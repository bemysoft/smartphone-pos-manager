import { getResolvedTenantId } from './api';

/**
 * Tenant-Isolated IndexedDB Local Storage Service
 * Provides partitioned client-side key-value & record storage per tenant,
 * guaranteeing offline isolation between stores.
 */

const DB_NAME = 'NexusPosMultiTenantDB';
const DB_VERSION = 2;

export interface TenantStorageRecord<T = any> {
  id: string;
  tenantId: string;
  storeName: string;
  data: T;
  updatedAt: string;
}

class TenantIndexedDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported in current environment'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 1. Generic Key-Value Store partitioned by [tenantId, storeName, key]
        if (!db.objectStoreNames.contains('tenant_kv')) {
          const kvStore = db.createObjectStore('tenant_kv', { keyPath: ['tenantId', 'key'] });
          kvStore.createIndex('tenantId', 'tenantId', { unique: false });
        }

        // 2. Collection Records Store partitioned by tenantId and collection
        if (!db.objectStoreNames.contains('tenant_records')) {
          const recStore = db.createObjectStore('tenant_records', { keyPath: ['tenantId', 'storeName', 'id'] });
          recStore.createIndex('tenantId', 'tenantId', { unique: false });
          recStore.createIndex('tenantStore', ['tenantId', 'storeName'], { unique: false });
        }

        // 3. Offline Pending Sync Queue (transactions, inventory updates to sync when online)
        if (!db.objectStoreNames.contains('pending_sync_queue')) {
          const syncStore = db.createObjectStore('pending_sync_queue', { keyPath: 'queueId', autoIncrement: true });
          syncStore.createIndex('tenantId', 'tenantId', { unique: false });
          syncStore.createIndex('status', 'status', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // Get active tenant ID dynamically
  private getTenantId(): string {
    return getResolvedTenantId() || 'default';
  }

  /**
   * Set a key-value pair under the active tenant's partition
   */
  async setItem<T = any>(key: string, value: T): Promise<void> {
    const db = await this.initDB();
    const tenantId = this.getTenantId();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tenant_kv', 'readwrite');
      const store = tx.objectStore('tenant_kv');
      const record = {
        tenantId,
        key,
        value,
        updatedAt: new Date().toISOString()
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Get a key-value item strictly belonging to the active tenant
   */
  async getItem<T = any>(key: string, fallback: T | null = null): Promise<T | null> {
    try {
      const db = await this.initDB();
      const tenantId = this.getTenantId();
      return new Promise((resolve) => {
        const tx = db.transaction('tenant_kv', 'readonly');
        const store = tx.objectStore('tenant_kv');
        const req = store.get([tenantId, key]);
        req.onsuccess = () => {
          if (req.result && req.result.value !== undefined) {
            resolve(req.result.value as T);
          } else {
            resolve(fallback);
          }
        };
        req.onerror = () => resolve(fallback);
      });
    } catch {
      return fallback;
    }
  }

  /**
   * Store a collection record (e.g. products, transactions) with tenant isolation
   */
  async putRecord<T = any>(storeName: string, id: string, data: T): Promise<void> {
    const db = await this.initDB();
    const tenantId = this.getTenantId();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tenant_records', 'readwrite');
      const store = tx.objectStore('tenant_records');
      const record: TenantStorageRecord<T> = {
        tenantId,
        storeName,
        id,
        data: {
          ...data,
          tenantId // Inject tenantId inside data payload
        },
        updatedAt: new Date().toISOString()
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Fetch all records in a collection for the active tenant
   */
  async getAllRecords<T = any>(storeName: string): Promise<T[]> {
    try {
      const db = await this.initDB();
      const tenantId = this.getTenantId();
      return new Promise((resolve) => {
        const tx = db.transaction('tenant_records', 'readonly');
        const store = tx.objectStore('tenant_records');
        const index = store.index('tenantStore');
        const req = index.getAll(IDBKeyRange.only([tenantId, storeName]));
        
        req.onsuccess = () => {
          const results = (req.result || []).map((rec: TenantStorageRecord<T>) => rec.data);
          resolve(results);
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  /**
   * Delete a collection record for the active tenant
   */
  async deleteRecord(storeName: string, id: string): Promise<void> {
    const db = await this.initDB();
    const tenantId = this.getTenantId();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tenant_records', 'readwrite');
      const store = tx.objectStore('tenant_records');
      const req = store.delete([tenantId, storeName, id]);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Enqueue a pending mutation for background synchronization
   */
  async enqueueSyncMutation(action: string, entityType: string, payload: any): Promise<number> {
    const db = await this.initDB();
    const tenantId = this.getTenantId();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_sync_queue', 'readwrite');
      const store = tx.objectStore('pending_sync_queue');
      const item = {
        tenantId,
        action,
        entityType,
        payload: {
          ...payload,
          tenantId
        },
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      const req = store.add(item);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Clear all local storage records for a specific tenant (e.g. on logout / switch)
   */
  async clearTenantData(tenantIdToClear?: string): Promise<void> {
    const targetTenant = tenantIdToClear || this.getTenantId();
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['tenant_kv', 'tenant_records'], 'readwrite');
      
      // Delete from tenant_records
      const recStore = tx.objectStore('tenant_records');
      const recIndex = recStore.index('tenantId');
      const recReq = recIndex.openCursor(IDBKeyRange.only(targetTenant));
      recReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const tenantIndexedDB = new TenantIndexedDB();
