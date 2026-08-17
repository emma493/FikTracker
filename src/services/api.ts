import {
  AuthResponse,
  User,
  FikFapAccount,
  DashboardStats,
  AppSettings,
  DailyStat,
} from '../types';

const TOKEN_KEY = 'fikfap_tracker_token';
const USER_KEY = 'fikfap_tracker_user';

class ApiService {
  private token: string | null = localStorage.getItem(TOKEN_KEY);

  public setToken(token: string) {
    this.token = token;
    localStorage.setItem(TOKEN_KEY, token);
  }

  public clearToken() {
    this.token = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  public getToken(): string | null {
    return this.token;
  }

  public getSavedUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public setSavedUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data as T;
  }

  // Auth Endpoints
  public async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    this.setSavedUser(res.user);
    return res;
  }

  public async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(res.token);
    this.setSavedUser(res.user);
    return res;
  }

  public async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me');
  }

  // Account Endpoints
  public async getAccounts(): Promise<{ accounts: FikFapAccount[] }> {
    return this.request<{ accounts: FikFapAccount[] }>('/api/accounts');
  }

  public async validateCredentials(
    fikfapEmail: string,
    fikfapPassword?: string,
    proxy?: string
  ): Promise<any> {
    return this.request('/api/accounts/validate', {
      method: 'POST',
      body: JSON.stringify({ fikfapEmail, fikfapPassword, proxy }),
    });
  }

  public async addAccount(data: {
    fikfapEmail: string;
    fikfapPassword?: string;
    fikfapUsername?: string;
    label?: string;
    targetBioLink?: string;
    proxy?: string;
    syncFrequency?: string;
    fetchInitialStats?: boolean;
  }): Promise<{ account: FikFapAccount }> {
    return this.request<{ account: FikFapAccount }>('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateAccount(id: string, updates: Partial<FikFapAccount> & { fikfapPassword?: string }): Promise<{ account: FikFapAccount }> {
    return this.request<{ account: FikFapAccount }>(`/api/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async deleteAccount(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/accounts/${id}`, {
      method: 'DELETE',
    });
  }

  public async syncAccount(id: string): Promise<{ success: boolean; account?: FikFapAccount; error?: string }> {
    return this.request<{ success: boolean; account?: FikFapAccount; error?: string }>(`/api/accounts/${id}/sync`, {
      method: 'POST',
    });
  }

  public async syncAll(): Promise<{ success: boolean; accounts: FikFapAccount[] }> {
    return this.request<{ success: boolean; accounts: FikFapAccount[] }>('/api/accounts/sync-all', {
      method: 'POST',
    });
  }

  public async bulkImport(accounts: any[]): Promise<{ success: boolean; count: number; accounts: FikFapAccount[] }> {
    return this.request('/api/accounts/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ accounts }),
    });
  }

  // Stats Endpoints
  public async getDailyStats(): Promise<any> {
    return this.request('/api/stats/daily');
  }

  public async getAllTimeStats(): Promise<any> {
    return this.request('/api/stats/alltime');
  }

  public async getSummary(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/api/stats/summary');
  }

  // Settings Endpoints
  public async getSettings(): Promise<{ settings: AppSettings }> {
    return this.request<{ settings: AppSettings }>('/api/settings');
  }

  public async updateSettings(settings: Partial<AppSettings>): Promise<{ settings: AppSettings }> {
    return this.request<{ settings: AppSettings }>('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }
}

export const api = new ApiService();
