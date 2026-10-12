import { supabase } from './supabase';

export interface UtilityReading {
  id: string;
  building_id: string;
  unit_number: string;
  service_type: string;
  reading_date: string;
  previous_reading: number | null;
  current_reading: number | null;
  consumption: number | null;
  rate_per_unit: number | null;
  total_charge: number | null;
  notes: string | null;
  created_at: string;
}

// ── Get readings for a building ──

export async function getReadings(
  buildingId: string,
  unitNumber?: string
): Promise<UtilityReading[]> {
  let query = supabase
    .from('utility_readings')
    .select('*')
    .eq('building_id', buildingId)
    .order('reading_date', { ascending: false });

  if (unitNumber) {
    query = query.eq('unit_number', unitNumber);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching utility readings:', error);
    return [];
  }
  return (data || []) as UtilityReading[];
}

// ── Get unit consumption by service type ──

export async function getUnitConsumption(
  buildingId: string,
  unitNumber: string,
  serviceType: string
): Promise<UtilityReading[]> {
  const { data, error } = await supabase
    .from('utility_readings')
    .select('*')
    .eq('building_id', buildingId)
    .eq('unit_number', unitNumber)
    .eq('service_type', serviceType)
    .order('reading_date', { ascending: false });

  if (error) {
    console.error('Error fetching unit consumption:', error);
    return [];
  }
  return (data || []) as UtilityReading[];
}
