import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Redirect } from 'expo-router';

import { initDB } from '@/services/db';
import Register from '@/screens/Register';
import Login from '@/screens/Login';

export default function Index() {
  const [appReady, setAppReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState('login');

  useEffect(() => {
    // Inicialización centralizada
    const setup = async () => {
      try {
        await initDB();
      } catch (e) {
        console.error('Fallo al inicializar DB:', e);
      } finally {
        setAppReady(true);
      }
    };
    setup();
  }, []);

  if (!appReady) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/vault" />;
  }

  return view === 'login' ? (
    <Login
      onLoginSuccess={() => setIsAuthenticated(true)}
      onGoToRegister={() => setView('register')}
    />
  ) : (
    <Register onBackToLogin={() => setView('login')} />
  );
}
