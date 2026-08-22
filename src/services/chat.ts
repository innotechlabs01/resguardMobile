import { supabase } from './supabase';

export interface ChatThread {
  id: string;
  building_id: string;
  unit_number: string;
  thread_type: 'vigilante' | 'admin' | 'ai';
  subject: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// ── Get threads ──

export async function getThreads(
  buildingId: string,
  unitNumber?: string
): Promise<ChatThread[]> {
  let query = supabase
    .from('chat_threads')
    .select('*')
    .eq('building_id', buildingId);

  if (unitNumber) {
    query = query.eq('unit_number', unitNumber);
  }

  const { data, error } = await query.order('last_message_at', {
    ascending: false,
    nullsFirst: false,
  });

  if (error) {
    console.error('Error fetching threads:', error);
    return [];
  }
  return (data || []) as ChatThread[];
}

// ── Get or create thread ──

export async function getOrCreateThread(
  buildingId: string,
  unitNumber: string,
  threadType: 'vigilante' | 'admin' | 'ai',
  subject?: string
): Promise<ChatThread | null> {
  // Try to find existing
  const { data: existing } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('building_id', buildingId)
    .eq('unit_number', unitNumber)
    .eq('thread_type', threadType)
    .single();

  if (existing) return existing as ChatThread;

  // Create new
  const { data, error } = await supabase
    .from('chat_threads')
    .insert({
      building_id: buildingId,
      unit_number: unitNumber,
      thread_type: threadType,
      subject: subject || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating thread:', error);
    return null;
  }
  return data as ChatThread;
}

// ── Get messages ──

export async function getMessages(threadId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_thread_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  return (data || []) as ChatMessage[];
}

// ── Send message ──

export async function sendMessage(
  threadId: string,
  senderId: string,
  senderName: string,
  senderRole: string,
  content: string
): Promise<ChatMessage | null> {
  // Insert message
  const { data: message, error: msgError } = await supabase
    .from('chat_thread_messages')
    .insert({
      thread_id: threadId,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      content: content.trim(),
    })
    .select()
    .single();

  if (msgError) {
    console.error('Error sending message:', msgError);
    return null;
  }

  // Update thread metadata
  const preview = content.length > 255 ? content.substring(0, 255) : content;
  await supabase
    .from('chat_threads')
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: preview,
    })
    .eq('id', threadId);

  return message as ChatMessage;
}

// ── Mark as read ──

export async function markAsRead(threadId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('chat_thread_messages')
    .update({ is_read: true })
    .eq('thread_id', threadId)
    .neq('sender_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking as read:', error);
    return false;
  }
  return true;
}
