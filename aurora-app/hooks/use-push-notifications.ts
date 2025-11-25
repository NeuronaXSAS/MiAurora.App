"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  showLocalNotification,
  NotificationPayload,
  NotificationPreferences,
} from '@/lib/push-notifications';

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  subscription: PushSubscription | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'unsupported',
    isSubscribed: false,
    subscription: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const isSupported = isPushSupported();
      const permission = getNotificationPermission();
      
      setState(prev => ({ ...prev, isSupported, permission }));

      if (isSupported && permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setState(prev => ({ 
            ...prev, 
            isSubscribed: !!subscription,
            subscription 
          }));
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }
    };

    checkStatus();
  }, []);


  const requestPermission = useCallback(async () => {
    if (!state.isSupported) return false;
    
    setIsLoading(true);
    try {
      const permission = await requestNotificationPermission();
      setState(prev => ({ ...prev, permission }));
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [state.isSupported]);

  const subscribe = useCallback(async (vapidPublicKey: string) => {
    if (!state.isSupported || state.permission !== 'granted') return null;
    
    setIsLoading(true);
    try {
      const subscription = await subscribeToPush(vapidPublicKey);
      if (subscription) {
        setState(prev => ({ ...prev, isSubscribed: true, subscription }));
      }
      return subscription;
    } catch (error) {
      console.error('Error subscribing:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [state.isSupported, state.permission]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setState(prev => ({ ...prev, isSubscribed: false, subscription: null }));
      }
      return success;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const notify = useCallback(async (payload: NotificationPayload) => {
    if (state.permission !== 'granted') return;
    await showLocalNotification(payload);
  }, [state.permission]);

  return {
    ...state,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    notify,
    preferences: NotificationPreferences,
  };
}
