import { supabase } from './supabase';

export interface InfractionItem {
  id: string;
  building_id: string;
  reporter_id: string;
  reporter_name: string;
  reporter_unit: string | null;
  infraction_type: string;
  description: string;
  location: string | null;
  target_unit: string;
  status: string;
  reply: string | null;
  reply_at: string | null;
  reply_deadline: string | null;
  admin_decision: string | null;
  admin_notes: string | null;
  decided_by: string | null;
  decided_at: string | null;
  fine_amount: number | null;
  fine_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InfractionEvidence {
  id: string;
  infraction_id: string;
  type: string;
  url: string;
  uploaded_by: string;
  created_at: string;
}

// ── Get infractions list ──

export async function getInfractions(
  buildingId: string,
  filters?: { status?: string; infraction_type?: string }
): Promise<InfractionItem[]> {
  let query = supabase
    .from('infraction_reports')
    .select('*')
    .eq('building_id', buildingId)
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.infraction_type) query = query.eq('infraction_type', filters.infraction_type);

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching infractions:', error);
    return [];
  }
  return (data || []) as InfractionItem[];
}

// ── Get infractions by reporter ──

export async function getInfractionsByUser(userId: string): Promise<InfractionItem[]> {
  const { data, error } = await supabase
    .from('infraction_reports')
    .select('*')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user infractions:', error);
    return [];
  }
  return (data || []) as InfractionItem[];
}

// ── Get single infraction ──

export async function getInfractionById(id: string): Promise<InfractionItem | null> {
  const { data, error } = await supabase
    .from('infraction_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching infraction by ID:', error);
    return null;
  }
  return data as InfractionItem;
}

// ── Report infraction ──

export async function reportInfraction(data: {
  building_id: string;
  reporter_id: string;
  reporter_name: string;
  reporter_unit?: string;
  infraction_type: string;
  description: string;
  location?: string;
  target_unit: string;
}): Promise<InfractionItem | null> {
  const { data: result, error } = await supabase
    .from('infraction_reports')
    .insert({
      building_id: data.building_id,
      reporter_id: data.reporter_id,
      reporter_name: data.reporter_name,
      reporter_unit: data.reporter_unit || null,
      infraction_type: data.infraction_type,
      description: data.description,
      location: data.location || null,
      target_unit: data.target_unit,
    })
    .select()
    .single();

  if (error) {
    console.error('Error reporting infraction:', error);
    return null;
  }
  return result as InfractionItem;
}

// ── Submit reply (infractor defense) ──

export async function submitReply(id: string, reply: string): Promise<boolean> {
  const { error } = await supabase
    .from('infraction_reports')
    .update({
      status: 'reply_received',
      reply,
      reply_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error submitting reply:', error);
    return false;
  }
  return true;
}
