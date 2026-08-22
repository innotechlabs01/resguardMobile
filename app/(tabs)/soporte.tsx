import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Surface,
  Avatar,
  Divider,
  Portal,
  Modal,
  TextInput,
  Chip,
  ActivityIndicator,
  SegmentedButtons,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  getPqrsByUser,
  createPqrs,
  getPqrsById,
  addComment,
  getComments,
  respondToPqrs,
  PqrsItem,
  PqrsComment,
} from '../../src/services/pqrs';

const categoryConfig: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
  maintenance: { label: 'Mantenimiento', icon: 'wrench', color: '#3B82F6', bgColor: '#DBEAFE' },
  noise: { label: 'Ruido', icon: 'volume-high', color: '#8B5CF6', bgColor: '#EDE9FE' },
  security: { label: 'Seguridad', icon: 'shield-lock', color: '#DC2626', bgColor: '#FEE2E2' },
  cleaning: { label: 'Limpieza', icon: 'broom', color: '#10B981', bgColor: '#D1FAE5' },
  parking: { label: 'Parqueadero', icon: 'car', color: '#F59E0B', bgColor: '#FEF3C7' },
  common_areas: { label: 'Areas Comunes', icon: 'office-building', color: '#6366F1', bgColor: '#E0E7FF' },
  billing: { label: 'Facturacion', icon: 'cash', color: '#EA580C', bgColor: '#FFEDD5' },
  other: { label: 'Otro', icon: 'help-circle', color: '#666666', bgColor: '#F3F4F6' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: '#666666' },
  normal: { label: 'Normal', color: '#3B82F6' },
  high: { label: 'Alta', color: '#EA580C' },
  urgent: { label: 'Urgente', color: '#DC2626' },
};

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  open: { label: 'Abierto', color: '#F59E0B', icon: 'clock-outline' },
  in_progress: { label: 'En Progreso', color: '#3B82F6', icon: 'progress-clock' },
  waiting: { label: 'En Espera', color: '#EA580C', icon: 'clock-alert-outline' },
  resolved: { label: 'Resuelto', color: '#10B981', icon: 'check-circle' },
  closed: { label: 'Cerrado', color: '#666666', icon: 'close-circle' },
  reopened: { label: 'Reabierto', color: '#DC2626', icon: 'refresh' },
};

export default function SoporteScreen() {
  const { user } = useAuth();
  const [pqrsList, setPqrsList] = useState<PqrsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPqrs, setSelectedPqrs] = useState<PqrsItem | null>(null);
  const [comments, setComments] = useState<PqrsComment[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Create dialog
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm, setCreateForm] = useState({
    subject: '',
    description: '',
    category: 'maintenance',
    priority: 'normal',
    unit: '',
    location_detail: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchMyPqrs = useCallback(async () => {
    if (!user?.id || !user?.building_id) return;
    try {
      const data = await getPqrsByUser(user.id);
      setPqrsList(data);
    } catch (err) {
      console.error('Error fetching PQRS:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.building_id]);

  // Polling every 10s
  useEffect(() => {
    fetchMyPqrs();
    pollingRef.current = setInterval(fetchMyPqrs, 10000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchMyPqrs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyPqrs();
  }, [fetchMyPqrs]);

  // Open detail
  const openDetail = async (pqrs: PqrsItem) => {
    setSelectedPqrs(pqrs);
    setLoadingDetail(true);
    try {
      const [pqrsData, commentsData] = await Promise.all([
        getPqrsById(pqrs.id),
        getComments(pqrs.id),
      ]);
      if (pqrsData) setSelectedPqrs(pqrsData);
      setComments(commentsData);
    } catch (err) {
      console.error('Error fetching detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Create PQRS
  const handleCreate = async () => {
    if (!createForm.subject || !createForm.description || !user || !user.building_id) return;
    setCreating(true);
    try {
      const result = await createPqrs({
        building_id: user.building_id,
        created_by: user.id,
        created_by_name: user.display_name,
        created_by_unit: user.unit,
        subject: createForm.subject,
        description: createForm.description,
        category: createForm.category,
        priority: createForm.priority,
        unit: createForm.unit || user.unit,
        location_detail: createForm.location_detail || undefined,
      });
      if (result) {
        setCreateModalVisible(false);
        setCreateForm({ subject: '', description: '', category: 'maintenance', priority: 'normal', unit: '', location_detail: '' });
        fetchMyPqrs();
        Alert.alert('Exito', 'PQRS creado correctamente');
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo crear el PQRS');
    } finally {
      setCreating(false);
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!selectedPqrs || !newComment.trim() || !user) return;
    try {
      const comment = await addComment({
        pqrs_id: selectedPqrs.id,
        author_id: user.id,
        author_name: user.display_name,
        author_role: user.role,
        content: newComment.trim(),
      });
      if (comment) {
        setComments(prev => [...prev, comment]);
        setNewComment('');
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo agregar el comentario');
    }
  };

  // Filter PQRS
  const filteredPqrs = pqrsList.filter(p => {
    if (filterTab === 'all') return true;
    if (filterTab === 'open') return ['open', 'reopened'].includes(p.status);
    if (filterTab === 'in_progress') return ['in_progress', 'waiting'].includes(p.status);
    if (filterTab === 'resolved') return ['resolved', 'closed'].includes(p.status);
    return true;
  });

  // ── Detail View ──
  if (selectedPqrs) {
    const catCfg = categoryConfig[selectedPqrs.category] || categoryConfig.other;
    const statCfg = statusConfig[selectedPqrs.status] || statusConfig.open;
    const priCfg = priorityConfig[selectedPqrs.priority] || priorityConfig.normal;

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Button
          mode="text"
          icon="arrow-left"
          onPress={() => { setSelectedPqrs(null); setComments([]); fetchMyPqrs(); }}
          style={styles.backButton}
          labelStyle={styles.backLabel}
        >
          Volver
        </Button>

        {/* Header */}
        <Surface style={styles.detailHeader} elevation={1}>
          <View style={styles.detailHeaderTop}>
            <View style={[styles.categoryBadge, { backgroundColor: catCfg.bgColor }]}>
              <Icon name={catCfg.icon} size={16} color={catCfg.color} />
              <Text variant="bodySmall" style={[styles.categoryLabel, { color: catCfg.color }]}>
                {catCfg.label}
              </Text>
            </View>
            <View style={styles.badges}>
              <View style={[styles.statusBadge, { backgroundColor: statCfg.color + '20' }]}>
                <Icon name={statCfg.icon} size={14} color={statCfg.color} />
                <Text variant="bodySmall" style={[styles.statusText, { color: statCfg.color }]}>
                  {statCfg.label}
                </Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: priCfg.color + '20' }]}>
                <Text variant="bodySmall" style={{ color: priCfg.color }}>{priCfg.label}</Text>
              </View>
            </View>
          </View>

          <Text variant="titleLarge" style={styles.detailTitle}>{selectedPqrs.subject}</Text>
          <Text variant="bodyMedium" style={styles.detailDescription}>{selectedPqrs.description}</Text>

          <View style={styles.detailMeta}>
            <Text variant="bodySmall" style={styles.detailMetaText}>
              {new Date(selectedPqrs.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            {selectedPqrs.unit && (
              <Text variant="bodySmall" style={styles.detailMetaText}>Apto {selectedPqrs.unit}</Text>
            )}
            {selectedPqrs.assigned_to && (
              <Text variant="bodySmall" style={[styles.detailMetaText, { color: Colors.info }]}>
                Asignado: {selectedPqrs.assigned_to}
              </Text>
            )}
          </View>
        </Surface>

        {/* Comments */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Comentarios ({comments.length})</Text>

        {loadingDetail ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : comments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="comment-outline" size={32} color={Colors.textSecondary} />
              <Text variant="bodySmall" style={styles.emptyText}>No hay comentarios aun</Text>
            </Card.Content>
          </Card>
        ) : (
          comments.map(comment => (
            <Surface
              key={comment.id}
              style={[
                styles.commentCard,
                comment.is_internal && styles.commentInternal,
              ]}
              elevation={0}
            >
              <View style={styles.commentHeader}>
                <View style={styles.commentAuthor}>
                  <Avatar.Text size={28} label={comment.author_name.charAt(0)} style={{ backgroundColor: Colors.muted }} />
                  <View>
                    <Text variant="bodySmall" style={styles.commentAuthorName}>{comment.author_name}</Text>
                    <Text variant="bodySmall" style={styles.commentRole}>{comment.author_role}</Text>
                  </View>
                </View>
                <Text variant="bodySmall" style={styles.commentTime}>
                  {new Date(comment.created_at).toLocaleDateString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.commentContent}>{comment.content}</Text>
            </Surface>
          ))
        )}

        {/* Add comment */}
        <Surface style={styles.addCommentCard} elevation={0}>
          <TextInput
            mode="outlined"
            placeholder="Escribe un comentario..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            numberOfLines={3}
            style={styles.commentInput}
            outlineStyle={styles.commentInputOutline}
          />
          <Button
            mode="contained"
            icon="send"
            onPress={handleAddComment}
            disabled={!newComment.trim()}
            style={styles.sendButton}
            buttonColor={Colors.primary}
          >
            Enviar
          </Button>
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
          Nuevo PQRS
        </Button>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabBar}>
        {(['all', 'open', 'in_progress', 'resolved'] as const).map(tab => {
          const tabLabels: Record<string, string> = {
            all: 'Todos',
            open: 'Abiertos',
            in_progress: 'En Progreso',
            resolved: 'Resueltos',
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

      {/* PQRS list */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : filteredPqrs.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="ticket-confirmation-outline" size={56} color={Colors.textSecondary} />
          <Text variant="bodyLarge" style={styles.emptyTitle}>Sin PQRS</Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            No tienes PQRS en esta categoria
          </Text>
        </View>
      ) : (
        filteredPqrs.map(pqrs => {
          const catCfg = categoryConfig[pqrs.category] || categoryConfig.other;
          const statCfg = statusConfig[pqrs.status] || statusConfig.open;
          const priCfg = priorityConfig[pqrs.priority] || priorityConfig.normal;

          return (
            <Card key={pqrs.id} style={styles.pqrsCard} onPress={() => openDetail(pqrs)}>
              <Card.Content>
                <View style={styles.pqrsHeader}>
                  <View style={[styles.pqrsIcon, { backgroundColor: catCfg.bgColor }]}>
                    <Icon name={catCfg.icon} size={20} color={catCfg.color} />
                  </View>
                  <View style={styles.pqrsInfo}>
                    <Text variant="titleSmall" style={styles.pqrsSubject}>{pqrs.subject}</Text>
                    <Text variant="bodySmall" style={styles.pqrsDesc} numberOfLines={1}>
                      {pqrs.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.pqrsFooter}>
                  <View style={styles.pqrsBadges}>
                    <View style={[styles.miniBadge, { backgroundColor: statCfg.color + '20' }]}>
                      <Icon name={statCfg.icon} size={12} color={statCfg.color} />
                      <Text variant="bodySmall" style={{ color: statCfg.color, fontSize: 11 }}>
                        {statCfg.label}
                      </Text>
                    </View>
                    <View style={[styles.miniBadge, { backgroundColor: priCfg.color + '20' }]}>
                      <Text variant="bodySmall" style={{ color: priCfg.color, fontSize: 11 }}>
                        {priCfg.label}
                      </Text>
                    </View>
                  </View>
                  <Text variant="bodySmall" style={styles.pqrsDate}>
                    {new Date(pqrs.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          );
        })
      )}

      <View style={{ height: 30 }} />

      {/* Create Modal */}
      <Portal>
        <Modal
          visible={createModalVisible}
          onDismiss={() => setCreateModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Icon name="ticket-confirmation" size={32} color={Colors.primary} />
              <Text variant="titleLarge" style={styles.modalTitle}>Nuevo PQRS</Text>
            </View>

            <TextInput
              mode="outlined"
              label="Asunto *"
              value={createForm.subject}
              onChangeText={v => setCreateForm(prev => ({ ...prev, subject: v }))}
              placeholder="Ej: Fuga en el techo"
              style={styles.formInput}
              outlineStyle={styles.formInputOutline}
            />

            <TextInput
              mode="outlined"
              label="Descripcion *"
              value={createForm.description}
              onChangeText={v => setCreateForm(prev => ({ ...prev, description: v }))}
              placeholder="Describe el problema en detalle..."
              multiline
              numberOfLines={4}
              style={styles.formInput}
              outlineStyle={styles.formInputOutline}
            />

            <Text variant="bodySmall" style={styles.formLabel}>Categoria</Text>
            <View style={styles.categoryGrid}>
              {Object.entries(categoryConfig).map(([key, cfg]) => (
                <Button
                  key={key}
                  mode={createForm.category === key ? 'contained' : 'outlined'}
                  compact
                  icon={cfg.icon}
                  onPress={() => setCreateForm(prev => ({ ...prev, category: key }))}
                  style={[
                    styles.categoryButton,
                    createForm.category === key && { backgroundColor: cfg.color },
                  ]}
                  labelStyle={[
                    styles.categoryButtonLabel,
                    createForm.category === key && { color: '#FFF' },
                  ]}
                >
                  {cfg.label}
                </Button>
              ))}
            </View>

            <Text variant="bodySmall" style={styles.formLabel}>Prioridad</Text>
            <View style={styles.priorityRow}>
              {Object.entries(priorityConfig).map(([key, cfg]) => (
                <Button
                  key={key}
                  mode={createForm.priority === key ? 'contained' : 'outlined'}
                  compact
                  onPress={() => setCreateForm(prev => ({ ...prev, priority: key }))}
                  style={[
                    styles.priorityButton,
                    createForm.priority === key && { backgroundColor: cfg.color },
                  ]}
                  labelStyle={[
                    styles.priorityButtonLabel,
                    createForm.priority === key && { color: '#FFF' },
                  ]}
                >
                  {cfg.label}
                </Button>
              ))}
            </View>

            <TextInput
              mode="outlined"
              label="Unidad"
              value={createForm.unit}
              onChangeText={v => setCreateForm(prev => ({ ...prev, unit: v }))}
              placeholder={user?.unit || 'Ej: 301'}
              style={styles.formInput}
              outlineStyle={styles.formInputOutline}
            />

            <TextInput
              mode="outlined"
              label="Ubicacion"
              value={createForm.location_detail}
              onChangeText={v => setCreateForm(prev => ({ ...prev, location_detail: v }))}
              placeholder="Ej: Tercer piso"
              style={styles.formInput}
              outlineStyle={styles.formInputOutline}
            />

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
                disabled={creating || !createForm.subject || !createForm.description}
                style={styles.submitButton}
                buttonColor={Colors.primary}
              >
                {creating ? 'Creando...' : 'Crear'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
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
    marginHorizontal: 16,
    marginTop: 20,
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
  // PQRS card
  pqrsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  pqrsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pqrsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pqrsInfo: {
    flex: 1,
  },
  pqrsSubject: {
    fontWeight: '600',
    color: Colors.text,
  },
  pqrsDesc: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pqrsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  pqrsBadges: {
    flexDirection: 'row',
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
  pqrsDate: {
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
  badges: {
    flexDirection: 'row',
    gap: 6,
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
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
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
  // Comments
  commentCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.muted,
  },
  commentInternal: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAuthorName: {
    fontWeight: '600',
    color: Colors.text,
  },
  commentRole: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  commentTime: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  commentContent: {
    color: Colors.text,
    lineHeight: 18,
  },
  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 10,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    color: Colors.textSecondary,
    marginTop: 8,
  },
  // Add comment
  addCommentCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  commentInput: {
    backgroundColor: Colors.surface,
    marginBottom: 8,
  },
  commentInputOutline: {
    borderRadius: 10,
  },
  sendButton: {
    alignSelf: 'flex-end',
    borderRadius: 8,
  },
  // Modal
  modalContainer: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    maxHeight: '85%',
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
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    borderRadius: 8,
  },
  priorityButtonLabel: {
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
