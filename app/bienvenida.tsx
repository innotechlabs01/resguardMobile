import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Animated,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../src/lib/theme';
import { useAuth } from '../src/contexts/AuthContext';
import {
  getMyOnboarding,
  updateItem,
  OnboardingChecklist,
} from '../src/services/onboarding';

const onboardingItems = [
  { key: 'signed_regulation', label: 'Firmar reglamento', icon: 'file-document-outline', description: 'Firma el reglamento interno del edificio' },
  { key: 'received_keys', label: 'Recibido llaves', icon: 'key-variant', description: 'Recibe las llaves de tu apartamento' },
  { key: 'met_vigilante', label: 'Conocer vigilante', icon: 'shield-account', description: 'Presentate con el personal de vigilancia' },
  { key: 'met_admin', label: 'Conocer administrador', icon: 'account-tie', description: 'Conoce al administrador del edificio' },
  { key: 'parking_assigned', label: 'Parqueadero asignado', icon: 'car', description: 'Confirma tu parqueadero asignado' },
  { key: 'wifi_configured', label: 'WiFi configurado', icon: 'wifi', description: 'Configura el acceso a WiFi del edificio' },
  { key: 'emergency_numbers', label: 'Numeros de emergencia', icon: 'phone-alert', description: 'Ten a mano los numeros de emergencia' },
] as const;

type OnboardingItemKey = typeof onboardingItems[number]['key'];

export default function BienvenidaScreen() {
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<OnboardingChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [celebrateAnim] = useState(new Animated.Value(0));
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchChecklist = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getMyOnboarding(user.id);
      setChecklist(data);
    } catch (err) {
      console.error('Error fetching onboarding:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchChecklist();
    pollingRef.current = setInterval(fetchChecklist, 15000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchChecklist]);

  useEffect(() => {
    if (checklist && getCompletedCount(checklist) === onboardingItems.length) {
      Animated.sequence([
        Animated.timing(celebrateAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(celebrateAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [checklist?.status]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChecklist();
  }, [fetchChecklist]);

  const getCompletedCount = (c: OnboardingChecklist) => {
    return onboardingItems.filter(item => c[item.key as OnboardingItemKey]).length;
  };

  const handleToggle = async (itemKey: string, currentValue: boolean) => {
    if (!checklist) return;
    setUpdating(itemKey);
    try {
      const updated = await updateItem(checklist.id, itemKey, !currentValue);
      if (updated) {
        setChecklist(updated);
      }
    } catch (err) {
      console.error('Error updating item:', err);
    } finally {
      setUpdating(null);
    }
  };

  // ── No checklist state ──

  if (!loading && !checklist) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Icon name="account-plus-outline" size={56} color={Colors.textSecondary} />
          <Text variant="bodyLarge" style={styles.emptyTitle}>Sin checklist</Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Tu administrador debe crear tu checklist de bienvenida
          </Text>
        </View>
      </View>
    );
  }

  // ── Loading ──

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  const allCompleted = checklist && getCompletedCount(checklist) === onboardingItems.length;

  // ── Main View ──

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <Surface style={styles.headerCard} elevation={1}>
        <Text variant="titleLarge" style={styles.headerTitle}>Mi Checklist de Bienvenida</Text>
        {checklist && (
          <>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {getCompletedCount(checklist)}/{onboardingItems.length} items completados
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(getCompletedCount(checklist) / onboardingItems.length) * 100}%` },
                ]}
              />
            </View>
          </>
        )}
      </Surface>

      {/* Celebration */}
      {allCompleted && (
        <Animated.View style={[styles.celebrationCard, { opacity: celebrateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.8],
        }) }]}>
          <Icon name="party-popper" size={64} color={Colors.secondary} />
          <Text variant="headlineSmall" style={styles.celebrationTitle}>Bienvenido!</Text>
          <Text variant="bodyMedium" style={styles.celebrationText}>
            Has completado todo tu checklist de bienvenida
          </Text>
        </Animated.View>
      )}

      {/* Items */}
      {checklist && onboardingItems.map(item => {
        const isChecked = checklist[item.key as OnboardingItemKey];
        return (
          <Surface
            key={item.key}
            style={[styles.itemCard, isChecked && styles.itemCardChecked]}
            elevation={0}
          >
            <Button
              mode="text"
              onPress={() => handleToggle(item.key, isChecked)}
              disabled={updating === item.key}
              style={styles.itemButton}
              contentStyle={styles.itemContent}
              labelStyle={styles.itemLabel}
            >
              <View style={styles.itemRow}>
                {updating === item.key ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : isChecked ? (
                  <Icon name="check-circle" size={24} color={Colors.success} />
                ) : (
                  <Icon name="checkbox-blank-circle-outline" size={24} color={Colors.textSecondary} />
                )}
                <View style={styles.itemIconContainer}>
                  <Icon name={item.icon} size={20} color={isChecked ? Colors.success : Colors.primary} />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text
                    variant="bodyMedium"
                    style={[styles.itemTitle, isChecked && styles.itemTitleChecked]}
                  >
                    {item.label}
                  </Text>
                  <Text variant="bodySmall" style={styles.itemDescription}>
                    {item.description}
                  </Text>
                </View>
              </View>
            </Button>
          </Surface>
        );
      })}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  // Header
  headerCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.muted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  // Celebration
  celebrationCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 24,
    backgroundColor: Colors.secondary + '10',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  celebrationTitle: {
    fontWeight: 'bold',
    color: Colors.secondary,
    marginTop: 12,
  },
  celebrationText: {
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  // Item card
  itemCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  itemCardChecked: {
    backgroundColor: Colors.successContainer + '40',
    borderColor: Colors.success + '40',
  },
  itemButton: {
    padding: 0,
    margin: 0,
  },
  itemContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemLabel: {
    textAlign: 'left',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: '600',
    color: Colors.text,
  },
  itemTitleChecked: {
    color: Colors.success,
  },
  itemDescription: {
    color: Colors.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },
});
