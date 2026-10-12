import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../src/lib/theme';

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  screen: string;
  color: string;
}

const menuItems: MenuItem[] = [
  { id: 'asambleas', icon: 'vote', label: 'Asambleas', screen: '/(tabs)/asambleas', color: Colors.primary },
  { id: 'mantenimiento', icon: 'wrench', label: 'Mantenimiento', screen: '/(tabs)/mantenimiento', color: Colors.primary },
  { id: 'convivencia', icon: 'shield-alert', label: 'Convivencia', screen: '/(tabs)/convivencia', color: Colors.primary },
  { id: 'mensajes', icon: 'message-text', label: 'Mensajes', screen: '/(tabs)/mensajes', color: Colors.primary },
  { id: 'servicios', icon: 'water', label: 'Servicios', screen: '/(tabs)/servicios', color: Colors.primary },
  { id: 'proveedores', icon: 'account-group', label: 'Proveedores', screen: '/(tabs)/proveedores', color: Colors.primary },
  { id: 'encuestas', icon: 'clipboard-check', label: 'Encuestas', screen: '/(tabs)/encuestas', color: Colors.primary },
  { id: 'bienvenida', icon: 'hand-wave', label: 'Bienvenida', screen: '/(tabs)/bienvenida', color: Colors.primary },
  { id: 'reservas', icon: 'calendar-check', label: 'Reservas', screen: '/(tabs)/reservas', color: Colors.primary },
  { id: 'soporte', icon: 'headset', label: 'Soporte', screen: '/(tabs)/soporte', color: Colors.primary },
];

export default function MenuScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={0}>
        <Text variant="headlineSmall" style={styles.headerTitle}>Menú</Text>
        <Text variant="bodySmall" style={styles.headerSubtitle}>Accede a todas las funciones</Text>
      </Surface>
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {menuItems.map(item => (
          <TouchableOpacity key={item.id} onPress={() => router.push(item.screen as any)} activeOpacity={0.8}>
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={[styles.iconWrap, { backgroundColor: Colors.muted }]}>
                  <Icon name={item.icon} size={28} color={item.color} />
                </View>
                <Text variant="titleSmall" style={styles.label}>{item.label}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
  },
  headerTitle: { fontWeight: '700', color: Colors.text },
  headerSubtitle: { color: Colors.textSecondary, marginTop: 2 },
  grid: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: Colors.text, fontWeight: '600' },
});
