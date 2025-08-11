"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered successfully:", registration);

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener("statechange", () => {
                if (installingWorker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    // New content is available, show update notification
                    console.log("New content is available; please refresh.");
                    // You could show a toast notification here
                  } else {
                    // Content is cached for offline use
                    console.log("Content is cached for offline use.");
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });

      // Handle service worker controller changes
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("Service Worker controller changed, reloading page...");
        window.location.reload();
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
