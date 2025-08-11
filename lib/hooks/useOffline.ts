"use client";

import { useState, useEffect } from "react";
import offlineAPI from "@/lib/offline/offlineAPI";

export interface OfflineState {
  isOnline: boolean;
  pendingSyncCount: number;
  isInitialized: boolean;
}

export function useOffline(): OfflineState {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initOfflineAPI = async () => {
      try {
        await offlineAPI.init();
        if (isMounted) {
          setIsInitialized(true);
          setIsOnline(offlineAPI.isAppOnline());
          const count = await offlineAPI.getPendingSyncCount();
          setPendingSyncCount(count);
        }
      } catch (error) {
        console.error("Failed to initialize offline API:", error);
        if (isMounted) {
          setIsInitialized(true); // Still mark as initialized even if it failed
        }
      }
    };

    // Initialize
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      initOfflineAPI();
    }

    const handleOnline = async () => {
      setIsOnline(true);
      // Wait a bit for potential sync to complete, then update count
      setTimeout(async () => {
        if (isMounted) {
          try {
            const count = await offlineAPI.getPendingSyncCount();
            setPendingSyncCount(count);
          } catch (error) {
            console.error("Failed to get pending sync count:", error);
          }
        }
      }, 1000);
    };

    const handleOffline = async () => {
      setIsOnline(false);
      if (isMounted) {
        try {
          const count = await offlineAPI.getPendingSyncCount();
          setPendingSyncCount(count);
        } catch (error) {
          console.error("Failed to get pending sync count:", error);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    // Periodically update sync count
    const interval = setInterval(async () => {
      if (isMounted && isInitialized) {
        try {
          const count = await offlineAPI.getPendingSyncCount();
          setPendingSyncCount(count);
        } catch (error) {
          console.error("Failed to get pending sync count:", error);
        }
      }
    }, 5000);

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
      clearInterval(interval);
    };
  }, [isInitialized]);

  return {
    isOnline,
    pendingSyncCount,
    isInitialized,
  };
}
