import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../src/lib/theme';
import { useAuthStore } from '../src/stores/authStore';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      
      // Allow time for store to hydrate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLoading(false);
      
      if (isAuthenticated) {
        router.replace('/(tabs)' as any);
      } else {
        router.replace('/login' as any);
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <Surface style={styles.card} elevation={2}>
        <View style={styles.logoContainer}>
          <Icon name="shield-lock" size={80} color={Colors.primary} />
        </View>
        
        <Text variant="headlineMedium" style={styles.title}>
          ResGuard
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Sistema de Gestion Residencial
        </Text>

        <View style={styles.statusContainer}>
          <ActivityIndicator size="small" color={Colors.secondary} />
          <Text variant="bodySmall" style={styles.statusText}>
            Cargando...
          </Text>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    padding: 32,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    width: '85%',
  },
  logoContainer: {
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});