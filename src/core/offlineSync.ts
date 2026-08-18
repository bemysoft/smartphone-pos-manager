/**
 * Offline Synchronization & Resilience Manager for NexusPOS.
 * Handles queue management, offline retry policies, and syncing with backend Firestore/Express APIs.
 */

export interface OfflineSyncQueueItem {
  id: string;
  type: "TRANSACTION" | "STOCK_MUTATION" | "BUYBACK" | "SERVICE_ORDER";
  payload: any;
  createdAt: string;
  retryCount: number;
  lastError?: string;
  tenantId: string;
}

const OFFLINE_QUEUE_KEY = "nexus_pos_offline_sync_queue";

export class OfflineSyncManager {
  private static listeners: ((isOnline: boolean, queueLength: number) => void)[] = [];

  /**
   * Initializes network status listeners
   */
  static init(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => {
      this.notifyListeners();
    });

    window.addEventListener("offline", () => {
      this.notifyListeners();
    });
  }

  static isOnline(): boolean {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  }

  static getQueue(): OfflineSyncQueueItem[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static enqueue(item: Omit<OfflineSyncQueueItem, "id" | "createdAt" | "retryCount">): OfflineSyncQueueItem {
    const queue = this.getQueue();
    const newItem: OfflineSyncQueueItem = {
      ...item,
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    queue.push(newItem);
    this.saveQueue(queue);
    this.notifyListeners();
    return newItem;
  }

  static dequeue(id: string): void {
    const queue = this.getQueue().filter((item) => item.id !== id);
    this.saveQueue(queue);
    this.notifyListeners();
  }

  static updateItemError(id: string, errorMessage: string): void {
    const queue = this.getQueue().map((item) => {
      if (item.id === id) {
        return {
          ...item,
          retryCount: item.retryCount + 1,
          lastError: errorMessage,
        };
      }
      return item;
    });
    this.saveQueue(queue);
    this.notifyListeners();
  }

  static clearQueue(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      this.notifyListeners();
    }
  }

  private static saveQueue(queue: OfflineSyncQueueItem[]): void {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      } catch (err) {
        console.error("[OfflineSync] Failed to save queue to localStorage", err);
      }
    }
  }

  static subscribe(listener: (isOnline: boolean, queueLength: number) => void): () => void {
    this.listeners.push(listener);
    listener(this.isOnline(), this.getQueue().length);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners(): void {
    const online = this.isOnline();
    const len = this.getQueue().length;
    for (const listener of this.listeners) {
      try {
        listener(online, len);
      } catch (err) {
        console.error("[OfflineSync] Error in listener", err);
      }
    }
  }
}
