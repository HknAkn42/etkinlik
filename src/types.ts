export type UserRole = 'superadmin' | 'firmadmin' | 'staff';

export interface Permissions {
  canSell: boolean;
  canScan: boolean;
  canViewRevenue: boolean;
  canManageEvents: boolean;
  canManageStaff: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  firmId: string;
  role: UserRole;
  permissions: Permissions;
  demoMode?: boolean;
  licenseStatus?: 'active' | 'expired' | 'trial';
  licenseExpiry?: string;
}

export interface Firm {
  id: string;
  name: string;
  logoUrl?: string;
  ownerUid: string;
  ownerEmail?: string;
  createdAt: string;
  status: 'active' | 'suspended';
  licenseExpiry?: string;
  licenseStatus: 'active' | 'expired' | 'trial';
  demoMode: boolean;
  subscriptionPrice?: number;
  subscriptionType?: 'monthly' | 'yearly';
  totalPaid?: number;
  lastPaymentDate?: string;
}

export interface Table {
  id: string;
  name: string;
  price: number;
  capacity: number;
  category: string;
  isPremium?: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: 'draft' | 'published' | 'cancelled';
  category: string;
  firmId: string;
  createdAt: string;
  tables?: Table[];
  firmName?: string;
  firmLogo?: string;
}
  firmId: string;
  title: string;
  description: string;
  date: string;
  location: string;
  tables: Table[];
  status: 'draft' | 'published' | 'cancelled';
  category?: string;
  firmName?: string;
  firmLogo?: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  firmId: string;
  saleId: string;
  customerName: string;
  customerPhone: string;
  tableId: string;
  tableName: string;
  price: number;
  code: string;
  status: 'valid' | 'used' | 'refunded';
  soldBy: string;
  soldAt: string;
  scannedAt?: string;
  scannedBy?: string;
  isPremium?: boolean;
  debt?: number;
  credit?: number;
  note?: string;
}

export interface Sale {
  id: string;
  firmId: string;
  eventId: string;
  items: {
    tableId: string;
    tableName: string;
    price: number;
    quantity: number;
    isPremium?: boolean;
  }[];
  totalAmount: number;
  discount: number;
  commission: number;
  soldBy: string;
  soldAt: string;
  customerName: string;
  customerPhone: string;
  status: 'confirmed' | 'proposal';
  debt?: number;
  credit?: number;
  note?: string;
}

export interface Log {
  id: string;
  firmId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'sale' | 'ticket' | 'user' | 'event' | 'system';
  entityId: string;
  details: string;
  timestamp: string;
}
