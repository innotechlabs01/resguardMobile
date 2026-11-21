import * as supabase from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: string;
  building_id: string | null;
  building_name?: string | null;
  unit: string | null;
  is_tenant?: boolean;
  created_at: string;
}

export async function getUser(userId: string): Promise<UserProfile | null> {
  return supabase.getUser(userId);
}

export async function getUserPayments(userId: string) {
  return supabase.getUserPayments(userId);
}

export async function getReservations(userId: string) {
  return supabase.getReservations(userId);
}

export async function getParkingRequests(userId: string) {
  return supabase.getParkingRequests(userId);
}

export async function getCommunications(buildingId: string) {
  return supabase.getCommunications(buildingId);
}

export async function getIntercomCalls(userId: string) {
  return supabase.getIntercomCalls(userId);
}

export async function getAssemblies(buildingId: string) {
  return supabase.getAssemblies(buildingId);
}

export async function submitVote(
  agendaItemId: string,
  userId: string,
  encryptedVote: string,
  voteHash: string
) {
  return supabase.submitVote(agendaItemId, userId, encryptedVote, voteHash);
}

export async function saveIntercomCall(call: {
  from_user_id: string;
  to_user_id: string;
  call_type: string;
  status: string;
  started_at: string;
  ended_at?: string;
  duration?: number;
}) {
  return supabase.saveIntercomCall(call);
}

export async function syncUser(userData: {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  buildingId?: string;
  role?: string;
  unit?: string;
}): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  const { syncUserToSupabase } = await import('./userSync');
  return syncUserToSupabase({
    id: userData.id,
    email: userData.email,
    displayName: userData.fullName,
    buildingId: userData.buildingId,
    role: userData.role,
    unit: userData.unit,
  });
}

export async function updateUserRole(userId: string, role: string): Promise<boolean> {
  const { updateUserRole: supabaseUpdateRole } = await import('./userSync');
  return supabaseUpdateRole(userId, role);
}

export async function updateUserBuilding(userId: string, buildingId: string): Promise<boolean> {
  const { updateUserBuilding: supabaseUpdateBuilding } = await import('./userSync');
  return supabaseUpdateBuilding(userId, buildingId);
}

export function isDevMode(): boolean {
  return false;
}