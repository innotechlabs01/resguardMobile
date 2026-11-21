import { supabase } from './supabase';

export interface Communication {
  id: string;
  building_id: string;
  author_id: string;
  author_name: string;
  title: string;
  message: string;
  type: 'announcement' | 'maintenance' | 'alert' | 'event' | 'circular';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_roles: string[];
  includes_tenants: boolean;
  sent_at: Date;
  read_by: string[];
  attachments?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CommunicationCreate {
  building_id: string;
  author_id: string;
  title: string;
  message: string;
  type: Communication['type'];
  priority: Communication['priority'];
  target_roles?: string[];
  includes_tenants?: boolean;
  attachments?: string[];
}

export async function getCommunications(buildingId: string): Promise<Communication[]> {
  const { data, error } = await supabase
    .from('communications')
    .select('*')
    .eq('building_id', buildingId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching communications:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    building_id: item.building_id,
    author_id: item.author_id,
    author_name: item.author_name,
    title: item.title,
    message: item.message,
    type: item.type,
    priority: item.priority,
    target_roles: item.target_roles || [],
    includes_tenants: item.includes_tenants,
    sent_at: item.sent_at || item.created_at,
    read_by: item.read_by || [],
    attachments: item.attachments,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
}

export async function createCommunication(communication: CommunicationCreate): Promise<boolean> {
  const { error } = await supabase
    .from('communications')
    .insert({
      building_id: communication.building_id,
      author_id: communication.author_id,
      title: communication.title,
      message: communication.message,
      type: communication.type,
      priority: communication.priority,
      target_roles: communication.target_roles || [],
      includes_tenants: communication.includes_tenants !== false,
      attachments: communication.attachments || [],
    });

  if (error) {
    console.error('Error creating communication:', error);
    return false;
  }

  return true;
}

export async function markCommunicationAsRead(communicationId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('communications')
    .update({ read_by: [...(await getCommunicationReaders(communicationId)), userId] })
    .eq('id', communicationId);

  if (error) {
    console.error('Error marking communication as read:', error);
    return false;
  }

  return true;
}

async function getCommunicationReaders(communicationId: string): Promise<string[]> {
  const { data } = await supabase
    .from('communications')
    .select('read_by')
    .eq('id', communicationId)
    .single();

  return data?.read_by || [];
}
