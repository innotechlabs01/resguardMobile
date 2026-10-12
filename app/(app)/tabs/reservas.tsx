import { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Text, Button, Surface, Chip, Portal, Modal, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../../src/lib/theme';
import { mockReservations, mockCommonAreas } from '../../../src/services/mockData';
import { Reservation, CommonArea } from '../../../src/types';

export default function ReservasScreen() {
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedArea, setSelectedArea] = useState<CommonArea | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    guests: '',
    notes: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(date));
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmada', color: Colors.success, bgColor: Colors.successContainer };
      case 'pending':
        return { label: 'Pendiente', color: Colors.warning, bgColor: Colors.warningContainer };
      case 'cancelled':
        return { label: 'Cancelada', color: Colors.error, bgColor: Colors.errorContainer };
      default:
        return { label: status, color: Colors.textSecondary, bgColor: Colors.background };
    }
  };

  const getAreaName = (areaId: string) => {
    const area = mockCommonAreas.find(a => a.id === areaId || a.name.toLowerCase().replace(' ', '_') === areaId);
    return area?.name || areaId;
  };

  const getAreaIcon = (areaId: string) => {
    const area = mockCommonAreas.find(a => a.id === areaId || a.name.toLowerCase().replace(' ', '_') === areaId);
    return area?.icon || 'home';
  };

  const handleCancel = (reservationId: string) => {
    Alert.alert(
      'Cancelar Reserva',
      'Estas seguro de cancelar esta reserva?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Si, Cancelar', 
          style: 'destructive',
          onPress: () => {
            setReservations(prev => prev.map(r => 
              r.id === reservationId ? { ...r, status: 'cancelled' } : r
            ));
            Alert.alert('Exito', 'Reserva cancelada correctamente.');
          }
        },
      ]
    );
  };

  const handleSubmit = () => {
    if (!formData.date || !formData.startTime || !formData.endTime) {
      Alert.alert('Error', 'Por favor completa los campos requeridos.');
      return;
    }

    const newReservation: Reservation = {
      id: Date.now().toString(),
      area: selectedArea?.name.toLowerCase().replace(' ', '_') || '',
      date: new Date(formData.date),
      startTime: formData.startTime,
      endTime: formData.endTime,
      status: 'pending',
      guests: formData.guests ? parseInt(formData.guests) : undefined,
      notes: formData.notes || undefined,
    };

    setReservations([newReservation, ...reservations]);
    setModalVisible(false);
    setFormData({ date: '', startTime: '', endTime: '', guests: '', notes: '' });
    setSelectedArea(null);
    Alert.alert('Exito', 'Tu solicitud de reserva ha sido enviada. Recibiras una confirmacion.');
  };

  const openReservationModal = (area: CommonArea) => {
    setSelectedArea(area);
    setModalVisible(true);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text variant="titleMedium" style={styles.sectionTitle}>Areas Disponibles</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.areasScroll}>
        <View style={styles.areasContainer}>
          {mockCommonAreas.map((area) => (
            <Card 
              key={area.id} 
              style={styles.areaCard}
              onPress={() => openReservationModal(area)}
            >
              <Card.Content style={styles.areaContent}>
                <View style={styles.areaIcon}>
                  <Icon name={area.icon} size={28} color={Colors.text} />
                </View>
                <Text variant="titleSmall" style={styles.areaName}>{area.name}</Text>
                <Text variant="bodySmall" style={styles.areaInfo}>
                  Max {area.maxGuests} personas
                </Text>
                {area.deposit > 0 && (
                  <Text variant="bodySmall" style={styles.areaDeposit}>
                    Deposito: {formatCurrency(area.deposit)}
                  </Text>
                )}
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>

      <Text variant="titleMedium" style={styles.sectionTitle}>Mis Reservas</Text>
      <Card style={styles.reservationsCard}>
        <Card.Content>
          {reservations.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="calendar-blank-outline" size={64} color={Colors.textSecondary} />
              <Text variant="bodyMedium" style={styles.emptyText}>
                No tienes reservas programadas
              </Text>
              <Button 
                mode="contained" 
                onPress={() => setModalVisible(true)}
                style={{ backgroundColor: Colors.primary, marginTop: 16 }}
              >
                Hacer una Reserva
              </Button>
            </View>
          ) : (
            reservations.map((reservation, index) => {
              const statusConfig = getStatusConfig(reservation.status);
              const areaName = getAreaName(reservation.area);
              const areaIcon = getAreaIcon(reservation.area);
              
              return (
                <View key={reservation.id}>
                  <Surface style={styles.reservationItem} elevation={0}>
                    <View style={styles.reservationIcon}>
                      <Icon name={areaIcon} size={24} color={Colors.text} />
                    </View>
                    <View style={styles.reservationInfo}>
                      <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{areaName}</Text>
                      <Text variant="bodySmall" style={styles.reservationDate}>
                        {formatDate(reservation.date)}
                      </Text>
                      <Text variant="bodySmall" style={styles.reservationTime}>
                        {reservation.startTime} - {reservation.endTime}
                        {reservation.guests && ` | ${reservation.guests} invitados`}
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
                  {reservation.status === 'pending' && (
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
              label="Numero de Invitados"
              placeholder="Cantidad aproximada"
              value={formData.guests}
              onChangeText={(text) => setFormData({ ...formData, guests: text })}
              keyboardType="numeric"
              style={styles.input}
            />
            
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

            {selectedArea?.deposit && selectedArea.deposit > 0 && (
              <Surface style={styles.depositInfo} elevation={0}>
                <Icon name="information-outline" size={20} color={Colors.info} />
                <Text variant="bodySmall" style={styles.depositText}>
                  Deposito requerido: {formatCurrency(selectedArea.deposit)}
                </Text>
              </Surface>
            )}
            
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