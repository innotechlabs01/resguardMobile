import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../src/lib/theme';
import { supabase } from '../src/services/supabase';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_S = 60;

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_S);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendCode = async (normalized: string): Promise<boolean> => {
    // Anti-enumeración: siempre seguimos al estado "código enviado",
    // exista o no el correo. shouldCreateUser: false evita crear cuentas por typo.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { shouldCreateUser: false },
    });

    if (otpError) {
      console.error('signInWithOtp error:', otpError);
      return false;
    }
    return true;
  };

  const handleSendCode = async () => {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      setError('Ingresa un correo electrónico válido');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const ok = await sendCode(normalized);
      if (!ok) {
        setError('Ocurrió un error. Intenta de nuevo en unos momentos.');
        return;
      }

      setSent(true);
      startCooldown();
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError('Ocurrió un error. Intenta de nuevo en unos momentos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    const normalized = email.trim().toLowerCase();
    setIsLoading(true);
    try {
      const ok = await sendCode(normalized);
      if (ok) {
        startCooldown();
      } else {
        setError('Ocurrió un error. Intenta de nuevo en unos momentos.');
      }
    } catch (err: any) {
      console.error('Resend code error:', err);
      setError('Ocurrió un error. Intenta de nuevo en unos momentos.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Surface style={styles.headerCard} elevation={0}>
          <View style={styles.logoContainer}>
            <Icon name="email-check" size={60} color={Colors.primary} />
          </View>
          <Text variant="headlineSmall" style={styles.title}>
            Revisa tu correo
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Si el correo está registrado, recibirás un código de 6 dígitos. Puede tardar unos minutos; revisa también la carpeta de spam.
          </Text>
        </Surface>

        <Surface style={styles.formCard} elevation={2}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            mode="contained"
            icon="numeric"
            style={styles.submitButton}
            buttonColor={Colors.primary}
            contentStyle={styles.buttonContent}
            onPress={() =>
              router.push({
                pathname: '/reset-password',
                params: { email: email.trim().toLowerCase() },
              } as any)
            }
          >
            Ya tengo el código
          </Button>

          <Button
            mode="text"
            uppercase={false}
            onPress={handleResend}
            textColor={cooldown > 0 ? Colors.textSecondary : Colors.primary}
            disabled={cooldown > 0 || isLoading}
            style={styles.backButton}
          >
            {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar código'}
          </Button>

          <Button
            mode="text"
            uppercase={false}
            onPress={() => router.back()}
            textColor={Colors.textSecondary}
            style={styles.backButton}
          >
            ← Volver a iniciar sesión
          </Button>
        </Surface>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Surface style={styles.headerCard} elevation={0}>
        <View style={styles.logoContainer}>
          <Icon name="lock-reset" size={60} color={Colors.primary} />
        </View>
        <Text variant="headlineSmall" style={styles.title}>
          Recuperar contraseña
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Ingresa el correo asociado a tu cuenta y te enviaremos un código de verificación.
        </Text>
      </Surface>

      <Surface style={styles.formCard} elevation={2}>
        <RNTextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="send"
          onSubmitEditing={handleSendCode}
          placeholderTextColor={Colors.textSecondary}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          mode="contained"
          icon="email-send"
          style={styles.submitButton}
          buttonColor={Colors.primary}
          contentStyle={styles.buttonContent}
          onPress={handleSendCode}
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Enviando…' : 'Enviar código'}
        </Button>

        <Button
          mode="text"
          uppercase={false}
          onPress={() => router.back()}
          textColor={Colors.textSecondary}
          style={styles.backButton}
        >
          ← Volver a iniciar sesión
        </Button>
      </Surface>
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
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: Colors.surface,
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
  submitButton: {
    borderRadius: 12,
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  backButton: {
    marginTop: 8,
  },
});
