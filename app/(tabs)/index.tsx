import { useMemo } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Button, Avatar, Chip, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { palette, type AppPalette } from '../../src/lib/theme';
import { mockUser, mockPayments, mockCommunications, mockReservations } from '../../src/services/mockData';

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  screen: string;
}

const quickActions: QuickAction[] = [
  { id: 'parking', icon: 'car-outline', label: 'Parqueadero', screen: '/parqueadero' },
  { id: 'marketplace', icon: 'shopping-outline', label: 'Mercado', screen: '/mercado' },
  { id: 'rental', icon: 'home-outline', label: 'Alquiler', screen: '/alquiler' },
  { id: 'notifications', icon: 'bell-outline', label: 'Avisos', screen: '/notificaciones' },
  { id: 'settings', icon: 'cog-outline', label: 'Cuenta', screen: '/cuenta' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);

const typeLabel = (type: string) =>
  type === 'announcement' ? 'Anuncio' : type === 'maintenance' ? 'Mantenimiento' : 'Circular';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const c: AppPalette = theme.dark ? palette.dark : palette.light;
  const styles = useMemo(() => makeStyles(c), [c]);

  const user = mockUser;
  const pendingPayments = mockPayments.filter((p) => p.status === 'pending');
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const unreadNotifications = mockCommunications.filter(
    (comm) => !comm.readBy.includes(user.id),
  ).length;
  const activeReservations = mockReservations.filter((r) => r.status === 'confirmed').length;
  const initials = user.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ---- Hero / welcome ---- */}
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroUser}>
            <Avatar.Text size={48} label={initials} style={styles.heroAvatar} labelStyle={styles.heroAvatarLabel} />
            <View style={styles.heroTextWrap}>
              <Text variant="titleMedium" style={styles.heroTitle} numberOfLines={1}>
                Hola, {user.displayName.split(' ')[0]}
              </Text>
              <Text variant="bodySmall" style={styles.heroSubtitle} numberOfLines={1}>
                Apartamento {user.unit} · {user.buildingName}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => router.push('/notificaciones')}
            accessibilityRole="button"
            accessibilityLabel={
              unreadNotifications > 0
                ? `Notificaciones, ${unreadNotifications} sin leer`
                : 'Notificaciones'
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="bell-outline" size={22} color={c.onHero} />
            {unreadNotifications > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Primary action */}
        <View style={styles.heroAction}>
          <View style={styles.heroActionText}>
            <Text variant="bodySmall" style={styles.heroActionLabel}>
              {totalPending > 0 ? 'Saldo pendiente' : 'Estado de cuenta'}
            </Text>
            <Text variant="titleLarge" style={styles.heroActionValue}>
              {totalPending > 0 ? formatCurrency(totalPending) : 'Al día'}
            </Text>
          </View>
          <Button
            mode="contained"
            buttonColor={c.brand}
            textColor={c.onBrand}
            onPress={() => router.push('/pagos')}
            style={styles.heroButton}
            labelStyle={styles.heroButtonLabel}
            icon={totalPending > 0 ? 'credit-card-outline' : 'check-circle-outline'}
          >
            {totalPending > 0 ? 'Pagar cuota' : 'Ver pagos'}
          </Button>
        </View>
      </View>

      {/* ---- Demo data disclosure ---- */}
      <View style={styles.demoNote}>
        <Icon name="information-outline" size={14} color={c.textMuted} />
        <Text variant="bodySmall" style={styles.demoNoteText}>
          Datos de demostración
        </Text>
      </View>

      {/* ---- Summary ---- */}
      <View style={styles.statsRow}>
        <StatCard
          styles={styles}
          c={c}
          icon="credit-card-outline"
          value={totalPending > 0 ? formatCurrency(totalPending) : '—'}
          label={totalPending > 0 ? 'Por pagar' : 'Al día'}
          tone={c.warning}
        />
        <StatCard
          styles={styles}
          c={c}
          icon="calendar-check-outline"
          value={String(activeReservations)}
          label="Reservas activas"
          tone={c.brand}
        />
        <StatCard
          styles={styles}
          c={c}
          icon="bell-outline"
          value={String(unreadNotifications)}
          label="Avisos sin leer"
          tone={c.info}
        />
      </View>

      {/* ---- Quick actions ---- */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Acciones rápidas
      </Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() => router.push(action.screen as never)}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <View style={styles.actionIcon}>
              <Icon name={action.icon} size={26} color={c.brand} />
            </View>
            <Text variant="bodySmall" style={styles.actionLabel} numberOfLines={1}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ---- Latest notices ---- */}
      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={styles.sectionTitleInline}>
          Últimos avisos
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/notificaciones')}
          accessibilityRole="button"
          accessibilityLabel="Ver todos los avisos"
        >
          <Text variant="bodySmall" style={styles.sectionLink}>
            Ver todos
          </Text>
        </TouchableOpacity>
      </View>

      {mockCommunications.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="bell-sleep-outline" size={28} color={c.textMuted} />
          <Text variant="bodyMedium" style={styles.emptyText}>
            No hay avisos por ahora
          </Text>
        </View>
      ) : (
        mockCommunications.slice(0, 2).map((comm) => (
          <Card key={comm.id} style={styles.commCard} mode="outlined">
            <Card.Content>
              <View style={styles.commHeader}>
                <Chip
                  mode="flat"
                  compact
                  style={styles.typeChip}
                  textStyle={styles.typeChipText}
                >
                  {typeLabel(comm.type)}
                </Chip>
                {comm.priority === 'urgent' && (
                  <View style={styles.urgentChip}>
                    <Text style={styles.urgentChipText}>URGENTE</Text>
                  </View>
                )}
              </View>
              <Text variant="titleSmall" style={styles.commTitle} numberOfLines={2}>
                {comm.title}
              </Text>
              <Text variant="bodySmall" style={styles.commMessage} numberOfLines={2}>
                {comm.message}
              </Text>
              <View style={styles.commFooter}>
                <Text variant="bodySmall" style={styles.commMeta}>
                  {comm.authorName}
                </Text>
                <Text variant="bodySmall" style={styles.commMeta}>
                  {new Date(comm.sentAt).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

function StatCard({
  styles,
  c,
  icon,
  value,
  label,
  tone,
}: {
  styles: ReturnType<typeof makeStyles>;
  c: AppPalette;
  icon: string;
  value: string;
  label: string;
  tone: string;
}) {
  return (
    <Card style={styles.statCard} mode="outlined">
      <Card.Content style={styles.statContent}>
        <View style={[styles.statIcon, { backgroundColor: `${tone}1A` }]}>
          <Icon name={icon} size={20} color={tone} />
        </View>
        <Text variant="titleMedium" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text variant="bodySmall" style={styles.statLabel} numberOfLines={2}>
          {label}
        </Text>
      </Card.Content>
    </Card>
  );
}

const makeStyles = (c: AppPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      paddingBottom: 32,
    },
    hero: {
      margin: 16,
      padding: 18,
      borderRadius: 18,
      backgroundColor: c.hero,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroUser: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    heroAvatar: {
      backgroundColor: c.brand,
    },
    heroAvatarLabel: {
      color: c.onBrand,
      fontWeight: '700',
    },
    heroTextWrap: {
      flex: 1,
    },
    heroTitle: {
      color: c.onHero,
      fontWeight: '600',
    },
    heroSubtitle: {
      color: c.onHero,
      opacity: 0.72,
      marginTop: 2,
    },
    bellButton: {
      padding: 8,
      position: 'relative',
    },
    bellBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: 9,
      backgroundColor: c.warning,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bellBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
    heroAction: {
      marginTop: 18,
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.onHero,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    heroActionText: {
      flex: 1,
    },
    heroActionLabel: {
      color: c.onHero,
      opacity: 0.7,
    },
    heroActionValue: {
      color: c.onHero,
      fontWeight: '700',
      marginTop: 2,
    },
    heroButton: {
      borderRadius: 12,
    },
    heroButtonLabel: {
      fontWeight: '600',
      fontSize: 13,
    },
    demoNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 18,
      marginBottom: 8,
    },
    demoNoteText: {
      color: c.textMuted,
    },
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 8,
    },
    statCard: {
      flex: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      borderRadius: 14,
    },
    statContent: {
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 4,
      gap: 4,
    },
    statIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    statValue: {
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
    },
    statLabel: {
      color: c.textSecondary,
      textAlign: 'center',
    },
    sectionTitle: {
      marginHorizontal: 16,
      marginTop: 24,
      marginBottom: 12,
      fontWeight: '600',
      color: c.text,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      marginTop: 24,
      marginBottom: 12,
    },
    sectionTitleInline: {
      fontWeight: '600',
      color: c.text,
    },
    sectionLink: {
      color: c.brand,
      fontWeight: '600',
    },
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
      gap: 8,
    },
    actionCard: {
      width: '30%',
      minWidth: 96,
      flexGrow: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    actionIcon: {
      width: 52,
      height: 52,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      backgroundColor: c.brandSoft,
    },
    actionLabel: {
      color: c.text,
      fontWeight: '500',
      textAlign: 'center',
    },
    emptyCard: {
      marginHorizontal: 16,
      paddingVertical: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      gap: 8,
    },
    emptyText: {
      color: c.textMuted,
    },
    commCard: {
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: c.surface,
      borderRadius: 14,
      borderColor: c.border,
    },
    commHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    typeChip: {
      height: 26,
      backgroundColor: c.surfaceVariant,
    },
    typeChipText: {
      fontSize: 11,
      color: c.textSecondary,
    },
    urgentChip: {
      backgroundColor: c.errorContainer,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    urgentChipText: {
      fontSize: 10,
      fontWeight: '700',
      color: c.onErrorContainer,
    },
    commTitle: {
      fontWeight: '600',
      color: c.text,
    },
    commMessage: {
      color: c.textSecondary,
      marginTop: 4,
    },
    commFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    commMeta: {
      color: c.textMuted,
    },
  });
