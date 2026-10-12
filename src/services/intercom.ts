import { supabase } from './supabase';
import { IncomingCall, VisitorType } from '../types';

const callerTypeMap: Record<string, VisitorType> = {
  visitor: 'guest',
  delivery: 'delivery',
  other: 'other',
};

interface DbIntercomCall {
  id: string;
  building_id: string;
  unit_id: string;
  unit_number: string;
  caller_type: string;
  caller_name: string | null;
  caller_message: string | null;
  status: string;
  created_at: string;
  responded_at: string | null;
}

function mapCall(call: DbIntercomCall): IncomingCall {
  return {
    id: call.id,
    visitorName: call.caller_name || 'Visitante',
    visitorType: callerTypeMap[call.caller_type] || 'other',
    unit: call.unit_number,
    description: call.caller_message || undefined,
    timestamp: new Date(call.created_at),
    status: call.status === 'pending' ? 'ringing'
      : call.status === 'approved' ? 'accepted'
      : call.status === 'rejected' ? 'declined'
      : 'missed',
  };
}

export async function getCallsForUnit(
  buildingId: string,
  unitNumber: string,
  limit = 20
): Promise<IncomingCall[]> {
  const { data, error } = await supabase
    .from('intercom_calls')
    .select('*')
    .eq('building_id', buildingId)
    .eq('unit_number', unitNumber)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching intercom calls:', error);
    return [];
  }

  return (data || []).map(mapCall);
}

export async function getActiveCallsForUnit(
  buildingId: string,
  unitNumber: string
): Promise<IncomingCall[]> {
  const { data, error } = await supabase
    .from('intercom_calls')
    .select('*')
    .eq('building_id', buildingId)
    .eq('unit_number', unitNumber)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active calls:', error);
    return [];
  }

  return (data || []).map(mapCall);
}

export async function respondToCall(
  callId: string,
  response: 'approved' | 'rejected'
): Promise<boolean> {
  const { error } = await supabase
    .from('intercom_calls')
    .update({
      status: response,
      responded_at: new Date().toISOString(),
    })
    .eq('id', callId);

  if (error) {
    console.error('Error responding to call:', error);
    return false;
  }

  return true;
}
