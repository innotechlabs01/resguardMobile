import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
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
import { Colors } from '../../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  getWorkOrders,
  getSchedules,
  getWorkOrderById,
  updateWorkOrderStatus,
  WorkOrder,
  MaintenanceSchedule,
} from '../../src/services/maintenance';

const categoryConfig: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
  elevator: { label: 'Ascensor', icon: 'elevator', color: '#8B5CF6', bgColor: '#EDE9FE' },
  plumbing: { label: 'Plomeria', icon: 'water', color: '#3B82F6', bgColor: '#DBEAFE' },
  electrical: { label: 'Electrico', icon: 'flash', color: '#F59E0B', bgColor: '#FEF3C7' },
  painting: { label: 'Pintura', icon: 'paintbrush', color: '#EC4899', bgColor: '#FCE7F3' },
  gardening: { label: 'Jardineria', icon: 'flower', color: '#10B981', bgColor: '#D1FAE5' },
  cleaning: { label: 'Limpieza', icon: 'broom', color: '#14B8A6', bgColor: '#CCFBF1' },
  security_system: { label: 'Seguridad', icon: 'shield-lock', color: '#DC2626', bgColor: '#FEE2E2' },
  other: { label: 'Otro', icon: 'help-circle', color: '#666666', bgColor: '#F3F4F6' },
};

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pendiente', color: '#F59E0B', icon: 'clock-outline' },
  in_progress: { label: 'En Progreso', color: '#3B82F6', icon: 'progress-clock' },
  completed: { label: 'Completada', color: '#10B981', icon: 'check-circle' },
  cancelled: { label: 'Cancelada', color: '#666666', icon: 'close-circle' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: '#666666' },
  normal: { label: 'Normal', color: '#3B82F6' },
  high: { label: 'Alta', color: '#EA580C' },
  urgent: { label: 'Urgente', color: '#DC2626' },
};

export default function MantenimientoScreen() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filterTab, setFilterTab] = useState('all');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Status update modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  const [targetStatus, setTargetStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.building_id) return;
    try {
      const [orders, scheds] = await Promise.all([
        getWorkOrders(user.building_id),
        getSchedules(user.building_id),
      ]);
      setWorkOrders(orders);
      setSchedules(scheds);
    } catch (err) {
      console.error('Error fetching maintenance data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.building_id]);

  // Polling every 15s
  useEffect(() => {
    fetchData();
    pollingRef.current = setInterval(fetchData, 15000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Open detail
  const openDetail = async (order: WorkOrder) => {
    setSelectedOrder(order);
    setLoadingDetail(true);
    try {
      const data = await getWorkOrderById(order.id);
      if (data) setSelectedOrder(data);
    } catch (err) {
      console.error('Error fetching detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Update status
  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const success = await updateWorkOrderStatus(selectedOrder.id, newStatus, statusNotes || undefined);
      if (success) {
        setStatusModalVisible(false);
        setSelectedOrder(null);
        setStatusNotes('');
        fetchData();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Filter orders
  const filteredOrders = workOrders.filter(o => {
    if (filterTab === 'all') return true;
    if (filterTab === 'pending') return ['pending'].includes(o.status);
    if (filterTab === 'in_progress') return ['in_progress'].includes(o.status);
    if (filterTab === 'completed') return ['completed', 'cancelled'].includes(o.status);
    return true;
  });

  const pendingCount = workOrders.filter(o => o.status === 'pending').length;
  const overdueSchedules = schedules.filter(s => s.next_due < new Date().toISOString().split('T')[0]).length;

  // ── Detail View ──
  if (selectedOrder) {
    const catCfg = categoryConfig[selectedOrder.category] || categoryConfig.other;
    const statCfg = statusConfig[selectedOrder.status] || statusConfig.pending;
    const priCfg = priorityConfig[selectedOrder.priority] || priorityConfig.normal;

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Button
          mode="text"
          icon="arrow-left"
          onPress={() => { setSelectedOrder(null); fetchData(); }}
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

          <Text variant="titleLarge" style={styles.detailTitle}>{selectedOrder.title}</Text>
          {selectedOrder.description && (
            <Text variant="bodyMedium" style={styles.detailDescription}>{selectedOrder.description}</Text>
          )}

          <View style={styles.detailMeta}>
            {selectedOrder.scheduled_date && (
              <Text variant="bodySmall" style={styles.detailMetaText}>
                Programada: {new Date(selectedOrder.scheduled_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
              </Text>
            )}
            {selectedOrder.completed_date && (
              <Text variant="bodySmall" style={[styles.detailMetaText, { color: Colors.success }]}>
                Completada: {new Date(selectedOrder.completed_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
              </Text>
            )}
            {selectedOrder.assigned_provider && (
              <Text variant="bodySmall" style={styles.detailMetaText}>
                Proveedor: {selectedOrder.assigned_provider}
              </Text>
            )}
            {selectedOrder.assigned_provider_phone && (
              <Text variant="bodySmall" style={styles.detailMetaText}>
                Tel: {selectedOrder.assigned_provider_phone}
              </Text>
            )}
            {selectedOrder.actual_cost && (
              <Text variant="bodySmall" style={styles.detailMetaText}>
                Costo real: ${selectedOrder.actual_cost.toLocaleString('es-CO')}
              </Text>
            )}
          </View>

          {selectedOrder.notes && (
            <Surface style={styles.notesCard} elevation={0}>
              <Text variant="bodySmall" style={styles.notesLabel}>Notas:</Text>
              <Text variant="bodyMedium" style={styles.notesText}>{selectedOrder.notes}</Text>
            </Surface>
          )}
        </Surface>

        {/* Status update buttons */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Actualizar Estado</Text>
        <View style={styles.statusButtons}>
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <Button
              key={key}
              mode={selectedOrder.status === key ? 'contained' : 'outlined'}
              compact
              icon={cfg.icon}
              onPress={() => {
                setStatusNotes('');
                setTargetStatus(key);
                setStatusModalVisible(true);
              }}
              disabled={selectedOrder.status === key}
              style={[
                styles.statusButton,
                selectedOrder.status === key && { backgroundColor: cfg.color },
              ]}
              labelStyle={[
                styles.statusButtonLabel,
                selectedOrder.status === key && { color: '#FFF' },
              ]}
            >
              {cfg.label}
            </Button>
          ))}
        </View>

        <View style={{ height: 30 }} />

        {/* Status update modal */}
        <Portal>
          <Modal
            visible={statusModalVisible}
            onDismiss={() => setStatusModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Text variant="titleMedium" style={styles.modalTitle}>Actualizar Estado</Text>
            <TextInput
              mode="outlined"
              label="Notas (opcional)"
              value={statusNotes}
              onChangeText={setStatusNotes}
              placeholder="Agregar notas sobre el cambio..."
              multiline
              numberOfLines={3}
              style={styles.formInput}
              outlineStyle={styles.formInputOutline}
            />
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setStatusModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                icon="check"
                onPress={() => handleStatusUpdate(targetStatus)}
                disabled={updating}
                style={styles.submitButton}
                buttonColor={Colors.primary}
              >
                {updating ? 'Actualizando...' : 'Confirmar'}
              </Button>
            </View>
          </Modal>
        </Portal>
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
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <Surface style={styles.statCard} elevation={0}>
          <Icon name="calendar-clock" size={20} color={Colors.info} />
          <Text variant="bodySmall" style={styles.statLabel}>Proximos</Text>
          <Text variant="titleMedium" style={styles.statValue}>{schedules.length}</Text>
        </Surface>
        <Surface style={styles.statCard} elevation={0}>
          <Icon name="alert-circle" size={20} color={Colors.error} />
          <Text variant="bodySmall" style={styles.statLabel}>Vencidos</Text>
          <Text variant="titleMedium" style={[styles.statValue, { color: Colors.error }]}>{overdueSchedules}</Text>
        </Surface>
        <Surface style={styles.statCard} elevation={0}>
          <Icon name="clipboard-text-clock" size={20} color={Colors.warning} />
          <Text variant="bodySmall" style={styles.statLabel}>Pendientes</Text>
          <Text variant="titleMedium" style={[styles.statValue, { color: Colors.warning }]}>{pendingCount}</Text>
        </Surface>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabBar}>
        {(['all', 'pending', 'in_progress', 'completed'] as const).map(tab => {
          const tabLabels: Record<string, string> = {
            all: 'Todas',
            pending: 'Pendientes',
            in_progress: 'En Progreso',
            completed: 'Completadas',
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

      {/* Work orders list */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="wrench-outline" size={56} color={Colors.textSecondary} />
          <Text variant="bodyLarge" style={styles.emptyTitle}>Sin ordenes</Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            No hay ordenes de trabajo en esta categoria
          </Text>
        </View>
      ) : (
        filteredOrders.map(order => {
          const catCfg = categoryConfig[order.category] || categoryConfig.other;
          const statCfg = statusConfig[order.status] || statusConfig.pending;
          const priCfg = priorityConfig[order.priority] || priorityConfig.normal;
          const isOverdue = order.scheduled_date && order.scheduled_date < new Date().toISOString().split('T')[0] && order.status === 'pending';

          return (
            <Card key={order.id} style={[styles.orderCard, isOverdue && styles.overdueCard]} onPress={() => openDetail(order)}>
              <Card.Content>
                <View style={styles.orderHeader}>
                  <View style={[styles.orderIcon, { backgroundColor: catCfg.bgColor }]}>
                    <Icon name={catCfg.icon} size={20} color={catCfg.color} />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text variant="titleSmall" style={styles.orderTitle}>{order.title}</Text>
                    {order.description && (
                      <Text variant="bodySmall" style={styles.orderDesc} numberOfLines={1}>
                        {order.description}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.orderFooter}>
                  <View style={styles.orderBadges}>
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
                    {isOverdue && (
                      <View style={[styles.miniBadge, { backgroundColor: Colors.error + '20' }]}>
                        <Icon name="alert" size={12} color={Colors.error} />
                        <Text variant="bodySmall" style={{ color: Colors.error, fontSize: 11 }}>
                          Vencida
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text variant="bodySmall" style={styles.orderDate}>
                    {order.scheduled_date
                      ? new Date(order.scheduled_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
                      : '-'}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          );
        })
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Stats
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    gap: 4,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  statValue: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 16,
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
  // Section
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
  // Order card
  orderCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  overdueCard: {
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontWeight: '600',
    color: Colors.text,
  },
  orderDesc: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  orderBadges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  orderDate: {
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
  notesCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.muted,
  },
  notesLabel: {
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    fontSize: 12,
  },
  notesText: {
    color: Colors.text,
    lineHeight: 18,
  },
  // Status buttons
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  statusButton: {
    borderRadius: 8,
  },
  statusButtonLabel: {
    fontSize: 11,
  },
  // Modal
  modalContainer: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  formInput: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
  },
  formInputOutline: {
    borderRadius: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
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
