import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { ClerkProvider, useAuth, SignedIn, SignedOut } from '@clerk/clerk-expo';
import { PaperProvider } from 'react-native-paper';
import Constants from 'expo-constants';
import { theme, Colors } from '../src/lib/theme';

const CLERK_KEY = Constants.expoConfig?.extra?.CLERK_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === undefined || segments[0] === 'splash' || segments[0] === 'login' || segments[0] === 'lock';

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/splash' as any);
    } else if (isSignedIn && inAuthGroup && segments[0] !== 'lock') {
      router.replace('/(tabs)' as any);
    }
  }, [isLoaded, isSignedIn, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="splash" options={{ animation: 'none' }} />
      <Stack.Screen name="login" options={{ animation: 'none' }} />
      <Stack.Screen name="lock" options={{ animation: 'none' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen 
        name="parqueadero" 
        options={{ 
          headerShown: true,
          headerTitle: 'Parqueadero',
          headerTintColor: '#FFF',
          headerStyle: { backgroundColor: Colors.primary },
        }} 
      />
      <Stack.Screen 
        name="mercado" 
        options={{ 
          headerShown: true,
          headerTitle: 'Mercado Vecinal',
          headerTintColor: '#FFF',
          headerStyle: { backgroundColor: Colors.primary },
        }} 
      />
      <Stack.Screen 
        name="alquiler" 
        options={{ 
          headerShown: true,
          headerTitle: 'Alquiler e Inquilinos',
          headerTintColor: '#FFF',
          headerStyle: { backgroundColor: Colors.primary },
        }} 
      />
      <Stack.Screen 
        name="notificaciones" 
        options={{ 
          headerShown: true,
          headerTitle: 'Notificaciones',
          headerTintColor: '#FFF',
          headerStyle: { backgroundColor: Colors.primary },
        }} 
      />
      <Stack.Screen 
        name="cuenta" 
        options={{ 
          headerShown: true,
          headerTitle: 'Mi Cuenta',
          headerTintColor: '#FFF',
          headerStyle: { backgroundColor: Colors.primary },
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider 
      publishableKey={CLERK_KEY || 'pk_test_placeholder'} 
      tokenCache={tokenCache}
    >
      <PaperProvider theme={theme}>
        <StatusBar style="light" />
        <InitialLayout />
      </PaperProvider>
    </ClerkProvider>
  );
}