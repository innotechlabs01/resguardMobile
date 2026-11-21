import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, View, ScrollView, StyleSheet, Alert } from 'react-native';
import { ActivityIndicator, Card, Text, Button, Surface, Chip, Portal, Modal, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/services/supabase';

interface DbCommonArea {
  id: string;
  building_id: string;
  name: string;
  description: string | null;
  max_capacity: number | null;
  max_duration_hours: number | null;
  advance_notice_hours: number | null;
  is_active: boolean;
}

interface DbAreaReservation {
  id: string;
  area_id: string;
  building_id: string;
  user_id: string;
  user_name: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string | null;
  created_at: string;
}

const areaIconForName = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('bbq') || lower.includes('asador') || lower.includes('parrilla')) return 'grill';
  if (lower.includes('gimnasio') || lower.includes('gym')) return 'dumbbell';
  if (lower.includes('piscina') || lower.includes('pool')) return 'pool';
  if (lower.includes('salon') || lower.includes('salón') || lower.includes('social')) return 'party-popper';
  if (lower.includes('terraza')) return 'balcony';
  if (lower.includes('cancha')) return 'tennis';
  return 'home-city-outline';
};

export default function ReservasScreen() {
  const { user } = useAuth();
  const [commonAreas, setCommonAreas] = useState<DbCommonArea[]>([]);
  const [reservations, setReservations] = useState<DbAreaReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedArea, setSelectedArea] = useState<DbCommonArea | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    if (!user?.building_id || !user?.id) {
      setLoading(false);
      return;
    }
    try {
      const [areasRes, reservationsRes] = await Promise.all([
        supabase
          .from('common_areas')
          .select('*')
          .eq('building_id', user.building_id)
          .eq('is_active', true)
          .order('name', { ascending: true }),
        supabase
          .from('area_reservations')
          .select('*')
          .eq('building_id', user.building_id)
          .eq('user_id', user.id)
          .order('start_time', { ascending: false }),
      ]);

      if (areasRes.error) throw areasRes.error;
      if (reservationsRes.error) throw reservationsRes.error;

      setCommonAreas(areasRes.data || []);
      setReservations(reservationsRes.data || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.building_id, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const formatDate = (iso: string) => {
    return new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(iso));
  };

  const formatTime = (iso: string) => {
    return new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso));
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmada', color: Colors.success, bgColor: Colors.successContainer };
      case 'pending':
        return { label: 'Pendiente', color: Colors.warning, bgColor: Colors.warningContainer };
      case 'completed':
        return { label: 'Completada', color: Colors.info, bgColor: Colors.infoContainer };
      case 'cancelled':
        return { label: 'Cancelada', color: Colors.error, bgColor: Colors.errorContainer };
      default:
        return { label: status, color: Colors.textSecondary, bgColor: Colors.background };
    }
  };

  const getAreaName = (areaId: string) => {
    const area = commonAreas.find((a) => a.id === areaId);
    return area?.name || 'Zona Común';
  };

  const getAreaIcon = (areaId: string) => {
    const area = commonAreas.find((a) => a.id === areaId);
    return area ? areaIconForName(area.name) : 'home-city-outline';
  };

  const handleCancel = (reservationId: string) => {
    if (!user?.id) return;
    Alert.alert(
      'Cancelar Reserva',
      '¿Estás seguro de cancelar esta reserva?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('area_reservations')
                .update({ status: 'cancelled' })
                .eq('id', reservationId)
                .eq('user_id', user.id);

              if (error) throw error;

              setReservations((prev) =>
                prev.map((r) => (r.id === reservationId ? { ...r, status: 'cancelled' } : r))
              );
              Alert.alert('Éxito', 'Reserva cancelada correctamente.');
            } catch (error) {
              console.error('Error cancelling reservation:', error);
              Alert.alert('Error', 'No se pudo cancelar la reserva.');
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!user?.building_id || !user?.id) {
      Alert.alert('Error', 'Debes iniciar sesión para hacer una reserva.');
      return;
    }
    const targetArea = selectedArea || commonAreas[0] || null;
    if (!targetArea) {
      Alert.alert('Error', 'No hay zonas comunes disponibles en este edificio.');
      return;
    }
    if (!formData.date || !formData.startTime || !formData.endTime) {
      Alert.alert('Error', 'Por favor completa la fecha, hora de inicio y hora de fin.');
      return;
    }

    const startDate = new Date(`${formData.date.trim()}T${formData.startTime.trim()}:00`);
    const endDate = new Date(`${formData.date.trim()}T${formData.endTime.trim()}:00`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      Alert.alert('Error', 'Formato inválido. Usa YYYY-MM-DD y HH:MM (ej. 14:00).');
      return;
    }
    if (endDate <= startDate) {
      Alert.alert('Error', 'La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('area_reservations')
        .insert({
          area_id: targetArea.id,
          building_id: user.building_id,
          user_id: user.id,
          user_name: user.display_name || user.email,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          status: 'pending',
          notes: formData.notes.trim() || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23P01' || error.message?.includes('Time slot already reserved')) {
          Alert.alert('Horario ocupado', 'Ese horario ya está reservado para esta zona.');
          return;
        }
        throw error;
      }

      if (data) {
        setReservations((prev) => [data, ...prev]);
      }
      setModalVisible(false);
      setFormData({ date: '', startTime: '', endTime: '', notes: '' });
      setSelectedArea(null);
      Alert.alert('Éxito', 'Tu solicitud de reserva ha sido enviada.');
    } catch (error) {
      console.error('Error creating reservation:', error);
      Alert.alert('Error', 'No se pudo crear la reserva. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const openReservationModal = (area: DbCommonArea) => {
    setSelectedArea(area);
    setModalVisible(true);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <Text variant="titleMedium" style={styles.sectionTitle}>Áreas Disponibles</Text>
      {loading ? (
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : commonAreas.length === 0 ? (
        <Card style={styles.reservationsCard}>
          <Card.Content style={styles.emptyState}>
            <Icon name="home-city-outline" size={40} color={Colors.textSecondary} />
            <Text variant="bodyMedium" style={styles.emptyText}>
              No hay zonas comunes configuradas
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.areasScroll}>
          <View style={styles.areasContainer}>
            {commonAreas.map((area) => (
              <Card
                key={area.id}
                style={styles.areaCard}
                onPress={() => openReservationModal(area)}
              >
                <Card.Content style={styles.areaContent}>
                  <View style={styles.areaIcon}>
                    <Icon name={areaIconForName(area.name)} size={28} color={Colors.text} />
                  </View>
                  <Text variant="titleSmall" style={styles.areaName}>{area.name}</Text>
                  <Text variant="bodySmall" style={styles.areaInfo}>
                    Máx {area.max_capacity ?? 10} personas
                  </Text>
                  {area.max_duration_hours ? (
                    <Text variant="bodySmall" style={styles.areaDeposit}>
                      Máx {area.max_duration_hours}h
                    </Text>
                  ) : null}
                </Card.Content>
              </Card>
            ))}
          </View>
        </ScrollView>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>Mis Reservas</Text>
      <Card style={styles.reservationsCard}>
        <Card.Content>
          {loading ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : reservations.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="calendar-blank-outline" size={64} color={Colors.textSecondary} />
              <Text variant="bodyMedium" style={styles.emptyText}>
                No tienes reservas programadas
              </Text>
              {commonAreas.length > 0 && (
                <Button
                  mode="contained"
                  onPress={() => {
                    setSelectedArea(commonAreas[0]);
                    setModalVisible(true);
                  }}
                  style={{ backgroundColor: Colors.primary, marginTop: 16 }}
                >
                  Hacer una Reserva
                </Button>
              )}
            </View>
          ) : (
            reservations.map((reservation, index) => {
              const statusConfig = getStatusConfig(reservation.status);
              const areaName = getAreaName(reservation.area_id);
              const areaIcon = getAreaIcon(reservation.area_id);

              return (
                <View key={reservation.id}>
                  <Surface style={styles.reservationItem} elevation={0}>
                    <View style={styles.reservationIcon}>
                      <Icon name={areaIcon} size={24} color={Colors.text} />
                    </View>
                    <View style={styles.reservationInfo}>
                      <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{areaName}</Text>
                      <Text variant="bodySmall" style={styles.reservationDate}>
                        {formatDate(reservation.start_time)}
                      </Text>
                      <Text variant="bodySmall" style={styles.reservationTime}>
                        {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
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
                  </Surface>
                  {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                    <View style={styles.reservationActions}>
                      <Button
                        mode="text"
                        compact
                        textColor={Colors.error}
                        onPress={() => handleCancel(reservation.id)}
                      >
                        Cancelar
                      </Button>
                    </View>
                  )}
                  {index < reservations.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })
          )}
        </Card.Content>
      </Card>

      <Card style={styles.rulesCard}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.rulesTitle}>Normas de Reserva</Text>
          <View style={styles.rulesList}>
            <View style={styles.ruleItem}>
              <Icon name="clock-outline" size={20} color={Colors.textSecondary} />
              <Text variant="bodySmall" style={styles.ruleText}>
                Las reservas deben realizarse con al menos 24 horas de anticipacion.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Icon name="cash-outline" size={20} color={Colors.textSecondary} />
              <Text variant="bodySmall" style={styles.ruleText}>
                El deposito se devuelve 24 horas despues del evento si no hay danos.
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Icon name="account-group-outline" size={20} color={Colors.textSecondary} />
              <Text variant="bodySmall" style={styles.ruleText}>
                El numero de invitados no puede exceder el maximo permitido.
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Nueva Reserva
            </Text>
            {selectedArea && (
              <Chip style={styles.selectedAreaChip} icon="check">
                {selectedArea.name}
              </Chip>
            )}
            
            <TextInput
              mode="outlined"
              label="Fecha"
              placeholder="YYYY-MM-DD"
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
              style={styles.input}
            />
            
            <View style={styles.timeRow}>
              <TextInput
                mode="outlined"
                label="Hora Inicio"
                placeholder="14:00"
                value={formData.startTime}
                onChangeText={(text) => setFormData({ ...formData, startTime: text })}
                style={[styles.input, styles.timeInput]}
              />
              <TextInput
                mode="outlined"
                label="Hora Fin"
                placeholder="18:00"
                value={formData.endTime}
                onChangeText={(text) => setFormData({ ...formData, endTime: text })}
                style={[styles.input, styles.timeInput]}
              />
            </View>
            
            <TextInput
              mode="outlined"
              label="Notas (opcional)"
              placeholder="Descripcion del evento"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Button 
                mode="outlined" 
                onPress={() => setModalVisible(false)}
                disabled={submitting}
                style={{ flex: 1 }}
              >
                Cancelar
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting}
                style={{ flex: 1, backgroundColor: Colors.primary }}
              >
                Enviar
              </Button>
            </View>
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
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  areasScroll: {
    paddingLeft: 16,
  },
  areasContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  areaCard: {
    width: 140,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  areaContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  areaIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: Colors.muted,
  },
  areaName: {
    fontWeight: '600',
    textAlign: 'center',
  },
  areaInfo: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  areaDeposit: {
    color: Colors.warning,
    marginTop: 4,
  },
  reservationsCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  reservationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  reservationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.muted,
  },
  reservationInfo: {
    flex: 1,
  },
  reservationDate: {
    color: Colors.text,
    marginTop: 2,
  },
  reservationTime: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reservationActions: {
    alignItems: 'flex-end',
    paddingBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
  rulesCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  rulesTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  rulesList: {
    gap: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ruleText: {
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
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  selectedAreaChip: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    backgroundColor: Colors.muted,
  },
  input: {
    marginBottom: 12,
    backgroundColor: Colors.surface,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  depositInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.infoContainer,
    borderRadius: 8,
    marginBottom: 16,
  },
  depositText: {
    color: Colors.info,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});