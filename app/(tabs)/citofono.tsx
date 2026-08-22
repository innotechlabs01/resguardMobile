import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Vibration } from 'react-native';
import { Card, Text, Button, Surface, Avatar, Divider, Portal, Modal, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../src/lib/theme';
import { mockUser, mockIntercomCalls, mockIncomingCalls } from '../../src/services/mockData';
import { IncomingCall, VisitorType } from '../../src/types';

const visitorTypeConfig: Record<VisitorType, { label: string; icon: string; color: string; bgColor: string }> = {
  guest: { label: 'Visitante', icon: 'account', color: Colors.text, bgColor: Colors.muted },
  delivery: { label: 'Domicilio', icon: 'moped', color: Colors.info, bgColor: Colors.infoContainer },
  rappi: { label: 'Rappi', icon: 'shopping', color: Colors.success, bgColor: Colors.successContainer },
  express: { label: 'Express', icon: 'lightning-bolt', color: Colors.warning, bgColor: Colors.warningContainer },
  taxi: { label: 'Taxi', icon: 'taxi', color: Colors.textSecondary, bgColor: Colors.muted },
  other: { label: 'Otro', icon: 'help-circle', color: Colors.textSecondary, bgColor: Colors.muted },
};

export default function CitofonoScreen() {
  const [incomingCalls, setIncomingCalls] = useState<IncomingCall[]>(mockIncomingCalls);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'vigilante' | 'admin' | null>(null);
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [incomingModalVisible, setIncomingModalVisible] = useState(false);
  const [currentIncoming, setCurrentIncoming] = useState<IncomingCall | null>(null);
  const [isRinging, setIsRinging] = useState(false);

  // QR Visitor state
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrVisitorName, setQrVisitorName] = useState('');
  const [qrUnit, setQrUnit] = useState('');
  const [qrDuration, setQrDuration] = useState<'1h' | '2h' | '4h'>('1h');
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrHistory, setQrHistory] = useState<Array<{
    id: string;
    visitorName: string;
    unit: string;
    duration: string;
    status: 'pending' | 'used' | 'expired';
    timestamp: Date;
  }>>([]);

  const vigilante = {
    id: 'vigilante-1',
    name: 'Don Pedro',
    role: 'Vigilante',
    unit: 'Porteria',
  };

  const admin = {
    id: 'admin-1',
    name: 'Sra. Carmen',
    role: 'Administradora',
    unit: 'Oficina',
  };

  useEffect(() => {
    const randomDelay = Math.random() * 10000 + 5000;
    const timer = setTimeout(() => {
      simulateIncomingCall();
    }, randomDelay);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const simulateIncomingCall = async () => {
    const visitors = [
      { name: 'Rappi', type: 'rappi' as VisitorType, desc: 'Paquete - 2 bultos' },
      { name: 'Juan Perez', type: 'guest' as VisitorType, desc: 'Visita - Apto 301', unit: '301' },
      { name: 'Domisol Express', type: 'delivery' as VisitorType, desc: 'Almuerzo' },
      { name: 'Taxi', type: 'taxi' as VisitorType, desc: 'Cliente' },
    ];
    
    const random = visitors[Math.floor(Math.random() * visitors.length)];
    
    const newCall: IncomingCall = {
      id: `inc-${Date.now()}`,
      visitorName: random.name,
      visitorType: random.type,
      description: random.desc,
      unit: random.unit,
      timestamp: new Date(),
      status: 'ringing',
    };

    setCurrentIncoming(newCall);
    setIncomingModalVisible(true);
    setIsRinging(true);
    Vibration.vibrate([0, 500, 200, 500], true);
  };

  const playRingtone = async () => {
    // Using vibration only - audio will be added later
  };

  const stopRingtone = async () => {
    setIsRinging(false);
    Vibration.cancel();
  };

  const handleAccept = async () => {
    if (!currentIncoming) return;
    
    await stopRingtone();
    
    setIncomingCalls(prev => prev.map(call => 
      call.id === currentIncoming.id 
        ? { ...call, status: 'accepted' as const } 
        : call
    ));
    
    setIncomingModalVisible(false);
    
    Alert.alert(
      'Visitante Recibido',
      `Has confirmado la llegada de ${currentIncoming.visitorName}.`,
      [{ text: 'OK' }]
    );
  };

  const handleDecline = async () => {
    if (!currentIncoming) return;
    
    await stopRingtone();
    
    setIncomingCalls(prev => prev.map(call => 
      call.id === currentIncoming.id 
        ? { ...call, status: 'declined' as const } 
        : call
    ));
    
    setIncomingModalVisible(false);
    
    Alert.alert(
      'Llamada Rechazada',
      `Has rechazado la llamada de ${currentIncoming.visitorName}.`,
      [{ text: 'OK' }]
    );
  };

  const handleCall = (type: 'vigilante' | 'admin') => {
    setCallType(type);
    setCallModalVisible(true);
    setIsCalling(true);
    
    setTimeout(() => {
      setIsCalling(false);
      Alert.alert(
        'Llamada Finalizada',
        `La llamada con ${type === 'vigilante' ? vigilante.name : admin.name} ha terminado.`,
        [{ text: 'OK' }]
      );
      setCallModalVisible(false);
    }, 3000);
  };

  const handleGenerateQR = () => {
    if (!qrVisitorName.trim()) {
      Alert.alert('Error', 'Ingresa el nombre del visitante');
      return;
    }
    if (!qrUnit.trim()) {
      Alert.alert('Error', 'Ingresa la unidad destino');
      return;
    }

    const newQR = {
      id: `qr-${Date.now()}`,
      visitorName: qrVisitorName.trim(),
      unit: qrUnit.trim(),
      duration: qrDuration,
      status: 'pending' as const,
      timestamp: new Date(),
    };

    setQrHistory(prev => [newQR, ...prev]);
    setQrGenerated(true);

    // Auto-expire QR after duration
    const durationMs = qrDuration === '1h' ? 3600000 : qrDuration === '2h' ? 7200000 : 14400000;
    setTimeout(() => {
      setQrHistory(prev => prev.map(qr =>
        qr.id === newQR.id ? { ...qr, status: 'expired' as const } : qr
      ));
    }, durationMs);
  };

  const resetQRModal = () => {
    setQrModalVisible(false);
    setQrVisitorName('');
    setQrUnit('');
    setQrDuration('1h');
    setQrGenerated(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCallTime = (date: Date) => {
    return new Date(date).toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'accepted':
        return { label: 'Recibido', color: Colors.success, icon: 'check-circle' };
      case 'declined':
        return { label: 'Rechazado', color: Colors.error, icon: 'close-circle' };
      case 'missed':
        return { label: 'Perdido', color: Colors.warning, icon: 'alert-circle' };
      case 'ringing':
        return { label: 'Sonando', color: Colors.success, icon: 'bell' };
      default:
        return { label: status, color: Colors.textSecondary, icon: 'help-circle' };
    }
  };

  const ringingCalls = incomingCalls.filter(c => c.status === 'ringing');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {ringingCalls.length > 0 && (
        <View style={styles.incomingAlert}>
          <Surface style={styles.incomingAlertCard} elevation={3}>
            <View style={styles.incomingAlertContent}>
              <Icon name="bell" size={24} color={Colors.success} />
              <View style={styles.incomingAlertText}>
                <Text variant="titleSmall" style={styles.incomingAlertTitle}>
                  {ringingCalls.length} llamada(s) entrante(s)
                </Text>
                <Text variant="bodySmall" style={styles.incomingAlertSubtitle}>
                  Toca para ver
                </Text>
              </View>
              <Button 
                mode="contained" 
                compact 
                buttonColor={Colors.success}
                onPress={() => simulateIncomingCall()}
              >
                Ver
              </Button>
            </View>
          </Surface>
        </View>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>Llamadas Rapidas</Text>
      <View style={styles.callButtons}>
        <Button
          mode="contained"
          icon="shield-account-outline"
          onPress={() => handleCall('vigilante')}
          style={[styles.callButton, { backgroundColor: Colors.primary }]}
          labelStyle={styles.callButtonLabel}
        >
          Llamar Vigilante
        </Button>
        <Button
          mode="contained"
          icon="account-tie-outline"
          onPress={() => handleCall('admin')}
          style={[styles.callButton, { backgroundColor: Colors.primary }]}
          labelStyle={styles.callButtonLabel}
        >
          Llamar Admin
        </Button>
      </View>

      <View style={styles.qrSection}>
        <Button
          mode="contained"
          icon="qrcode"
          onPress={() => setQrModalVisible(true)}
          style={[styles.qrButton, { backgroundColor: Colors.secondary }]}
          labelStyle={styles.qrButtonLabel}
        >
          Generar QR Visitante
        </Button>
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>Contactos</Text>
      <Card style={styles.contactCard}>
        <Card.Content>
          <Surface style={styles.contactItem} elevation={0}>
            <Avatar.Text 
              size={56} 
              label="VP" 
              style={{ backgroundColor: Colors.muted }}
            />
            <View style={styles.contactInfo}>
              <Text variant="titleMedium" style={styles.contactName}>{vigilante.name}</Text>
              <Text variant="bodySmall" style={styles.contactRole}>{vigilante.role}</Text>
              <Text variant="bodySmall" style={styles.contactUnit}>{vigilante.unit}</Text>
            </View>
            <Button 
              mode="contained-tonal" 
              icon="phone-outline" 
              onPress={() => handleCall('vigilante')}
              style={{ backgroundColor: Colors.muted }}
              labelStyle={{ color: Colors.text, fontSize: 12 }}
              compact
            >
              Llamar
            </Button>
          </Surface>
          <Divider style={styles.divider} />
          <Surface style={styles.contactItem} elevation={0}>
            <Avatar.Text 
              size={56} 
              label="AD" 
              style={{ backgroundColor: Colors.muted }}
            />
            <View style={styles.contactInfo}>
              <Text variant="titleMedium" style={styles.contactName}>{admin.name}</Text>
              <Text variant="bodySmall" style={styles.contactRole}>{admin.role}</Text>
              <Text variant="bodySmall" style={styles.contactUnit}>{admin.unit}</Text>
            </View>
            <Button 
              mode="contained-tonal" 
              icon="phone-outline" 
              onPress={() => handleCall('admin')}
              style={{ backgroundColor: Colors.muted }}
              labelStyle={{ color: Colors.text, fontSize: 12 }}
              compact
            >
              Llamar
            </Button>
          </Surface>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.sectionTitle}>Historial de Llamadas</Text>
      <Card style={styles.historyCard}>
        <Card.Content>
          {incomingCalls.length === 0 && mockIntercomCalls.length === 0 && qrHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="phone-off-outline" size={48} color={Colors.textSecondary} />
              <Text variant="bodyMedium" style={styles.emptyText}>
                No hay llamadas registradas
              </Text>
            </View>
          ) : (
            [...incomingCalls, ...mockIntercomCalls].sort((a, b) => 
              new Date('timestamp' in b ? b.timestamp : (b as any).startedAt).getTime() - 
              new Date('timestamp' in a ? a.timestamp : (a as any).startedAt).getTime()
            ).map((call: any, index) => {
              const isIncoming = 'visitorType' in call;
              const typeConfig = isIncoming ? visitorTypeConfig[call.visitorType as VisitorType] : null;
              const statusConfig = getStatusConfig(call.status);
              
              return (
                <View key={call.id}>
                  <Surface style={styles.historyItem} elevation={0}>
                    <View style={[styles.historyIcon, { backgroundColor: typeConfig?.bgColor || Colors.muted }]}>
                      <Icon 
                        name={typeConfig?.icon || (call.callType === 'admin' ? 'account-tie-outline' : 'shield-account-outline')} 
                        size={24} 
                        color={typeConfig?.color || Colors.text} 
                      />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text variant="titleSmall" style={styles.historyName}>
                        {isIncoming ? call.visitorName : (call.callType === 'admin' ? 'Administracion' : 'Vigilante')}
                      </Text>
                      <Text variant="bodySmall" style={styles.historyDesc}>
                        {isIncoming ? typeConfig?.label : 'Llamada saliente'} - {call.description || 'Llamada'}
                      </Text>
                      <Text variant="bodySmall" style={styles.historyTime}>
                        {formatCallTime(call.timestamp || call.startedAt)}
                      </Text>
                    </View>
                    <View style={styles.historyStatus}>
                      <View style={styles.statusContainer}>
                        <Icon name={statusConfig.icon} size={14} color={statusConfig.color} />
                        <Text variant="bodySmall" style={[styles.statusText, { color: statusConfig.color }]}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>
                  </Surface>
                  {index < [...incomingCalls, ...mockIntercomCalls].length - 1 && <Divider style={styles.itemDivider} />}
                </View>
              );
            })
          )}

          {qrHistory.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text variant="bodySmall" style={styles.qrHistoryTitle}>QR Generados</Text>
              {qrHistory.map((qr, index) => {
                const qrStatusConfig = qr.status === 'pending'
                  ? { label: 'Pendiente', color: Colors.warning, icon: 'clock-outline' }
                  : qr.status === 'used'
                    ? { label: 'Usado', color: Colors.success, icon: 'check-circle' }
                    : { label: 'Expirado', color: Colors.error, icon: 'close-circle' };

                return (
                  <View key={qr.id}>
                    <Surface style={styles.historyItem} elevation={0}>
                      <View style={[styles.historyIcon, { backgroundColor: Colors.infoContainer }]}>
                        <Icon name="qrcode" size={24} color={Colors.info} />
                      </View>
                      <View style={styles.historyInfo}>
                        <Text variant="titleSmall" style={styles.historyName}>
                          {qr.visitorName}
                        </Text>
                        <Text variant="bodySmall" style={styles.historyDesc}>
                          Apto {qr.unit} - {qr.duration}
                        </Text>
                        <Text variant="bodySmall" style={styles.historyTime}>
                          {formatCallTime(qr.timestamp)}
                        </Text>
                      </View>
                      <View style={styles.historyStatus}>
                        <View style={styles.statusContainer}>
                          <Icon name={qrStatusConfig.icon} size={14} color={qrStatusConfig.color} />
                          <Text variant="bodySmall" style={[styles.statusText, { color: qrStatusConfig.color }]}>
                            {qrStatusConfig.label}
                          </Text>
                        </View>
                      </View>
                    </Surface>
                    {index < qrHistory.length - 1 && <Divider style={styles.itemDivider} />}
                  </View>
                );
              })}
            </>
          )}
        </Card.Content>
      </Card>

      <Portal>
        <Modal
          visible={incomingModalVisible}
          onDismiss={() => {}}
          contentContainerStyle={styles.incomingModalContainer}
        >
          <View style={styles.incomingModal}>
            <View style={styles.ringingIndicator}>
              <Icon name="bell" size={28} color={Colors.success} />
              <Text variant="titleMedium" style={styles.ringingText}>LLAMADA ENTRANTE</Text>
            </View>

            <View style={styles.visitorAvatar}>
              <Icon 
                name={currentIncoming ? visitorTypeConfig[currentIncoming.visitorType].icon : 'account'} 
                size={64} 
                color={Colors.primary} 
              />
            </View>

            <Text variant="headlineMedium" style={styles.visitorName}>
              {currentIncoming?.visitorName || 'Visitante'}
            </Text>

            {currentIncoming && (
              <View style={styles.visitorDetails}>
                <Surface style={[styles.typeBadge, { backgroundColor: visitorTypeConfig[currentIncoming.visitorType].bgColor }]} elevation={0}>
                  <Icon 
                    name={visitorTypeConfig[currentIncoming.visitorType].icon} 
                    size={16} 
                    color={visitorTypeConfig[currentIncoming.visitorType].color} 
                  />
                  <Text variant="bodySmall" style={[styles.typeLabel, { color: visitorTypeConfig[currentIncoming.visitorType].color }]}>
                    {visitorTypeConfig[currentIncoming.visitorType].label}
                  </Text>
                </Surface>
                
                {currentIncoming.description && (
                  <Text variant="bodyMedium" style={styles.visitorDesc}>
                    {currentIncoming.description}
                  </Text>
                )}
                
                {currentIncoming.unit && (
                  <Text variant="bodySmall" style={styles.visitorUnit}>
                    Destino: Apto {currentIncoming.unit}
                  </Text>
                )}
              </View>
            )}

            <Text variant="bodySmall" style={styles.callTime}>
              {currentIncoming ? formatCallTime(currentIncoming.timestamp) : ''}
            </Text>

            <View style={styles.callActions}>
              <Button
                mode="contained"
                icon="check"
                onPress={handleAccept}
                style={styles.acceptButton}
                buttonColor={Colors.success}
                contentStyle={styles.buttonContent}
              >
                Aceptar
              </Button>
              <Button
                mode="contained"
                icon="close"
                onPress={handleDecline}
                style={styles.declineButton}
                buttonColor={Colors.error}
                contentStyle={styles.buttonContent}
              >
                Rechazar
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={callModalVisible}
          onDismiss={() => {}}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.callModal}>
            <Avatar.Text 
              size={100} 
              label={callType === 'vigilante' ? 'VP' : 'AD'} 
              style={{ backgroundColor: Colors.primary }}
            />
            <Text variant="headlineSmall" style={styles.callName}>
              {callType === 'vigilante' ? vigilante.name : admin.name}
            </Text>
            <Text variant="bodyMedium" style={styles.callStatus}>
              {isCalling ? 'Llamando...' : 'Conectando...'}
            </Text>
            {isCalling && (
              <View style={styles.callingIndicator}>
                <Icon name="phone-in-talk" size={24} color={Colors.success} />
                <Text variant="bodySmall" style={{ color: Colors.success }}>
                  Conectado
                </Text>
              </View>
            )}
            <View style={styles.callActionsModal}>
              <Button
                mode="contained"
                icon="phone-hangup"
                onPress={() => {
                  setIsCalling(false);
                  setCallModalVisible(false);
                }}
                style={{ backgroundColor: Colors.error }}
              >
                Terminar
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={qrModalVisible}
          onDismiss={resetQRModal}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.qrModal}>
            {!qrGenerated ? (
              <>
                <Icon name="qrcode" size={48} color={Colors.primary} />
                <Text variant="titleLarge" style={styles.qrModalTitle}>
                  Generar QR Visitante
                </Text>
                <Text variant="bodySmall" style={styles.qrModalSubtitle}>
                  Crea un codigo QR para el acceso del visitante
                </Text>

                <TextInput
                  mode="outlined"
                  label="Nombre del visitante"
                  value={qrVisitorName}
                  onChangeText={setQrVisitorName}
                  style={styles.qrInput}
                  outlineStyle={styles.qrInputOutline}
                />

                <TextInput
                  mode="outlined"
                  label="Unidad destino"
                  value={qrUnit}
                  onChangeText={setQrUnit}
                  placeholder="Ej: 301"
                  style={styles.qrInput}
                  outlineStyle={styles.qrInputOutline}
                />

                <Text variant="bodySmall" style={styles.durationLabel}>Duracion de acceso</Text>
                <View style={styles.durationSelector}>
                  {(['1h', '2h', '4h'] as const).map((d) => (
                    <Button
                      key={d}
                      mode={qrDuration === d ? 'contained' : 'outlined'}
                      compact
                      onPress={() => setQrDuration(d)}
                      style={[
                        styles.durationButton,
                        qrDuration === d && { backgroundColor: Colors.primary },
                      ]}
                      labelStyle={qrDuration === d ? { color: '#FFF' } : { color: Colors.text }}
                    >
                      {d}
                    </Button>
                  ))}
                </View>

                <Button
                  mode="contained"
                  icon="qrcode"
                  onPress={handleGenerateQR}
                  style={[styles.generateButton, { backgroundColor: Colors.primary }]}
                  contentStyle={{ paddingVertical: 6 }}
                >
                  Generar QR
                </Button>
              </>
            ) : (
              <>
                <View style={styles.qrDisplay}>
                  <Icon name="qrcode" size={120} color={Colors.primary} />
                </View>

                <Text variant="titleLarge" style={styles.qrVisitorName}>
                  {qrVisitorName}
                </Text>

                <View style={styles.qrInfo}>
                  <View style={styles.qrInfoRow}>
                    <Icon name="home-outline" size={16} color={Colors.textSecondary} />
                    <Text variant="bodySmall" style={styles.qrInfoText}>Apto {qrUnit}</Text>
                  </View>
                  <View style={styles.qrInfoRow}>
                    <Icon name="clock-outline" size={16} color={Colors.textSecondary} />
                    <Text variant="bodySmall" style={styles.qrInfoText}>Expira en {qrDuration}</Text>
                  </View>
                </View>

                <Surface style={styles.qrStatusBadge} elevation={0}>
                  <Icon name="clock-outline" size={14} color={Colors.warning} />
                  <Text variant="bodySmall" style={[styles.qrStatusText, { color: Colors.warning }]}>
                    Pendiente de uso
                  </Text>
                </Surface>

                <Button
                  mode="outlined"
                  onPress={resetQRModal}
                  style={styles.closeQRButton}
                >
                  Cerrar
                </Button>
              </>
            )}
          </View>
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
  incomingAlert: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  incomingAlertCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.successContainer,
  },
  incomingAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  incomingAlertText: {
    flex: 1,
  },
  incomingAlertTitle: {
    fontWeight: '600',
    color: Colors.success,
  },
  incomingAlertSubtitle: {
    color: Colors.textSecondary,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    fontWeight: '600',
    color: Colors.text,
    fontSize: 16,
  },
  callButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  callButton: {
    flex: 1,
    borderRadius: 12,
  },
  callButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  contactCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: '600',
    color: Colors.text,
  },
  contactRole: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contactUnit: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  divider: {
    marginHorizontal: 8,
  },
  itemDivider: {
    marginVertical: 4,
  },
  historyCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 12,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontWeight: '600',
    color: Colors.text,
  },
  historyDesc: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyTime: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  historyStatus: {
    alignItems: 'flex-end',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
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
  incomingModalContainer: {
    margin: 16,
  },
  incomingModal: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  ringingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  ringingText: {
    fontWeight: '700',
    color: Colors.success,
    letterSpacing: 1,
  },
  visitorAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  visitorName: {
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  visitorDetails: {
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  typeLabel: {
    fontWeight: '500',
  },
  visitorDesc: {
    color: Colors.text,
    textAlign: 'center',
  },
  visitorUnit: {
    color: Colors.textSecondary,
  },
  callTime: {
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 20,
  },
  callActions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  acceptButton: {
    flex: 1,
    borderRadius: 12,
  },
  declineButton: {
    flex: 1,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  modalContainer: {
    margin: 20,
  },
  callModal: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  callName: {
    marginTop: 20,
    fontWeight: 'bold',
  },
  callStatus: {
    color: Colors.textSecondary,
    marginTop: 8,
  },
  callingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.successContainer,
    borderRadius: 20,
  },
  callActionsModal: {
    marginTop: 32,
    width: '100%',
  },
  qrSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  qrButton: {
    borderRadius: 12,
  },
  qrButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  qrHistoryTitle: {
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qrModal: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  qrModalTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  qrModalSubtitle: {
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  qrInput: {
    width: '100%',
    marginBottom: 12,
    backgroundColor: Colors.surface,
  },
  qrInputOutline: {
    borderRadius: 12,
  },
  durationLabel: {
    color: Colors.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: 4,
  },
  durationSelector: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 20,
  },
  durationButton: {
    flex: 1,
    borderRadius: 8,
  },
  generateButton: {
    width: '100%',
    borderRadius: 12,
  },
  qrDisplay: {
    width: 160,
    height: 160,
    borderRadius: 16,
    backgroundColor: Colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  qrVisitorName: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  qrInfo: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  qrInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qrInfoText: {
    color: Colors.textSecondary,
  },
  qrStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    backgroundColor: Colors.warningContainer,
    marginBottom: 16,
  },
  qrStatusText: {
    fontWeight: '500',
  },
  closeQRButton: {
    borderRadius: 12,
    width: '100%',
  },
});