import { supabase } from './supabase';

export interface RentalProperty {
  id: string;
  building_id: string;
  owner_id: string;
  owner_name: string;
  owner_unit: string;
  type: 'apartment' | 'parking' | 'storage' | 'storage_room';
  title: string;
  description: string;
  price: number;
  currency: string;
  period: 'monthly' | 'daily' | 'yearly';
  available: boolean;
  available_from?: string;
  rooms?: number;
  bathrooms?: number;
  area?: number;
  parking_code?: string;
  contact_phone?: string;
  amenities?: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface RentalPropertyCreate {
  building_id: string;
  owner_id: string;
  owner_name: string;
  owner_unit: string;
  type: 'apartment' | 'parking' | 'storage' | 'storage_room';
  title: string;
  description: string;
  price: number;
  currency: string;
  period: 'monthly' | 'daily' | 'yearly';
  available?: boolean;
  rooms?: number;
  bathrooms?: number;
  area?: number;
  parking_code?: string;
  contact_phone?: string;
  available_from?: string;
  amenities?: string[];
  status?: 'active' | 'inactive';
}

export async function getRentalProperties(buildingId: string): Promise<RentalProperty[]> {
  const { data, error } = await supabase
    .from('rental_listings')
    .select('*')
    .eq('building_id', buildingId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rental properties:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    building_id: item.building_id,
    owner_id: item.owner_id,
    owner_name: item.owner_name,
    owner_unit: item.owner_unit,
    type: item.type,
    title: item.title,
    description: item.description,
    price: item.price,
    currency: item.currency,
    period: item.period,
    available: item.available,
    available_from: item.available_from,
    rooms: item.rooms,
    bathrooms: item.bathrooms,
    area: item.area,
    parking_code: item.parking_code,
    contact_phone: item.contact_phone,
    amenities: item.amenities || [],
    status: item.status,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
}

export async function createRentalProperty(property: RentalPropertyCreate): Promise<RentalProperty | null> {
  const { data, error } = await supabase
    .from('rental_listings')
    .insert({
      building_id: property.building_id,
      owner_id: property.owner_id,
      owner_name: property.owner_name,
      owner_unit: property.owner_unit,
      type: property.type,
      title: property.title,
      description: property.description,
      price: property.price,
      currency: property.currency,
      period: property.period,
      available: property.available !== false,
      available_from: property.available_from || null,
      rooms: property.rooms || null,
      bathrooms: property.bathrooms || null,
      area: property.area || null,
      parking_code: property.parking_code || null,
      contact_phone: property.contact_phone || null,
      amenities: property.amenities || [],
      status: property.status || 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating rental property:', error);
    return null;
  }

  return {
    id: data.id,
    building_id: data.building_id,
    owner_id: data.owner_id,
    owner_name: data.owner_name,
    owner_unit: data.owner_unit,
    type: data.type,
    title: data.title,
    description: data.description,
    price: data.price,
    currency: data.currency,
    period: data.period,
    available: data.available,
    available_from: data.available_from,
    rooms: data.rooms,
    bathrooms: data.bathrooms,
    area: data.area,
    parking_code: data.parking_code,
    contact_phone: data.contact_phone,
    amenities: data.amenities,
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function deleteRentalProperty(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('rental_listings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting rental property:', error);
    return false;
  }

  return true;
}
