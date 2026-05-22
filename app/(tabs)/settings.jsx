import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authService } from '@/services/db';
import NetInfo from '@react-native-community/netinfo';

export default function SettingsPage() {
  const router = useRouter();
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  // Estado para controlar la visibilidad de la nueva alerta de diseño
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOfflineMode(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const confirmarCierreSesion = () => {
    setIsLogoutModalVisible(true);
  };

  const ejecutarCierreSesion = async () => {
    setIsLogoutModalVisible(false);
    await authService.logout();
    router.replace('/');
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* HEADER */}
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

      {/* CONTENIDO PRINCIPAL */}
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

      {/* COMPONENTE ALERT MODAL PERSONALIZADO */}
      <Modal
        transparent={true}
        visible={isLogoutModalVisible}
        animationType="fade"
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-slate-900/40 px-6">
          <View className="w-full max-w-sm bg-white rounded-[30px] p-6 border border-slate-100 shadow-xl items-center">
            
            {/* Icono de advertencia integrado */}
            <View className="h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-4">
              <Ionicons name="log-out-outline" size={26} color="#ef4444" />
            </View>

            {/* Textos */}
            <Text className="text-xl font-bold text-slate-900 text-center mb-2">
              Cerrar Sesión
            </Text>
            <Text className="text-sm text-slate-500 text-center mb-6 px-2">
              ¿Estás seguro de que quieres salir de Lockaris?
            </Text>

            {/* Contenedor de Botones en Fila */}
            <View className="flex-row w-full gap-3">
              <TouchableOpacity
                onPress={() => setIsLogoutModalVisible(false)}
                className="flex-1 bg-slate-100 py-3.5 rounded-2xl items-center justify-center active:bg-slate-200"
              >
                <Text className="text-sm font-semibold text-slate-600">Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={ejecutarCierreSesion}
                className="flex-1 bg-red-500 py-3.5 rounded-2xl items-center justify-center active:bg-red-600"
              >
                <Text className="text-sm font-semibold text-white">Salir</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}