export type UserRole = 'super_admin' | 'admin' | 'vigilante' | 'resident';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  buildingId: string;
  unit?: string;
  buildingName?: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  units: number;
  adminId: string;
}

export interface Payment {
  id: string;
  concept: string;
  amount: number;
  date: Date;
  status: 'paid' | 'pending' | 'overdue';
  dueDate?: Date;
}

export interface Reservation {
  id: string;
  area: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  guests?: number;
  notes?: string;
}

export interface CommonArea {
  id: string;
  name: string;
  icon: string;
  deposit: number;
  maxHours: number;
  maxGuests: number;
}

export interface ParkingRequest {
  id: string;
  visitorName: string;
  vehiclePlate?: string;
  date: Date;
  time?: string;
  duration: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  spotAssigned?: string;
}

export interface Communication {
  id: string;
  title: string;
  message: string;
  type: 'announcement' | 'maintenance' | 'alert' | 'event' | 'circular';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  authorName: string;
  sentAt: Date;
  readBy: string[];
}

export type VisitorType = 'guest' | 'delivery' | 'rappi' | 'express' | 'taxi' | 'other';

export interface IncomingCall {
  id: string;
  visitorName: string;
  visitorType: VisitorType;
  visitorPhone?: string;
  unit?: string;
  vehiclePlate?: string;
  description?: string;
  photoUrl?: string;
  timestamp: Date;
  status: 'ringing' | 'accepted' | 'declined' | 'missed';
}

export interface IntercomCall {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserUnit?: string;
  toUserId: string;
  toUserRole: 'vigilante' | 'admin';
  callType: 'vigilante' | 'admin' | 'visitor';
  status: 'missed' | 'completed' | 'rejected' | 'in_progress';
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
}

export interface Assembly {
  id: string;
  buildingId: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'closed';
  createdBy: string;
  createdAt: Date;
  agendaItems: AgendaItem[];
}

export interface AgendaItem {
  id: string;
  assemblyId: string;
  title: string;
  description: string;
  voteType: 'yes_no' | 'multiple_choice';
  options: VoteOption[];
  hasVoted?: boolean;
  userVote?: string;
}

export interface VoteOption {
  id: string;
  label: string;
  voteCount?: number;
  percentage?: number;
}

export interface Vote {
  id: string;
  agendaItemId: string;
  userId: string;
  encryptedVote: string;
  voteHash: string;
  createdAt: Date;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  sellerName: string;
  sellerUnit: string;
  createdAt: Date;
  status: 'active' | 'sold';
}

export interface RentalProperty {
  id: string;
  type: 'apartment' | 'parking';
  title: string;
  description: string;
  price: number;
  status: 'available' | 'rented';
  ownerName: string;
  ownerUnit: string;
}

// PQRS Types
export type PqrsCategory = 'maintenance' | 'noise' | 'security' | 'cleaning' | 'parking' | 'common_areas' | 'billing' | 'other';
export type PqrsPriority = 'low' | 'normal' | 'high' | 'urgent';
export type PqrsStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed' | 'reopened';

export interface Pqrs {
  id: string;
  building_id: string;
  created_by: string;
  created_by_name: string;
  created_by_unit?: string;
  subject: string;
  description: string;
  category: PqrsCategory;
  priority: PqrsPriority;
  status: PqrsStatus;
  unit?: string;
  location_detail?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  first_response_at?: string;
}

export interface PqrsComment {
  id: string;
  pqrs_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}
