import { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Text, Button, Surface, Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../src/lib/theme';
import { mockPayments } from '../../src/services/mockData';

export default function PagosScreen() {
  const [payments] = useState(mockPayments);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  };

  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'overdue');
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'Pagado', color: Colors.success, bgColor: Colors.successContainer, icon: 'check-circle-outline' };
      case 'pending':
        return { label: 'Pendiente', color: Colors.warning, bgColor: Colors.warningContainer, icon: 'clock-outline' };
      case 'overdue':
        return { label: 'Vencido', color: Colors.error, bgColor: Colors.errorContainer, icon: 'alert-circle-outline' };
      default:
        return { label: status, color: Colors.textSecondary, bgColor: Colors.background, icon: 'help-circle-outline' };
    }
  };

  const handlePay = (paymentId: string) => {
    Alert.alert(
      'Confirmar Pago',
      'Estas seguro de realizar este pago?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Pagar', 
          onPress: () => {
            Alert.alert('Exito', 'Pago procesado correctamente. Recibiras una confirmacion por correo.');
          }
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Icon name="credit-card-outline" size={28} color={Colors.textSecondary} />
            <Text variant="bodySmall" style={styles.summaryLabel}>Saldo Pendiente</Text>
            <Text variant="headlineSmall" style={[styles.summaryValue, { color: Colors.text }]}>
              {formatCurrency(totalPending)}
            </Text>
          </Card.Content>
        </Card>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Icon name="check-circle-outline" size={28} color={Colors.textSecondary} />
            <Text variant="bodySmall" style={styles.summaryLabel}>Total Pagado 2026</Text>
            <Text variant="headlineSmall" style={[styles.summaryValue, { color: Colors.success }]}>
              {formatCurrency(totalPaid)}
            </Text>
          </Card.Content>
        </Card>
      </View>

      {totalPending > 0 && (
        <Surface style={styles.alertCard} elevation={1}>
          <View style={styles.alertContent}>
            <Icon name="alert-circle-outline" size={32} color={Colors.warning} />
            <View style={styles.alertText}>
              <Text variant="titleSmall">Tienes pagos pendientes</Text>
              <Text variant="bodySmall" style={styles.alertSubtext}>
                Total por pagar: {formatCurrency(totalPending)}
              </Text>
            </View>
            <Button 
              mode="contained" 
              onPress={() => handlePay('all')}
              style={{ backgroundColor: Colors.primary }}
            >
              Pagar Todo
            </Button>
          </View>
        </Surface>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>Historial de Pagos</Text>
      <Card style={styles.historyCard}>
        <Card.Content>
          {payments.map((payment, index) => {
            const statusConfig = getStatusConfig(payment.status);
            return (
              <View key={payment.id}>
                <Surface style={styles.paymentItem} elevation={0}>
                  <View style={styles.paymentIcon}>
                    <Icon 
                      name={payment.concept.includes('Parqueadero') ? 'car-outline' : 'home-outline'} 
                      size={24} 
                      color={Colors.text} 
                    />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text variant="bodyMedium" style={{ fontWeight: '500' }}>
                      {payment.concept}
                    </Text>
                    <Text variant="bodySmall" style={styles.paymentDate}>
                      {formatDate(payment.date)}
                    </Text>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                      {formatCurrency(payment.amount)}
                    </Text>
                    <Chip 
                      mode="flat" 
                      compact
                      style={{ backgroundColor: statusConfig.bgColor }}
                      textStyle={{ color: statusConfig.color, fontSize: 10 }}
                    >
                      {statusConfig.label}
                    </Chip>
                  </View>
                </Surface>
                <View style={styles.paymentActions}>
                  {payment.status === 'paid' ? (
                    <Button 
                      mode="text" 
                      compact 
                      icon="download"
                      textColor={Colors.text}
                    >
                      Ver Recibo
                    </Button>
                  ) : (
                    <Button 
                      mode="contained" 
                      compact 
                      icon="credit-card-outline"
                      onPress={() => handlePay(payment.id)}
                      style={{ backgroundColor: Colors.primary }}
                    >
                      Pagar
                    </Button>
                  )}
                </View>
                {index < payments.length - 1 && <Divider />}
              </View>
            );
          })}
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.sectionTitle}>Medios de Pago</Text>
      <Card style={styles.methodsCard}>
        <Card.Content>
          <Surface style={styles.methodItem} elevation={0}>
            <Icon name="credit-card-outline" size={32} color={Colors.text} />
            <View style={styles.methodInfo}>
              <Text variant="bodyMedium" style={{ fontWeight: '500' }}>Tarjeta de Credito/Debito</Text>
              <Text variant="bodySmall" style={styles.methodDesc}>Pago inmediato con PSE</Text>
            </View>
            <Icon name="chevron-right" size={24} color={Colors.textSecondary} />
          </Surface>
          <Divider />
          <Surface style={styles.methodItem} elevation={0}>
            <Icon name="bank-outline" size={32} color={Colors.text} />
            <View style={styles.methodInfo}>
              <Text variant="bodyMedium" style={{ fontWeight: '500' }}>Transferencia Bancaria</Text>
              <Text variant="bodySmall" style={styles.methodDesc}>NC: 123456789 - Banco de Bogota</Text>
            </View>
            <Icon name="chevron-right" size={24} color={Colors.textSecondary} />
          </Surface>
        </Card.Content>
      </Card>

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
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  summaryLabel: {
    color: Colors.textSecondary,
    marginTop: 8,
  },
  summaryValue: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  alertCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.warningContainer,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertText: {
    flex: 1,
  },
  alertSubtext: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  historyCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDate: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentActions: {
    alignItems: 'flex-end',
    paddingBottom: 12,
  },
  methodsCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodDesc: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
});