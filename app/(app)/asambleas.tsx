import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Card, Text, Button, Surface, Chip, RadioButton, Portal, Modal, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../src/lib/theme';
import * as database from '../../src/services/database';
import { encryptVote } from '../../src/services/voting';
import { useAuth } from '../../src/contexts/AuthContext';
import { Assembly, AgendaItem } from '../../src/types';

interface RawAssembly {
  id: string;
  building_id: string;
  title: string;
  description: string;
  date?: string;
  time?: string;
  location?: string;
  status: Assembly['status'];
  created_at: string;
  agenda_items?: RawAgendaItem[];
}

interface RawAgendaItem {
  id: string;
  assembly_id: string;
  title: string;
  description: string | null;
  vote_type: AgendaItem['voteType'];
  options: { id: string; label: string }[];
  created_at: string;
}

const mapRawAssembly = (raw: RawAssembly): Assembly => ({
  id: raw.id,
  buildingId: raw.building_id,
  title: raw.title,
  description: raw.description,
  date: raw.date,
  time: raw.time,
  location: raw.location,
  status: raw.status,
  createdBy: '',
  createdAt: new Date(raw.created_at || Date.now()),
  agendaItems: (raw.agenda_items ?? []).map(mapRawAgendaItem),
});

const mapRawAgendaItem = (raw: RawAgendaItem): AgendaItem => ({
  id: raw.id,
  assemblyId: raw.assembly_id,
  title: raw.title,
  description: raw.description ?? '',
  voteType: raw.vote_type,
  options: raw.options ?? [],
  voteCounts: {},
  totalVotes: 0,
});

export default function AsambleasScreen() {
  const { user } = useAuth();
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | null>(null);
  const [voteModalVisible, setVoteModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isVoting, setIsVoting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState<Record<string, boolean>>({});

  const buildingId = user?.building_id ?? null;
  const userId = user?.id?.toString() ?? null;

  const loadAssemblies = async () => {
    if (!buildingId || !userId) {
      setIsLoading(false);
      return;
    }

    try {
      const raw = await database.getAssemblies(buildingId);
      const mapped = (raw ?? []).map(mapRawAssembly);

      // Enrich each assembly's agenda items with the current user's vote state + live counts.
      const enriched = await Promise.all(
        mapped.map(async (assembly) => {
          const agenda = await database.getAgendaItemsWithVoteState(assembly.id, userId);
          const agendaItems = (agenda ?? []).map(
            (item): AgendaItem => {
              const base = assembly.agendaItems.find((a) => a.id === item.id);
              return {
                id: item.id,
                assemblyId: assembly.id,
                title: item.title ?? base?.title ?? '',
                description: item.description ?? base?.description ?? '',
                voteType: item.vote_type ?? base?.voteType ?? 'yes_no',
                options: item.options ?? base?.options ?? [],
                hasVoted: item.hasVoted,
                userVote: item.userVote,
                voteCounts: item.voteCounts ?? {},
                totalVotes: item.totalVotes ?? 0,
              };
            }
          );

          const votedMap: Record<string, boolean> = {};
          agendaItems.forEach((item) => {
            votedMap[item.id] = !!item.hasVoted;
          });

          return { ...assembly, agendaItems };
        })
      );

      // Merge voted flags into screen state.
      const combinedVoted: Record<string, boolean> = {};
      enriched.forEach((a) =>
        a.agendaItems.forEach((item) => {
          combinedVoted[item.id] = !!item.hasVoted;
        })
      );

      setHasVoted(combinedVoted);
      setAssemblies(enriched);
    } catch (error) {
      console.error('Error loading assemblies:', error);
      Alert.alert('Error', 'No se pudieron cargar las asambleas. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (buildingId && userId) {
      loadAssemblies();
    } else {
      setIsLoading(false);
    }
  }, [buildingId, userId]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Fecha no disponible';
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusConfig = (status: Assembly['status']) => {
    switch (status) {
      case 'active':
        return { label: 'Activa', color: Colors.success, bgColor: Colors.successContainer, icon: 'vote-outline' };
      case 'scheduled':
        return { label: 'Programada', color: Colors.info, bgColor: Colors.infoContainer, icon: 'clock-outline' };
      case 'completed':
        return { label: 'Completada', color: Colors.textSecondary, bgColor: Colors.background, icon: 'check-circle-outline' };
      case 'cancelled':
        return { label: 'Cancelada', color: Colors.error, bgColor: Colors.errorContainer, icon: 'cancel' };
      default:
        return { label: status, color: Colors.textSecondary, bgColor: Colors.background, icon: 'help-circle-outline' };
    }
  };

  const openVoting = (item: AgendaItem) => {
    if (hasVoted[item.id]) {
      Alert.alert('Ya has votado', 'Tu voto ya ha sido registrado.');
      return;
    }
    setSelectedItem(item);
    setSelectedOption('');
    setVoteModalVisible(true);
  };

  const submitVote = async () => {
    if (!selectedOption || !selectedItem || !userId) {
      Alert.alert('Error', 'Por favor selecciona una opcion.');
      return;
    }

    setIsVoting(true);

    try {
      const { encrypted_vote, vote_hash } = await encryptVote({
        agendaItemId: selectedItem.id,
        optionId: selectedOption,
        userId,
      });

      await database.submitVote(
        selectedItem.id,
        userId,
        encrypted_vote,
        vote_hash,
        selectedOption
      );

      setHasVoted((prev) => ({ ...prev, [selectedItem.id]: true }));

      // Refresh live results for the item after voting.
      try {
        const results = await database.getVoteResults(selectedItem.id);
        const { total, ...voteCounts } = results;
        setAssemblies((prev) =>
          prev.map((a) => ({
            ...a,
            agendaItems: a.agendaItems.map((item) =>
              item.id === selectedItem.id
                ? { ...item, hasVoted: true, userVote: selectedOption, voteCounts, totalVotes: total }
                : item
            ),
          }))
        );
      } catch (resultsError) {
        console.error('Error refreshing results:', resultsError);
      }

      Alert.alert(
        'Voto Registrado',
        'Tu voto ha sido cifrado y registrado de forma segura. No puedes modificar tu voto despues de enviado.',
        [{ text: 'Aceptar', onPress: () => setVoteModalVisible(false) }]
      );
    } catch (error) {
      console.error('Error submitting vote:', error);
      Alert.alert('Error', 'Hubo un problema al registrar tu voto. Intenta de nuevo.');
    } finally {
      setIsVoting(false);
    }
  };

  const viewResults = (item: AgendaItem) => {
    setSelectedItem(item);
    setVoteModalVisible(true);
  };

  const totalVotes = (item: AgendaItem) => {
    return item.totalVotes ?? item.options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);
  };

  const getVotePercentage = (item: AgendaItem, optionId: string) => {
    const total = totalVotes(item);
    if (total === 0) return 0;
    const count = item.voteCounts?.[optionId] ?? item.options.find((o) => o.id === optionId)?.voteCount ?? 0;
    return Math.round((count / total) * 100);
  };

  const activeAssembly = assemblies.find(a => a.status === 'active');
  const scheduledAssemblies = assemblies
    .filter(a => a.status === 'scheduled')
    .sort((a,b) => new Date(a.date ?? '').getTime() - new Date(b.date ?? '').getTime());
  const nextScheduled = scheduledAssemblies[0];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>Cargando asambleas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Surface style={styles.securityCard} elevation={1}>
        <View style={styles.securityContent}>
          <Icon name="shield-lock-outline" size={32} color={Colors.success} />
          <View style={styles.securityText}>
            <Text variant="titleSmall">Votacion Segura y Encriptada</Text>
            <Text variant="bodySmall" style={styles.securityDesc}>
              Tu voto es personal, encriptado y no puede ser compartido ni identificado.
            </Text>
          </View>
        </View>
      </Surface>

      <Text variant="titleMedium" style={styles.sectionTitle}>Asamblea</Text>
      {!activeAssembly ? (
        <Card style={styles.assemblyCard}>
          <Card.Content>
            <View style={{alignItems:'center', paddingVertical:24}}>
              <Icon name="calendar-remove-outline" size={48} color={Colors.textSecondary} />
              <Text variant="titleSmall" style={{marginTop:12, color:Colors.textSecondary, textAlign:'center'}}>
                Por el momento no es la asamblea
              </Text>
              <Text variant="bodySmall" style={{marginTop:4, color:Colors.textSecondary, textAlign:'center'}}>
                Cuando el administrador active una asamblea verás aquí las votaciones y documentos importantes.
              </Text>
              {nextScheduled && (
                <View style={{marginTop:16, alignItems:'center'}}>
                  <View style={{flexDirection:'row', alignItems:'center', gap:6, backgroundColor:Colors.infoContainer, paddingHorizontal:12, paddingVertical:6, borderRadius:999}}>
                    <Icon name="calendar-clock-outline" size={14} color={Colors.info} />
                    <Text variant="labelSmall" style={{color:Colors.info}}>
                      Próxima: {nextScheduled.title} · {formatDate(nextScheduled.date)}
                      {nextScheduled.time ? ` · ${formatTime(nextScheduled.time)}` : ''}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      ) : (
        <View>
          {(() => {
            const assembly = activeAssembly!;
            const statusConfig = getStatusConfig(assembly.status);
            const activeItems = assembly.agendaItems.filter((item) => !item.hasVoted).length;

            return (
              <Card
                key={assembly.id}
                style={styles.assemblyCard}
                onPress={() => setSelectedAssembly(selectedAssembly?.id === assembly.id ? null : assembly)}
              >
              <Card.Content>
                <View style={styles.assemblyHeader}>
                  <View style={styles.assemblyTitle}>
                    <Text variant="titleMedium" style={styles.assemblyName}>{assembly.title}</Text>
                    <Text variant="bodySmall" style={styles.assemblyDesc} numberOfLines={2}>
                      {assembly.description}
                    </Text>
                  </View>
                  <Chip
                    mode="flat"
                    compact
                    style={{ backgroundColor: statusConfig.bgColor }}
                    textStyle={{ color: statusConfig.color, fontSize: 10 }}
                  >
                    {statusConfig.label}
                  </Chip>
                </View>

                <View style={styles.assemblyMeta}>
                  <View style={styles.metaItem}>
                    <Icon name="calendar-outline" size={16} color={Colors.textSecondary} />
                    <Text variant="bodySmall" style={styles.metaText}>
                      {formatDate(assembly.date)}
                      {assembly.time ? ` · ${formatTime(assembly.time)}` : ''}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Icon name="format-list-checks" size={16} color={Colors.textSecondary} />
                    <Text variant="bodySmall" style={styles.metaText}>
                      {assembly.agendaItems.length} temas
                    </Text>
                  </View>
                  {assembly.status === 'active' && activeItems > 0 && (
                    <Chip compact style={{ backgroundColor: Colors.warningContainer }}>
                      {activeItems} por votar
                    </Chip>
                  )}
                </View>

                {selectedAssembly?.id === assembly.id && (
                  <View style={styles.agendaContainer}>
                    <Divider style={{ marginVertical: 12 }} />
                    <Text variant="titleSmall" style={styles.agendaTitle}>Temas a Votar</Text>

                    {assembly.agendaItems.length === 0 ? (
                      <Text variant="bodySmall" style={styles.metaText}>
                        No hay temas de votación para esta asamblea.
                      </Text>
                    ) : (
                      assembly.agendaItems.map((item) => (
                        <Surface key={item.id} style={styles.agendaItem} elevation={0}>
                          <View style={styles.agendaHeader}>
                            <Text variant="bodyMedium" style={{ fontWeight: '600', flex: 1 }}>
                              {item.title}
                            </Text>
                            {item.hasVoted ? (
                              <Chip compact style={{ backgroundColor: Colors.successContainer }} textStyle={{ fontSize: 10, color: Colors.success }}>
                                Votado
                              </Chip>
                            ) : assembly.status === 'active' ? (
                              <Button
                                mode="contained"
                                compact
                                onPress={() => openVoting(item)}
                                style={{ backgroundColor: Colors.primary }}
                                labelStyle={{ fontSize: 12 }}
                              >
                                Votar
                              </Button>
                            ) : null}
                          </View>

                          <Text variant="bodySmall" style={styles.agendaDesc} numberOfLines={2}>
                            {item.description}
                          </Text>

                          {(assembly.status === 'completed' || assembly.status === 'cancelled' || item.hasVoted) ? (
                            <View style={styles.resultsPreview}>
                              {item.options.map((opt) => {
                                const count = item.voteCounts?.[opt.id] ?? opt.voteCount ?? 0;
                                return (
                                  <View key={opt.id} style={styles.resultBar}>
                                    <View style={styles.resultLabel}>
                                      <Text variant="bodySmall">{opt.label}</Text>
                                      <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                                        {count} · {getVotePercentage(item, opt.id)}%
                                      </Text>
                                    </View>
                                    <View style={styles.barContainer}>
                                      <View
                                        style={[
                                          styles.barFill,
                                          { width: `${getVotePercentage(item, opt.id)}%` },
                                        ]}
                                      />
                                    </View>
                                  </View>
                                );
                              })}
                            </View>
                          ) : (
                            <Button
                              mode="text"
                              compact
                              onPress={() => viewResults(item)}
                              textColor={Colors.textSecondary}
                            >
                              Ver resultados
                            </Button>
                          )}
                        </Surface>
                      ))
                    )}
                  </View>
                )}
              </Card.Content>
            </Card>
          );
        })()}
        </View>
      )}

      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.infoTitle}>Como funciona la votacion?</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Icon name="lock-outline" size={20} color={Colors.text} />
              <Text variant="bodySmall" style={styles.infoText}>
                Tu voto se encripta antes de enviarse al servidor.
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="eye-off-outline" size={20} color={Colors.text} />
              <Text variant="bodySmall" style={styles.infoText}>
                Nadie puede ver por quien votaste, ni siquiera el administrador.
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="shield-check-outline" size={20} color={Colors.text} />
              <Text variant="bodySmall" style={styles.infoText}>
                Puedes verificar que tu voto fue contado sin revelar tu eleccion.
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Portal>
        <Modal
          visible={voteModalVisible}
          onDismiss={() => setVoteModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <View style={styles.modalHeader}>
              <Icon name="vote-outline" size={32} color={Colors.text} />
              <Text variant="headlineSmall" style={styles.modalTitle}>
                Votacion Encriptada
              </Text>
            </View>

            {selectedItem && (
              <>
                <Text variant="titleMedium" style={styles.voteQuestion}>
                  {selectedItem.title}
                </Text>
                <Text variant="bodySmall" style={styles.voteDesc}>
                  {selectedItem.description}
                </Text>

                <Divider style={{ marginVertical: 16 }} />

                <Text variant="titleSmall" style={styles.optionsTitle}>
                  Selecciona tu voto:
                </Text>

                <RadioButton.Group
                  onValueChange={(value) => setSelectedOption(value)}
                  value={selectedOption}
                >
                  {selectedItem.options.map((option) => (
                    <Surface
                      key={option.id}
                      style={[
                        styles.optionItem,
                        (selectedOption === option.id || (selectedItem.hasVoted && selectedItem.userVote === option.id)) && styles.optionSelected,
                      ]}
                      elevation={0}
                    >
                      <RadioButton.Android
                        value={option.id}
                        color={Colors.primary}
                        disabled={!!selectedItem.hasVoted}
                      />
                      <View style={styles.optionContent}>
                        <Text variant="bodyMedium" style={styles.optionLabel}>
                          {option.label}
                        </Text>
                        {selectedItem.hasVoted && selectedItem.userVote === option.id && (
                          <Text variant="labelSmall" style={{ color: Colors.success }}>
                            Tu voto
                          </Text>
                        )}
                      </View>
                    </Surface>
                  ))}
                </RadioButton.Group>

                {!selectedItem.hasVoted && (
                  <Surface style={styles.encryptionNotice} elevation={0}>
                    <Icon name="shield-check-outline" size={20} color={Colors.success} />
                    <Text variant="bodySmall" style={styles.encryptionText}>
                      Tu voto sera encriptado y enviado de forma segura.
                    </Text>
                  </Surface>
                )}

                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setVoteModalVisible(false)}
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </Button>
                  {!selectedItem.hasVoted ? (
                    <Button
                      mode="contained"
                      onPress={submitVote}
                      loading={isVoting}
                      disabled={!selectedOption || isVoting}
                      style={{ flex: 1, backgroundColor: Colors.primary }}
                    >
                      Enviar Voto
                    </Button>
                  ) : (
                    <Button
                      mode="contained"
                      onPress={() => setVoteModalVisible(false)}
                      style={{ flex: 1, backgroundColor: Colors.primary }}
                    >
                      Cerrar
                    </Button>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </Modal>
      </Portal>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
  },
  securityCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.successContainer,
  },
  securityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityText: {
    flex: 1,
  },
  securityDesc: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  assemblyCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  assemblyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  assemblyTitle: {
    flex: 1,
    marginRight: 12,
  },
  assemblyName: {
    fontWeight: '600',
  },
  assemblyDesc: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  assemblyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: Colors.textSecondary,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  agendaContainer: {
    marginTop: 4,
  },
  agendaTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  agendaItem: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  agendaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agendaDesc: {
    color: Colors.textSecondary,
    marginTop: 8,
  },
  resultsPreview: {
    marginTop: 12,
    gap: 8,
  },
  resultBar: {
    gap: 4,
  },
  resultLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barContainer: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  infoTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: Colors.textSecondary,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  voteQuestion: {
    fontWeight: '600',
    marginBottom: 8,
  },
  voteDesc: {
    color: Colors.textSecondary,
  },
  optionsTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.muted,
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    flex: 1,
  },
  encryptionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.successContainer,
    borderRadius: 8,
    marginTop: 16,
  },
  encryptionText: {
    flex: 1,
    color: Colors.success,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
});
