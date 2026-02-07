import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authService } from '@/services/db';

export default function SettingsPage() {
  const router = useRouter();

  // Función para el mensaje de "Próximamente"
  const mostrarAvisoProximamente = () => {
    Alert.alert(
      'Próximamente',
      'La edición de perfil estará disponible en la siguiente versión de Lockaris.',
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  const confirmarCierreSesion = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres salir de Lockaris?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await authService.logout(); // Limpia los tokens/sesión en la base de datos
          router.replace('/'); // Redirige al usuario al login
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* TÍTULO DE LA PÁGINA */}
      <View className="px-6 pt-16 pb-8">
        <Text className="text-3xl font-bold text-slate-900">Ajustes</Text>
        <Text className="mt-1 text-slate-500">Gestiona tu búnker de seguridad</Text>
      </View>

      <View className="px-6">
        {/* GRUPO DE OPCIONES (Contenedor estilo Tarjeta) */}
        <View className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-sm">
          {/* Opción de Perfil */}
          <TouchableOpacity
            onPress={mostrarAvisoProximamente}
            className="flex-row items-center border-b border-slate-50 p-5 active:bg-slate-50">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <Ionicons name="person-outline" size={20} color="#64748b" />
            </View>
            <Text className="flex-1 text-base font-medium text-slate-700">Mi Perfil</Text>
            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
          </TouchableOpacity>

          {/* Opción de Cerrar Sesión */}
          <TouchableOpacity
            onPress={confirmarCierreSesion}
            className="flex-row items-center p-5 active:bg-red-50">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </View>
            <Text className="flex-1 text-base font-medium text-red-600">Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <Text className="mt-8 text-center text-xs font-medium tracking-widest text-slate-400 uppercase">
          Lockaris v1.0.0
        </Text>
      </View>
    </View>
  );
}
