import { supabase } from './supabase';

export interface PqrsItem {
  id: string;
  building_id: string;
  created_by: string;
  created_by_name: string;
  created_by_unit: string | null;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  unit: string | null;
  location_detail: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  first_response_at: string | null;
}

export interface PqrsComment {
  id: string;
  pqrs_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export interface PqrsStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  waiting: number;
  reopened: number;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
  avg_response_hours: number | null;
}

// ── Get PQRS list (optionally filtered) ──

export async function getPqrs(
  buildingId: string,
  filters?: { status?: string; category?: string; priority?: string }
): Promise<PqrsItem[]> {
  let query = supabase
    .from('pqrs')
    .select('*')
    .eq('building_id', buildingId)
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.priority) query = query.eq('priority', filters.priority);

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching PQRS:', error);
    return [];
  }
  return (data || []) as PqrsItem[];
}

// ── Get PQRS by user ──

export async function getPqrsByUser(userId: string): Promise<PqrsItem[]> {
  const { data, error } = await supabase
    .from('pqrs')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user PQRS:', error);
    return [];
  }
  return (data || []) as PqrsItem[];
}

// ── Get single PQRS ──

export async function getPqrsById(id: string): Promise<PqrsItem | null> {
  const { data, error } = await supabase
    .from('pqrs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching PQRS by ID:', error);
    return null;
  }
  return data as PqrsItem;
}

// ── Create PQRS ──

export async function createPqrs(pqrs: {
  building_id: string;
  created_by: string;
  created_by_name: string;
  created_by_unit?: string;
  subject: string;
  description: string;
  category: string;
  priority?: string;
  unit?: string;
  location_detail?: string;
}): Promise<PqrsItem | null> {
  const { data, error } = await supabase
    .from('pqrs')
    .insert({
      building_id: pqrs.building_id,
      created_by: pqrs.created_by,
      created_by_name: pqrs.created_by_name,
      created_by_unit: pqrs.created_by_unit || null,
      subject: pqrs.subject,
      description: pqrs.description,
      category: pqrs.category,
      priority: pqrs.priority || 'normal',
      unit: pqrs.unit || null,
      location_detail: pqrs.location_detail || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating PQRS:', error);
    return null;
  }
  return data as PqrsItem;
}

// ── Update PQRS status ──

export async function respondToPqrs(
  id: string,
  status: string
): Promise<boolean> {
  const update: Record<string, any> = { status };
  if (status === 'resolved') {
    update.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('pqrs')
    .update(update)
    .eq('id', id);

  if (error) {
    console.error('Error updating PQRS:', error);
    return false;
  }
  return true;
}

// ── Add comment ──

export async function addComment(data: {
  pqrs_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  content: string;
  is_internal?: boolean;
}): Promise<PqrsComment | null> {
  const { data: result, error } = await supabase
    .from('pqrs_comments')
    .insert({
      pqrs_id: data.pqrs_id,
      author_id: data.author_id,
      author_name: data.author_name,
      author_role: data.author_role,
      content: data.content,
      is_internal: data.is_internal || false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    return null;
  }
  return result as PqrsComment;
}

// ── Get comments ──

export async function getComments(pqrsId: string): Promise<PqrsComment[]> {
  const { data, error } = await supabase
    .from('pqrs_comments')
    .select('*')
    .eq('pqrs_id', pqrsId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
  return (data || []) as PqrsComment[];
}

// ── Get stats ──

export async function getPqrsStats(buildingId: string): Promise<PqrsStats | null> {
  const { data, error } = await supabase
    .from('pqrs')
    .select('*')
    .eq('building_id', buildingId);

  if (error) {
    console.error('Error fetching PQRS stats:', error);
    return null;
  }

  const all = (data || []) as PqrsItem[];
  const byCategory: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  let totalResponseMs = 0;
  let responseCount = 0;

  for (const p of all) {
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    byPriority[p.priority] = (byPriority[p.priority] || 0) + 1;
    if (p.first_response_at) {
      totalResponseMs += new Date(p.first_response_at).getTime() - new Date(p.created_at).getTime();
      responseCount++;
    }
  }

  return {
    total: all.length,
    open: all.filter(p => p.status === 'open').length,
    in_progress: all.filter(p => p.status === 'in_progress').length,
    resolved: all.filter(p => p.status === 'resolved').length,
    closed: all.filter(p => p.status === 'closed').length,
    waiting: all.filter(p => p.status === 'waiting').length,
    reopened: all.filter(p => p.status === 'reopened').length,
    by_category: byCategory,
    by_priority: byPriority,
    avg_response_hours: responseCount > 0
      ? Math.round((totalResponseMs / responseCount / 3600000) * 10) / 10
      : null,
  };
}
