import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  display_name: string;
  role: string;
  building_id: string | null;
  building_name?: string | null;
  unit: string | null;
  is_tenant?: boolean;
  created_at: string;
}

function normalizeUserProfile(raw: any, fallbackEmail = '', fallbackName = ''): UserProfile {
  const email = raw?.email || fallbackEmail || '';
  const resolvedName =
    raw?.name ||
    raw?.display_name ||
    fallbackName ||
    (email ? email.split('@')[0] : '') ||
    'Usuario';

  return {
    id: raw?.id || '',
    email,
    name: resolvedName,
    display_name: resolvedName,
    role: raw?.role || 'usuario',
    building_id: raw?.building_id || null,
    building_name: raw?.building_name || null,
    unit: raw?.unit || null,
    is_tenant: raw?.is_tenant,
    created_at: raw?.created_at || new Date().toISOString(),
  };
}

export async function syncUserToSupabase(userData: {
  id: string;
  email: string;
  displayName: string;
  buildingId?: string;
  role?: string;
  unit?: string;
}): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    const { data: existingProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userData.id)
      .single();

    if (existingProfile) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('users')
        .update({
          email: userData.email,
          name: userData.displayName,
          building_id: userData.buildingId || existingProfile.building_id,
          role: userData.role || existingProfile.role,
          unit: userData.unit ?? existingProfile.unit,
        })
        .eq('id', userData.id)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return {
        success: true,
        profile: normalizeUserProfile(updatedProfile, userData.email, userData.displayName),
      };
    }

    const { data: newProfile, error: insertError } = await supabase
      .from('users')
      .insert({
        id: userData.id,
        email: userData.email,
        name: userData.displayName,
        role: userData.role || 'usuario',
        building_id: userData.buildingId || null,
        unit: userData.unit || null,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return {
      success: true,
      profile: normalizeUserProfile(newProfile, userData.email, userData.displayName),
    };
  } catch (error) {
    console.error('Error syncing user to Supabase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return normalizeUserProfile(data);
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function updateUserRole(userId: string, role: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);

    return !error;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
}

export async function updateUserBuilding(userId: string, buildingId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ building_id: buildingId })
      .eq('id', userId);

    return !error;
  } catch (error) {
    console.error('Error updating user building:', error);
    return false;
  }
}