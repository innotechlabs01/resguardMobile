import { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Text, Button, Surface, Chip, RadioButton, Portal, Modal, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../src/lib/theme';
import { mockAssemblies } from '../../src/services/mockData';
import { encryptVote } from '../../src/services/voting';
import { Assembly, AgendaItem } from '../../src/types';

export default function AsambleasScreen() {
  const [assemblies] = useState<Assembly[]>(mockAssemblies);
  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | null>(null);
  const [voteModalVisible, setVoteModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState<Record<string, boolean>>({});

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Activa', color: Colors.success, bgColor: Colors.successContainer, icon: 'vote-outline' };
      case 'upcoming':
        return { label: 'Proxima', color: Colors.info, bgColor: Colors.infoContainer, icon: 'clock-outline' };
      case 'closed':
        return { label: 'Cerrada', color: Colors.textSecondary, bgColor: Colors.background, icon: 'lock' };
      default:
        return { label: status, color: Colors.textSecondary, bgColor: Colors.background, icon: 'help-circle-outline' };
    }
  };

  const openVoting = (item: AgendaItem) => {
    if (item.hasVoted) {
      Alert.alert('Ya has votado', 'Tu voto ya ha sido registrado.');
      return;
    }
    setSelectedItem(item);
    setSelectedOption('');
    setVoteModalVisible(true);
  };

  const submitVote = async () => {
    if (!selectedOption || !selectedItem) {
      Alert.alert('Error', 'Por favor selecciona una opcion.');
      return;
    }

    setIsVoting(true);

    try {
      const voteData = `${selectedItem.id}:${selectedOption}:${Date.now()}`;
      const { encrypted, hash } = await encryptVote(voteData);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasVoted(prev => ({ ...prev, [selectedItem.id]: true }));
      
      Alert.alert(
        'Voto Registrado',
        'Tu voto ha sido cifrado y registrado de forma segura. No puedes modificar tu voto despues de enviado.',
        [{ text: 'Aceptar', onPress: () => setVoteModalVisible(false) }]
      );
    } catch (error) {
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
    return item.options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);
  };

  const getVotePercentage = (item: AgendaItem, optionId: string) => {
    const total = totalVotes(item);
    if (total === 0) return 0;
    const option = item.options.find(o => o.id === optionId);
    return Math.round(((option?.voteCount || 0) / total) * 100);
  };

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

      <Text variant="titleMedium" style={styles.sectionTitle}>Asambleas</Text>
      {assemblies.map((assembly) => {
        const statusConfig = getStatusConfig(assembly.status);
        const activeItems = assembly.agendaItems.filter(item => !item.hasVoted).length;
        
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
                    {formatDate(assembly.startDate)} - {formatDate(assembly.endDate)}
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
                  
                  {assembly.agendaItems.map((item) => (
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
                      
                      {assembly.status === 'closed' || item.hasVoted ? (
                        <View style={styles.resultsPreview}>
                          {item.options.map((opt) => (
                            <View key={opt.id} style={styles.resultBar}>
                              <View style={styles.resultLabel}>
                                <Text variant="bodySmall">{opt.label}</Text>
                                <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                                  {getVotePercentage(item, opt.id)}%
                                </Text>
                              </View>
                              <View style={styles.barContainer}>
                                <View 
                                  style={[
                                    styles.barFill, 
                                    { width: `${getVotePercentage(item, opt.id)}%` }
                                  ]} 
                                />
                              </View>
                            </View>
                          ))}
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
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        );
      })}

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
                  onValueChange={value => setSelectedOption(value)} 
                  value={selectedOption}
                >
                  {selectedItem.options.map((option) => (
                    <Surface 
                      key={option.id} 
                      style={[
                        styles.optionItem,
                        selectedOption === option.id && styles.optionSelected
                      ]} 
                      elevation={0}
                    >
                      <RadioButton.Android 
                        value={option.id} 
                        color={Colors.primary}
                      />
                      <Text variant="bodyMedium" style={styles.optionLabel}>
                        {option.label}
                      </Text>
                    </Surface>
                  ))}
                </RadioButton.Group>

                <Surface style={styles.encryptionNotice} elevation={0}>
                  <Icon name="shield-check-outline" size={20} color={Colors.success} />
                  <Text variant="bodySmall" style={styles.encryptionText}>
                    Tu voto sera encriptado y enviado de forma segura.
                  </Text>
                </Surface>
                
                <View style={styles.modalActions}>
                  <Button 
                    mode="outlined" 
                    onPress={() => setVoteModalVisible(false)}
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    mode="contained" 
                    onPress={submitVote}
                    loading={isVoting}
                    disabled={!selectedOption || isVoting}
                    style={{ flex: 1, backgroundColor: Colors.primary }}
                  >
                    Enviar Voto
                  </Button>
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