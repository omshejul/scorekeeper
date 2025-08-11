import { Game, Player } from "@/app/types/game";
import indexedDBManager from "./indexedDB";

export interface CreateGameParams {
  id: string;
  name: string;
  players: Player[];
}

class OfflineAPI {
  private isOnline: boolean = true;

  constructor() {
    // Initialize online status
    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine;

      // Listen for online/offline events
      window.addEventListener("online", this.handleOnline.bind(this));
      window.addEventListener("offline", this.handleOffline.bind(this));
    }
  }

  private handleOnline(): void {
    this.isOnline = true;
    console.log("App is now online");
    this.syncPendingChanges();
  }

  private handleOffline(): void {
    this.isOnline = false;
    console.log("App is now offline");
  }

  async init(): Promise<void> {
    await indexedDBManager.init();
  }

  // Game Management
  async fetchGames(userId?: string): Promise<Game[]> {
    try {
      if (this.isOnline) {
        // Try to fetch from server first
        const response = await fetch("/api/games");

        if (response.ok) {
          const games = await response.json();
          const gamesWithDates = games.map((game: any) => ({
            ...game,
            createdAt: new Date(game.createdAt),
            lastPlayed: new Date(game.lastPlayed),
          }));

          // Cache games in IndexedDB
          for (const game of gamesWithDates) {
            await indexedDBManager.saveGame(game);
          }

          return gamesWithDates;
        }
      }
    } catch (error) {
      console.log("Failed to fetch from server, using offline data:", error);
    }

    // Fallback to offline data
    return await indexedDBManager.getAllGames(userId);
  }

  async fetchGame(gameId: string): Promise<Game> {
    try {
      if (this.isOnline) {
        // Try to fetch from server first
        const response = await fetch(`/api/games/${gameId}`);

        if (response.ok) {
          const game = await response.json();
          const gameWithDates = {
            ...game,
            createdAt: new Date(game.createdAt),
            lastPlayed: new Date(game.lastPlayed),
          };

          // Cache in IndexedDB
          await indexedDBManager.saveGame(gameWithDates);

          return gameWithDates;
        }
      }
    } catch (error) {
      console.log(
        "Failed to fetch game from server, using offline data:",
        error
      );
    }

    // Fallback to offline data
    const game = await indexedDBManager.getGame(gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    return game;
  }

  async createGame(params: CreateGameParams): Promise<Game> {
    const game: Game = {
      id: params.id,
      name: params.name,
      players: params.players,
      createdAt: new Date(),
      lastPlayed: new Date(),
    };

    // Always save locally first
    await indexedDBManager.saveGame(game);

    if (this.isOnline) {
      try {
        // Try to sync with server
        const response = await fetch("/api/games", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: game.id,
            name: game.name,
            players: game.players,
          }),
        });

        if (response.ok) {
          const serverGame = await response.json();
          const gameWithDates = {
            ...serverGame,
            createdAt: new Date(serverGame.createdAt),
            lastPlayed: new Date(serverGame.lastPlayed),
          };

          // Update local copy with server data
          await indexedDBManager.saveGame(gameWithDates);
          return gameWithDates;
        } else {
          // If server request fails, queue for sync
          await this.queueForSync("POST", "/api/games", {
            id: game.id,
            name: game.name,
            players: game.players,
          });
        }
      } catch (error) {
        console.log("Failed to create game on server, queued for sync:", error);
        // Queue for sync when online
        await this.queueForSync("POST", "/api/games", {
          id: game.id,
          name: game.name,
          players: game.players,
        });
      }
    } else {
      // Queue for sync when online
      await this.queueForSync("POST", "/api/games", {
        id: game.id,
        name: game.name,
        players: game.players,
      });
    }

    return game;
  }

  async updateGame(gameId: string, updates: Partial<Game>): Promise<Game> {
    // Get current game
    let game = await indexedDBManager.getGame(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Apply updates
    const updatedGame: Game = {
      ...game,
      ...updates,
      lastPlayed: new Date(),
    };

    // Save locally first
    await indexedDBManager.saveGame(updatedGame);

    if (this.isOnline) {
      try {
        // Try to sync with server
        const response = await fetch(`/api/games/${gameId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        });

        if (response.ok) {
          const serverGame = await response.json();
          const gameWithDates = {
            ...serverGame,
            createdAt: new Date(serverGame.createdAt),
            lastPlayed: new Date(serverGame.lastPlayed),
          };

          // Update local copy with server response
          await indexedDBManager.saveGame(gameWithDates);
          return gameWithDates;
        } else {
          // If server request fails, queue for sync
          await this.queueForSync("PUT", `/api/games/${gameId}`, updates);
        }
      } catch (error) {
        console.log("Failed to update game on server, queued for sync:", error);
        // Queue for sync when online
        await this.queueForSync("PUT", `/api/games/${gameId}`, updates);
      }
    } else {
      // Queue for sync when online
      await this.queueForSync("PUT", `/api/games/${gameId}`, updates);
    }

    return updatedGame;
  }

  async deleteGame(gameId: string): Promise<void> {
    // Delete locally first
    await indexedDBManager.deleteGame(gameId);

    if (this.isOnline) {
      try {
        // Try to delete from server
        const response = await fetch(`/api/games/${gameId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          // If server request fails, queue for sync
          await this.queueForSync("DELETE", `/api/games/${gameId}`);
        }
      } catch (error) {
        console.log(
          "Failed to delete game from server, queued for sync:",
          error
        );
        // Queue for sync when online
        await this.queueForSync("DELETE", `/api/games/${gameId}`);
      }
    } else {
      // Queue for sync when online
      await this.queueForSync("DELETE", `/api/games/${gameId}`);
    }
  }

  async joinSharedGame(shareCode: string): Promise<Game> {
    if (!this.isOnline) {
      throw new Error("Joining shared games requires an internet connection");
    }

    try {
      const response = await fetch("/api/games/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shareCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to join game");
      }

      const game = await response.json();
      const gameWithDates = {
        ...game,
        createdAt: new Date(game.createdAt),
        lastPlayed: new Date(game.lastPlayed),
      };

      // Save to local storage
      await indexedDBManager.saveGame(gameWithDates);

      return gameWithDates;
    } catch (error) {
      console.error("Failed to join shared game:", error);
      throw error;
    }
  }

  private async queueForSync(
    method: string,
    url: string,
    data?: any
  ): Promise<void> {
    await indexedDBManager.addToSyncQueue({
      url,
      method,
      data,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Register background sync if available
    if ("serviceWorker" in navigator && navigator.serviceWorker.ready) {
      const registration = await navigator.serviceWorker.ready;
      if ("sync" in registration && registration.sync) {
        try {
          await (registration.sync as any).register("game-sync");
          console.log("Background sync registered");
        } catch (error) {
          console.log("Background sync registration failed:", error);
        }
      }
    }
  }

  private async syncPendingChanges(): Promise<void> {
    try {
      const syncQueue = await indexedDBManager.getSyncQueue();

      for (const item of syncQueue) {
        try {
          await this.syncSingleItem(item);
          await indexedDBManager.removeSyncQueueItem(item.id);
          console.log("Synced item:", item.url);
        } catch (error) {
          console.error("Failed to sync item:", item.url, error);

          // Increment retry count
          await indexedDBManager.updateSyncQueueItem(item.id, {
            retryCount: item.retryCount + 1,
          });

          // Remove from queue if too many retries
          if (item.retryCount >= 3) {
            console.log(
              "Removing item from sync queue after 3 failed attempts:",
              item.url
            );
            await indexedDBManager.removeSyncQueueItem(item.id);
          }
        }
      }
    } catch (error) {
      console.error("Failed to sync pending changes:", error);
    }
  }

  private async syncSingleItem(item: any): Promise<any> {
    const response = await fetch(item.url, {
      method: item.method,
      headers: item.headers || {},
      body: item.data ? JSON.stringify(item.data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
    }

    return response.json().catch(() => null); // Some requests might not return JSON
  }

  // Utility methods
  isAppOnline(): boolean {
    return this.isOnline;
  }

  async getPendingSyncCount(): Promise<number> {
    const syncQueue = await indexedDBManager.getSyncQueue();
    return syncQueue.length;
  }

  async clearAllOfflineData(): Promise<void> {
    await indexedDBManager.clearSyncQueue();
    // Note: We don't clear games as they might contain valuable offline data
  }
}

// Singleton instance
const offlineAPI = new OfflineAPI();

export default offlineAPI;
