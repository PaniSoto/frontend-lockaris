import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authService } from '@/services/db';
import NetInfo from '@react-native-community/netinfo';

export default function SettingsPage() {
  const router = useRouter();
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOfflineMode(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const confirmarCierreSesion = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres salir de Lockaris?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between bg-white px-6 pt-14 pb-6 shadow-sm">
        <View>
          <Text className="text-2xl font-extrabold text-slate-900">Ajustes</Text>
        </View>
        <Ionicons
          name={isOfflineMode ? 'cloud-offline' : 'shield-checkmark'}
          size={24}
          color={isOfflineMode ? '#f59e0b' : '#10b981'}
        />
      </View>

      <View className="px-6 mt-6">
        <View className="overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-sm">
          <TouchableOpacity
            onPress={confirmarCierreSesion}
            className="flex-row items-center p-5 active:bg-red-50">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </View>
            <Text className="flex-1 text-base font-medium text-red-600">Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <Text className="mt-8 text-center text-xs font-medium tracking-widest text-slate-400 uppercase">
          Lockaris v2.0.0
        </Text>
      </View>
    </View>
  );
}
