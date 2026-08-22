import { supabase } from './supabase';

export interface OnboardingChecklist {
  id: string;
  building_id: string;
  user_id: string;
  user_name: string;
  user_unit: string | null;
  status: string;
  signed_regulation: boolean;
  received_keys: boolean;
  met_vigilante: boolean;
  met_admin: boolean;
  parking_assigned: boolean;
  wifi_configured: boolean;
  emergency_numbers: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Get my onboarding checklist ──

export async function getMyOnboarding(userId: string): Promise<OnboardingChecklist | null> {
  const { data, error } = await supabase
    .from('onboarding_checklists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching onboarding:', error);
    return null;
  }
  return data as OnboardingChecklist;
}

// ── Update a checklist item ──

export async function updateItem(
  id: string,
  item: string,
  value: boolean
): Promise<OnboardingChecklist | null> {
  const { data, error } = await supabase
    .from('onboarding_checklists')
    .update({ [item]: value })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating onboarding item:', error);
    return null;
  }
  return data as OnboardingChecklist;
}

// ── Complete onboarding ──

export async function completeOnboarding(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('onboarding_checklists')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error completing onboarding:', error);
    return false;
  }
  return true;
}
