import * as turso from './turso';
import * as supabase from './supabase';

const isDevelopment = process.env.EXPO_PUBLIC_APP_SCOPE === 'DEVELOPMENT';

export interface UserProfile {
  id: string | number;
  clerk_user_id: string;
  email: string;
  display_name: string;
  role: string;
  building_id: string | null;
  unit?: string;
  created_at: string;
}

export async function getUser(clerkUserId: string): Promise<UserProfile | null> {
  if (isDevelopment) {
    return turso.getUser(clerkUserId);
  }
  return supabase.getUser(clerkUserId);
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

export async function syncUser(clerkUser: {
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
    return turso.upsertUser(clerkUser);
  }
  const { syncClerkUserToSupabase } = await import('./userSync');
  return syncClerkUserToSupabase(clerkUser);
}

export async function updateUserRole(clerkUserId: string, role: string): Promise<boolean> {
  if (isDevelopment) {
    return turso.updateUserRole(clerkUserId, role);
  }
  const { updateUserRole: supabaseUpdateRole } = await import('./userSync');
  return supabaseUpdateRole(clerkUserId, role);
}

export async function updateUserBuilding(clerkUserId: string, buildingId: string): Promise<boolean> {
  if (isDevelopment) {
    return turso.updateUserBuilding(clerkUserId, buildingId);
  }
  const { updateUserBuilding: supabaseUpdateBuilding } = await import('./userSync');
  return supabaseUpdateBuilding(clerkUserId, buildingId);
}

export function isDevMode(): boolean {
  return isDevelopment;
}
