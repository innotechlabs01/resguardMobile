import { supabase } from './supabase';

export interface Provider {
  id: string;
  building_id: string;
  name: string;
  category: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  description: string | null;
  verified_by: string | null;
  is_verified: boolean;
  avg_rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface ProviderReview {
  id: string;
  provider_id: string;
  reviewer_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

// ── Get providers list ──

export async function getProviders(
  buildingId: string,
  category?: string
): Promise<Provider[]> {
  let query = supabase
    .from('verified_providers')
    .select('*')
    .eq('building_id', buildingId)
    .order('avg_rating', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching providers:', error);
    return [];
  }
  return (data || []) as Provider[];
}

// ── Get provider by ID with reviews ──

export async function getProviderById(
  id: string
): Promise<{ provider: Provider; reviews: ProviderReview[] } | null> {
  const { data: provider, error: pErr } = await supabase
    .from('verified_providers')
    .select('*')
    .eq('id', id)
    .single();

  if (pErr || !provider) {
    console.error('Error fetching provider:', pErr);
    return null;
  }

  const { data: reviews, error: rErr } = await supabase
    .from('provider_reviews')
    .select('*')
    .eq('provider_id', id)
    .order('created_at', { ascending: false });

  if (rErr) {
    console.error('Error fetching reviews:', rErr);
  }

  return {
    provider: provider as Provider,
    reviews: (reviews || []) as ProviderReview[],
  };
}

// ── Add review ──

export async function addReview(data: {
  provider_id: string;
  reviewer_id: string;
  reviewer_name: string;
  rating: number;
  comment?: string;
}): Promise<ProviderReview | null> {
  const { data: result, error } = await supabase
    .from('provider_reviews')
    .insert({
      provider_id: data.provider_id,
      reviewer_id: data.reviewer_id,
      reviewer_name: data.reviewer_name,
      rating: data.rating,
      comment: data.comment || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding review:', error);
    return null;
  }

  // Update provider rating
  const { data: allReviews } = await supabase
    .from('provider_reviews')
    .select('rating')
    .eq('provider_id', data.provider_id);

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;
    await supabase
      .from('verified_providers')
      .update({ avg_rating: Math.round(avg * 100) / 100, total_reviews: allReviews.length })
      .eq('id', data.provider_id);
  }

  return result as ProviderReview;
}
