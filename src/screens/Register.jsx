import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';

const Register = ({ onBackToLogin }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState({ loading: false, error: '', showPassword: false });

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password)
      return setStatus({ ...status, error: 'Rellena todos los campos' });

    setStatus({ ...status, loading: true, error: '' });
    try {
      await api.post('/api/auth/register', {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        password: form.password,
      });

      Alert.alert('¡Éxito!', 'Cuenta creada correctamente', [
        { text: 'Ir al Login', onPress: onBackToLogin },
      ]);
    } catch (err) {
      setStatus({
        ...status,
        loading: false,
        error: err.response?.data?.message || 'Error al registrar',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View className="mb-8 items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <Ionicons name="person-add" size={30} color="white" />
          </View>
          <Text className="text-3xl font-bold text-slate-900">Nuevo Usuario</Text>
        </View>

        <View className="rounded-[40px] bg-white p-7 shadow-2xl shadow-slate-200">
          {status.error && (
            <View className="mb-5 flex-row items-center rounded-xl bg-red-50 p-3">
              <Ionicons name="alert-circle" size={20} color="#b91c1c" />
              <Text className="ml-2 text-xs text-red-700">{status.error}</Text>
            </View>
          )}

          <View className="gap-y-4">
            <RegInput
              label="Nombre"
              icon="person-outline"
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
              placeholder="Tu nombre"
            />
            <RegInput
              label="Email"
              icon="mail-outline"
              value={form.email}
              onChangeText={(t) => setForm({ ...form, email: t })}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
            />
            <RegInput
              label="Contraseña"
              icon="lock-closed-outline"
              value={form.password}
              onChangeText={(t) => setForm({ ...form, password: t })}
              secureTextEntry={!status.showPassword}
              placeholder="Mínimo 8 caracteres"
              isPassword
              toggle={() => setStatus({ ...status, showPassword: !status.showPassword })}
              showPassword={status.showPassword}
            />

            <TouchableOpacity
              onPress={handleRegister}
              disabled={status.loading}
              className={`mt-4 w-full rounded-xl py-4 ${status.loading ? 'bg-slate-300' : 'bg-blue-600'}`}>
              {status.loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center text-lg font-bold text-white">Crear Cuenta</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onBackToLogin} className="mt-8">
            <Text className="text-center text-slate-500">
              ¿Ya tienes cuenta? <Text className="font-bold text-blue-600">Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const RegInput = ({ label, icon, isPassword, toggle, showPassword, ...props }) => (
  <View className="gap-y-1.5">
    <Text className="ml-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
      {label}
    </Text>
    <View className="relative">
      <View className="absolute top-[14px] left-4 z-10">
        <Ionicons name={icon} size={18} color="#94a3b8" />
      </View>
      <TextInput
        className="w-full rounded-xl border border-slate-100 bg-slate-50 py-3.5 pr-11 pl-11 text-slate-700"
        {...props}
      />
      {isPassword && (
        <TouchableOpacity onPress={toggle} className="absolute top-[14px] right-4">
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color="#94a3b8"
          />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default Register;
