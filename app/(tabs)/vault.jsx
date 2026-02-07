import VaultScreen from '@/screens/VaultScreen';
import React from 'react';
import { View } from 'react-native';

// Renderiza el componente principal VaultScreen dentro de la estructura de pestañas
export default function VaultPage() {
  return (
    <View className="flex-1">
      <VaultScreen />
    </View>
  );
}
