import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Surface,
  Avatar,
  ActivityIndicator,
  Modal,
  Portal,
  TextInput,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  getThreads,
  getOrCreateThread,
  getMessages,
  sendMessage,
  markAsRead,
  ChatThread,
  ChatMessage,
} from '../../src/services/chat';

const threadTypeConfig: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
  vigilante: { label: 'Vigilante', icon: 'shield', color: '#3B82F6', bgColor: '#DBEAFE' },
  admin: { label: 'Admin', icon: 'office-building', color: '#8B5CF6', bgColor: '#EDE9FE' },
  ai: { label: 'AI Concierge', icon: 'robot', color: '#F59E0B', bgColor: '#FEF3C7' },
};

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export default function MensajesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // New thread modal
  const [newThreadModal, setNewThreadModal] = useState(false);
  const [newThreadType, setNewThreadType] = useState<'vigilante' | 'admin'>('vigilante');
  const [newThreadUnit, setNewThreadUnit] = useState('');
  const [creating, setCreating] = useState(false);

  // Chat modal
  const [chatThread, setChatThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const chatPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!user?.building_id) return;
    try {
      const data = await getThreads(user.building_id, user.unit || undefined);
      setThreads(data);
    } catch (err) {
      console.error('Error fetching threads:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.building_id, user?.unit]);

  useEffect(() => {
    fetchThreads();
    pollingRef.current = setInterval(fetchThreads, 10000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchThreads]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchThreads();
  }, [fetchThreads]);

  // Create thread
  const handleCreateThread = async () => {
    if (!user?.building_id || !user?.unit) return;
    setCreating(true);
    try {
      const unit = newThreadUnit || user.unit;
      const thread = await getOrCreateThread(
        user.building_id,
        unit,
        newThreadType,
        `Conversacion ${newThreadType === 'vigilante' ? 'con Vigilante' : 'con Admin'}`
      );
      if (thread) {
        setNewThreadModal(false);
        setNewThreadUnit('');
        openChat(thread);
      }
    } catch (err) {
      console.error('Error creating thread:', err);
    } finally {
      setCreating(false);
    }
  };

  // Open chat
  const openChat = async (thread: ChatThread) => {
    setChatThread(thread);
    setLoadingMessages(true);
    try {
      const [msgs] = await Promise.all([
        getMessages(thread.id),
        markAsRead(thread.id, user?.id || ''),
      ]);
      setMessages(msgs);
      fetchThreads();
    } catch (err) {
      console.error('Error opening chat:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Poll messages in chat
  useEffect(() => {
    if (!chatThread) {
      if (chatPollingRef.current) clearInterval(chatPollingRef.current);
      return;
    }
    chatPollingRef.current = setInterval(async () => {
      const msgs = await getMessages(chatThread.id);
      setMessages(msgs);
    }, 5000);
    return () => {
      if (chatPollingRef.current) clearInterval(chatPollingRef.current);
    };
  }, [chatThread]);

  // Send message
  const handleSend = async () => {
    if (!chatThread || !newMessage.trim() || !user || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(
        chatThread.id,
        user.id,
        user.display_name,
        user.role,
        newMessage.trim()
      );
      if (msg) {
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
        fetchThreads();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  // Close chat
  const closeChat = () => {
    setChatThread(null);
    setMessages([]);
    setNewMessage('');
    fetchThreads();
  };

  // ── Chat Detail View ──
  if (chatThread) {
    const typeCfg = threadTypeConfig[chatThread.thread_type] || threadTypeConfig.vigilante;

    return (
      <View style={styles.container}>
        {/* Header */}
        <Surface style={styles.chatHeader} elevation={2}>
          <Button mode="text" icon="arrow-left" onPress={closeChat} compact style={styles.backBtn}>
            Volver
          </Button>
          <View style={styles.chatHeaderInfo}>
            <View style={[styles.threadIcon, { backgroundColor: typeCfg.bgColor }]}>
              <Icon name={typeCfg.icon} size={18} color={typeCfg.color} />
            </View>
            <View>
              <Text variant="titleSmall" style={styles.chatTitle}>Apto {chatThread.unit_number}</Text>
              <Text variant="bodySmall" style={styles.chatSubtitle}>{typeCfg.label}</Text>
            </View>
          </View>
        </Surface>

        {/* Messages */}
        <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
          {loadingMessages ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
          ) : messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <Icon name="message-outline" size={32} color={Colors.textSecondary} />
              <Text variant="bodySmall" style={styles.emptyChatText}>No hay mensajes</Text>
            </View>
          ) : (
            messages.map(msg => {
              const isMe = msg.sender_id === user?.id;
              return (
                <View key={msg.id} style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
                  <Surface
                    style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}
                    elevation={0}
                  >
                    {!isMe && (
                      <Text variant="bodySmall" style={styles.messageSender}>{msg.sender_name}</Text>
                    )}
                    <Text variant="bodyMedium" style={[styles.messageContent, isMe && { color: '#FFFFFF' }]}>
                      {msg.content}
                    </Text>
                    <Text variant="bodySmall" style={[styles.messageTime, isMe && { color: 'rgba(255,255,255,0.6)' }]}>
                      {formatTime(msg.created_at)}
                    </Text>
                  </Surface>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input */}
        <Surface style={styles.inputContainer} elevation={2}>
          <TextInput
            mode="outlined"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChangeText={setNewMessage}
            style={styles.chatInput}
            outlineStyle={styles.chatInputOutline}
            right={
              <TextInput.Icon
                icon="send"
                onPress={handleSend}
                disabled={!newMessage.trim() || sending}
                color={Colors.primary}
              />
            }
          />
        </Surface>
      </View>
    );
  }

  // ── Thread List View ──
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Create button */}
      <View style={styles.header}>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => setNewThreadModal(true)}
          style={styles.createButton}
          buttonColor={Colors.primary}
          labelStyle={styles.createButtonLabel}
        >
          Iniciar conversacion
        </Button>
      </View>

      {/* Thread list */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : threads.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="message-text-outline" size={56} color={Colors.textSecondary} />
          <Text variant="bodyLarge" style={styles.emptyTitle}>Sin conversaciones</Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Inicia una conversacion con tu vigilante o administrador
          </Text>
        </View>
      ) : (
        threads.map(thread => {
          const typeCfg = threadTypeConfig[thread.thread_type] || threadTypeConfig.vigilante;

          return (
            <Card key={thread.id} style={styles.threadCard} onPress={() => openChat(thread)}>
              <Card.Content>
                <View style={styles.threadHeader}>
                  <View style={[styles.threadIcon, { backgroundColor: typeCfg.bgColor }]}>
                    <Icon name={typeCfg.icon} size={20} color={typeCfg.color} />
                  </View>
                  <View style={styles.threadInfo}>
                    <View style={styles.threadTitleRow}>
                      <Text variant="titleSmall" style={styles.threadTitle}>Apto {thread.unit_number}</Text>
                      <View style={[styles.threadTypeBadge, { backgroundColor: typeCfg.bgColor }]}>
                        <Text variant="bodySmall" style={{ color: typeCfg.color, fontSize: 11 }}>
                          {typeCfg.label}
                        </Text>
                      </View>
                    </View>
                    {thread.last_message_preview && (
                      <Text variant="bodySmall" style={styles.threadPreview} numberOfLines={1}>
                        {thread.last_message_preview}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.threadFooter}>
                  <Text variant="bodySmall" style={styles.threadTime}>
                    {formatTime(thread.last_message_at)}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          );
        })
      )}

      <View style={{ height: 30 }} />

      {/* New Thread Modal */}
      <Portal>
        <Modal
          visible={newThreadModal}
          onDismiss={() => setNewThreadModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Icon name="message-text" size={32} color={Colors.primary} />
            <Text variant="titleLarge" style={styles.modalTitle}>Nueva conversacion</Text>

            <Text variant="bodySmall" style={styles.formLabel}>Tipo de conversacion</Text>
            <View style={styles.typeRow}>
              {(['vigilante', 'admin'] as const).map(type => {
                const cfg = threadTypeConfig[type];
                return (
                  <Button
                    key={type}
                    mode={newThreadType === type ? 'contained' : 'outlined'}
                    compact
                    icon={cfg.icon}
                    onPress={() => setNewThreadType(type)}
                    style={[
                      styles.typeButton,
                      newThreadType === type && { backgroundColor: cfg.color },
                    ]}
                    labelStyle={[
                      styles.typeButtonLabel,
                      newThreadType === type && { color: '#FFF' },
                    ]}
                  >
                    {cfg.label}
                  </Button>
                );
              })}
            </View>

            <TextInput
              mode="outlined"
              label="Unidad"
              value={newThreadUnit}
              onChangeText={setNewThreadUnit}
              placeholder={user?.unit || 'Ej: 301'}
              style={styles.formInput}
              outlineStyle={styles.formInputOutline}
            />

            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={() => setNewThreadModal(false)} style={styles.cancelBtn}>
                Cancelar
              </Button>
              <Button
                mode="contained"
                icon="check"
                onPress={handleCreateThread}
                disabled={creating}
                style={styles.submitBtn}
                buttonColor={Colors.primary}
              >
                {creating ? 'Creando...' : 'Iniciar'}
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
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
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  createButton: {
    borderRadius: 12,
  },
  createButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Thread card
  threadCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  threadIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  threadInfo: {
    flex: 1,
  },
  threadTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  threadTitle: {
    fontWeight: '600',
    color: Colors.text,
  },
  threadTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  threadPreview: {
    color: Colors.textSecondary,
    marginTop: 2,
  },
  threadFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  threadTime: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  // Chat
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    minWidth: 0,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  chatTitle: {
    fontWeight: '600',
    color: Colors.text,
  },
  chatSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyChat: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyChatText: {
    color: Colors.textSecondary,
    marginTop: 8,
  },
  messageRow: {
    marginBottom: 8,
  },
  messageRowMe: {
    alignItems: 'flex-end',
  },
  messageRowOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.muted,
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
    fontSize: 11,
  },
  messageContent: {
    color: Colors.text,
    lineHeight: 18,
  },
  messageTime: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  chatInput: {
    backgroundColor: Colors.surface,
  },
  chatInputOutline: {
    borderRadius: 20,
  },
  // Modal
  modalContainer: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    maxHeight: '70%',
  },
  modalContent: {
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 20,
  },
  formLabel: {
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
    fontSize: 13,
    alignSelf: 'flex-start',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  typeButton: {
    flex: 1,
    borderRadius: 8,
  },
  typeButtonLabel: {
    fontSize: 12,
  },
  formInput: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: Colors.surface,
  },
  formInputOutline: {
    borderRadius: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
  },
  submitBtn: {
    flex: 1,
    borderRadius: 10,
  },
});
