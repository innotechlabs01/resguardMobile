import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput, Alert } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../src/lib/theme';
import { useAuthStore } from '../src/stores/authStore';
import { supabase } from '../src/services/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor ingresa email y contrasena');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) {
        setError(authError.message || 'Error al iniciar sesion');
        return;
      }

      if (authData.user) {
        // Get user profile from users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.log('Profile error:', profileError);
        }

        // Create user object matching store schema
        const user = {
          id: authData.user.id,
          email: authData.user.email || email,
          display_name: profile?.display_name || authData.user.email?.split('@')[0] || 'Usuario',
          role: profile?.role || 'usuario',
          building_id: profile?.building_id || null,
          unit: profile?.unit || null,
          created_at: profile?.created_at || new Date().toISOString(),
        };

        // Save to Zustand store
        login(user, authData.session?.access_token || '');

        Alert.alert(
          'Bienvenido',
          `Hola ${user.display_name}, has iniciado sesion correctamente.`,
          [{ text: 'OK', onPress: () => router.replace('/(tabs)' as any) }]
        );
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Error al iniciar sesion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Surface style={styles.headerCard} elevation={0}>
        <View style={styles.logoContainer}>
          <Icon name="shield-lock" size={60} color={Colors.primary} />
        </View>
        
        <Text variant="headlineMedium" style={styles.title}>
          ResGuard
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Ingresa a tu cuenta
        </Text>
      </Surface>

      <Surface style={styles.loginCard} elevation={2}>
        <View style={styles.welcomeSection}>
          <Icon name="account-circle" size={48} color={Colors.textSecondary} />
          <Text variant="titleMedium" style={styles.welcomeTitle}>
            Bienvenido de nuevo
          </Text>
          <Text variant="bodySmall" style={styles.welcomeText}>
            Inicia sesion para continuar
          </Text>
        </View>

        <View style={styles.formSection}>
          <RNTextInput
            style={styles.input}
            placeholder="Correo electronico"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={Colors.textSecondary}
          />
          
          <RNTextInput
            style={styles.input}
            placeholder="Contrasena"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={Colors.textSecondary}
          />

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <Button
            mode="contained"
            icon="login"
            style={styles.signInButton}
            buttonColor={Colors.primary}
            contentStyle={styles.buttonContent}
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Ingresando...' : 'Iniciar Sesion'}
          </Button>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Icon name="shield-check" size={20} color={Colors.success} />
            <Text variant="bodySmall" style={styles.infoText}>
              Sesion segura
            </Text>
          </View>
        </View>
      </Surface>

      <Text variant="bodySmall" style={styles.footerText}>
        Al iniciar sesion, aceptas nuestros terminos y condiciones
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  headerCard: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
  },
  loginCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  welcomeText: {
    color: Colors.textSecondary,
  },
  formSection: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorText: {
    color: Colors.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  signInButton: {
    borderRadius: 12,
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  infoSection: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    color: Colors.textSecondary,
    flex: 1,
  },
  footerText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 24,
  },
});