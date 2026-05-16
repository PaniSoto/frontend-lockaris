import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CustomAlert({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText,
  type = 'info', // 'info', 'danger', 'success'
}) {
  const getConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'alert-circle',
          color: '#ef4444',
          bgColor: 'bg-red-50',
          btnColor: 'bg-red-500',
          shadow: 'shadow-red-200',
          defaultText: 'Eliminar',
        };
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: '#10b981',
          bgColor: 'bg-emerald-50',
          btnColor: 'bg-emerald-500',
          shadow: 'shadow-emerald-200',
          defaultText: 'Genial',
        };
      default: // info o aviso offline
        return {
          icon: 'cloud-offline-outline', // Cambiado para que encaje con "Offline"
          color: '#3b82f6',
          bgColor: 'bg-blue-50',
          btnColor: 'bg-blue-600',
          shadow: 'shadow-blue-200',
          defaultText: 'Entendido',
        };
    }
  };

  const config = getConfig();

  // Si es tipo 'danger', siempre queremos dos botones.
  // Si no hay onClose, entendemos que es un aviso informativo de un solo botón.
  const showCancelButton = type === 'danger' || (onClose && type !== 'success');

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-slate-900/60 px-6">
        <View className="w-full max-w-sm rounded-[35px] bg-white p-8 shadow-2xl">
          {/* ICONO DINÁMICO */}
          <View
            className={`mx-auto mb-5 h-20 w-20 items-center justify-center rounded-full ${config.bgColor}`}>
            <Ionicons
              name={type === 'info' && message.includes('internet') ? 'cloud-offline' : config.icon}
              size={40}
              color={config.color}
            />
          </View>

          {/* TEXTO */}
          <Text className="text-center text-2xl font-bold text-slate-900">{title}</Text>
          <Text className="mt-3 text-center text-base leading-6 text-slate-500">{message}</Text>

          {/* BOTONES */}
          <View className="mt-10 flex-row gap-x-4">
            {showCancelButton && (
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                className="flex-1 rounded-2xl bg-slate-100 py-4">
                <Text className="text-center font-semibold text-slate-600">Cancelar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onConfirm}
              activeOpacity={0.8}
              className={`flex-1 rounded-2xl py-4 shadow-xl ${config.btnColor} ${config.shadow}`}>
              <Text className="text-center text-base font-bold text-white">
                {confirmText || config.defaultText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
