import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  clerk_user_id: string;
  email: string;
  display_name: string;
  role: string;
  building_id: string | null;
  unit?: string;
  created_at: string;
}

export async function syncClerkUserToSupabase(clerkUser: {
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

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', clerkUser.id)
      .single();

    if (existingProfile) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          email: clerkUser.email,
          display_name: displayName,
          building_id: clerkUser.buildingId || existingProfile.building_id,
          role: clerkUser.role || existingProfile.role,
        })
        .eq('clerk_user_id', clerkUser.id)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true, profile: updatedProfile };
    }

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        clerk_user_id: clerkUser.id,
        email: clerkUser.email,
        display_name: displayName,
        role: clerkUser.role || 'usuario',
        building_id: clerkUser.buildingId || null,
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

export async function getUserProfile(clerkUserId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
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

export async function updateUserRole(clerkUserId: string, role: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('clerk_user_id', clerkUserId);

    return !error;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
}

export async function updateUserBuilding(clerkUserId: string, buildingId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ building_id: buildingId })
      .eq('clerk_user_id', clerkUserId);

    return !error;
  } catch (error) {
    console.error('Error updating user building:', error);
    return false;
  }
}