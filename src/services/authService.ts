import { supabase } from './supabase';
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw error || new Error('Login failed');

    const userId = data.user.id;
    const token = await supabase.auth.getSession().then(s => s.data.session?.access_token || '');

    const profile = await database.getUser(userId);
    
    const user: AuthUser = {
      id: userId,
      email: profile?.email || email,
      displayName: profile?.display_name || email.split('@')[0],
      role: profile?.role || 'usuario',
      buildingId: profile?.building_id || undefined,
      unit: profile?.unit || undefined,
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
    await supabase.auth.signOut();
    logger.log('User signed out successfully');
  } catch (error) {
    logger.error('Sign out error:', error);
    throw error;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const userId = user.id;
    const token = (await supabase.auth.getSession()).data.session?.access_token || '';
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

    const token = (await supabase.auth.getSession()).data.session?.access_token || '';

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
