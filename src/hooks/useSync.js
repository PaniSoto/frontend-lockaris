import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncPendingChanges } from '@/services/sync';
import { DeviceEventEmitter } from 'react-native';

// Variable encargada de que no se choquen dos procesos de sincronización entre si
let isProcessingSync = false;

export const useSync = () => {
  const timeoutRef = useRef(null);

  // Verifica el estado de la red y dispara la sincronización si es posible.
  const checkAndSync = (state) => {
    if (state.isConnected && state.isInternetReachable && !isProcessingSync) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(async () => {
        if (isProcessingSync) return;

        try {
          isProcessingSync = true;
          console.log('Sincronizando...');
          await syncPendingChanges(); // Procesa uno a uno los cambios guardados localmente para enviarlos al servidor
          DeviceEventEmitter.emit('event_refresh_messages'); // Avisa a toda la app que hay datos nuevos
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
    // Comprobación inmediata al abrir la aplicación si hay conexion
    NetInfo.fetch().then(checkAndSync);

    // Se suscribe a los cambios de red en tiempo real para reaccionar ante cualquier desconexión o reconexión
    const unsubscribe = NetInfo.addEventListener(checkAndSync);

    // Limpieza al desmontar el hook para evitar fugas de memoria
    return () => {
      unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
};
