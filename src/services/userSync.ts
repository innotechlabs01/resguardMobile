import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  display_name: string;
  unit?: string;
  role: string;
  building_id: string | null;
  created_at: string;
}

export async function syncUserToSupabase(user: {
  id: string;
  email: string;
  fullName: string;
  buildingId?: string;
  role?: string;
  unit?: string;
}): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    const displayName = user.fullName || user.email;

    const { data: existingProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('users')
        .update({
          email: user.email,
          name: displayName,
          building_id: user.buildingId || existingProfile.building_id,
          role: user.role || existingProfile.role,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true, profile: updatedProfile };
    }

    const { data: newProfile, error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        name: displayName,
        role: user.role || 'usuario',
        building_id: user.buildingId || null,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true, profile: newProfile };
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

    return data;
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