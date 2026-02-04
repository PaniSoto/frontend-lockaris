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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    // Validación local rápida
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Por favor, rellena todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Petición a tu ruta de Next.js
      const response = await api.post('/api/auth/register', {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
      });

      // Si todo va bien, avisamos y volvemos al login
      Alert.alert('¡Cuenta creada!', 'Ya puedes iniciar sesión con tus credenciales', [
        { text: 'Ir al Login', onPress: onBackToLogin },
      ]);
    } catch (err) {
      // Capturamos el mensaje de error que configuraste en el backend
      const msg = err.response?.data?.message || 'Error al crear la cuenta';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, marginBottom: 50 }}>
        {/* Header - Identidad Lockaris */}
        <View className="mb-8 items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-300">
            <Ionicons name="person-add" size={32} color="white" />
          </View>
          <Text className="text-3xl font-bold tracking-tight text-slate-900">Nuevo Usuario</Text>
          <Text className="mt-1 text-slate-500">Crea tu búnker personal</Text>
        </View>

        {/* Card de Registro */}
        <View className="rounded-[40px] border border-slate-100 bg-white p-7 shadow-2xl shadow-slate-200">
          {error ? (
            <View className="mb-5 flex-row items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3.5">
              <Ionicons name="alert-circle" size={20} color="#b91c1c" />
              <Text className="flex-1 text-sm text-red-700">{error}</Text>
            </View>
          ) : null}

          <View className="gap-y-4">
            {/* Campo Nombre */}
            <View className="gap-y-2">
              <Text className="ml-1 text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                Nombre
              </Text>
              <View className="relative">
                <View className="absolute top-[14px] left-4 z-10">
                  <Ionicons name="person-outline" size={20} color="#94a3b8" />
                </View>
                <TextInput
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-4 pl-12 text-slate-700"
                  placeholder="Tu nombre completo"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Campo Email */}
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
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Campo Contraseña */}
            <View className="gap-y-2">
              <Text className="ml-1 text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                Contraseña
              </Text>
              <View className="relative">
                {/* Icono de candado a la izquierda */}
                <View className="absolute top-[14px] left-4 z-10">
                  <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                </View>

                <TextInput
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-12 text-slate-700"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword} // Cambia dinámicamente
                  autoCapitalize="none"
                />

                {/* Botón del ojo a la derecha */}
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute top-[14px] right-4 z-10"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Mejora el área táctil
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón de Acción */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.7}
              className={`mt-2 w-full flex-row items-center justify-center rounded-xl py-4 shadow-lg ${loading ? 'bg-slate-300' : 'bg-blue-600 shadow-blue-200'}`}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center text-lg font-bold text-white">Crear Cuenta</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer para volver */}
          <View className="mt-8 items-center border-t border-slate-50 pt-6">
            <TouchableOpacity onPress={onBackToLogin}>
              <Text className="text-sm text-slate-500">
                ¿Ya eres usuario? <Text className="font-bold text-blue-600">Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Register;
