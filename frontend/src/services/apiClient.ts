// Production-Ready Unified API Client for Loan Management System
// Connects directly to Next.js PostgreSQL/Prisma API endpoints

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('lms_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.id) {
          defaultHeaders['x-user-id'] = parsed.id;
        }
      }
    } catch {
      // ignore
    }
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    cache: 'no-store',
  };

  try {
    const res = await fetch(url, config);

    if (res.status === 204) {
      return {} as T;
    }

    const contentType = res.headers.get('content-type');
    let data: any = null;

    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = text ? { message: text } : {};
    }

    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined') {
        try {
          if (data?.error?.includes('User account not found') || data?.error?.includes('session')) {
            localStorage.removeItem('lms_auth_user');
            window.dispatchEvent(new CustomEvent('lms_auth_invalid'));
          }
        } catch {
          // ignore
        }
      }

      throw new ApiError(
        data?.error || data?.message || `Request failed with status ${res.status}`,
        res.status,
        data
      );
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Network communication failure', 500);
  }
}

export const api = {
  get: <T = any>(url: string, params?: Record<string, any>) => {
    let fullUrl = url;
    if (params) {
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          sp.append(k, String(v));
        }
      });
      const qs = sp.toString();
      if (qs) {
        fullUrl += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return request<T>(fullUrl, { method: 'GET' });
  },

  post: <T = any>(url: string, body?: any) =>
    request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(url: string, body?: any) =>
    request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(url: string, body?: any) =>
    request<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(url: string) =>
    request<T>(url, {
      method: 'DELETE',
    }),
};

// ==========================================
// Domain-Specific Real API Endpoints
// ==========================================

export const dashboardApi = {
  getStats: () => api.get('/api/dashboard/stats'),
};

export const customerApi = {
  getAll: (params?: any) => api.get('/api/customers', params),
  getById: (id: string) => api.get('/api/customers', { id }),
  create: (data: any) => api.post('/api/customers', data),
  update: (id: string, data: any) => api.put('/api/customers', { id, ...data }),
  archive: (id: string, reason?: string) =>
    api.put('/api/customers', { id, status: 'ARCHIVED', archivedReason: reason }),
  restore: (id: string) =>
    api.put('/api/customers', { id, status: 'ACTIVE' }),
};

export const applicationApi = {
  getAll: (params?: any) => api.get('/api/applications', params),
  getById: (id: string) => api.get(`/api/applications/${id}`),
  create: (data: any) => api.post('/api/applications', data),
  update: (id: string, data: any) => api.put(`/api/applications/${id}`, data),
  updateStatus: (id: string, status: string, remarks?: string) =>
    api.post(`/api/applications/${id}/status`, { status, remarks }),
  submitFormResponse: (id: string, data: any) =>
    api.post(`/api/applications/${id}/form-response`, data),
};

export const loanApi = {
  getAll: (params?: any) => api.get('/api/loans', params),
  getById: (id: string) => api.get(`/api/loans/${id}`),
  getSchedule: (id: string) => api.get(`/api/loans/${id}/schedule`),
  getCharges: (id: string) => api.get(`/api/loans/${id}/charges`),
  getHistory: (id: string) => api.get(`/api/loans/${id}/history`),
  getRepaymentSetup: (id: string) => api.get(`/api/loans/${id}/repayment-setup`),
};

export const repaymentApi = {
  getAll: (params?: any) => api.get('/api/repayments', params),
  recordRepayment: (data: any) => api.post('/api/repayments', data),
};

export const disbursementApi = {
  getAll: (params?: any) => api.get('/api/disbursements', params),
  getBatches: () => api.get('/api/disbursements/batches'),
  createBatch: (data: any) => api.post('/api/disbursements/batches', data),
  disburseBatch: (batchId: string, data: any) =>
    api.post(`/api/disbursements/batches/${batchId}/disburse`, data),
};

export const approvalApi = {
  getAll: (params?: any) => api.get('/api/approvals', params),
  actOnApproval: (id: string, action: 'APPROVE' | 'REJECT' | 'SEND_BACK', remarks?: string) =>
    api.post(`/api/approvals/${id}/action`, { action, remarks }),
};

export const sanctionApi = {
  getAll: (params?: any) => api.get('/api/sanctions', params),
  generateSanction: (data: any) => api.post('/api/sanctions', data),
  acceptSanction: (id: string, termsAccepted: boolean) =>
    api.post(`/api/sanctions/${id}/accept`, { termsAccepted }),
};

export const creditAssessmentApi = {
  getForApplication: (applicationId: string) =>
    api.get(`/api/applications/${applicationId}/credit-assessment`),
  saveAssessment: (applicationId: string, data: any) =>
    api.post(`/api/applications/${applicationId}/credit-assessment`, data),
};

export const kycApi = {
  getAll: (params?: any) => api.get('/api/kyc', params),
  updateStatus: (id: string, status: string, remarks?: string) =>
    api.put('/api/kyc', { id, status, remarks }),
};

export const documentApi = {
  getAll: (params?: any) => api.get('/api/documents', params),
  upload: (data: any) => api.post('/api/documents', data),
  updateStatus: (id: string, status: string, remarks?: string) =>
    api.put('/api/documents', { id, status, remarks }),
};

export const recoveryApi = {
  getAll: (params?: any) => api.get('/api/recovery', params),
  getLegalCases: (params?: any) => api.get('/api/legal-cases', params),
  getLegalNotices: (params?: any) => api.get('/api/legal-notices', params),
  createSettlement: (data: any) => api.post('/api/recovery/settlements', data),
};

export const restructuringApi = {
  getAll: (params?: any) => api.get('/api/restructuring', params),
  createProposal: (data: any) => api.post('/api/restructuring', data),
  actOnProposal: (id: string, action: string, remarks?: string) =>
    api.post(`/api/restructuring/${id}/action`, { action, remarks }),
};

export const chargeApi = {
  getConfigs: () => api.get('/api/charges/configs'),
  createConfig: (data: any) => api.post('/api/charges/configs', data),
  applyCharge: (data: any) => api.post('/api/charges/apply', data),
  waiveCharge: (id: string, reason?: string) =>
    api.post(`/api/charges/${id}/waive`, { reason }),
};

export const closureApi = {
  getAll: (params?: any) => api.get('/api/closures', params),
  getQuote: (loanId: string) => api.get('/api/closures/quote', { loanId }),
  requestClosure: (data: any) => api.post('/api/closures', data),
  getNocs: (params?: any) => api.get('/api/noc', params),
  issueNoc: (closureId: string) => api.post('/api/noc/issue', { closureId }),
};

export const loanProductApi = {
  getAll: (params?: any) => api.get('/api/loan-products', params),
  create: (data: any) => api.post('/api/loan-products', data),
  getFormBuilder: (id: string) => api.get(`/api/loan-products/${id}/form-builder`),
  saveFormDraft: (id: string, data: any) =>
    api.post(`/api/loan-products/${id}/form-builder`, data),
  publishFormVersion: (id: string, data: any) =>
    api.post(`/api/loan-products/${id}/publish`, data),
};

export const systemApi = {
  getUsers: (params?: any) => api.get('/api/users', params),
  createUser: (data: any) => api.post('/api/users', data),
  updateUser: (id: string, data: any) => api.put('/api/users', { id, ...data }),
  getRoles: (params?: any) => api.get('/api/roles', params),
  createRole: (data: any) => api.post('/api/roles', data),
  updateRole: (id: string, data: any) => api.put('/api/roles', { id, ...data }),
  getBranches: (params?: any) => api.get('/api/branches', params),
  createBranch: (data: any) => api.post('/api/branches', data),
  updateBranch: (id: string, data: any) => api.put('/api/branches', { id, ...data }),
  getAuditLogs: (params?: any) => api.get('/api/audit', params),
};
