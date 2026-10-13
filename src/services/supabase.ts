import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const getUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const getUserPayments = async (userId: string) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
};

export const getReservations = async (userId: string) => {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
};

export const getParkingRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from('parking_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error
  return data;
};

export const getCommunications = async (buildingId: string) => {
  const { data, error } = await supabase
    .from('communications')
    .select('*')
    .eq('building_id', buildingId)
    .order('sent_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getIntercomCalls = async (userId: string) => {
  const { data, error } = await supabase
    .from('intercom_calls')
    .select('*')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getAssemblies = async (buildingId: string) => {
  const { data, error } = await supabase
    .from('assemblies')
    .select('*, agenda_items(*)')
    .eq('building_id', buildingId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const submitVote = async (
  agendaItemId: string,
  userId: string,
  encryptedVote: string,
  voteHash: string
) => {
  const { data, error } = await supabase
    .from('votes')
    .insert({
      agenda_item_id: agendaItemId,
      user_id: userId,
      encrypted_vote: encryptedVote,
      vote_hash: voteHash,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const saveIntercomCall = async (call: {
  from_user_id: string;
  to_user_id: string;
  call_type: string;
  status: string;
  started_at: string;
  ended_at?: string;
  duration?: number;
}) => {
  const { data, error } = await supabase
    .from('intercom_calls')
    .insert(call)
    .select()
    .single();

  if (error) throw error;
  return data;
};