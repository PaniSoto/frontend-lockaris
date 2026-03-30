import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const baseURL = 'https://lockaris.vercel.app';

const api = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * INTERCEPTOR DE PETICIÓN:
 * Se ejecuta antes de que cualquier petición salga del móvil
 * Inyecta el JWT Token recuperado de SecureStore en la cabecera Authorization
 */
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      console.log('Token recibido en interceptor:', token);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token inyectado en PUT:', token.substring(0, 10) + '...');
      } else {
        console.warn('No se encontró token en SecureStore para esta petición');
      }
    } catch (e) {
      console.error('Error al recuperar el token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * INTERCEPTOR DE RESPUESTA:
 * Actúa como un filtro para todas las respuestas que llegan del servidor.
 * Detecta si el error es por falta de red o por problemas de servidor.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isNetworkError = !error.response;

    if (isNetworkError) {
      error.isOffline = true;
      console.log('Modo Offline: La petición se resolverá localmente.');
    } else {
      const status = error.response.status;

      if (status === 401) {
        console.log('Aviso: Credenciales incorrectas o sesión expirada.');
      } else {
        console.error('API Server Error:', {
          status: status,
          data: error.response.data,
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
