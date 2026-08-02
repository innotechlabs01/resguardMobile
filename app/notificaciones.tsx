import { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Button, Surface, Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../src/lib/theme';
import { mockCommunications } from '../src/services/mockData';
import { Communication } from '../src/types';

const typeConfig: Record<Communication['type'], { label: string; icon: string; color: string; bgColor: string }> = {
  announcement: { label: 'Anuncio', icon: 'megaphone-outline', color: Colors.text, bgColor: Colors.muted },
  maintenance: { label: 'Mantenimiento', icon: 'wrench-outline', color: Colors.textSecondary, bgColor: Colors.muted },
  alert: { label: 'Alerta', icon: 'alert-outline', color: Colors.error, bgColor: Colors.errorContainer },
  event: { label: 'Evento', icon: 'calendar-outline', color: Colors.success, bgColor: Colors.successContainer },
  circular: { label: 'Circular', icon: 'file-document-outline', color: Colors.info, bgColor: Colors.infoContainer },
};

const priorityConfig: Record<Communication['priority'], { label: string; color: string }> = {
  low: { label: 'Baja', color: Colors.textSecondary },
  normal: { label: 'Normal', color: Colors.textSecondary },
  high: { label: 'Alta', color: Colors.warning },
  urgent: { label: 'URGENTE', color: Colors.error },
};

export default function NotificacionesScreen() {
  const [communications, setCommunications] = useState<Communication[]>(mockCommunications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);

  const MY_USER_ID = 'user-1';

  const markAsRead = (id: string) => {
    setCommunications((prev) =>
      prev.map((c) =>
        c.id === id && !c.readBy.includes(MY_USER_ID)
          ? { ...c, readBy: [...c.readBy, MY_USER_ID] }
          : c
      )
    );
  };

  const markAllRead = () => {
    setCommunications((prev) =>
      prev.map((c) =>
        !c.readBy.includes(MY_USER_ID) ? { ...c, readBy: [...c.readBy, MY_USER_ID] } : c
      )
    );
  };

  const isRead = (comm: Communication) => comm.readBy.includes(MY_USER_ID);

  const filtered = communications.filter((c) => {
    if (filter === 'unread') return !isRead(c);
    return true;
  });

  const unreadCount = communications.filter((c) => !isRead(c)).length;

  const formatRelativeTime = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    return `Hace ${Math.floor(hrs / 24)} dias`;
  };

  const openComm = (comm: Communication) => {
    markAsRead(comm.id);
    setSelectedComm(comm);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="titleLarge" style={styles.headerTitle}>Notificaciones</Text>
          {unreadCount > 0 && (
            <Chip 
              mode="flat" 
              style={{ backgroundColor: Colors.secondary }}
              textStyle={{ color: '#FFF', fontSize: 12 }}
            >
              {unreadCount} nuevas
            </Chip>
          )}
        </View>
        {unreadCount > 0 && (
          <Button mode="text" compact onPress={markAllRead}>
            Marcar todo leido
          </Button>
        )}
      </View>

      <View style={styles.filterContainer}>
        <Chip
          mode={filter === 'all' ? 'flat' : 'outlined'}
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          style={filter === 'all' ? { backgroundColor: Colors.primary } : {}}
          textStyle={filter === 'all' ? { color: '#FFF' } : {}}
        >
          Todas ({communications.length})
        </Chip>
        <Chip
          mode={filter === 'unread' ? 'flat' : 'outlined'}
          selected={filter === 'unread'}
          onPress={() => setFilter('unread')}
          style={filter === 'unread' ? { backgroundColor: Colors.primary } : {}}
          textStyle={filter === 'unread' ? { color: '#FFF' } : {}}
        >
          Sin leer ({unreadCount})
        </Chip>
      </View>

      {filtered.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Icon name="bell-off-outline" size={64} color={Colors.textSecondary} />
            <Text variant="bodyMedium" style={styles.emptyText}>
              No hay notificaciones
            </Text>
          </Card.Content>
        </Card>
      ) : (
        filtered.map((comm) => {
          const type = typeConfig[comm.type];
          const priority = priorityConfig[comm.priority];
          const read = isRead(comm);

          return (
            <TouchableOpacity key={comm.id} onPress={() => openComm(comm)}>
              <Card style={[styles.notificationCard, !read && styles.unreadCard]}>
                <Card.Content>
                  <View style={styles.notificationHeader}>
                    <View style={[styles.typeIcon, { backgroundColor: type.bgColor }]}>
                      <Icon name={type.icon} size={20} color={type.color} />
                    </View>
                    <View style={styles.notificationInfo}>
                      <View style={styles.notificationTitleRow}>
                        <Text 
                          variant="titleSmall" 
                          style={[styles.notificationTitle, !read && styles.unreadTitle]}
                          numberOfLines={1}
                        >
                          {comm.title}
                        </Text>
                        {!read && <View style={styles.unreadDot} />}
                      </View>
                      <View style={styles.notificationMeta}>
                        <Chip compact style={{ backgroundColor: type.bgColor, height: 22 }}>
                          <Text style={{ fontSize: 10, color: type.color }}>{type.label}</Text>
                        </Chip>
                        {(comm.priority === 'urgent' || comm.priority === 'high') && (
                          <Chip compact style={{ backgroundColor: priority.color + '20', height: 22 }}>
                            <Text style={{ fontSize: 10, color: priority.color }}>{priority.label}</Text>
                          </Chip>
                        )}
                      </View>
                    </View>
                  </View>
                  <Text variant="bodySmall" style={styles.notificationMessage} numberOfLines={2}>
                    {comm.message}
                  </Text>
                  <View style={styles.notificationFooter}>
                    <Text variant="bodySmall" style={styles.notificationAuthor}>
                      {comm.authorName}
                    </Text>
                    <Text variant="bodySmall" style={styles.notificationTime}>
                      {formatRelativeTime(comm.sentAt)}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          );
        })
      )}

      {selectedComm && (
        <Card style={styles.detailCard}>
          <Card.Content>
            <View style={styles.detailHeader}>
              <View style={[styles.typeIcon, { backgroundColor: typeConfig[selectedComm.type].bgColor }]}>
                <Icon name={typeConfig[selectedComm.type].icon} size={24} color={typeConfig[selectedComm.type].color} />
              </View>
              <View style={styles.detailTitle}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{selectedComm.title}</Text>
                <View style={styles.detailChips}>
                  <Chip compact style={{ backgroundColor: typeConfig[selectedComm.type].bgColor }}>
                    {typeConfig[selectedComm.type].label}
                  </Chip>
                  <Chip compact style={{ backgroundColor: priorityConfig[selectedComm.priority].color + '20' }}>
                    {priorityConfig[selectedComm.priority].label}
                  </Chip>
                </View>
              </View>
            </View>
            <Text variant="bodyMedium" style={styles.detailMessage}>
              {selectedComm.message}
            </Text>
            <View style={styles.detailFooter}>
              <Text variant="bodySmall" style={styles.detailAuthor}>
                Enviado por {selectedComm.authorName}
              </Text>
              <Text variant="bodySmall" style={styles.detailTime}>
                {formatRelativeTime(selectedComm.sentAt)}
              </Text>
            </View>
            <Button mode="contained" onPress={() => setSelectedComm(null)} style={styles.detailButton}>
              Entendido
            </Button>
          </Card.Content>
        </Card>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.surface,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
  notificationCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontWeight: '500',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  notificationMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  notificationMessage: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  notificationAuthor: {
    color: Colors.textSecondary,
  },
  notificationTime: {
    color: Colors.textSecondary,
  },
  detailCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailTitle: {
    flex: 1,
  },
  detailChips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  detailMessage: {
    color: Colors.text,
    lineHeight: 22,
  },
  detailFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailAuthor: {
    color: Colors.textSecondary,
  },
  detailTime: {
    color: Colors.textSecondary,
  },
  detailButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
  },
});