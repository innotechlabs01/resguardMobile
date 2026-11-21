import { supabase } from './supabase';

export interface ParkingRequest {
  id: string;
  building_id: string;
  visitor_name: string;
  vehicle_plate: string;
  start_time: string;
  end_time: string;
  duration: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  spot_assigned?: string;
  created_at: string;
  updated_at: string;
}

export interface ParkingRequestCreate {
  building_id: string;
  visitor_name: string;
  vehicle_plate: string;
  start_time: string;
  end_time: string;
  duration: number;
}

export async function getParkingRequests(buildingId: string): Promise<ParkingRequest[]> {
  const { data, error } = await supabase
    .from('visitor_parking_requests')
    .select('*')
    .eq('building_id', buildingId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching parking requests:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    building_id: item.building_id,
    visitor_name: item.visitor_name,
    vehicle_plate: item.vehicle_plate,
    start_time: item.start_time,
    end_time: item.end_time,
    duration: item.duration,
    status: item.status,
    spot_assigned: item.spot_assigned,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
}

export async function createParkingRequest(request: ParkingRequestCreate): Promise<ParkingRequest | null> {
  const { data, error } = await supabase
    .from('visitor_parking_requests')
    .insert({
      building_id: request.building_id,
      visitor_name: request.visitor_name,
      vehicle_plate: request.vehicle_plate,
      start_time: request.start_time,
      end_time: request.end_time,
      duration: request.duration,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating parking request:', error);
    return null;
  }

  return {
    id: data.id,
    building_id: data.building_id,
    visitor_name: data.visitor_name,
    vehicle_plate: data.vehicle_plate,
    start_time: data.start_time,
    end_time: data.end_time,
    duration: data.duration,
    status: data.status,
    spot_assigned: data.spot_assigned,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function deleteParkingRequest(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('visitor_parking_requests')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting parking request:', error);
    return false;
  }

  return true;
}
