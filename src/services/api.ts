// Backend API Service
const API_BASE_URL = 'https://etkinlik-app-7n95.onrender.com';

class ApiService {
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

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async login(email: string, password: string) {
    const response = await this.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setToken(response.token);
    return response.user;
  }

  async logout() {
    this.setToken(null);
  }

  async getMe() {
    return this.fetch('/auth/me');
  }

  async register(data: {
    email: string;
    password: string;
    displayName: string;
    firmName?: string;
  }) {
    const response = await this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    this.setToken(response.token);
    return response.user;
  }

  async getFirm(firmId: string) {
    return this.fetch(`/firms/${firmId}`);
  }

  async updateFirm(firmId: string, data: any) {
    return this.fetch(`/firms/${firmId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async validateTicket(qrData: string) {
    return this.fetch('/tickets/validate', {
      method: 'POST',
      body: JSON.stringify({ qrData }),
    });
  }

  async approvePayment(data: any) {
    return this.fetch('/payments/approve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createLog(data: any) {
    return this.fetch('/logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStats() {
    return this.fetch('/stats');
  }

  async getFirms() {
    return this.fetch('/firms');
  }

  async getEvents() {
    return this.fetch('/events');
  }

  async createEvent(data: any) {
    return this.fetch('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id: string, data: any) {
    return this.fetch(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: string) {
    return this.fetch(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  async getSales() {
    return this.fetch('/sales');
  }

  async createSale(data: any) {
    return this.fetch('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStaff() {
    return this.fetch('/staff');
  }

  async createStaff(data: any) {
    return this.fetch('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteStaff(id: string) {
    return this.fetch(`/staff/${id}`, {
      method: 'DELETE',
    });
  }

  async getTickets() {
    return this.fetch('/tickets');
  }

  async createTicket(data: any) {
    return this.fetch('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkInTicket(id: string) {
    return this.fetch(`/tickets/${id}/checkin`, {
      method: 'POST',
    });
  }

  async createFirm(data: any) {
    return this.fetch('/firms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteFirm(firmId: string) {
    return this.fetch(`/firms/${firmId}`, {
      method: 'DELETE',
    });
  }

  async getLogs() {
    return this.fetch('/logs');
  }
}

export const api = new ApiService();
