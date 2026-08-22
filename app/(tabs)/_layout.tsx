import { Tabs } from 'expo-router';
import { Colors } from '../../src/lib/theme';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerTitle: 'ResGuard',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'home' : 'home-outline'} size={size} color={focused ? Colors.primary : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="citofono"
        options={{
          title: 'Citofono',
          headerTitle: 'Citofono',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'phone-in-talk' : 'phone-outline'} size={size} color={focused ? Colors.primary : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pagos"
        options={{
          title: 'Pagos',
          headerTitle: 'Pagos',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'credit-card' : 'credit-card-outline'} size={size} color={focused ? Colors.primary : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Reservas',
          headerTitle: 'Reservas',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'calendar-check' : 'calendar-outline'} size={size} color={focused ? Colors.primary : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="asambleas"
        options={{
          title: 'Asambleas',
          headerTitle: 'Asambleas',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'vote' : 'vote-outline'} size={size} color={focused ? Colors.primary : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mantenimiento"
        options={{
          title: 'Mantenimiento',
          headerTitle: 'Mantenimiento',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'wrench' : 'wrench-outline'} size={size} color={focused ? Colors.primary : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="convivencia"
        options={{
          title: 'Convivencia',
          headerTitle: 'Convivencia',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'shield-alert' : 'shield-alert-outline'} size={size} color={focused ? Colors.primary : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mensajes"
        options={{
          title: 'Mensajes',
          headerTitle: 'Mensajes',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'message-text' : 'message-text-outline'} size={size} color={focused ? Colors.primary : color} />
          ),
        }}
      />
    </Tabs>
  );
}