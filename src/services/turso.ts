import { openRemote } from '@op-engineering/op-sqlite';
import { logger } from '../lib/logger';

const tursoUrl = process.env.EXPO_PUBLIC_DATABASE_URL_TURSO;
const tursoToken = process.env.EXPO_PUBLIC_DATABASE_TOKEN_TURSO;

if (!tursoUrl || !tursoToken) {
  logger.error('Turso credentials not configured. Set EXPO_PUBLIC_DATABASE_URL_TURSO and EXPO_PUBLIC_DATABASE_TOKEN_TURSO');
  throw new Error('Turso credentials not configured for development mode');
}

export const tursoDb = openRemote({
  url: tursoUrl,
  authToken: tursoToken,
});

export interface UserProfile {
  id: number;
  clerk_user_id: string;
  email: string;
  display_name: string;
  role: string;
  building_id: string | null;
  unit?: string;
  created_at: string;
}

export async function getUser(clerkUserId: string): Promise<UserProfile | null> {
  try {
    const result = await tursoDb.execute(
      'SELECT * FROM users WHERE clerk_user_id = ?',
      [clerkUserId]
    );

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as unknown as UserProfile;
  } catch (error) {
    logger.error('Error fetching user from Turso:', error);
    return null;
  }
}

export async function getUserPayments(userId: string) {
  try {
    const result = await tursoDb.execute(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    return result.rows || [];
  } catch (error) {
    logger.error('Error fetching payments from Turso:', error);
    return [];
  }
}

export async function getReservations(userId: string) {
  try {
    const result = await tursoDb.execute(
      'SELECT * FROM reservations WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    return result.rows || [];
  } catch (error) {
    logger.error('Error fetching reservations from Turso:', error);
    return [];
  }
}

export async function getParkingRequests(userId: string) {
  try {
    const result = await tursoDb.execute(
      'SELECT * FROM parking_requests WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return result.rows || [];
  } catch (error) {
    logger.error('Error fetching parking requests from Turso:', error);
    return [];
  }
}

export async function getCommunications(buildingId: string) {
  try {
    const result = await tursoDb.execute(
      'SELECT * FROM communications WHERE building_id = ? ORDER BY sent_at DESC',
      [buildingId]
    );
    return result.rows || [];
  } catch (error) {
    logger.error('Error fetching communications from Turso:', error);
    return [];
  }
}

export async function getIntercomCalls(userId: string) {
  try {
    const result = await tursoDb.execute(
      'SELECT * FROM intercom_calls WHERE from_user_id = ? OR to_user_id = ? ORDER BY started_at DESC',
      [userId, userId]
    );
    return result.rows || [];
  } catch (error) {
    logger.error('Error fetching intercom calls from Turso:', error);
    return [];
  }
}

export async function getAssemblies(buildingId: string) {
  try {
    const result = await tursoDb.execute(
      'SELECT * FROM assemblies WHERE building_id = ? ORDER BY start_date DESC',
      [buildingId]
    );
    return result.rows || [];
  } catch (error) {
    logger.error('Error fetching assemblies from Turso:', error);
    return [];
  }
}

export async function submitVote(
  agendaItemId: string,
  userId: string,
  encryptedVote: string,
  voteHash: string
) {
  try {
    const result = await tursoDb.execute(
      'INSERT INTO votes (agenda_item_id, user_id, encrypted_vote, vote_hash) VALUES (?, ?, ?, ?)',
      [agendaItemId, userId, encryptedVote, voteHash]
    );
    return result;
  } catch (error) {
    logger.error('Error submitting vote to Turso:', error);
    throw error;
  }
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
  try {
    const result = await tursoDb.execute(
      'INSERT INTO intercom_calls (from_user_id, to_user_id, call_type, status, started_at, ended_at, duration) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        call.from_user_id,
        call.to_user_id,
        call.call_type,
        call.status,
        call.started_at,
        call.ended_at ?? null,
        call.duration ?? null,
      ]
    );
    return result;
  } catch (error) {
    logger.error('Error saving intercom call to Turso:', error);
    throw error;
  }
}

export async function upsertUser(clerkUser: {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  buildingId?: string;
  role?: string;
  unit?: string;
}): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    const displayName = clerkUser.fullName ||
      `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
      clerkUser.email;

    const existingUser = await getUser(clerkUser.id);

    if (existingUser) {
      await tursoDb.execute(
        'UPDATE users SET email = ?, display_name = ?, building_id = ?, role = ?, unit = ? WHERE clerk_user_id = ?',
        [
          clerkUser.email,
          displayName,
          clerkUser.buildingId || existingUser.building_id,
          clerkUser.role || existingUser.role,
          clerkUser.unit ?? existingUser.unit ?? null,
          clerkUser.id,
        ]
      );
    } else {
      await tursoDb.execute(
        'INSERT INTO users (clerk_user_id, email, display_name, role, building_id, unit) VALUES (?, ?, ?, ?, ?, ?)',
        [
          clerkUser.id,
          clerkUser.email,
          displayName,
          clerkUser.role || 'usuario',
          clerkUser.buildingId || null,
          clerkUser.unit ?? null,
        ]
      );
    }

    const updatedUser = await getUser(clerkUser.id);
    return { success: true, profile: updatedUser || undefined };
  } catch (error) {
    logger.error('Error upserting user to Turso:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function updateUserRole(clerkUserId: string, role: string): Promise<boolean> {
  try {
    await tursoDb.execute(
      'UPDATE users SET role = ? WHERE clerk_user_id = ?',
      [role, clerkUserId]
    );
    return true;
  } catch (error) {
    logger.error('Error updating user role in Turso:', error);
    return false;
  }
}

export async function updateUserBuilding(clerkUserId: string, buildingId: string): Promise<boolean> {
  try {
    await tursoDb.execute(
      'UPDATE users SET building_id = ? WHERE clerk_user_id = ?',
      [buildingId, clerkUserId]
    );
    return true;
  } catch (error) {
    logger.error('Error updating user building in Turso:', error);
    return false;
  }
}
