import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TabLayout() {
  const theme = useTheme();
  const c = theme.colors;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.secondary,
        tabBarInactiveTintColor: c.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.outlineVariant,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: c.surface,
        },
        headerTintColor: c.onSurface,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        sceneStyle: {
          backgroundColor: c.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerTitle: 'ResGuard',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="citofono"
        options={{
          title: 'Citófono',
          headerTitle: 'Citófono',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'phone-in-talk' : 'phone-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pagos"
        options={{
          title: 'Pagos',
          headerTitle: 'Pagos',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'credit-card' : 'credit-card-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Reservas',
          headerTitle: 'Reservas',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'calendar-check' : 'calendar-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="asambleas"
        options={{
          title: 'Asambleas',
          headerTitle: 'Asambleas',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'vote' : 'vote-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mantenimiento"
        options={{
          title: 'Mantenimiento',
          headerTitle: 'Mantenimiento',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'wrench' : 'wrench-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="convivencia"
        options={{
          title: 'Convivencia',
          headerTitle: 'Convivencia',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'shield-alert' : 'shield-alert-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mensajes"
        options={{
          title: 'Mensajes',
          headerTitle: 'Mensajes',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'message-text' : 'message-text-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="soporte"
        options={{
          title: 'Soporte',
          headerTitle: 'Soporte',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'lifebuoy' : 'lifebuoy'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="encuestas"
        options={{
          title: 'Encuestas',
          headerTitle: 'Encuestas',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'clipboard-check' : 'clipboard-check-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bienvenida"
        options={{
          title: 'Bienvenida',
          headerTitle: 'Bienvenida',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'hand-wave' : 'hand-wave-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
