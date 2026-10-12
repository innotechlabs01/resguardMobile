import { Tabs } from 'expo-router';
import { Colors } from '../../../src/lib/theme';
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
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
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
    </Tabs>
  );
}
