import * as turso from './turso';
import * as supabase from './supabase';

const isDevelopment = process.env.EXPO_PUBLIC_APP_SCOPE === 'DEVELOPMENT';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: string;
  building_id: string | null;
  unit: string | null;
  created_at: string;
}

export async function getUser(userId: string): Promise<UserProfile | null> {
  if (isDevelopment) {
    return turso.getUser(userId);
  }
  return supabase.getUser(userId);
}

export async function getUserPayments(userId: string) {
  if (isDevelopment) {
    return turso.getUserPayments(userId);
  }
  return supabase.getUserPayments(userId);
}

export async function getReservations(userId: string) {
  if (isDevelopment) {
    return turso.getReservations(userId);
  }
  return supabase.getReservations(userId);
}

export async function getParkingRequests(userId: string) {
  if (isDevelopment) {
    return turso.getParkingRequests(userId);
  }
  return supabase.getParkingRequests(userId);
}

export async function getCommunications(buildingId: string) {
  if (isDevelopment) {
    return turso.getCommunications(buildingId);
  }
  return supabase.getCommunications(buildingId);
}

export async function getIntercomCalls(userId: string) {
  if (isDevelopment) {
    return turso.getIntercomCalls(userId);
  }
  return supabase.getIntercomCalls(userId);
}

export async function getAssemblies(buildingId: string) {
  if (isDevelopment) {
    return turso.getAssemblies(buildingId);
  }
  return supabase.getAssemblies(buildingId);
}

export async function submitVote(
  agendaItemId: string,
  userId: string,
  encryptedVote: string,
  voteHash: string
) {
  if (isDevelopment) {
    return turso.submitVote(agendaItemId, userId, encryptedVote, voteHash);
  }
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
  if (isDevelopment) {
    return turso.saveIntercomCall(call);
  }
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
  if (isDevelopment) {
    return turso.upsertUser(userData);
  }
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
  if (isDevelopment) {
    return turso.updateUserRole(userId, role);
  }
  const { updateUserRole: supabaseUpdateRole } = await import('./userSync');
  return supabaseUpdateRole(userId, role);
}

export async function updateUserBuilding(userId: string, buildingId: string): Promise<boolean> {
  if (isDevelopment) {
    return turso.updateUserBuilding(userId, buildingId);
  }
  const { updateUserBuilding: supabaseUpdateBuilding } = await import('./userSync');
  return supabaseUpdateBuilding(userId, buildingId);
}

export function isDevMode(): boolean {
  return isDevelopment;
}