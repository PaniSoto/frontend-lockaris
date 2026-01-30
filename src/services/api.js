import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Puedes alternar entre estas dos líneas comentando la que no uses
// const baseURL = 'http://192.168.18.67:3000'; 
const baseURL = 'https://lockaris.vercel.app';

const api = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * INTERCEPTOR DE PETICIÓN: 
 * Se ejecuta ANTES de que la señal salga del móvil.
 * Inyecta el JWT Token automáticamente.
 */
api.interceptors.request.use(
  async (config) => {
    try {
      // USAR SecureStore (igual que en el Login)
      const token = await SecureStore.getItemAsync('userToken'); 
      
      if (token) {
        // Asegúrate de que no haya espacios extra o falte "Bearer "
        config.headers.Authorization = `Bearer ${token}`;
        console.log("Token inyectado en PUT:", token.substring(0, 10) + "...");
      } else {
        console.warn("No se encontró token en SecureStore para esta petición");
      }
    } catch (e) {
      console.error("Error al recuperar el token:", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * INTERCEPTOR DE RESPUESTA:
 * Para debuguear errores de la API.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Detectar si es un error de conexión (Sin internet o servidor apagado)
    const isNetworkError = !error.response;

    if (isNetworkError) {
      // Marcamos el error para que sync.js sepa que debe encolar en SQLite
      error.isOffline = true;
      // Log más amigable y menos "escandaloso"
      console.log("Modo Offline: La petición se resolverá localmente.");
    } else {
      // 2. Si el servidor respondió pero con error (401, 403, 500, etc.)
      const status = error.response.status;

      if (status === 401) {
        console.warn("Sesión expirada o no autorizada.");
        // Aquí podrías disparar un evento para cerrar sesión si quisieras
      }

      // Solo logueamos errores reales del servidor para no ensuciar la consola
      console.error('API Server Error:', {
        status: status,
        data: error.response.data
      });
    }

    return Promise.reject(error);
  }
);

export default api;