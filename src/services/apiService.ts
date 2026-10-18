// API Service for communicating with backend REST endpoints

const TOKEN_KEY = 'maqsuud_ict_token';
const OFFLINE_QUEUE_KEY = 'maqsuud_ict_offline_queue';
const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  (window as Window & { huggingface?: { variables?: Record<string, string> } }).huggingface?.variables?.API_BASE_URL ||
  'https://maqsuud-ict-pos-api-proxy.sharmacadenuur2017.workers.dev'
).replace(/\/+$/, '');

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith('offline_cache_')) localStorage.removeItem(key);
    }
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    // Cache successful GET results for offline resilience
    const method = (options.method || 'GET').toUpperCase();
    if (method === 'GET') {
      try {
        localStorage.setItem(`offline_cache_${endpoint}`, JSON.stringify(data));
      } catch (e) {
        // quota exceeded ignore
      }
    } else {
      // Mutations can affect several screens (e.g. checkout changes sales,
      // stock, customer balances, dashboard metrics, and reports).
      for (let index = localStorage.length - 1; index >= 0; index -= 1) {
        const key = localStorage.key(index);
        if (key?.startsWith('offline_cache_')) localStorage.removeItem(key);
      }
      window.dispatchEvent(new CustomEvent('maqsuud:data-changed', { detail: { endpoint } }));
    }

    return data;
  } catch (err: any) {
    // If network error / offline, check offline cache
    if (!options.method || options.method.toUpperCase() === 'GET') {
      const cached = localStorage.getItem(`offline_cache_${endpoint}`);
      if (cached && !navigator.onLine) {
        console.warn(`[Offline Mode] Using cached data for ${endpoint}`);
        return JSON.parse(cached);
      }
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  biometricLogin: (biometricToken?: string) =>
    request<any>('/api/auth/biometric', { method: 'POST', body: JSON.stringify({ biometricToken }) }),
  getMe: () => request<any>('/api/auth/me'),
  updateProfile: (profile: any) =>
    request<any>('/api/auth/profile', { method: 'PUT', body: JSON.stringify(profile) }),
  changePassword: (data: any) =>
    request<any>('/api/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  deactivateAccount: (data: any) =>
    request<any>('/api/auth/deactivate', { method: 'POST', body: JSON.stringify(data) }),

  // Dashboard
  getDashboardMetrics: (period: 'day' | 'week' | 'month' | 'year' = 'week') =>
    request<any>(`/api/dashboard?period=${period}`),

  // Products & QR
  getProducts: (search?: string, category?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    return request<any>(`/api/products?${params.toString()}`);
  },
  getProductById: (id: string) => request<any>(`/api/products/${id}`),
  createProduct: (data: any) => request<any>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => request<any>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request<any>(`/api/products/${id}`, { method: 'DELETE' }),
  importProducts: (items: any[]) => request<any>('/api/products/import', { method: 'POST', body: JSON.stringify({ items }) }),
  scanQRCode: (code: string) => request<any>('/api/qr/scan', { method: 'POST', body: JSON.stringify({ code }) }),

  // Categories
  getCategories: () => request<any>('/api/categories'),
  createCategory: (data: any) => request<any>('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) => request<any>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => request<any>(`/api/categories/${id}`, { method: 'DELETE' }),

  // Customers & Debts & Payments
  getCustomers: (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<any>(`/api/customers${params}`);
  },
  getCustomerById: (id: string) => request<any>(`/api/customers/${id}`),
  createCustomer: (data: any) => request<any>('/api/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: any) => request<any>(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id: string) => request<any>(`/api/customers/${id}`, { method: 'DELETE' }),
  recordCustomerPayment: (data: any) => request<any>('/api/customer-payments', { method: 'POST', body: JSON.stringify(data) }),

  // Suppliers & Debts & Payments
  getSuppliers: (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<any>(`/api/suppliers${params}`);
  },
  getSupplierById: (id: string) => request<any>(`/api/suppliers/${id}`),
  createSupplier: (data: any) => request<any>('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: string, data: any) => request<any>(`/api/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id: string) => request<any>(`/api/suppliers/${id}`, { method: 'DELETE' }),
  recordSupplierPayment: (data: any) => request<any>('/api/supplier-payments', { method: 'POST', body: JSON.stringify(data) }),

  // POS Checkout & Invoices
  checkoutPOS: (data: any) => request<any>('/api/pos/checkout', { method: 'POST', body: JSON.stringify(data) }),
  getInvoices: (params: { search?: string; status?: string; customerId?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.status) q.append('status', params.status);
    if (params.customerId) q.append('customerId', params.customerId);
    return request<any>(`/api/invoices?${q.toString()}`);
  },
  getInvoiceById: (id: string) => request<any>(`/api/invoices/${id}`),
  refundInvoice: (id: string, reason?: string) =>
    request<any>(`/api/invoices/${id}/refund`, { method: 'POST', body: JSON.stringify({ reason }) }),
  deleteInvoice: (id: string) => request<any>(`/api/invoices/${id}`, { method: 'DELETE' }),

  // Purchases
  getPurchases: () => request<any>('/api/purchases'),
  createPurchase: (data: any) => request<any>('/api/purchases', { method: 'POST', body: JSON.stringify(data) }),
  receivePurchaseStock: (id: string) => request<any>(`/api/purchases/${id}/receive`, { method: 'POST' }),

  // Inventory & Stock Adjustments
  getStockMovements: () => request<any>('/api/inventory/movements'),
  adjustStock: (data: any) => request<any>('/api/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getSalesReport: (filters: any = {}) => {
    const q = new URLSearchParams(filters);
    return request<any>(`/api/reports/sales?${q.toString()}`);
  },
  getPurchaseReport: (filters: any = {}) => {
    const q = new URLSearchParams(filters);
    return request<any>(`/api/reports/purchases?${q.toString()}`);
  },
  getInventoryReport: (category?: string) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return request<any>(`/api/reports/inventory${q}`);
  },
  getCOGSReport: (filters: any = {}) => {
    const q = new URLSearchParams(filters);
    return request<any>(`/api/reports/cogs?${q.toString()}`);
  },
  getCustomerBalanceReport: () => request<any>('/api/reports/customer-balances'),
  getSupplierBalanceReport: () => request<any>('/api/reports/supplier-balances'),

  // Settings & Subscriptions & Users
  getBusinessSettings: () => request<any>('/api/settings/business'),
  updateBusinessSettings: (data: any) => request<any>('/api/settings/business', { method: 'PUT', body: JSON.stringify(data) }),
  updateCurrency: (currency: string, symbol?: string) =>
    request<any>('/api/settings/currency', { method: 'PUT', body: JSON.stringify({ currency, symbol }) }),
  getSubscriptionPlans: () => request<any>('/api/subscriptions/plans'),
  upgradeSubscription: (planId: string, transactionRef?: string) =>
    request<any>('/api/subscriptions/upgrade', { method: 'POST', body: JSON.stringify({ planId, transactionRef }) }),
  getUsers: () => request<any>('/api/users'),
  createUser: (data: any) => request<any>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => request<any>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateUserStatus: (id: string, isActive: boolean) =>
    request<any>(`/api/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ isActive }) }),
  deleteUser: (id: string) => request<any>(`/api/users/${id}`, { method: 'DELETE' }),
  getRoles: () => request<any>('/api/roles'),
  clearAllBusinessData: () => request<any>('/api/admin/store-data', {
    method: 'DELETE',
    body: JSON.stringify({ confirmation: 'DELETE ALL BUSINESS DATA' }),
  }),
};
