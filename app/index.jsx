import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Redirect } from 'expo-router';

import { initDB } from '@/services/db';
import Register from '@/screens/Register';
import Login from '@/screens/Login';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false); // ¿Existe sesión previa?
  const [isAuthenticated, setIsAuthenticated] = useState(false); // ¿Ha pasado la huella/pass ahora?
  const [currentView, setCurrentView] = useState('login');

  useEffect(() => {
    const prepararAplicacion = async () => {
      try {
        await initDB();
        const token = await SecureStore.getItemAsync('userToken');
        
        // Si hay token, marcamos que hay una sesión previa, 
        // pero NO marcamos isAuthenticated como true.
        setHasToken(!!token); 
      } catch (e) {
        console.error('Error al preparar la app:', e);
      } finally {
        setIsLoading(false);
      }
    };
    prepararAplicacion();
  }, []);

  // Esta función se llamará cuando el Login sea exitoso (Manual o Huella)
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // --- LÓGICA DE BITWARDEN ---

  // Solo redirigimos a la bóveda si ha pasado por el proceso de Login/Huella satisfactoriamente
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/vault" />;
  }

  // Si no está autenticado, mostramos Login (aunque tenga token)
  // El Login se encargará de lanzar la huella automáticamente porque detectará el token en el disco
  if (currentView === 'login') {
    return (
      <Login 
        onLoginSuccess={handleAuthSuccess} 
        onGoToRegister={() => setCurrentView('register')} 
      />
    );
  }

  return <Register onBackToLogin={() => setCurrentView('login')} />;
}