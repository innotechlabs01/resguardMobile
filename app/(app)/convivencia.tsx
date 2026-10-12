import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  Image,
  Pressable,
  Linking,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Surface,
  Avatar,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  getInfractionsByUser,
  reportInfraction,
  getInfractionById,
  submitReply,
  getInfractionEvidences,
  InfractionItem,
  InfractionEvidence,
} from '../../src/services/infractions';

const infractionTypeConfig: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
  noise: { label: 'Ruido', icon: 'volume-high', color: '#8B5CF6', bgColor: '#EDE9FE' },
  pet: { label: 'Mascotas', icon: 'dog', color: '#F59E0B', bgColor: '#FEF3C7' },
  parking: { label: 'Parqueo Indebido', icon: 'car', color: '#EAB308', bgColor: '#FEF9C3' },
  common_area: { label: 'Area Comun', icon: 'office-building', color: '#6366F1', bgColor: '#E0E7FF' },
  smoking: { label: 'Fumar', icon: 'smoking', color: '#DC2626', bgColor: '#FEE2E2' },
  trash: { label: 'Basuras', icon: 'delete', color: '#EA580C', bgColor: '#FFEDD5' },
  construction: { label: 'Construccion', icon: 'hammer-wrench', color: '#3B82F6', bgColor: '#DBEAFE' },
  other: { label: 'Otro', icon: 'help-circle', color: '#666666', bgColor: '#F3F4F6' },
};

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  reported: { label: 'Reportado', color: '#F59E0B', icon: 'clock-outline' },
  notified: { label: 'Notificado', color: '#3B82F6', icon: 'bell-outline' },
  reply_pending: { label: 'Replica Pendiente', color: '#EA580C', icon: 'clock-alert-outline' },
  reply_received: { label: 'Replica Recibida', color: '#6366F1', icon: 'message-text-outline' },
  fine_issued: { label: 'Multa Impuesta', color: '#DC2626', icon: 'cash-remove' },
  dismissed: { label: 'Desestimado', color: '#10B981', icon: 'check-circle' },
  escalated: { label: 'Escalado', color: '#666666', icon: 'arrow-up-bold' },
};

export default function ConvivenciaScreen() {
  const { user } = useAuth();
  const [infractionsList, setInfractionsList] = useState<InfractionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInfraction, setSelectedInfraction] = useState<InfractionItem | null>(null);
  const [evidences, setEvidences] = useState<InfractionEvidence[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filterTab, setFilterTab] = useState('all');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Create form
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm, setCreateForm] = useState({
    infraction_type: 'noise',
    description: '',
    target_unit: '',
    location: '',
  });
  const [creating, setCreating] = useState(false);

  // Reply form
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchMyInfractions = useCallback(async () => {
    if (!user?.id || !user?.building_id) return;
    try {
      const data = await getInfractionsByUser(user.id);
      setInfractionsList(data);
    } catch (err) {
      console.error('Error fetching infractions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.building_id]);

  // Polling every 10s
  useEffect(() => {
    fetchMyInfractions();
    pollingRef.current = setInterval(fetchMyInfractions, 10000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchMyInfractions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyInfractions();
  }, [fetchMyInfractions]);

  // Open detail
  const openDetail = async (infraction: InfractionItem) => {
    setSelectedInfraction(infraction);
    setLoadingDetail(true);
    try {
      const [data, ev] = await Promise.all([
        getInfractionById(infraction.id),
        getInfractionEvidences(infraction.id),
      ]);
      if (data) setSelectedInfraction(data);
      setEvidences(ev);
    } catch (err) {
      console.error('Error fetching detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Create infraction
  const handleCreate = async () => {
    if (!createForm.description || !createForm.target_unit || !user || !user.building_id) return;
    setCreating(true);
    try {
      const result = await reportInfraction({
        building_id: user.building_id,
        reporter_id: user.id,
        reporter_name: user.display_name,
        reporter_unit: user.unit,
        infraction_type: createForm.infraction_type,
        description: createForm.description,
        location: createForm.location || undefined,
        target_unit: createForm.target_unit,
      });
      if (result) {
        setCreateModalVisible(false);
        setCreateForm({ infraction_type: 'noise', description: '', target_unit: '', location: '' });
        fetchMyInfractions();
        Alert.alert('Exito', 'Reporte de infraccion creado correctamente');
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo crear el reporte');
    } finally {
      setCreating(false);
    }
  };

  // Submit reply
  const handleReply = async () => {
    if (!selectedInfraction || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const success = await submitReply(selectedInfraction.id, replyText.trim());
      if (success) {
        setSelectedInfraction(prev => prev ? { ...prev, status: 'reply_received', reply: replyText.trim(), reply_at: new Date().toISOString() } : null);
        setReplyText('');
        Alert.alert('Exito', 'Replica enviada correctamente');
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo enviar la replica');
    } finally {
      setSendingReply(false);
    }
  };

  // Filter
  const filteredInfractions = infractionsList.filter(p => {
    if (filterTab === 'all') return true;
    if (filterTab === 'active') return ['reported', 'notified', 'reply_pending', 'reply_received'].includes(p.status);
    if (filterTab === 'resolved') return ['fine_issued', 'dismissed', 'escalated'].includes(p.status);
    return true;
  });

  // ── Detail View ──
  if (selectedInfraction) {
    const typeCfg = infractionTypeConfig[selectedInfraction.infraction_type] || infractionTypeConfig.other;
    const statCfg = statusConfig[selectedInfraction.status] || statusConfig.reported;
    const isReplyPending = selectedInfraction.status === 'reply_pending' || selectedInfraction.status === 'notified';
    const isOverdue = selectedInfraction.reply_deadline && new Date(selectedInfraction.reply_deadline) < new Date();

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Button
          mode="text"
          icon="arrow-left"
          onPress={() => { setSelectedInfraction(null); setEvidences([]); setReplyText(''); fetchMyInfractions(); }}
          style={styles.backButton}
          labelStyle={styles.backLabel}
        >
          Volver
        </Button>

        {/* Header */}
        <Surface style={styles.detailHeader} elevation={1}>
          <View style={styles.detailHeaderTop}>
            <View style={[styles.categoryBadge, { backgroundColor: typeCfg.bgColor }]}>
              <Icon name={typeCfg.icon} size={16} color={typeCfg.color} />
              <Text variant="bodySmall" style={[styles.categoryLabel, { color: typeCfg.color }]}>
                {typeCfg.label}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statCfg.color + '20' }]}>
              <Icon name={statCfg.icon} size={14} color={statCfg.color} />
              <Text variant="bodySmall" style={[styles.statusText, { color: statCfg.color }]}>
                {statCfg.label}
              </Text>
            </View>
          </View>

          <Text variant="titleMedium" style={styles.detailTitle}>
            Unidad {selectedInfraction.target_unit}
          </Text>
          <Text variant="bodyMedium" style={styles.detailDescription}>
            {selectedInfraction.description}
          </Text>

          <View style={styles.detailMeta}>
            <Text variant="bodySmall" style={styles.detailMetaText}>
              {new Date(selectedInfraction.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            {selectedInfraction.location && (
              <Text variant="bodySmall" style={styles.detailMetaText}>
                Ubicacion: {selectedInfraction.location}
              </Text>
            )}
            {selectedInfraction.fine_amount && (
              <Text variant="bodySmall" style={[styles.detailMetaText, { color: Colors.error }]}>
                Multa: ${selectedInfraction.fine_amount.toLocaleString('es-CO')}
              </Text>
            )}
          </View>
        </Surface>

        {/* Reply deadline warning */}
        {isReplyPending && selectedInfraction.reply_deadline && (
          <Surface style={[styles.deadlineCard, { backgroundColor: isOverdue ? '#FEE2E2' : '#FEF3C7' }]} elevation={0}>
            <Icon name={isOverdue ? 'alert-circle' : 'clock-outline'} size={20} color={isOverdue ? Colors.error : Colors.warning} />
            <Text variant="bodySmall" style={{ color: isOverdue ? Colors.error : Colors.warning, fontWeight: '500' }}>
              {isOverdue ? 'Plazo de replica vencido' : `Plazo: ${new Date(selectedInfraction.reply_deadline).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`}
            </Text>
          </Surface>
        )}

        {/* Reply from infractor */}
        {selectedInfraction.reply && (
          <Surface style={styles.replyCard} elevation={0}>
            <View style={styles.replyHeader}>
              <Icon name="message-text-outline" size={18} color={Colors.primary} />
              <Text variant="titleSmall" style={styles.replyTitle}>Replica del Infractor</Text>
            </View>
            <Text variant="bodyMedium" style={styles.replyContent}>{selectedInfraction.reply}</Text>
            {selectedInfraction.reply_at && (
              <Text variant="bodySmall" style={styles.replyTime}>
                Enviada: {new Date(selectedInfraction.reply_at).toLocaleDateString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </Surface>
        )}

        {/* Send reply (if infractor can reply) */}
        {isReplyPending && !selectedInfraction.reply && (
          <Surface style={styles.addReplyCard} elevation={0}>
            <Text variant="titleSmall" style={styles.sectionTitle}>Enviar Replica</Text>
            <TextInput
              mode="outlined"
              placeholder="Escribe tu defensa o explicacion..."
              value={replyText}
              onChangeText={setReplyText}
              multiline
              numberOfLines={4}
              style={styles.replyInput}
              outlineStyle={styles.replyInputOutline}
            />
            <Button
              mode="contained"
              icon="send"
              onPress={handleReply}
              disabled={!replyText.trim() || sendingReply}
              style={styles.sendButton}
              buttonColor={Colors.primary}
            >
              {sendingReply ? 'Enviando...' : 'Enviar Replica'}
            </Button>
          </Surface>
        )}

        {/* Decision result */}
        {selectedInfraction.admin_decision && (
          <Surface style={styles.decisionCard} elevation={0}>
            <Text variant="titleSmall" style={styles.sectionTitle}>Decision</Text>
            <View style={styles.decisionRow}>
              <View style={[styles.decisionBadge, {
                backgroundColor: selectedInfraction.admin_decision === 'fine' ? '#FEE2E2' :
                  selectedInfraction.admin_decision === 'dismiss' ? '#D1FAE5' : '#F3F4F6'
              }]}>
                <Text variant="bodySmall" style={{
                  color: selectedInfraction.admin_decision === 'fine' ? Colors.error :
                    selectedInfraction.admin_decision === 'dismiss' ? Colors.success : Colors.textSecondary,
                  fontWeight: '500',
                }}>
                  {selectedInfraction.admin_decision === 'fine' ? 'Multa Impuesta' :
                   selectedInfraction.admin_decision === 'dismiss' ? 'Desestimado' : 'Escalado'}
                </Text>
              </View>
              {selectedInfraction.fine_amount && (
                <Text variant="bodyMedium" style={{ color: Colors.error, fontWeight: '600' }}>
                  ${selectedInfraction.fine_amount.toLocaleString('es-CO')}
                </Text>
              )}
            </View>
            <Text variant="bodySmall" style={styles.decisionNotes}>{selectedInfraction.admin_notes}</Text>
          </Surface>
        )}

        {/* Evidencias */}
        <Surface style={styles.evidenceSection} elevation={0}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Evidencias ({evidences.length})</Text>
          {evidences.length === 0 ? (
            <Text variant="bodySmall" style={{ color: Colors.textSecondary }}>Sin evidencias</Text>
          ) : (
            evidences.map(ev => {
              const isPhoto = ev.type === 'photo' || ev.url.startsWith('data:image');
              if (isPhoto) {
                return (
                  <Pressable key={ev.id} onPress={() => Linking.openURL(ev.url)}>
                    <Image
                      source={{ uri: ev.url }}
                      style={styles.evidenceImg}
                      resizeMode="cover"
                    />
                  </Pressable>
                );
              }
              return (
                <View key={ev.id} style={styles.evidenceRow}>
                  <Icon
                    name={ev.type === 'audio' ? 'file-music' : 'file-document'}
                    size={20}
                    color={Colors.textSecondary}
                  />
                  <Text variant="bodyMedium" style={styles.evidenceLabel}>
                    {ev.type === 'audio' ? 'Audio' : 'Documento'}
                  </Text>
                  <Pressable onPress={() => Linking.openURL(ev.url)}>
                    <Text variant="bodySmall" style={styles.evidenceLink}>Abrir</Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </Surface>

        <View style={{ height: 30 }} />
      </ScrollView>
    );
  }

  // ── List View ──
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Create button */}
      <View style={styles.header}>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => setCreateModalVisible(true)}
          style={styles.createButton}
          buttonColor={Colors.primary}
          labelStyle={styles.createButtonLabel}
        >
          Reportar Infraccion
        </Button>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabBar}>
        {(['all', 'active', 'resolved'] as const).map(tab => {
          const tabLabels: Record<string, string> = {
            all: 'Todas',
            active: 'Activas',
            resolved: 'Resueltas',
          };
          const isActive = filterTab === tab;
          return (
            <Button
              key={tab}
              mode={isActive ? 'contained' : 'outlined'}
              compact
              onPress={() => setFilterTab(tab)}
              style={[styles.tab, isActive && { backgroundColor: Colors.primary }]}
              labelStyle={[styles.tabLabel, isActive && { color: '#FFF' }]}
            >
              {tabLabels[tab]}
            </Button>
          );
        })}
      </View>

      {/* Infractions list */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : filteredInfractions.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="shield-alert-outline" size={56} color={Colors.textSecondary} />
          <Text variant="bodyLarge" style={styles.emptyTitle}>Sin Reportes</Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            No tienes reportes de convivencia
          </Text>
        </View>
      ) : (
        filteredInfractions.map(infraction => {
          const typeCfg = infractionTypeConfig[infraction.infraction_type] || infractionTypeConfig.other;
          const statCfg = statusConfig[infraction.status] || statusConfig.reported;

          return (
            <Card key={infraction.id} style={styles.infractionCard} onPress={() => openDetail(infraction)}>
              <Card.Content>
                <View style={styles.infractionHeader}>
                  <View style={[styles.infractionIcon, { backgroundColor: typeCfg.bgColor }]}>
                    <Icon name={typeCfg.icon} size={20} color={typeCfg.color} />
                  </View>
                  <View style={styles.infractionInfo}>
                    <Text variant="titleSmall" style={styles.infractionSubject}>
                      Unidad {infraction.target_unit}
                    </Text>
                    <Text variant="bodySmall" style={styles.infractionDesc} numberOfLines={1}>
                      {infraction.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.infractionFooter}>
                  <View style={[styles.miniBadge, { backgroundColor: statCfg.color + '20' }]}>
                    <Icon name={statCfg.icon} size={12} color={statCfg.color} />
                    <Text variant="bodySmall" style={{ color: statCfg.color, fontSize: 11 }}>
                      {statCfg.label}
                    </Text>
                  </View>
                  <View style={[styles.miniBadge, { backgroundColor: typeCfg.bgColor }]}>
                    <Text variant="bodySmall" style={{ color: typeCfg.color, fontSize: 11 }}>
                      {typeCfg.label}
                    </Text>
                  </View>
                  <Text variant="bodySmall" style={styles.infractionDate}>
                    {new Date(infraction.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          );
        })
      )}

      <View style={{ height: 30 }} />

      {/* Create Modal - inline since Portal may not be available */}
      {createModalVisible && (
        <Surface style={styles.modalOverlay} elevation={2}>
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Icon name="shield-alert" size={32} color={Colors.primary} />
              <Text variant="titleLarge" style={styles.modalTitle}>Reportar Infraccion</Text>
            </View>

            <Text variant="bodySmall" style={styles.formLabel}>Tipo de Infraccion</Text>
            <View style={styles.categoryGrid}>
              {Object.entries(infractionTypeConfig).map(([key, cfg]) => (
                <Button
                  key={key}
                  mode={createForm.infraction_type === key ? 'contained' : 'outlined'}
                  compact
                  icon={cfg.icon}
                  onPress={() => setCreateForm(prev => ({ ...prev, infraction_type: key }))}
                  style={[
                    styles.categoryButton,
                    createForm.infraction_type === key && { backgroundColor: cfg.color },
                  ]}
                  labelStyle={[
                    styles.categoryButtonLabel,
                    createForm.infraction_type === key && { color: '#FFF' },
                  ]}
                >
                  {cfg.label}
                </Button>
              ))}
            </View>

            <TextInput
              mode="outlined"
              label="Descripcion *"
              value={createForm.description}
              onChangeText={v => setCreateForm(prev => ({ ...prev, description: v }))}
              placeholder="Describe la infraccion en detalle..."
              multiline
              numberOfLines={4}
              style={styles.formInput}
              outlineStyle={styles.formInputOutline}
            />

            <View style={styles.formRow}>
              <TextInput
                mode="outlined"
                label="Unidad Infractora *"
                value={createForm.target_unit}
                onChangeText={v => setCreateForm(prev => ({ ...prev, target_unit: v }))}
                placeholder="Ej: 301"
                style={[styles.formInput, { flex: 1 }]}
                outlineStyle={styles.formInputOutline}
              />
              <TextInput
                mode="outlined"
                label="Ubicacion"
                value={createForm.location}
                onChangeText={v => setCreateForm(prev => ({ ...prev, location: v }))}
                placeholder="Ej: Tercer piso"
                style={[styles.formInput, { flex: 1 }]}
                outlineStyle={styles.formInputOutline}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setCreateModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                icon="check"
                onPress={handleCreate}
                disabled={creating || !createForm.description || !createForm.target_unit}
                style={styles.submitButton}
                buttonColor={Colors.primary}
              >
                {creating ? 'Creando...' : 'Reportar'}
              </Button>
            </View>
          </ScrollView>
        </Surface>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  createButton: {
    borderRadius: 12,
  },
  createButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    borderRadius: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
    color: Colors.text,
    fontSize: 16,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Infraction card
  infractionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  infractionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infractionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infractionInfo: {
    flex: 1,
  },
  infractionSubject: {
    fontWeight: '600',
    color: Colors.text,
  },
  infractionDesc: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infractionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  infractionDate: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  // Detail
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: 8,
    marginTop: 8,
  },
  backLabel: {
    color: Colors.primary,
    fontSize: 13,
  },
  detailHeader: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    backgroundColor: Colors.surface,
  },
  detailHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  categoryLabel: {
    fontWeight: '500',
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusText: {
    fontWeight: '500',
    fontSize: 11,
  },
  detailTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  detailDescription: {
    color: Colors.text,
    lineHeight: 20,
  },
  detailMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  detailMetaText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  // Deadline
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  // Reply
  replyCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.muted,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  replyTitle: {
    fontWeight: '600',
    color: Colors.text,
  },
  replyContent: {
    color: Colors.text,
    lineHeight: 18,
  },
  replyTime: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 8,
  },
  // Add reply
  addReplyCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  replyInput: {
    backgroundColor: Colors.surface,
    marginBottom: 8,
  },
  replyInputOutline: {
    borderRadius: 10,
  },
  sendButton: {
    alignSelf: 'flex-end',
    borderRadius: 8,
  },
  // Decision
  decisionCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  decisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  decisionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  decisionNotes: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  // Evidencias
  evidenceSection: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  evidenceImg: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  evidenceLabel: {
    flex: 1,
    color: Colors.text,
  },
  evidenceLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    zIndex: 100,
    margin: 16,
    borderRadius: 16,
    maxHeight: '90%',
  },
  modalScroll: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  formInput: {
    marginBottom: 12,
    backgroundColor: Colors.surface,
  },
  formInputOutline: {
    borderRadius: 10,
  },
  formLabel: {
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
    fontSize: 13,
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    borderRadius: 8,
  },
  categoryButtonLabel: {
    fontSize: 11,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 10,
  },
  submitButton: {
    flex: 1,
    borderRadius: 10,
  },
});
