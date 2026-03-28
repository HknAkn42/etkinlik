// Mock API - Vercel serverless çalışmadığı için geçici çözüm
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

class MockApiService {
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

  private async request(path: string, options: RequestInit = {}) {
    // Mock API - production'da gerçek API çağrıları
    if (path.includes('/api/auth/login')) {
      const { email, password } = JSON.parse(options.body as string);
      const user = mockUsers.find(u => u.email === email && u.password === password);
      
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

    if (path.includes('/api/validate-ticket')) {
      return {
        success: true,
        ticket: {
          id: 'demo-ticket-1',
          customerName: 'Demo Müşteri',
          customerPhone: '05551234567',
          eventTitle: 'Demo Etkinlik',
          eventDate: new Date().toISOString(),
          eventLocation: 'Demo Mekan',
          status: 'validated'
        }
      };
    }

    if (path.includes('/api/approve-payment')) {
      return {
        success: true,
        message: 'Ödeme onayı başarılı'
      };
    }

    // Diğer API çağrıları için mock veriler
    if (path.includes('/api/me')) {
      const token = this.getToken();
      if (!token) throw new Error('Token bulunamadı');
      
      const user = mockUsers.find(u => token.includes(u.id));
      if (!user) throw new Error('Kullanıcı bulunamadı');
      
      return user;
    }

    if (path.includes('/api/firms')) {
      return mockFirm;
    }

    // Default mock response
    return { success: true };
  }

  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  }

  async logout() {
    this.setToken(null);
  }

  async getMe() {
    return this.request('/api/me');
  }

  async getFirm(firmId: string) {
    return this.request(`/api/firms/${firmId}`);
  }

  async updateFirm(firmId: string, data: any) {
    return this.request(`/api/firms/${firmId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async validateTicket(qrData: string) {
    return this.request('/api/validate-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData })
    });
  }

  async approvePayment(data: any) {
    return this.request('/api/approve-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async createLog(data: any) {
    return this.request('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async getStats() {
    return this.request('/api/stats');
  }

  async getFirms() {
    return this.request('/api/firms');
  }

  async getEvents() {
    return this.request('/api/events');
  }

  async createEvent(data: any) {
    return this.request('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async updateEvent(id: string, data: any) {
    return this.request(`/api/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async deleteEvent(id: string) {
    return this.request(`/api/events/${id}`, {
      method: 'DELETE'
    });
  }

  async getSales() {
    return this.request('/api/sales');
  }

  async createSale(data: any) {
    return this.request('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async getStaff() {
    return this.request('/api/staff');
  }

  async createStaff(data: any) {
    return this.request('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async deleteStaff(id: string) {
    return this.request(`/api/staff/${id}`, {
      method: 'DELETE'
    });
  }

  async getTickets() {
    return this.request('/api/tickets');
  }

  async createTicket(data: any) {
    return this.request('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async checkInTicket(id: string) {
    return this.request(`/api/tickets/${id}/checkin`, {
      method: 'POST'
    });
  }

  async getLogs() {
    return this.request('/api/logs');
  }
}

export const api = new MockApiService();
