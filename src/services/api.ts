// Standalone Frontend - Hiçbir API çağrısı yapmadan
const mockUsers = [
  {
    id: 'superadmin-1',
    email: 'superadmin@etkinlik.com',
    password: 'superadmin123',
    displayName: 'Super Admin',
    role: 'superadmin',
    firmId: null,
    permissions: {
      canSell: true,
      canScan: true,
      canViewRevenue: true,
      canManageEvents: true,
      canManageStaff: true
    }
  },
  {
    id: 'demo-user-1',
    email: 'admin@demo.com',
    password: 'demo123',
    displayName: 'Demo Admin',
    role: 'firmadmin',
    firmId: 'demo-firm-1',
    permissions: {
      canSell: true,
      canScan: true,
      canViewRevenue: true,
      canManageEvents: true,
      canManageStaff: true
    }
  }
];

const mockFirm = {
  id: 'demo-firm-1',
  name: 'Demo Firma',
  ownerEmail: 'admin@demo.com',
  subscriptionPrice: 299,
  subscriptionType: 'monthly',
  licenseExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  licenseStatus: 'trial',
  demoMode: false
};

// LocalStorage'dan verileri yükle
const loadDynamicData = () => {
  try {
    const savedUsers = localStorage.getItem('dynamicUsers');
    const savedFirms = localStorage.getItem('dynamicFirms');
    
    return {
      dynamicUsers: savedUsers ? JSON.parse(savedUsers) : [...mockUsers],
      dynamicFirms: savedFirms ? JSON.parse(savedFirms) : [mockFirm]
    };
  } catch (error) {
    console.error('Error loading dynamic data:', error);
    return {
      dynamicUsers: [...mockUsers],
      dynamicFirms: [mockFirm]
    };
  }
};

// LocalStorage'a verileri kaydet
const saveDynamicData = (users: any[], firms: any[]) => {
  try {
    localStorage.setItem('dynamicUsers', JSON.stringify(users));
    localStorage.setItem('dynamicFirms', JSON.stringify(firms));
  } catch (error) {
    console.error('Error saving dynamic data:', error);
  }
};

// Başlangıç verileri
const { dynamicUsers, dynamicFirms } = loadDynamicData();

class StandaloneApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  // Hiçbir fetch çağrısı yapmıyor - her şey mock
  async login(email: string, password: string) {
    // Simüle edilmiş async bekleme
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // LocalStorage'dan güncel kullanıcıları yükle
    const { dynamicUsers: currentUsers } = loadDynamicData();
    const allUsers = [...mockUsers, ...currentUsers];
    const user = allUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Geçersiz e-posta veya şifre');
    }
    
    const token = 'mock-token-' + user.id;
    this.setToken(token);
    
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      firmId: user.firmId,
      permissions: user.permissions,
      token
    };
  }

  async logout() {
    await new Promise(resolve => setTimeout(resolve, 200));
    this.setToken(null);
  }

  async getMe() {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const token = this.getToken();
    if (!token) throw new Error('Token bulunamadı');
    
    // LocalStorage'dan güncel kullanıcıları yükle
    const { dynamicUsers: currentUsers } = loadDynamicData();
    const allUsers = [...mockUsers, ...currentUsers];
    const user = allUsers.find(u => token.includes(u.id));
    if (!user) throw new Error('Kullanıcı bulunamadı');
    
    return user;
  }

  async getFirm(firmId: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // LocalStorage'dan güncel firmaları yükle
    const { dynamicFirms: currentFirms } = loadDynamicData();
    const allFirms = [mockFirm, ...currentFirms];
    const firm = allFirms.find(f => f.id === firmId);
    
    return firm || mockFirm;
  }

  async updateFirm(firmId: string, data: any) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { ...mockFirm, ...data };
  }

  async validateTicket(qrData: string) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // QR veriyi parse et
    let ticketData;
    try {
      ticketData = JSON.parse(qrData);
    } catch (error) {
      throw new Error('Geçersiz QR kod formatı');
    }

    return {
      success: true,
      ticket: {
        id: ticketData.ticketId || 'demo-ticket-1',
        customerName: 'Demo Müşteri',
        customerPhone: '05551234567',
        eventTitle: 'Demo Etkinlik',
        eventDate: new Date().toISOString(),
        eventLocation: 'Demo Mekan',
        status: 'validated'
      }
    };
  }

  async approvePayment(data: any) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      message: 'Ödeme onayı başarılı'
    };
  }

  async createLog(data: any) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true };
  }

  async getStats() {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      totalRevenue: 15000,
      totalTickets: 150,
      activeEvents: 5,
      totalUsers: 25
    };
  }

  async getFirms() {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // LocalStorage'dan güncel verileri yükle
    const { dynamicFirms: currentFirms } = loadDynamicData();
    return currentFirms;
  }

  async getEvents() {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
      {
        id: 'demo-event-1',
        title: 'Demo Etkinlik',
        description: 'Bu bir demo etkinliktir',
        date: new Date().toISOString(),
        location: 'Demo Mekan',
        category: 'Konser',
        firmId: 'demo-firm-1',
        status: 'active',
        tables: []
      }
    ];
  }

  async createEvent(data: any) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { id: 'new-event-1', ...data };
  }

  async updateEvent(id: string, data: any) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { id, ...data };
  }

  async deleteEvent(id: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true };
  }

  async getSales() {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
      {
        id: 'demo-sale-1',
        eventId: 'demo-event-1',
        customerName: 'Demo Müşteri',
        customerPhone: '05551234567',
        items: [],
        totalAmount: 299,
        status: 'completed',
        createdAt: new Date().toISOString()
      }
    ];
  }

  async createSale(data: any) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { id: 'new-sale-1', ...data };
  }

  async getStaff() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: 'demo-staff-1',
        email: 'staff@demo.com',
        displayName: 'Demo Personel',
        role: 'staff',
        permissions: { canSell: true, canScan: true }
      }
    ];
  }

  async createStaff(data: any) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { id: 'new-staff-1', ...data };
  }

  async deleteStaff(id: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true };
  }

  async getTickets() {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
      {
        id: 'demo-ticket-1',
        eventId: 'demo-event-1',
        customerName: 'Demo Müşteri',
        customerPhone: '05551234567',
        status: 'valid',
        createdAt: new Date().toISOString()
      }
    ];
  }

  async createTicket(data: any) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { id: 'new-ticket-1', ...data };
  }

  async checkInTicket(id: string) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, status: 'used' };
  }

  async createFirm(data: any) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newFirm = {
      id: 'new-firm-' + Date.now(),
      name: data.name,
      ownerEmail: data.ownerEmail,
      createdAt: new Date().toISOString(),
      status: 'active',
      licenseExpiry: data.licenseExpiry,
      licenseStatus: data.licenseStatus,
      demoMode: data.demoMode,
      subscriptionPrice: data.subscriptionPrice,
      subscriptionType: data.subscriptionType,
      totalPaid: data.totalPaid || 0
    };
    
    // Firma admin kullanıcısı oluştur
    const newUserId = 'user-' + Date.now();
    const hashedPassword = 'demo123'; // Varsayılan şifre
    
    const newUser = {
      id: newUserId,
      email: data.ownerEmail,
      password: hashedPassword,
      displayName: `${data.name} Admin`,
      role: 'firmadmin',
      firmId: newFirm.id,
      permissions: {
        canSell: true,
        canScan: true,
        canViewRevenue: true,
        canManageEvents: true,
        canManageStaff: true
      }
    };
    
    // Dinamik listelere ekle ve kaydet
    const allUsers = [...dynamicUsers, newUser];
    const allFirms = [...dynamicFirms, newFirm];
    
    saveDynamicData(allUsers, allFirms);
    
    return newFirm;
  }

  async deleteFirm(firmId: string) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  }

  async getLogs() {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
      {
        id: 'demo-log-1',
        action: 'Demo Log',
        entityType: 'system',
        entityId: 'demo-1',
        details: 'Demo log kaydı',
        timestamp: new Date().toISOString()
      }
    ];
  }
}

export const api = new StandaloneApiService();
