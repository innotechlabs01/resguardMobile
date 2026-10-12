import { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Button, Surface, Avatar, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../../src/lib/theme';
import { mockUser, mockPayments, mockCommunications, mockReservations } from '../../../src/services/mockData';

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  color: string;
  screen: string;
}

const quickActions: QuickAction[] = [
  { id: 'parking', icon: 'car-outline', label: 'Parqueadero', color: Colors.textSecondary, screen: '/parqueadero' },
  { id: 'marketplace', icon: 'shopping-outline', label: 'Mercado', color: Colors.textSecondary, screen: '/mercado' },
  { id: 'rental', icon: 'home-outline', label: 'Alquiler', color: Colors.textSecondary, screen: '/alquiler' },
  { id: 'notifications', icon: 'bell-outline', label: 'Avisos', color: Colors.textSecondary, screen: '/notificaciones' },
  { id: 'settings', icon: 'cog-outline', label: 'Cuenta', color: Colors.textSecondary, screen: '/cuenta' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [user] = useState(mockUser);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const pendingPayments = mockPayments.filter(p => p.status === 'pending');
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const unreadNotifications = mockCommunications.filter(c => !c.readBy.includes(user.id)).length;
  const activeReservations = mockReservations.filter(r => r.status === 'confirmed').length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Surface style={styles.welcomeCard} elevation={1}>
        <View style={styles.welcomeContent}>
          <View style={styles.userInfo}>
            <Avatar.Text 
              size={50} 
              label={user.displayName.split(' ').map(n => n[0]).join('')} 
              style={{ backgroundColor: Colors.primary }}
            />
            <View style={styles.userText}>
              <Text variant="titleMedium" style={styles.welcomeText}>
                Hola, {user.displayName.split(' ')[0]}!
              </Text>
              <Text variant="bodySmall" style={styles.unitText}>
                Apartamento {user.unit} - {user.buildingName}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Icon name="bell-outline" size={24} color="#FFF" />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Surface>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="credit-card-outline" size={24} color={Colors.textSecondary} />
            <Text variant="titleLarge" style={styles.statValue}>
              {formatCurrency(totalPending)}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>
              {totalPending > 0 ? 'Por pagar' : 'Al dia'}
            </Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="calendar-check-outline" size={24} color={Colors.textSecondary} />
            <Text variant="titleLarge" style={styles.statValue}>{activeReservations}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Reservas</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="bell-outline" size={24} color={Colors.textSecondary} />
            <Text variant="titleLarge" style={styles.statValue}>{unreadNotifications}</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Avisos</Text>
          </Card.Content>
        </Card>
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>Acciones Rapidas</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity 
            key={action.id} 
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() => router.push(action.screen as any)}
          >
            <Surface style={styles.actionIcon} elevation={0}>
              <Icon name={action.icon} size={28} color={Colors.text} />
            </Surface>
            <Text variant="bodySmall" style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>Ultimos Avisos</Text>
      {mockCommunications.slice(0, 2).map((comm) => (
        <Card key={comm.id} style={styles.commCard}>
          <Card.Content>
            <View style={styles.commHeader}>
              <Chip 
                mode="flat" 
                compact
                style={styles.typeChip}
                textStyle={{ fontSize: 10, color: Colors.textSecondary }}
              >
                {comm.type === 'announcement' ? 'Anuncio' : comm.type === 'maintenance' ? 'Mantenimiento' : 'Alerta'}
              </Chip>
              {comm.priority === 'urgent' && (
                <Chip mode="flat" compact style={styles.urgentChip}>
                  <Text style={{ fontSize: 10, color: Colors.error }}>URGENTE</Text>
                </Chip>
              )}
            </View>
            <Text variant="titleSmall" style={styles.commTitle}>{comm.title}</Text>
            <Text variant="bodySmall" style={styles.commMessage} numberOfLines={2}>
              {comm.message}
            </Text>
            <View style={styles.commFooter}>
              <Text variant="bodySmall" style={styles.commAuthor}>{comm.authorName}</Text>
              <Text variant="bodySmall" style={styles.commDate}>
                {new Date(comm.sentAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          </Card.Content>
        </Card>
      ))}

      <View style={styles.quickLinks}>
        <TouchableOpacity style={styles.linkButton}>
          <Icon name="shopping-outline" size={20} color={Colors.text} />
          <Text variant="bodySmall" style={styles.linkText}>Mercado</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton}>
          <Icon name="home-outline" size={20} color={Colors.text} />
          <Text variant="bodySmall" style={styles.linkText}>Alquiler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton}>
          <Icon name="cog-outline" size={20} color={Colors.text} />
          <Text variant="bodySmall" style={styles.linkText}>Cuenta</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  welcomeCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userText: {
    flex: 1,
  },
  welcomeText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  unitText: {
    color: 'rgba(255,255,255,0.8)',
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 4,
  },
  statLabel: {
    color: Colors.textSecondary,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  actionCard: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: Colors.muted,
  },
  actionLabel: {
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  commCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  commHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeChip: {
    height: 24,
    backgroundColor: Colors.muted,
  },
  urgentChip: {
    backgroundColor: Colors.errorContainer,
  },
  commTitle: {
    fontWeight: '600',
    color: Colors.text,
  },
  commMessage: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  commFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  commAuthor: {
    color: Colors.textSecondary,
  },
  commDate: {
    color: Colors.textSecondary,
  },
  quickLinks: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    justifyContent: 'space-around',
  },
  linkButton: {
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    color: Colors.text,
  },
});