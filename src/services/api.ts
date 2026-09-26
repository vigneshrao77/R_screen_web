import {
  Screening,
  Candidate,
  JobDescription,
  DashboardStats,
  AuditLog,
  Recruiter
} from '../types/index';

const TOKEN_KEY = 'recruiter_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  if (res.status === 401) {
    removeStoredToken();
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Session expired or unauthorized. Please log in.');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg) as any;
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: Recruiter }> {
    const data = await request<{ token: string; user: Recruiter }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setStoredToken(data.token);
    return data;
  },

  async register(email: string, password: string, name: string): Promise<{ token: string; user: Recruiter }> {
    const data = await request<{ token: string; user: Recruiter }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
    setStoredToken(data.token);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      removeStoredToken();
    }
  },

  async getMe(): Promise<{ user: Recruiter }> {
    return request<{ user: Recruiter }>('/api/auth/me');
  },

  // Screenings
  async uploadAndScreen(formData: FormData): Promise<Screening> {
    return request<Screening>('/api/screenings/upload', {
      method: 'POST',
      body: formData
    });
  },

  async getScreenings(params?: Record<string, string>): Promise<Screening[]> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return request<Screening[]>(`/api/screenings${query}`);
  },

  async getScreening(id: string): Promise<Screening & { job: JobDescription }> {
    return request<Screening & { job: JobDescription }>(`/api/screenings/${id}`);
  },

  async retryScreening(id: string): Promise<Screening> {
    return request<Screening>(`/api/screenings/${id}/retry`, {
      method: 'POST'
    });
  },

  async deleteScreening(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/screenings/${id}`, {
      method: 'DELETE'
    });
  },

  getResumeUrl(screeningId: string): string {
    const token = getStoredToken();
    return `/api/screenings/${screeningId}/resume?token=${token || ''}`;
  },

  // Jobs
  async getJobs(): Promise<JobDescription[]> {
    return request<JobDescription[]>('/api/jobs');
  },

  async getJob(id: string): Promise<JobDescription> {
    return request<JobDescription>(`/api/jobs/${id}`);
  },

  async createJob(job: Partial<JobDescription>): Promise<JobDescription> {
    return request<JobDescription>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(job)
    });
  },

  // Stats
  async getStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/api/stats');
  },

  // Audit
  async getAuditLogs(): Promise<AuditLog[]> {
    return request<AuditLog[]>('/api/audit-logs');
  }
};
