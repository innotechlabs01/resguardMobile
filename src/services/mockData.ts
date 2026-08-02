import { 
  User, 
  Payment, 
  Reservation, 
  ParkingRequest, 
  Communication, 
  IntercomCall,
  Assembly,
  AgendaItem,
  MarketplaceItem,
  RentalProperty,
  CommonArea,
  IncomingCall
} from '../types';

export const mockUser: User = {
  id: 'user-1',
  email: 'juan.perez@email.com',
  displayName: 'Juan Perez',
  role: 'resident',
  buildingId: 'building-1',
  unit: '301',
  buildingName: 'Torres del Parque',
};

export const mockPayments: Payment[] = [
  {
    id: '1',
    concept: 'Cuota Administracion - Marzo 2026',
    amount: 450000,
    date: new Date(),
    status: 'pending',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    concept: 'Cuota Administracion - Febrero 2026',
    amount: 450000,
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    status: 'paid',
  },
  {
    id: '3',
    concept: 'Cargo Parqueadero Extra',
    amount: 15000,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'paid',
  },
];

export const mockReservations: Reservation[] = [
  {
    id: '1',
    area: 'bbq',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    startTime: '12:00',
    endTime: '16:00',
    status: 'pending',
    guests: 10,
  },
  {
    id: '2',
    area: 'salon_social',
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    startTime: '14:00',
    endTime: '20:00',
    status: 'confirmed',
    guests: 25,
    notes: 'Cumpleanos',
  },
];

export const mockCommonAreas: CommonArea[] = [
  { id: '1', name: 'Salon Social', icon: 'account-group', deposit: 200000, maxHours: 8, maxGuests: 50 },
  { id: '2', name: 'Zona BBQ', icon: 'food', deposit: 100000, maxHours: 6, maxGuests: 20 },
  { id: '3', name: 'Gimnasio', icon: 'dumbbell', deposit: 0, maxHours: 2, maxGuests: 2 },
  { id: '4', name: 'Piscina', icon: 'pool', deposit: 0, maxHours: 4, maxGuests: 4 },
];

export const mockParkingRequests: ParkingRequest[] = [
  {
    id: '1',
    visitorName: 'Maria Garcia',
    vehiclePlate: 'ABC-123',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    time: '14:00',
    duration: 4,
    status: 'pending',
  },
  {
    id: '2',
    visitorName: 'Carlos Lopez',
    vehiclePlate: 'XYZ-987',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    time: '10:00',
    duration: 2,
    status: 'approved',
    spotAssigned: 'V-5',
  },
];

export const mockCommunications: Communication[] = [
  {
    id: '1',
    title: 'Mantenimiento Piscina',
    message: 'La piscina estara en mantenimiento los dias 25-26 de Marzo. Sorry por los inconvenientes.',
    type: 'maintenance',
    priority: 'high',
    authorName: 'Admin',
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    readBy: ['user-1'],
  },
  {
    id: '2',
    title: 'Asamblea Ordinaria',
    message: 'Se les invita a la asamblea ordinaria que se realizara el proximo 30 de Marzo a las 10:00 AM en el salon social.',
    type: 'announcement',
    priority: 'urgent',
    authorName: 'Admin',
    sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    readBy: [],
  },
  {
    id: '3',
    title: 'Horario Festivos',
    message: 'Les informamos que el horario de porteria durante Semana Santa sera de 6AM a 10PM.',
    type: 'circular',
    priority: 'normal',
    authorName: 'Vigilante',
    sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    readBy: ['user-1'],
  },
];

export const mockIntercomCalls: IntercomCall[] = [
  {
    id: '1',
    fromUserId: 'vigilante-1',
    fromUserName: 'Don Pedro',
    toUserId: 'user-1',
    toUserRole: 'vigilante',
    callType: 'visitor',
    status: 'completed',
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    endedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
    duration: 300,
  },
  {
    id: '2',
    fromUserId: 'user-1',
    fromUserName: 'Juan Perez',
    fromUserUnit: '301',
    toUserId: 'admin-1',
    toUserRole: 'admin',
    callType: 'admin',
    status: 'completed',
    startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
    duration: 600,
  },
];

export const mockAssemblies: Assembly[] = [
  {
    id: 'assembly-1',
    buildingId: 'building-1',
    title: 'Asamblea Ordinaria 2026',
    description: 'Asunta ordinaria para presentar informes de gestion y aprobar presupuesto del ano 2026.',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: 'active',
    createdBy: 'admin-1',
    createdAt: new Date(),
    agendaItems: [
      {
        id: 'agenda-1',
        assemblyId: 'assembly-1',
        title: 'Aprobacion Presupuesto 2026',
        description: 'Presentacion y votacion del presupuesto anual para el ano 2026.',
        voteType: 'yes_no',
        options: [
          { id: 'opt-1', label: 'Aprobar', voteCount: 15, percentage: 65 },
          { id: 'opt-2', label: 'Rechazar', voteCount: 5, percentage: 22 },
          { id: 'opt-3', label: 'Abstener', voteCount: 3, percentage: 13 },
        ],
        hasVoted: false,
      },
      {
        id: 'agenda-2',
        assemblyId: 'assembly-1',
        title: 'Instalacion Cameras Seguridad',
        description: 'Votacion para aprobar la instalacion de camaras de seguridad en areas comunes.',
        voteType: 'yes_no',
        options: [
          { id: 'opt-4', label: 'Aprobar', voteCount: 20, percentage: 87 },
          { id: 'opt-5', label: 'Rechazar', voteCount: 2, percentage: 9 },
          { id: 'opt-6', label: 'Abstener', voteCount: 1, percentage: 4 },
        ],
        hasVoted: true,
        userVote: 'opt-4',
      },
      {
        id: 'agenda-3',
        assemblyId: 'assembly-1',
        title: 'Eleccion Comite Convivencia',
        description: 'Seleccionar los 5 miembros del comite de convivencia.',
        voteType: 'multiple_choice',
        options: [
          { id: 'opt-7', label: 'Maria Rodriguez', voteCount: 12, percentage: 35 },
          { id: 'opt-8', label: 'Pedro Gomez', voteCount: 10, percentage: 29 },
          { id: 'opt-9', label: 'Ana Martinez', voteCount: 8, percentage: 24 },
          { id: 'opt-10', label: 'Carlos Sanchez', voteCount: 4, percentage: 12 },
        ],
        hasVoted: false,
      },
    ],
  },
  {
    id: 'assembly-2',
    buildingId: 'building-1',
    title: 'Asunta Extraordinaria - Piscina',
    description: 'Asunta extraordinaria para decidir sobre el cierre temporal de la piscina por reparaciones.',
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'closed',
    createdBy: 'admin-1',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    agendaItems: [
      {
        id: 'agenda-4',
        assemblyId: 'assembly-2',
        title: 'Cierre Piscina por Reparaciones',
        description: 'Aprobar el cierre de la piscina por 30 dias para reparaciones.',
        voteType: 'yes_no',
        options: [
          { id: 'opt-11', label: 'Aprobar', voteCount: 25, percentage: 89 },
          { id: 'opt-12', label: 'Rechazar', voteCount: 3, percentage: 11 },
        ],
        hasVoted: true,
        userVote: 'opt-11',
      },
    ],
  },
];

export const mockMarketplaceItems: MarketplaceItem[] = [
  {
    id: '1',
    title: 'Bicicleta Urbana',
    description: 'Bicicleta mountain bike en buen estado, ideal para desplazamientos urbanos.',
    price: 450000,
    category: 'Deportes',
    sellerName: 'Pedro Gomez',
    sellerUnit: '502',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'active',
  },
  {
    id: '2',
    title: 'Mueble Sala',
    description: 'Juego de sala en L, color gris, semi nuevo. Se vende por mudanza.',
    price: 800000,
    category: 'Hogar',
    sellerName: 'Ana Martinez',
    sellerUnit: '201',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'active',
  },
];

export const mockRentalProperties: RentalProperty[] = [
  {
    id: '1',
    type: 'apartment',
    title: 'Apartamento 401',
    description: 'Apartamento 3 habitaciones, 2 banos, balcon con vista al parque.',
    price: 1800000,
    status: 'available',
    ownerName: 'Carlos Rodriguez',
    ownerUnit: '401',
  },
  {
    id: '2',
    type: 'parking',
    title: 'Parqueadero 15 - Sotano',
    description: 'Parqueadero amplio en sotano 2, cercano al ascensor.',
    price: 150000,
    status: 'available',
    ownerName: 'Lucia Perez',
    ownerUnit: '302',
  },
];

export const mockIncomingCalls: IncomingCall[] = [
  {
    id: 'inc-1',
    visitorName: 'Carlos Mendez',
    visitorType: 'rappi',
    description: 'Paquete - 1 bulto',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    status: 'accepted',
  },
  {
    id: 'inc-2',
    visitorName: 'Maria Lopez',
    visitorType: 'guest',
    unit: '301',
    description: 'Visita familiar',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'declined',
  },
  {
    id: 'inc-3',
    visitorName: 'Domisol 1',
    visitorType: 'delivery',
    description: 'Almuerzo - Restaurante',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    status: 'missed',
  },
];
