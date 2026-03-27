import { UserProfile, Event as AppEvent } from '../types';

class ApiService {
  private token: string | null = localStorage.getItem('auth_token');

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }

  private async request(path: string, options: RequestInit = {}) {
    console.log(`API Request: ${path}`, options.method || 'GET');
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(path, { ...options, headers });
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Unauthorized request, clearing token and redirecting');
          this.setToken(null);
          window.location.href = '/login';
        }
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText || 'Bir hata oluştu' };
        }
        throw new Error(error.error || 'Bir hata oluştu');
      }
      
      const responseText = await response.text();
      if (!responseText) {
        return { success: true };
      }
      
      return JSON.parse(responseText);
    } catch (error) {
      console.error(`API Error (${path}):`, error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data.user as UserProfile;
  }

  async getMe() {
    if (!this.token) return null;
    return this.request('/api/auth/me') as Promise<UserProfile>;
  }

  async getStats() {
    return this.request('/api/stats');
  }

  async getFirms() {
    return this.request('/api/firms');
  }

  async getFirm(id: string) {
    return this.request(`/api/firms/${id}`);
  }

  async updateFirm(id: string, data: any) {
    return this.request(`/api/firms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFirm(id: string) {
    return this.request(`/api/firms/${id}`, {
      method: 'DELETE',
    });
  }

  async createFirm(firmData: any) {
    return this.request('/api/firms', {
      method: 'POST',
      body: JSON.stringify(firmData),
    });
  }

  async getEvents() {
    return this.request('/api/events');
  }

  async getEvent(id: string) {
    return this.request(`/api/events/${id}`) as Promise<AppEvent>;
  }

  async createEvent(eventData: any) {
    return this.request('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(id: string, eventData: any) {
    return this.request(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(id: string) {
    return this.request(`/api/events/${id}`, {
      method: 'DELETE',
    });
  }

  async getSales() {
    return this.request('/api/sales');
  }

  async validateTicket(ticketData: any) {
    return this.request('/api/validate-ticket', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
  }

  async createSale(saleData: any) {
    return this.request('/api/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  async updateSale(id: string, saleData: any) {
    return this.request(`/api/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(saleData),
    });
  }

  async getTickets(saleId?: string) {
    const url = saleId ? `/api/tickets?saleId=${saleId}` : '/api/tickets';
    return this.request(url);
  }

  async scanTicket(code: string) {
    return this.request(`/api/tickets/scan?code=${code}`);
  }

  async checkInTicket(id: string) {
    return this.request(`/api/tickets/${id}/checkin`, {
      method: 'POST',
    });
  }

  async getStaff() {
    return this.request('/api/staff');
  }

  async createStaff(staffData: any) {
    return this.request('/api/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  async deleteStaff(id: string) {
    return this.request(`/api/staff/${id}`, {
      method: 'DELETE',
    });
  }

  async getLogs(filters?: { entityType?: string, action?: string }) {
    const query = new URLSearchParams();
    if (filters?.entityType) query.append('entityType', filters.entityType);
    if (filters?.action) query.append('action', filters.action);
    return this.request(`/api/logs?${query.toString()}`);
  }

  async createLog(logData: { action: string, entityType: 'sale' | 'ticket' | 'user' | 'event' | 'system', entityId: string, details: string }) {
    return this.request('/api/logs', {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  }

  logout() {
    this.setToken(null);
  }
}

export const api = new ApiService();
