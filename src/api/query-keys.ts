export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  products: {
    all: () => ['products'] as const,
    list: (filters: Record<string, unknown>) => ['products', 'list', filters] as const,
    detail: (id: string) => ['products', id] as const,
    search: (query: string) => ['products', 'search', query] as const,
  },
  bills: {
    all: () => ['bills'] as const,
    list: (filters: Record<string, unknown>) => ['bills', 'list', filters] as const,
    detail: (id: string) => ['bills', id] as const,
    print: (id: string) => ['bills', id, 'print'] as const,
  },
  customers: {
    all: () => ['customers'] as const,
    list: (filters: Record<string, unknown>) => ['customers', 'list', filters] as const,
    detail: (id: string) => ['customers', id] as const,
    search: (phone: string) => ['customers', 'search', phone] as const,
    ledger: (id: string) => ['customers', id, 'ledger'] as const,
  },
  suppliers: {
    all: () => ['suppliers'] as const,
    list: (filters: Record<string, unknown>) => ['suppliers', 'list', filters] as const,
    detail: (id: string) => ['suppliers', id] as const,
    ledger: (id: string) => ['suppliers', id, 'ledger'] as const,
    products: (id: string) => ['suppliers', id, 'products'] as const,
  },
  purchases: {
    all: () => ['purchases'] as const,
    list: (filters: Record<string, unknown>) => ['purchases', 'list', filters] as const,
    detail: (id: string) => ['purchases', id] as const,
  },
  stock: {
    all: () => ['stock'] as const,
    list: (filters: Record<string, unknown>) => ['stock', 'list', filters] as const,
    detail: (productId: string) => ['stock', productId] as const,
    history: (productId: string) => ['stock', productId, 'history'] as const,
  },
  categories: {
    all: () => ['categories'] as const,
    subTypes: (categoryId: string) => ['categories', categoryId, 'sub-types'] as const,
  },
  brands: {
    all: () => ['brands'] as const,
  },
  sizeSystems: {
    all: () => ['size-systems'] as const,
  },
  cashRegister: {
    current: () => ['cash-register', 'current'] as const,
    detail: (id: string) => ['cash-register', id] as const,
    history: () => ['cash-register', 'history'] as const,
  },
  dashboard: () => ['dashboard'] as const,
  settings: () => ['settings'] as const,
  storeSettings: () => ['settings', 'store'] as const,
  users: {
    all: () => ['users'] as const,
    detail: (id: string) => ['users', id] as const,
  },
  labels: {
    templates: () => ['labels', 'templates'] as const,
  },
  purchaseOrders: {
    all: () => ['purchase-orders'] as const,
    list: (filters: Record<string, unknown>) => ['purchase-orders', 'list', filters] as const,
    detail: (id: string) => ['purchase-orders', id] as const,
  },
  purchaseReturns: {
    all: () => ['purchase-returns'] as const,
    list: (filters: Record<string, unknown>) => ['purchase-returns', 'list', filters] as const,
    detail: (id: string) => ['purchase-returns', id] as const,
  },
  stockAdjustments: {
    all: () => ['stock-adjustments'] as const,
    list: (filters: Record<string, unknown>) =>
      ['stock-adjustments', 'list', filters] as const,
  },
  stockAudits: {
    all: () => ['stock-audits'] as const,
    list: (filters: Record<string, unknown>) => ['stock-audits', 'list', filters] as const,
    detail: (id: string) => ['stock-audits', id] as const,
  },
  expenses: {
    all: () => ['expenses'] as const,
    list: (filters: Record<string, unknown>) => ['expenses', 'list', filters] as const,
    detail: (id: string) => ['expenses', id] as const,
    categories: () => ['expenses', 'categories'] as const,
  },
  sales: {
    overview: (params: Record<string, unknown>) => ['sales', 'overview', params] as const,
  },
  gst: {
    dashboard: (params: Record<string, unknown>) => ['gst', 'dashboard', params] as const,
    returnData: (returnType: string, params: Record<string, unknown>) =>
      ['gst', returnType, params] as const,
    itc: (filters: Record<string, unknown>) => ['gst', 'itc', filters] as const,
  },
  pnl: {
    data: (params: Record<string, unknown>) => ['pnl', params] as const,
  },
  reports: {
    data: (type: string, filters: Record<string, unknown>) =>
      ['reports', type, filters] as const,
  },
  audit: {
    all: () => ['audit'] as const,
    list: (filters: Record<string, unknown>) => ['audit', 'list', filters] as const,
  },
  returns: {
    returnable: (billId: string) => ['returns', 'returnable', billId] as const,
  },
  notifications: {
    unreadCount: () => ['notifications', 'unread-count'] as const,
    list: (filters: Record<string, unknown>) => ['notifications', 'list', filters] as const,
  },
  admin: {
    dashboard: () => ['admin', 'dashboard'] as const,
    tenants: {
      all: () => ['admin', 'tenants'] as const,
      list: (filters: Record<string, unknown>) => ['admin', 'tenants', 'list', filters] as const,
      detail: (id: string) => ['admin', 'tenants', id] as const,
      usage: (id: string) => ['admin', 'tenants', id, 'usage'] as const,
    },
  },
}
