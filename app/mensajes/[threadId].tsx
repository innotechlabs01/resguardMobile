import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Surface,
  ActivityIndicator,
  TextInput,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../src/lib/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  getMessages,
  sendMessage,
  markAsRead,
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

export default function ChatDetailScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!threadId) return;
    try {
      const msgs = await getMessages(threadId);
      setMessages(msgs);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchMessages();
    if (threadId && user?.id) {
      markAsRead(threadId, user.id);
    }
    pollingRef.current = setInterval(fetchMessages, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchMessages, threadId, user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    if (!threadId || !newMessage.trim() || !user || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(
        threadId,
        user.id,
        user.display_name,
        user.role,
        newMessage.trim()
      );
      if (msg) {
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {loading ? (
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
});
