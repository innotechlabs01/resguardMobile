import { supabase } from './supabase';
import { MarketplaceItem } from '../types';

interface DbMarketplaceProduct {
  id: string;
  building_id: string;
  seller_id: string;
  seller_name: string;
  seller_unit: string;
  title: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  contact_phone: string | null;
  whatsapp: string | null;
  created_at: string;
}

function mapProduct(p: DbMarketplaceProduct): MarketplaceItem {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    category: p.category,
    sellerName: p.seller_name,
    sellerUnit: p.seller_unit,
    createdAt: new Date(p.created_at),
    status: p.available ? 'active' : 'sold',
    imageUrl: undefined,
  };
}

export async function getMarketplaceProducts(buildingId: string): Promise<MarketplaceItem[]> {
  const { data, error } = await supabase
    .from('marketplace_products')
    .select('*')
    .eq('building_id', buildingId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching marketplace products:', error);
    return [];
  }

  return (data || []).map(mapProduct);
}

export async function createMarketplaceProduct(product: {
  building_id: string;
  seller_id: string;
  seller_name: string;
  seller_unit: string;
  title: string;
  description: string;
  price: number;
  category: string;
  contact_phone?: string;
  whatsapp?: string;
}): Promise<MarketplaceItem | null> {
  const { data, error } = await supabase
    .from('marketplace_products')
    .insert({
      building_id: product.building_id,
      seller_id: product.seller_id,
      seller_name: product.seller_name,
      seller_unit: product.seller_unit,
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      available: true,
      contact_phone: product.contact_phone || null,
      whatsapp: product.whatsapp || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating marketplace product:', error);
    return null;
  }

  return mapProduct(data);
}

export async function deleteMarketplaceProduct(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('marketplace_products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting marketplace product:', error);
    return false;
  }

  return true;
}
