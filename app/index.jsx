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
    const prepareApp = async () => {
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
    prepareApp();
  }, []);

  const refreshSession = async () => {
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

  // Si tenemos token, saltamos directamente a la bóveda.
  // Es vital que el href coincida con el nombre del archivo en app/(tabs)/vault.jsx
  if (userToken) {
    return <Redirect href="/(tabs)/vault" />;
  }

  // --- FLUJO DE AUTENTICACIÓN ---

  if (currentView === 'login') {
    return (
      <Login onLoginSuccess={refreshSession} onGoToRegister={() => setCurrentView('register')} />
    );
  }

  return <Register onBackToLogin={() => setCurrentView('login')} />;
}
