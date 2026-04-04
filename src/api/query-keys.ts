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
}
