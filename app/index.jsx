import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Redirect } from 'expo-router';

import { initDB } from '@/services/db';
import Register from '@/screens/Register';
import Login from '@/screens/Login';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [currentView, setCurrentView] = useState('login');

  useEffect(() => {
    /**
     * Tarea de preparación: Inicializa la infraestructura local
     * y recupera la sesión guardada si existe.
     */

    const prepararAplicacion = async () => {
      try {
        // Inicializamos DB local
        await initDB();
        // Verificamos si ya hay una sesión activa
        const token = await SecureStore.getItemAsync('userToken');
        setUserToken(token);
      } catch (e) {
        console.error('Error al preparar la app:', e);
      } finally {
        setIsLoading(false);
      }
    };
    prepararAplicacion();
  }, []);

  const refrescarSesion = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    setUserToken(token);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // --- LÓGICA DE REDIRECCIÓN ---

  // Si el usuario ya está autenticado se le envía a la bóveda
  if (userToken) {
    return <Redirect href="/(tabs)/vault" />;
  }

  // --- FLUJO DE AUTENTICACIÓN ---
  // Selección entre Login y Registro
  if (currentView === 'login') {
    return (
      <Login onLoginSuccess={refrescarSesion} onGoToRegister={() => setCurrentView('register')} />
    );
  }

  return <Register onBackToLogin={() => setCurrentView('login')} />;
}
