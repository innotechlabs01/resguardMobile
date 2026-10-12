import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Official Supabase RN guidance: drive auto-refresh from AppState,
// since JS timers are frozen while the app is backgrounded/headless.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
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

  if (error) throw error;
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
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
};

export const submitVote = async (
  agendaItemId: string,
  userId: string,
  encryptedVote: string,
  voteHash: string,
  optionId: string
) => {
  const { data, error } = await supabase
    .from('votes')
    .insert({
      agenda_item_id: agendaItemId,
      user_id: userId,
      encrypted_vote: encryptedVote,
      vote_hash: voteHash,
      option_id: optionId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Build a { option_id -> count } map plus total from raw vote rows (option_id column).
const buildVoteCounts = (voteRows: { option_id: string | null }[]) => {
  const voteCounts: Record<string, number> = {};
  let total = 0;
  for (const v of voteRows) {
    if (v.option_id) voteCounts[v.option_id] = (voteCounts[v.option_id] ?? 0) + 1;
    total += 1;
  }
  return { voteCounts, total };
};

export const getAgendaItemsWithVoteState = async (
  assemblyId: string,
  userId: string
) => {
  const { data: items, error } = await supabase
    .from('agenda_items')
    .select('*')
    .eq('assembly_id', assemblyId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const enriched = await Promise.all(
    (items ?? []).map(async (item) => {
      const [{ data: userVote, error: voteErr }, { data: allVotes, error: allErr }] =
        await Promise.all([
          supabase
            .from('votes')
            .select('option_id')
            .eq('agenda_item_id', item.id)
            .eq('user_id', userId)
            .maybeSingle(),
          supabase.from('votes').select('option_id').eq('agenda_item_id', item.id),
        ]);

      if (voteErr) throw voteErr;
      if (allErr) throw allErr;

      const { voteCounts, total } = buildVoteCounts((allVotes ?? []) as { option_id: string | null }[]);

      return {
        ...item,
        hasVoted: !!userVote?.option_id,
        userVote: userVote?.option_id ?? undefined,
        voteCounts,
        totalVotes: total,
      };
    })
  );

  return enriched;
};

export const getVoteResults = async (agendaItemId: string) => {
  const { data, error } = await supabase
    .from('votes')
    .select('option_id')
    .eq('agenda_item_id', agendaItemId);

  if (error) throw error;
  const { voteCounts, total } = buildVoteCounts((data ?? []) as { option_id: string | null }[]);
  return { ...voteCounts, total };
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
