import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../src/lib/theme';

export default function LockScreen() {
  const router = useRouter();

  const handleUnlock = () => {
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.card} elevation={2}>
        <View style={styles.iconContainer}>
          <Icon name="lock" size={60} color={Colors.primary} />
        </View>
        
        <Text variant="headlineMedium" style={styles.title}>
          Sesion Expirada
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Tu sesion ha expirado. Por favor inicia sesion nuevamente para continuar.
        </Text>

        <Button
          mode="contained"
          icon="login"
          style={styles.unlockButton}
          buttonColor={Colors.primary}
          contentStyle={styles.buttonContent}
          onPress={handleUnlock}
        >
          Iniciar Sesion
        </Button>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Icon name="shield-check" size={16} color={Colors.success} />
            <Text variant="bodySmall" style={styles.infoText}>
              Protegido por Clerk
            </Text>
          </View>
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
    padding: 20,
  },
  card: {
    padding: 32,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  unlockButton: {
    borderRadius: 12,
    width: '100%',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  infoSection: {
    marginTop: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: Colors.textSecondary,
  },
});