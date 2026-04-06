import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// ── Schema ──

export interface CatalogItem {
  variantId: string;
  productId: string;
  productName: string;
  variantDescription: string;
  sku: string;
  barcode: string;
  mrp: number;
  costPrice: number;
  availableQuantity: number;
  productDiscountPct: number;
  gstRate: number;
  hsnCode: string | null;
  version: number;
}

export interface OfflineCustomer {
  id: string;
  name: string;
  phone: string;
  outstandingBalance: number;
}

export interface OfflineBill {
  clientId: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  items: {
    variantId: string;
    productName: string;
    variantDescription: string;
    quantity: number;
    mrp: number;
    costPrice: number;
    productDiscountPct: number;
    gstRate: number;
    hsnCode: string | null;
    version: number;
  }[];
  billDiscountPct: number;
  bargainAdjustment: number;
  finalPrice: number | null;
  payments: { method: string; amount: number }[];
  newCustomer: { name: string; phone: string } | null;
  createdAt: string;
}

interface OfflineDBSchema extends DBSchema {
  catalog: {
    key: string;
    value: CatalogItem;
    indexes: {
      barcode: string;
      sku: string;
      productName: string;
    };
  };
  customers: {
    key: string;
    value: OfflineCustomer;
    indexes: {
      phone: string;
    };
  };
  pendingBills: {
    key: string;
    value: OfflineBill;
  };
  settings: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'inventrack-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<OfflineDBSchema>> | null = null;

export function getOfflineDB(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Catalog store
        if (!db.objectStoreNames.contains('catalog')) {
          const catalog = db.createObjectStore('catalog', { keyPath: 'variantId' });
          catalog.createIndex('barcode', 'barcode', { unique: true });
          catalog.createIndex('sku', 'sku', { unique: true });
          catalog.createIndex('productName', 'productName', { unique: false });
        }

        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customers = db.createObjectStore('customers', { keyPath: 'id' });
          customers.createIndex('phone', 'phone', { unique: true });
        }

        // Pending bills store
        if (!db.objectStoreNames.contains('pendingBills')) {
          db.createObjectStore('pendingBills', { keyPath: 'clientId' });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// ── Helper functions ──

export async function getCatalogByBarcode(barcode: string): Promise<CatalogItem | undefined> {
  const db = await getOfflineDB();
  return db.getFromIndex('catalog', 'barcode', barcode);
}

export async function searchCatalog(query: string, limit = 20): Promise<CatalogItem[]> {
  const db = await getOfflineDB();
  const all = await db.getAll('catalog');
  const q = query.toLowerCase();
  return all
    .filter(
      (item) =>
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.barcode.includes(q),
    )
    .slice(0, limit);
}

export async function searchOfflineCustomers(query: string, limit = 20): Promise<OfflineCustomer[]> {
  const db = await getOfflineDB();
  const all = await db.getAll('customers');
  const q = query.toLowerCase();
  return all
    .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
    .slice(0, limit);
}

export async function savePendingBill(bill: OfflineBill): Promise<void> {
  const db = await getOfflineDB();
  await db.put('pendingBills', bill);
}

export async function getAllPendingBills(): Promise<OfflineBill[]> {
  const db = await getOfflineDB();
  return db.getAll('pendingBills');
}

export async function deletePendingBill(clientId: string): Promise<void> {
  const db = await getOfflineDB();
  await db.delete('pendingBills', clientId);
}

export async function getPendingBillCount(): Promise<number> {
  const db = await getOfflineDB();
  return db.count('pendingBills');
}

export async function upsertCatalogItems(items: CatalogItem[]): Promise<void> {
  const db = await getOfflineDB();
  const tx = db.transaction('catalog', 'readwrite');
  for (const item of items) {
    await tx.store.put(item);
  }
  await tx.done;
}

export async function upsertCustomers(customers: OfflineCustomer[]): Promise<void> {
  const db = await getOfflineDB();
  const tx = db.transaction('customers', 'readwrite');
  for (const c of customers) {
    await tx.store.put(c);
  }
  await tx.done;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await getOfflineDB();
  await db.put('settings', { key, ...((typeof value === 'object' && value !== null) ? value : { value }) } as any);
}

export async function getSetting<T = unknown>(key: string): Promise<T | undefined> {
  const db = await getOfflineDB();
  const result = await db.get('settings', key);
  return result as T | undefined;
}
