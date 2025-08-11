import { Game } from "@/app/types/game";

export interface SyncQueueItem {
  id: string;
  url: string;
  method: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private readonly dbName = "scorekeeperDB";
  private readonly version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create games store
        if (!db.objectStoreNames.contains("games")) {
          const gamesStore = db.createObjectStore("games", { keyPath: "id" });
          gamesStore.createIndex("userId", "userId", { unique: false });
          gamesStore.createIndex("lastPlayed", "lastPlayed", { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains("syncQueue")) {
          const syncStore = db.createObjectStore("syncQueue", {
            keyPath: "id",
          });
          syncStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        // Create user settings store
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }

        // Create cache store for API responses
        if (!db.objectStoreNames.contains("apiCache")) {
          const cacheStore = db.createObjectStore("apiCache", {
            keyPath: "url",
          });
          cacheStore.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error("Database not initialized. Call init() first.");
    }
    return this.db;
  }

  // Games management
  async saveGame(game: Game): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["games"], "readwrite");
      const store = transaction.objectStore("games");

      // Ensure dates are properly serialized
      const gameToSave = {
        ...game,
        createdAt: game.createdAt.toISOString(),
        lastPlayed: game.lastPlayed.toISOString(),
      };

      const request = store.put(gameToSave);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getGame(gameId: string): Promise<Game | null> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["games"], "readonly");
      const store = transaction.objectStore("games");
      const request = store.get(gameId);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Convert date strings back to Date objects
          resolve({
            ...result,
            createdAt: new Date(result.createdAt),
            lastPlayed: new Date(result.lastPlayed),
          });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getAllGames(userId?: string): Promise<Game[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["games"], "readonly");
      const store = transaction.objectStore("games");

      let request: IDBRequest;
      if (userId) {
        const index = store.index("userId");
        request = index.getAll(userId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const games = (request.result || []).map((game: any) => ({
          ...game,
          createdAt: new Date(game.createdAt),
          lastPlayed: new Date(game.lastPlayed),
        })) as Game[];

        // Sort by lastPlayed descending
        games.sort(
          (a: Game, b: Game) => b.lastPlayed.getTime() - a.lastPlayed.getTime()
        );
        resolve(games);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteGame(gameId: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["games"], "readwrite");
      const store = transaction.objectStore("games");
      const request = store.delete(gameId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue management
  async addToSyncQueue(
    item: Omit<SyncQueueItem, "id" | "timestamp" | "retryCount">
  ): Promise<string> {
    const db = this.ensureDB();
    const syncItem: SyncQueueItem = {
      ...item,
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["syncQueue"], "readwrite");
      const store = transaction.objectStore("syncQueue");
      const request = store.add(syncItem);

      request.onsuccess = () => resolve(syncItem.id);
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["syncQueue"], "readonly");
      const store = transaction.objectStore("syncQueue");
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result || [];
        // Sort by timestamp
        items.sort((a, b) => a.timestamp - b.timestamp);
        resolve(items);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncQueueItem(
    id: string,
    updates: Partial<SyncQueueItem>
  ): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["syncQueue"], "readwrite");
      const store = transaction.objectStore("syncQueue");

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          const updatedItem = { ...item, ...updates };
          const putRequest = store.put(updatedItem);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error("Sync queue item not found"));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["syncQueue"], "readwrite");
      const store = transaction.objectStore("syncQueue");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["syncQueue"], "readwrite");
      const store = transaction.objectStore("syncQueue");
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Settings management
  async setSetting(key: string, value: any): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["settings"], "readwrite");
      const store = transaction.objectStore("settings");
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key: string): Promise<any> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["settings"], "readonly");
      const store = transaction.objectStore("settings");
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // API Cache management
  async cacheApiResponse(
    url: string,
    data: any,
    ttl: number = 5 * 60 * 1000
  ): Promise<void> {
    const db = this.ensureDB();
    const cacheItem = {
      url,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["apiCache"], "readwrite");
      const store = transaction.objectStore("apiCache");
      const request = store.put(cacheItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedApiResponse(url: string): Promise<any | null> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["apiCache"], "readonly");
      const store = transaction.objectStore("apiCache");
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.expiresAt > Date.now()) {
          resolve(result.data);
        } else {
          if (result) {
            // Clean up expired cache entry
            this.clearCachedApiResponse(url);
          }
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clearCachedApiResponse(url: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["apiCache"], "readwrite");
      const store = transaction.objectStore("apiCache");
      const request = store.delete(url);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpiredCache(): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["apiCache"], "readwrite");
      const store = transaction.objectStore("apiCache");
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const value = cursor.value;
          if (value.expiresAt <= Date.now()) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
const indexedDBManager = new IndexedDBManager();

export default indexedDBManager;
