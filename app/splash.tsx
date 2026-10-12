import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../src/lib/theme';
import { supabase } from '../src/services/supabase';
import { getUserProfile } from '../src/services/userSync';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getUserProfile(session.user.id);
        if (profile) {
          router.replace('/(app)/tabs' as any);
          return;
        }
        // Session exists but profile row is gone -> force re-login.
        await supabase.auth.signOut();
      }
      router.replace('/login' as any);
    };

    checkSession();
  }, [router]);

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