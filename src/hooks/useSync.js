import { useEffect, useRef } from 'react';
import NetInfo from "@react-native-community/netinfo";
import { syncPendingChanges } from '@/services/sync';
import { DeviceEventEmitter } from 'react-native';

let isProcessingSync = false;

export const useSync = () => {
  const timeoutRef = useRef(null);

  const checkAndSync = (state) => {
    if (state.isConnected && state.isInternetReachable && !isProcessingSync) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(async () => {
        if (isProcessingSync) return;
        try {
          isProcessingSync = true;
          console.log("Sincronizando...");
          await syncPendingChanges();
          DeviceEventEmitter.emit('event_refresh_messages');
        } catch (e) {
          console.error(e);
        } finally {
          isProcessingSync = false;
          timeoutRef.current = null;
        }
      }, 2000);
    }
  };

  useEffect(() => {
    // 1. EjecuciÃ³n inmediata al abrir la app (Estado actual)
    NetInfo.fetch().then(checkAndSync);

    // 2. Escuchar cambios futuros
    const unsubscribe = NetInfo.addEventListener(checkAndSync);
    
    return () => {
      unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
};