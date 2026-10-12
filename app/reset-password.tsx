import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../src/lib/theme';
import { supabase } from '../src/services/supabase';

const MAX_ATTEMPTS = 3;

type ErrorKind = 'invalid_code' | 'network' | 'validation' | 'expired' | null;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email ?? '').trim().toLowerCase();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeError, setCodeError] = useState('');
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async () => {
    setCodeError('');
    setErrorKind(null);

    if (code.length !== 6) {
      setCodeError('Ingresa el código de 6 dígitos');
      setErrorKind('validation');
      return;
    }
    if (password.length < 8) {
      setCodeError('La contraseña debe tener al menos 8 caracteres');
      setErrorKind('validation');
      return;
    }
    if (password !== confirmPassword) {
      setCodeError('Las contraseñas no coinciden');
      setErrorKind('validation');
      return;
    }

    setIsLoading(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });

      if (verifyError) {
        console.error('verifyOtp error:', verifyError);
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        setErrorKind('invalid_code');
        setCodeError(
          nextAttempts >= MAX_ATTEMPTS
            ? 'El código es incorrecto o expiró. Solicita un nuevo código.'
            : 'El código es incorrecto o expiró. Verifica e intenta de nuevo.'
        );
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        console.error('updateUser error:', updateError);
        setErrorKind('network');
        setCodeError('Ocurrió un error. Intenta de nuevo en unos momentos.');
        return;
      }

      await supabase.auth.signOut({ scope: 'global' });
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setErrorKind('network');
      setCodeError('Ocurrió un error. Intenta de nuevo en unos momentos.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Surface style={styles.headerCard} elevation={0}>
          <View style={styles.logoContainer}>
            <Icon name="check-circle" size={60} color={Colors.success} />
          </View>
          <Text variant="headlineSmall" style={styles.title}>
            Contraseña actualizada
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Ya puedes iniciar sesión con tu nueva contraseña.
          </Text>
        </Surface>

        <Surface style={styles.formCard} elevation={2}>
          <Button
            mode="contained"
            icon="login"
            style={styles.submitButton}
            buttonColor={Colors.primary}
            contentStyle={styles.buttonContent}
            onPress={() => router.replace('/login' as any)}
          >
            Ir a iniciar sesión
          </Button>
        </Surface>
      </ScrollView>
    );
  }

  if (errorKind === 'expired' || attempts >= MAX_ATTEMPTS) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Surface style={styles.headerCard} elevation={0}>
          <View style={styles.logoContainer}>
            <Icon name="timer-off" size={60} color={Colors.error} />
          </View>
          <Text variant="headlineSmall" style={styles.title}>
            El código expiró
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Los códigos de verificación vencen después de 60 minutos. Solicita uno nuevo.
          </Text>
        </Surface>

        <Surface style={styles.formCard} elevation={2}>
          <Button
            mode="contained"
            icon="email-sync"
            style={styles.submitButton}
            buttonColor={Colors.primary}
            contentStyle={styles.buttonContent}
            onPress={() => router.replace('/forgot-password' as any)}
          >
            Solicitar nuevo código
          </Button>
        </Surface>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Surface style={styles.headerCard} elevation={0}>
        <View style={styles.logoContainer}>
          <Icon name="lock-open" size={60} color={Colors.primary} />
        </View>
        <Text variant="headlineSmall" style={styles.title}>
          Nueva contraseña
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Ingresa el código que enviamos a tu correo y tu nueva contraseña.
        </Text>
      </Surface>

      <Surface style={styles.formCard} elevation={2}>
        <RNTextInput
          style={styles.codeInput}
          placeholder="Código de verificación"
          value={code}
          onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={6}
          textContentType="oneTimeCode"
          autoFocus
          placeholderTextColor={Colors.textSecondary}
        />

        <RNTextInput
          style={styles.input}
          placeholder="Nueva contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="next"
          placeholderTextColor={Colors.textSecondary}
        />
        <Text variant="bodySmall" style={styles.hintText}>
          Mínimo 8 caracteres
        </Text>

        <RNTextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          returnKeyType="send"
          onSubmitEditing={handleReset}
          placeholderTextColor={Colors.textSecondary}
        />

        {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}

        <Button
          mode="contained"
          icon="lock-check"
          style={styles.submitButton}
          buttonColor={Colors.primary}
          contentStyle={styles.buttonContent}
          onPress={handleReset}
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Restableciendo…' : 'Restablecer contraseña'}
        </Button>

        <Button
          mode="text"
          uppercase={false}
          onPress={() => router.replace('/forgot-password' as any)}
          textColor={Colors.textSecondary}
          style={styles.backButton}
        >
          Solicitar nuevo código
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
  codeInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: 'monospace' as any,
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
  hintText: {
    color: Colors.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
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
