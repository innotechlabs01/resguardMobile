import { supabase } from './supabase';

interface Payment {
  id: string;
  buildingId: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  description: string;
  residentUnit: string | null;
  createdAt: string;
  boldLinkId: string | null;
  boldUrl: string | null;
  paymentMethod: string | null;
  transactionId: string | null;
}

interface DbPayment {
  id: string;
  building_id: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  description: string;
  resident_unit: string | null;
  created_at: string;
  bold_link_id: string | null;
  bold_url: string | null;
  payment_method: string | null;
  transaction_id: string | null;
}

function mapPayment(p: DbPayment): Payment {
  return {
    id: p.id,
    buildingId: p.building_id,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    type: p.type,
    description: p.description,
    residentUnit: p.resident_unit,
    createdAt: p.created_at,
    boldLinkId: p.bold_link_id,
    boldUrl: p.bold_url,
    paymentMethod: p.payment_method,
    transactionId: p.transaction_id,
  };
}

export async function getUserPayments(buildingId: string, unit: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('building_id', buildingId)
    .eq('resident_unit', unit)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    return [];
  }

  return (data || []).map(mapPayment);
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching payment:', error);
    return null;
  }

  return mapPayment(data);
}
