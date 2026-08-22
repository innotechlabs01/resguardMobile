import { supabase } from './supabase';

interface ParkingAssignment {
  id: string;
  building_id: string;
  spot_code: string;
  assignment_type: 'owner' | 'rented' | 'available';
  owner_id: string | null;
  owner_name: string | null;
  owner_unit: string | null;
  tenant_name: string | null;
  tenant_unit: string | null;
  vehicle_plate: string | null;
  vehicle_brand: string | null;
  vehicle_color: string | null;
  created_at: string;
  updated_at: string;
}

export type { ParkingAssignment };

export async function getParkingAssignments(buildingId: string): Promise<ParkingAssignment[]> {
  const { data, error } = await supabase
    .from('parking_assignments')
    .select('*')
    .eq('building_id', buildingId)
    .order('spot_code');

  if (error) {
    console.error('Error fetching parking assignments:', error);
    return [];
  }

  return data || [];
}

export async function saveParkingAssignment(assignment: {
  building_id: string;
  spot_code: string;
  assignment_type: 'owner' | 'rented' | 'available';
  owner_name?: string;
  owner_unit?: string;
  tenant_name?: string;
  tenant_unit?: string;
  vehicle_plate?: string;
  vehicle_brand?: string;
  vehicle_color?: string;
}): Promise<boolean> {
  // Check if exists
  const { data: existing } = await supabase
    .from('parking_assignments')
    .select('id')
    .eq('building_id', assignment.building_id)
    .eq('spot_code', assignment.spot_code)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('parking_assignments')
      .update(assignment)
      .eq('id', existing.id);
    return !error;
  } else {
    const { error } = await supabase
      .from('parking_assignments')
      .insert(assignment);
    return !error;
  }
}

export async function deleteParkingAssignment(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('parking_assignments')
    .delete()
    .eq('id', id);
  return !error;
}
