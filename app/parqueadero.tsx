import { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Text, Button, Surface, Chip, Divider, TextInput, Portal, Modal, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../src/lib/theme';
import { mockParkingRequests } from '../src/services/mockData';
import { ParkingRequest } from '../src/types';
import { getParkingAssignments, ParkingAssignment } from '../src/services/parking-assignments';
import { useAuth } from '../src/contexts/AuthContext';

export default function ParqueaderoScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ParkingRequest[]>(mockParkingRequests);
  const [assignments, setAssignments] = useState<ParkingAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: '',
    vehiclePlate: '',
    date: '',
    time: '',
    duration: '2',
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const fetchAssignments = useCallback(async () => {
    if (!user?.building_id) return;
    const data = await getParkingAssignments(user.building_id);
    setAssignments(data);
    setLoadingAssignments(false);
  }, [user?.building_id]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Aprobado', color: Colors.success, bgColor: Colors.successContainer, icon: 'check-circle-outline' };
      case 'pending':
        return { label: 'Pendiente', color: Colors.warning, bgColor: Colors.warningContainer, icon: 'clock-outline' };
      case 'rejected':
        return { label: 'Rechazado', color: Colors.error, bgColor: Colors.errorContainer, icon: 'close-circle-outline' };
      case 'completed':
        return { label: 'Completado', color: Colors.textSecondary, bgColor: Colors.muted, icon: 'check-all' };
      default:
        return { label: status, color: Colors.textSecondary, bgColor: Colors.background, icon: 'help-circle-outline' };
    }
  };

  const handleSubmit = () => {
    if (!formData.visitorName || !formData.vehiclePlate || !formData.date || !formData.time) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos.');
      return;
    }

    const newRequest: ParkingRequest = {
      id: Date.now().toString(),
      visitorName: formData.visitorName,
      vehiclePlate: formData.vehiclePlate,
      date: new Date(`${formData.date}T${formData.time}`),
      duration: parseInt(formData.duration),
      status: 'pending',
    };

    setRequests([newRequest, ...requests]);
    setModalVisible(false);
    setFormData({ visitorName: '', vehiclePlate: '', date: '', time: '', duration: '2' });
    Alert.alert('Exito', 'Solicitud de parqueo enviada. Esperar aprobacion.');
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.summaryContainer}>
        <Card style={[styles.summaryCard, { backgroundColor: Colors.muted }]}>
          <Card.Content style={styles.summaryContent}>
            <Icon name="clock-outline" size={28} color={Colors.textSecondary} />
            <Text variant="bodySmall" style={styles.summaryLabel}>Pendientes</Text>
            <Text variant="headlineSmall" style={[styles.summaryValue, { color: Colors.text }]}>
              {pendingCount}
            </Text>
          </Card.Content>
        </Card>
        <Card style={[styles.summaryCard, { backgroundColor: Colors.successContainer }]}>
          <Card.Content style={styles.summaryContent}>
            <Icon name="check-circle-outline" size={28} color={Colors.success} />
            <Text variant="bodySmall" style={styles.summaryLabel}>Aprobados</Text>
            <Text variant="headlineSmall" style={[styles.summaryValue, { color: Colors.success }]}>
              {approvedCount}
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* PARQUEADEROS DEL EDIFICIO (asignaciones reales) */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Parqueaderos del Edificio</Text>
      {loadingAssignments ? (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : assignments.length === 0 ? (
        <Card style={styles.requestsCard}>
          <Card.Content>
            <View style={styles.emptyState}>
              <Icon name="parking" size={48} color={Colors.textSecondary} />
              <Text variant="bodySmall" style={styles.emptyText}>No hay parqueaderos registrados</Text>
            </View>
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.requestsCard}>
          <Card.Content>
            {assignments.map((a, index) => (
              <View key={a.id}>
                <Surface style={styles.assignmentItem} elevation={0}>
                  <View style={[styles.assignmentBadge, {
                    backgroundColor: a.assignment_type === 'owner' ? Colors.infoContainer
                      : a.assignment_type === 'rented' ? Colors.warningContainer
                      : Colors.successContainer
                  }]}>
                    <Icon
                      name={a.assignment_type === 'owner' ? 'car' : a.assignment_type === 'rented' ? 'car-key' : 'parking'}
                      size={20}
                      color={a.assignment_type === 'owner' ? Colors.info : a.assignment_type === 'rented' ? Colors.warning : Colors.success}
                    />
                  </View>
                  <View style={styles.assignmentInfo}>
                    <View style={styles.assignmentHeader}>
                      <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{a.spot_code}</Text>
                      <Chip compact style={{
                        backgroundColor: a.assignment_type === 'owner' ? Colors.infoContainer
                          : a.assignment_type === 'rented' ? Colors.warningContainer
                          : Colors.successContainer
                      }}>
                        <Text style={{
                          color: a.assignment_type === 'owner' ? Colors.info
                            : a.assignment_type === 'rented' ? Colors.warning
                            : Colors.success,
                          fontSize: 10
                        }}>
                          {a.assignment_type === 'owner' ? 'Propietario' : a.assignment_type === 'rented' ? 'Alquilado' : 'Disponible'}
                        </Text>
                      </Chip>
                    </View>
                    {a.assignment_type === 'owner' && (
                      <Text variant="bodySmall" style={styles.assignmentDetail}>
                        {a.owner_name || 'Propietario'}{a.owner_unit ? ` • ${a.owner_unit}` : ''}
                      </Text>
                    )}
                    {a.assignment_type === 'rented' && (
                      <Text variant="bodySmall" style={styles.assignmentDetail}>
                        {a.tenant_name || 'Inquilino'}{a.tenant_unit ? ` • ${a.tenant_unit}` : ''}
                      </Text>
                    )}
                    {a.vehicle_plate && (
                      <Text variant="bodySmall" style={styles.assignmentVehicle}>
                        🚗 {a.vehicle_plate}{a.vehicle_brand ? ` • ${a.vehicle_brand}` : ''}{a.vehicle_color ? ` • ${a.vehicle_color}` : ''}
                      </Text>
                    )}
                  </View>
                </Surface>
                {index < assignments.length - 1 && <Divider style={styles.itemDivider} />}
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => setModalVisible(true)}
          style={styles.newButton}
          buttonColor={Colors.primary}
        >
          Solicitar Parqueo
        </Button>
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>Mis Solicitudes</Text>
      <Card style={styles.requestsCard}>
        <Card.Content>
          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="car-off-outline" size={64} color={Colors.textSecondary} />
              <Text variant="bodyMedium" style={styles.emptyText}>
                No hay solicitudes de parqueo
              </Text>
            </View>
          ) : (
            requests.map((request, index) => {
              const statusConfig = getStatusConfig(request.status);
              return (
                <View key={request.id}>
                  <Surface style={styles.requestItem} elevation={0}>
                    <View style={styles.requestIcon}>
                      <Icon name="car-outline" size={24} color={Colors.text} />
                    </View>
                    <View style={styles.requestInfo}>
                      <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                        {request.visitorName}
                      </Text>
                      <Text variant="bodySmall" style={styles.requestPlate}>
                        {request.vehiclePlate}
                      </Text>
                      <Text variant="bodySmall" style={styles.requestDate}>
                        {formatDate(request.date)} - {request.time} ({request.duration}h)
                      </Text>
                    </View>
                    <View style={styles.requestStatus}>
                      <Chip 
                        mode="flat" 
                        compact
                        style={{ backgroundColor: statusConfig.bgColor }}
                        textStyle={{ color: statusConfig.color, fontSize: 10 }}
                      >
                        {statusConfig.label}
                      </Chip>
                      {request.spotAssigned && (
                        <Text variant="bodySmall" style={styles.spotText}>
                          Spot: {request.spotAssigned}
                        </Text>
                      )}
                    </View>
                  </Surface>
                  {index < requests.length - 1 && <Divider />}
                </View>
              );
            })
          )}
        </Card.Content>
      </Card>

      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.infoRow}>
            <Icon name="information-outline" size={20} color={Colors.textSecondary} />
            <Text variant="bodySmall" style={styles.infoText}>
              Las solicitudes de parqueo para visitantes deben solicitarse con al menos 2 horas de anticipacion.
            </Text>
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
              Solicitar Parqueo
            </Text>
            <Text variant="bodySmall" style={styles.modalSubtitle}>
              Ingresa los datos del visitante
            </Text>

            <TextInput
              mode="outlined"
              label="Nombre del Visitante *"
              placeholder="Juan Perez"
              value={formData.visitorName}
              onChangeText={(text) => setFormData({ ...formData, visitorName: text })}
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              label="Placa del Vehiculo *"
              placeholder="ABC-123"
              value={formData.vehiclePlate}
              onChangeText={(text) => setFormData({ ...formData, vehiclePlate: text.toUpperCase() })}
              autoCapitalize="characters"
              style={styles.input}
            />

            <View style={styles.dateRow}>
              <TextInput
                mode="outlined"
                label="Fecha *"
                placeholder="YYYY-MM-DD"
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                style={[styles.input, styles.dateInput]}
              />
              <TextInput
                mode="outlined"
                label="Hora *"
                placeholder="14:00"
                value={formData.time}
                onChangeText={(text) => setFormData({ ...formData, time: text })}
                style={[styles.input, styles.dateInput]}
              />
            </View>

            <TextInput
              mode="outlined"
              label="Duracion (horas)"
              placeholder="2"
              value={formData.duration}
              onChangeText={(text) => setFormData({ ...formData, duration: text })}
              keyboardType="numeric"
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Button 
                mode="outlined" 
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              >
                Cancelar
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSubmit}
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
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: Colors.textSecondary,
    marginTop: 8,
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  newButton: {
    borderRadius: 12,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  requestsCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  requestIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.muted,
  },
  requestInfo: {
    flex: 1,
  },
  requestPlate: {
    color: Colors.text,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  requestDate: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  requestStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  spotText: {
    color: Colors.success,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
  assignmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  assignmentBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentDetail: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  assignmentVehicle: {
    color: Colors.text,
    marginTop: 4,
    fontWeight: '500',
  },
  itemDivider: {
    marginVertical: 4,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.muted,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
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
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: Colors.surface,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});