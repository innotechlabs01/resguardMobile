import { clerkAuth } from './clerkAuth';
import * as database from './database';
import { logger } from '../lib/logger';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  buildingId: string | undefined;
  unit: string | undefined;
  token: string;
}

export async function signInWithEmail(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const clerkUser = await clerkAuth.signIn(email, password);
    
    const userId = clerkUser.id;
    const token = await clerkAuth.getToken() || '';

    const profile = await database.getUser(userId);
    
    const user: AuthUser = {
      id: userId,
      email: profile?.email || clerkUser.email || email,
      displayName: profile?.display_name || clerkUser.fullName || email.split('@')[0],
      role: profile?.role || clerkUser.role || 'usuario',
      buildingId: profile?.building_id || clerkUser.buildingId || undefined,
      unit: profile?.unit || clerkUser.unit || undefined,
      token,
    };

    await database.syncUser({
      id: userId,
      email: user.email,
      fullName: user.displayName,
      buildingId: user.buildingId,
      role: user.role,
      unit: user.unit,
    });

    logger.log('User signed in successfully:', user.email);
    return { user, error: null };
  } catch (error) {
    logger.error('Sign in error:', error);
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Error al iniciar sesión' 
    };
  }
}

export async function signOut(): Promise<void> {
  try {
    await clerkAuth.signOut();
    logger.log('User signed out successfully');
  } catch (error) {
    logger.error('Sign out error:', error);
    throw error;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const clerkUser = await clerkAuth.getCurrentUser();
    
    if (!clerkUser) {
      return null;
    }

    const userId = clerkUser.id;
    const token = await clerkAuth.getToken() || '';
    const profile = await database.getUser(userId);

    if (!profile) {
      return null;
    }

    return {
      id: userId,
      email: profile.email,
      displayName: profile.display_name,
      role: profile.role,
      buildingId: profile.building_id || undefined,
      unit: profile.unit || undefined,
      token,
    };
  } catch (error) {
    logger.error('Get current user error:', error);
    return null;
  }
}

export async function refreshUserData(userId: string): Promise<AuthUser | null> {
  try {
    const profile = await database.getUser(userId);
    
    if (!profile) {
      return null;
    }

    const token = await clerkAuth.getToken() || '';

    return {
      id: userId,
      email: profile.email,
      displayName: profile.display_name,
      role: profile.role,
      buildingId: profile.building_id || undefined,
      unit: profile.unit || undefined,
      token,
    };
  } catch (error) {
    logger.error('Refresh user data error:', error);
    return null;
  }
}
