"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, RotateCcw, Check } from "lucide-react";
import offlineAPI from "@/lib/offline/offlineAPI";

export default function OfflineStatus() {
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

  if (isOnline && pendingSyncCount === 0 && !showSyncComplete) {
    return null; // Don't show anything when online and no pending syncs
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <AnimatePresence mode="wait">
        {showSyncComplete ? (
          <motion.div
            key="sync-complete"
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg"
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">All changes synced!</span>
          </motion.div>
        ) : !isOnline ? (
          <motion.div
            key="offline"
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="flex items-center gap-2 bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg"
          >
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">
              Offline mode
              {pendingSyncCount > 0 && ` • ${pendingSyncCount} pending`}
            </span>
          </motion.div>
        ) : pendingSyncCount > 0 ? (
          <motion.div
            key="syncing"
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RotateCcw className="w-4 h-4" />
            </motion.div>
            <span className="text-sm font-medium">
              Syncing {pendingSyncCount} change
              {pendingSyncCount !== 1 ? "s" : ""}...
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
