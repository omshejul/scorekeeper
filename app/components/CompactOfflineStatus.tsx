"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, RotateCcw, Check, Cloud, CloudOff } from "lucide-react";
import offlineAPI from "@/lib/offline/offlineAPI";

export default function CompactOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [showSyncComplete, setShowSyncComplete] = useState(false);

  useEffect(() => {
    // Initialize
    setIsOnline(navigator.onLine);
    updatePendingSyncCount();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(updatePendingSyncCount, 1000); // Wait a bit for sync to complete
    };

    const handleOffline = () => {
      setIsOnline(false);
      updatePendingSyncCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodically check sync status
    const interval = setInterval(updatePendingSyncCount, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updatePendingSyncCount = async () => {
    try {
      const previousCount = pendingSyncCount;
      const count = await offlineAPI.getPendingSyncCount();
      setPendingSyncCount(count);

      // Show sync complete animation if we had pending items and now we don't
      if (previousCount > 0 && count === 0 && isOnline) {
        setShowSyncComplete(true);
        setTimeout(() => setShowSyncComplete(false), 3000);
      }
    } catch (error) {
      console.error("Failed to get pending sync count:", error);
    }
  };

  // Don't show anything if online and no pending syncs and no sync complete message
  if (isOnline && pendingSyncCount === 0 && !showSyncComplete) {
    return null;
  }

  return (
    <div className="mb-4">
      <AnimatePresence mode="wait">
        {showSyncComplete ? (
          <motion.div
            key="sync-complete"
            initial={{ opacity: 0, height: 0, scale: 0.8 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.8 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  All changes synced!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Your games are up to date
                </p>
              </div>
            </div>
          </motion.div>
        ) : !isOnline ? (
          <motion.div
            key="offline"
            initial={{ opacity: 0, height: 0, scale: 0.8 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.8 }}
            className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center">
                <CloudOff className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Playing offline
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  {pendingSyncCount > 0
                    ? `${pendingSyncCount} change${
                        pendingSyncCount !== 1 ? "s" : ""
                      } will sync when online`
                    : "Changes will sync when you're back online"}
                </p>
              </div>
            </div>
          </motion.div>
        ) : pendingSyncCount > 0 ? (
          <motion.div
            key="syncing"
            initial={{ opacity: 0, height: 0, scale: 0.8 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.8 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </motion.div>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Syncing changes...
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {pendingSyncCount} change{pendingSyncCount !== 1 ? "s" : ""}{" "}
                  pending
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
