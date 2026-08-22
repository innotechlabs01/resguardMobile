import { supabase } from './supabase';

export interface MaintenanceSchedule {
  id: string;
  building_id: string;
  title: string;
  description: string | null;
  category: string;
  frequency: string;
  next_due: string;
  last_completed: string | null;
  assigned_provider: string | null;
  assigned_provider_phone: string | null;
  estimated_cost: number | null;
  priority: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkOrder {
  id: string;
  schedule_id: string | null;
  building_id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  assigned_provider: string | null;
  assigned_provider_phone: string | null;
  scheduled_date: string | null;
  completed_date: string | null;
  actual_cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Get schedules ──

export async function getSchedules(buildingId: string): Promise<MaintenanceSchedule[]> {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .select('*')
    .eq('building_id', buildingId)
    .eq('is_active', true)
    .order('next_due', { ascending: true });

  if (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
  return (data || []) as MaintenanceSchedule[];
}

// ── Get work orders ──

export async function getWorkOrders(buildingId: string): Promise<WorkOrder[]> {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .eq('building_id', buildingId)
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Error fetching work orders:', error);
    return [];
  }
  return (data || []) as WorkOrder[];
}

// ── Get work order by ID ──

export async function getWorkOrderById(id: string): Promise<WorkOrder | null> {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching work order:', error);
    return null;
  }
  return data as WorkOrder;
}

// ── Create schedule ──

export async function createSchedule(schedule: {
  building_id: string;
  title: string;
  description?: string;
  category: string;
  frequency: string;
  next_due: string;
  assigned_provider?: string;
  assigned_provider_phone?: string;
  estimated_cost?: number;
  priority?: string;
}): Promise<MaintenanceSchedule | null> {
  const { data, error } = await supabase
    .from('maintenance_schedules')
    .insert({
      building_id: schedule.building_id,
      title: schedule.title,
      description: schedule.description || null,
      category: schedule.category,
      frequency: schedule.frequency,
      next_due: schedule.next_due,
      assigned_provider: schedule.assigned_provider || null,
      assigned_provider_phone: schedule.assigned_provider_phone || null,
      estimated_cost: schedule.estimated_cost ?? null,
      priority: schedule.priority || 'normal',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating schedule:', error);
    return null;
  }
  return data as MaintenanceSchedule;
}

// ── Update work order status ──

export async function updateWorkOrderStatus(
  id: string,
  status: string,
  notes?: string
): Promise<boolean> {
  const update: Record<string, any> = { status };
  if (status === 'completed') {
    update.completed_date = new Date().toISOString().split('T')[0];
  }
  if (notes) {
    update.notes = notes;
  }

  const { error } = await supabase
    .from('work_orders')
    .update(update)
    .eq('id', id);

  if (error) {
    console.error('Error updating work order:', error);
    return false;
  }
  return true;
}
