import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';

import api from '@/services/api';
import { authService } from '@/services/db';

const Login = ({ onLoginSuccess, onGoToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // --- NUEVA FUNCIÓN: INICIO MANUAL POR HUELLA ---
const handleBiometricAuth = async () => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) return;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Acceder a Lockaris',
    });

    if (result.success) {
      setError(''); // <--- Limpiamos cualquier error previo para que no confunda
      let token = await authService.getToken();
      
      if (!token) {
        console.log("Reintentando lectura de token...");
        await new Promise(resolve => setTimeout(resolve, 800)); // Un poco más de tiempo
        token = await authService.getToken();
      }

      if (token) {
        onLoginSuccess();
      } else {
        // Solo mostramos error si DE VERDAD no hay token tras reintentar
        setError("Inicia sesión con contraseña una vez para activar la huella.");
      }
    }
  } catch (err) {
    console.log("Error en biometría:", err);
  }
};

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Por favor, rellena todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', {
        email: email.toLowerCase().trim(),
        password,
      });

      const { token, user } = response.data;
      
      // Guardamos y aseguramos
      await authService.saveToken(token);
      authService.setSession(user);
      
      // Activar la preferencia de biometría automáticamente al loguear con éxito
      await authService.saveBiometricPreference(true);

      onLoginSuccess();
    } catch (err) {
      const msg = err.response?.data?.error || 'Correo o contraseña incorrectos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  const initAuth = async () => {
    // 1. Verificamos que el servicio esté listo
    if (authService && typeof authService.getBiometricPreference === 'function') {
      try {
        const pref = await authService.getBiometricPreference();
        const token = await authService.getToken(); // <--- AÑADIMOS ESTO

        // 2. SOLO disparamos si el usuario quiere usar huella Y hay un token guardado
        if (pref === true && token) {
          setTimeout(() => {
            handleBiometricAuth();
          }, 1000);
        } else {
          console.log("Auto-auth cancelado: No hay token o preferencia desactivada");
        }
      } catch (e) {
        console.log("Error en auto-auth:", e);
      }
    }
  };

  initAuth();
}, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View className="mb-8 items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-300">
            <Ionicons name="shield-checkmark" size={32} color="white" />
          </View>
          <Text className="text-3xl font-bold tracking-tight text-slate-900">Lockaris</Text>
          <Text className="mt-1 text-slate-500">Accede a tu bóveda segura</Text>
        </View>

        <View className="rounded-[40px] border border-slate-100 bg-white p-7 shadow-2xl shadow-slate-200">
          {error ? (
            <View className="mb-5 flex-row items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3.5">
              <Ionicons name="alert-circle" size={20} color="#b91c1c" />
              <Text className="flex-1 text-sm text-red-700">{error}</Text>
            </View>
          ) : null}

          <View className="gap-y-5">
            <View className="gap-y-2">
              <Text className="ml-1 text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                Email
              </Text>
              <View className="relative">
                <View className="absolute top-[14px] left-4 z-10">
                  <Ionicons name="mail-outline" size={20} color="#94a3b8" />
                </View>
                <TextInput
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-4 pl-12 text-slate-700"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View className="gap-y-2">
              <Text className="ml-1 text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                Contraseña
              </Text>
              <View className="relative">
                <View className="absolute top-[14px] left-4 z-10">
                  <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                </View>
                <TextInput
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-12 text-slate-700"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute top-[14px] right-4">
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.7}
              className={`mt-2 w-full flex-row items-center justify-center rounded-xl py-4 shadow-lg ${loading ? 'bg-slate-300' : 'bg-blue-600 shadow-blue-200'}`}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center text-lg font-bold text-white">Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-8 items-center border-t border-slate-50 pt-6">
            <TouchableOpacity onPress={onGoToRegister} activeOpacity={0.6}>
              <Text className="text-center text-sm text-slate-500">
                ¿No tienes cuenta? <Text className="font-bold text-blue-600">Regístrate ahora</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;