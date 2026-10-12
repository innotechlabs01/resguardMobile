import { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  Surface,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  getReadings,
  UtilityReading,
} from '../../src/services/utility';

const serviceConfig: Record<string, { label: string; icon: string; color: string; bgColor: string; unit: string }> = {
  water: { label: 'Agua', icon: 'water', color: '#3B82F6', bgColor: '#DBEAFE', unit: 'm3' },
  gas: { label: 'Gas', icon: 'fire', color: '#EA580C', bgColor: '#FFEDD5', unit: 'm3' },
  electricity: { label: 'Energia', icon: 'flash', color: '#F59E0B', bgColor: '#FEF3C7', unit: 'kWh' },
};

export default function ServiciosScreen() {
  const { user } = useAuth();
  const [readings, setReadings] = useState<UtilityReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeService, setActiveService] = useState<string>('water');

  const fetchReadings = useCallback(async () => {
    if (!user?.building_id || !user?.unit) return;
    try {
      const data = await getReadings(user.building_id, user.unit);
      setReadings(data);
    } catch (err) {
      console.error('Error fetching readings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.building_id, user?.unit]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReadings();
  }, [fetchReadings]);

  // Filter by active service
  const serviceReadings = readings.filter(r => r.service_type === activeService);

  // Compute summary per service
  const serviceSummary = Object.entries(serviceConfig).map(([key, cfg]) => {
    const sr = readings.filter(r => r.service_type === key);
    const latest = sr[0]; // already sorted desc
    const totalConsumption = sr.reduce((sum, r) => sum + (r.consumption ? Number(r.consumption) : 0), 0);
    const totalCharge = sr.reduce((sum, r) => sum + (r.total_charge ? Number(r.total_charge) : 0), 0);
    return { key, ...cfg, latest, totalConsumption, totalCharge, count: sr.length };
  });

  // Check for alerts (> 2x average)
  const getAlerts = () => {
    const alerts: Array<{ unit: string; service: string; consumption: number; average: number }> = [];
    for (const [serviceType, cfg] of Object.entries(serviceConfig)) {
      const sr = readings.filter(r => r.service_type === serviceType && r.consumption != null);
      if (sr.length < 2) continue;
      const avg = sr.reduce((sum, r) => sum + Number(r.consumption), 0) / sr.length;
      // Group by unit, get latest
      const latestByUnit: Record<string, UtilityReading> = {};
      for (const r of sr) {
        if (!latestByUnit[r.unit_number]) latestByUnit[r.unit_number] = r;
      }
      for (const [, r] of Object.entries(latestByUnit)) {
        const consumption = Number(r.consumption);
        if (avg > 0 && consumption > avg * 2) {
          alerts.push({ unit: r.unit_number, service: serviceType, consumption, average: avg });
        }
      }
    }
    return alerts;
  };

  const alerts = getAlerts();

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Service cards */}
      <Text variant="titleMedium" style={styles.sectionTitle}>Mis Servicios</Text>

      <View style={styles.serviceCards}>
        {serviceSummary.map(s => {
          const isActive = activeService === s.key;
          return (
            <Card
              key={s.key}
              style={[
                styles.serviceCard,
                isActive && { borderColor: s.color, borderWidth: 2 },
              ]}
              onPress={() => setActiveService(s.key)}
            >
              <Card.Content style={styles.serviceCardContent}>
                <View style={[styles.serviceIcon, { backgroundColor: s.bgColor }]}>
                  <Icon name={s.icon} size={24} color={s.color} />
                </View>
                <Text variant="titleSmall" style={styles.serviceLabel}>{s.label}</Text>
                {s.latest ? (
                  <>
                    <Text variant="headlineSmall" style={styles.serviceValue}>
                      {Number(s.latest.consumption || 0).toFixed(1)}
                    </Text>
                    <Text variant="bodySmall" style={styles.serviceUnit}>{s.unit}</Text>
                  </>
                ) : (
                  <Text variant="bodySmall" style={styles.noData}>Sin datos</Text>
                )}
              </Card.Content>
            </Card>
          );
        })}
      </View>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Surface style={styles.alertCard} elevation={1}>
          <View style={styles.alertHeader}>
            <Icon name="alert-circle" size={20} color={Colors.error} />
            <Text variant="bodySmall" style={styles.alertTitle}>
              Consumo Anomalo ({alerts.length})
            </Text>
          </View>
          {alerts.map((alert, i) => (
            <View key={i} style={styles.alertRow}>
              <Text variant="bodySmall" style={styles.alertText}>
                Unidad {alert.unit} - {serviceConfig[alert.service]?.label}
              </Text>
              <Text variant="bodySmall" style={styles.alertValue}>
                {alert.consumption.toFixed(1)} ({(alert.consumption / alert.average).toFixed(1)}x)
              </Text>
            </View>
          ))}
        </Surface>
      )}

      {/* Reading history */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Historial - {serviceConfig[activeService]?.label}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : serviceReadings.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name={serviceConfig[activeService]?.icon || 'help'} size={48} color={Colors.textSecondary} />
          <Text variant="bodyLarge" style={styles.emptyTitle}>Sin lecturas</Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            No hay lecturas registradas para este servicio
          </Text>
        </View>
      ) : (
        serviceReadings.map(reading => {
          const cfg = serviceConfig[reading.service_type];
          const isAlert = alerts.some(a => a.unit === reading.unit_number && a.service === reading.service_type);
          return (
            <Surface key={reading.id} style={[styles.readingCard, isAlert && styles.readingCardAlert]} elevation={0}>
              <View style={styles.readingHeader}>
                <View style={[styles.readingBadge, { backgroundColor: cfg?.bgColor || '#F3F4F6' }]}>
                  <Icon name={cfg?.icon || 'help'} size={16} color={cfg?.color || '#666'} />
                  <Text variant="bodySmall" style={{ color: cfg?.color || '#666', fontWeight: '500' }}>
                    {cfg?.label}
                  </Text>
                </View>
                {isAlert && (
                  <View style={styles.alertBadge}>
                    <Icon name="alert" size={14} color={Colors.error} />
                    <Text variant="bodySmall" style={{ color: Colors.error, fontSize: 11 }}>Alerta</Text>
                  </View>
                )}
              </View>

              <View style={styles.readingRow}>
                <View style={styles.readingCol}>
                  <Text variant="bodySmall" style={styles.readingLabel}>Lectura Ant.</Text>
                  <Text variant="bodyMedium" style={styles.readingValue}>{reading.previous_reading?.toFixed(1) ?? '-'}</Text>
                </View>
                <Icon name="arrow-right" size={16} color={Colors.textSecondary} />
                <View style={styles.readingCol}>
                  <Text variant="bodySmall" style={styles.readingLabel}>Lectura Actual</Text>
                  <Text variant="bodyMedium" style={styles.readingValueBold}>{reading.current_reading?.toFixed(1) ?? '-'}</Text>
                </View>
                <View style={styles.readingCol}>
                  <Text variant="bodySmall" style={styles.readingLabel}>Consumo</Text>
                  <Text variant="bodyMedium" style={[styles.readingValueBold, isAlert && { color: Colors.error }]}>
                    {reading.consumption?.toFixed(1) ?? '-'} {cfg?.unit}
                  </Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.readingFooter}>
                <Text variant="bodySmall" style={styles.readingDate}>
                  {new Date(reading.reading_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <Text variant="bodySmall" style={styles.readingCharge}>
                  ${reading.total_charge?.toLocaleString() ?? '-'}
                </Text>
              </View>
            </Surface>
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
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    fontWeight: '600',
    color: Colors.text,
    fontSize: 16,
  },
  serviceCards: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderColor: Colors.border,
  },
  serviceCardContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceLabel: {
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  serviceValue: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  serviceUnit: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  noData: {
    color: Colors.textSecondary,
    marginTop: 8,
  },
  // Alerts
  alertCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertTitle: {
    color: Colors.error,
    fontWeight: '600',
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  alertText: {
    color: Colors.error,
  },
  alertValue: {
    color: Colors.error,
    fontWeight: '600',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Reading card
  readingCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readingCardAlert: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  readingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readingCol: {
    alignItems: 'center',
    flex: 1,
  },
  readingLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
  readingValue: {
    color: Colors.text,
    fontWeight: '500',
  },
  readingValueBold: {
    color: Colors.text,
    fontWeight: '700',
  },
  divider: {
    marginVertical: 10,
  },
  readingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readingDate: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  readingCharge: {
    color: Colors.text,
    fontWeight: '600',
  },
});
