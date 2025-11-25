"use client";

import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isOnline: true,
    registration: null,
    updateAvailable: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isSupported = 'serviceWorker' in navigator;
    setState(prev => ({ ...prev, isSupported, isOnline: navigator.onLine }));

    if (!isSupported) return;

    // Register service worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[Aurora] Service Worker registered');
        
        setState(prev => ({ 
          ...prev, 
          isRegistered: true, 
          registration 
        }));

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState(prev => ({ ...prev, updateAvailable: true }));
              }
            });
          }
        });
      } catch (error) {
        console.error('[Aurora] SW registration failed:', error);
      }
    };

    registerSW();
  }, []);


  // Online/offline listeners
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update service worker
  const update = useCallback(async () => {
    if (state.registration) {
      await state.registration.update();
    }
  }, [state.registration]);

  // Skip waiting and reload
  const skipWaiting = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [state.registration]);

  // Unregister service worker
  const unregister = useCallback(async () => {
    if (state.registration) {
      await state.registration.unregister();
      setState(prev => ({ ...prev, isRegistered: false, registration: null }));
    }
  }, [state.registration]);

  return {
    ...state,
    update,
    skipWaiting,
    unregister,
  };
}

// Hook for offline data sync
export function useOfflineSync() {
  const [pendingActions, setPendingActions] = useState<number>(0);

  const queueAction = useCallback(async (action: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: string;
  }) => {
    if (typeof window === 'undefined') return;

    const db = await openOfflineDB();
    const transaction = db.transaction('pending-actions', 'readwrite');
    const store = transaction.objectStore('pending-actions');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.add(action);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    setPendingActions(prev => prev + 1);

    // Request background sync if available
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('aurora-sync');
    }
  }, []);

  const syncNow = useCallback(async () => {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('aurora-sync');
    }
  }, []);

  return { pendingActions, queueAction, syncNow };
}

// Helper to open IndexedDB
function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('aurora-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('pending-actions')) {
        db.createObjectStore('pending-actions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}
