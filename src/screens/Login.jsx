import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';

import api from '@/services/api';
import { authService } from '@/services/db';

const Login = ({ onLoginSuccess, onGoToRegister }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState({ loading: false, error: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleBiometricAuth = useCallback(async () => {
    try {
      const { success } = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Acceder a Lockaris',
      });

      if (!success) return;

      let token = await authService.getToken();

      // Se vuelve a intentar obtener el token por si la sesión expiró mientras se autenticaba con biometría
      if (!token) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        token = await authService.getToken();
      }

      token
        ? onLoginSuccess()
        : setStatus((prev) => ({ ...prev, error: 'Sesión expirada. Reingresa manualmente.' }));
    } catch (err) {
      console.error('Biometría fallida', err);
    }
  }, [onLoginSuccess]);

  const handleLogin = async () => {
    const { email, password } = form;
    if (!email.trim() || !password.trim()) {
      return setStatus({ ...status, error: 'Rellena todos los campos' });
    }

    setStatus({ error: '', loading: true });
    try {
      const { data } = await api.post('/api/auth/login', {
        email: email.toLowerCase().trim(),
        password,
      });

      await authService.saveToken(data.token);
      authService.setSession(data.user);
      await authService.saveBiometricPreference(true);

      onLoginSuccess();
    } catch (err) {
      setStatus({
        loading: false,
        error: err.response?.data?.error || 'Credenciales incorrectas',
      });
    }
  };

  useEffect(() => {
    const autoCheck = async () => {
      const [pref, token] = await Promise.all([
        authService.getBiometricPreference(),
        authService.getToken(),
      ]);
      if (pref && token) setTimeout(handleBiometricAuth, 1000);
    };
    autoCheck();
  }, [handleBiometricAuth]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View className="mb-8 items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <Ionicons name="shield-checkmark" size={32} color="white" />
          </View>
          <Text className="text-3xl font-bold text-slate-900">Lockaris</Text>
          <Text className="text-slate-500">Bóveda Segura</Text>
        </View>

        <View className="rounded-[40px] bg-white p-7 shadow-2xl shadow-slate-200">
          {status.error ? (
            <View className="mb-5 flex-row items-center rounded-xl bg-red-50 p-3.5">
              <Ionicons name="alert-circle" size={20} color="#b91c1c" />
              <Text className="ml-2 text-red-700">{status.error}</Text>
            </View>
          ) : null}

          <View className="gap-y-4">
            <Input
              label="Email"
              icon="mail-outline"
              placeholder="nombre@ejemplo.com"
              placeholderTextColor="#94a3b8"
              value={form.email}
              onChangeText={(t) => setForm({ ...form, email: t })}
            />

            <Input
              label="Contraseña"
              icon="lock-closed-outline"
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(t) => setForm({ ...form, password: t })}
              togglePassword={() => setShowPassword(!showPassword)}
              showPassword={showPassword}
            />

            <TouchableOpacity
              onPress={handleLogin}
              disabled={status.loading}
              className={`mt-4 w-full rounded-xl py-4 ${status.loading ? 'bg-slate-300' : 'bg-blue-600'}`}>
              {status.loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center text-lg font-bold text-white">Entrar</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onGoToRegister} className="mt-8">
            <Text className="text-center text-slate-500">
              ¿No tienes cuenta? <Text className="font-bold text-blue-600">Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Sub-componente para mantener el código limpio
const Input = ({ label, icon, togglePassword, showPassword, ...props }) => (
  <View className="gap-y-2">
    <Text className="ml-1 text-[11px] font-bold text-slate-500 uppercase">{label}</Text>
    <View className="relative">
      <View className="absolute top-[14px] left-4 z-10">
        <Ionicons name={icon} size={20} color="#94a3b8" />
      </View>
      <TextInput
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-12 text-slate-700"
        {...props}
      />
      {togglePassword && (
        <TouchableOpacity onPress={togglePassword} className="absolute top-[14px] right-4">
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#94a3b8"
          />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default Login;
