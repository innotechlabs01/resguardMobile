import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { theme, Colors } from '../src/lib/theme';
import { AuthProvider } from '../src/contexts/AuthContext';

function InitialLayout() {
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
      <Stack.Screen 
        name="mensajes/[threadId]" 
        options={{ 
          headerShown: true,
          headerTitle: 'Chat',
          headerTintColor: '#FFF',
          headerStyle: { backgroundColor: Colors.primary },
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="light" />
        <InitialLayout />
      </PaperProvider>
    </AuthProvider>
  );
}