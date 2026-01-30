import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, Share, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

export default function GeneratorPage() {
  const [password, setPassword] = useState('P4ssw0rd!');
  const [length, setLength] = useState(12);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [includeUppercase, setIncludeUppercase] = useState(true);

  const generatePassword = () => {
    let charset = 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPassword(newPassword);
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(password);
    alert('¡Copiado al portapapeles!');
  };

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="px-6 pt-16 pb-8">
        <Text className="text-3xl font-bold text-slate-900">Generador</Text>
        <Text className="mt-1 text-slate-500">Crea contraseñas ultra seguras</Text>
      </View>

      <View className="px-6">
        {/* Contraseña generada */}
        <View className="mb-6 items-center rounded-[30px] border border-slate-100 bg-white p-6 shadow-sm">
          <Text className="mb-4 text-center font-mono text-2xl text-blue-600">{password}</Text>
          <View className="flex-row gap-x-4">
            <TouchableOpacity onPress={generatePassword} className="rounded-full bg-blue-50 p-3">
              <Ionicons name="refresh" size={24} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={copyToClipboard} className="rounded-full bg-blue-600 p-3">
              <Ionicons name="copy-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Opciones de configuración */}
        <View className="gap-y-6 rounded-[30px] border border-slate-100 bg-white p-6 shadow-sm">
          <Text className="mb-2 text-lg font-bold text-slate-900">Configuración</Text>

          <OptionRow
            label="Longitud"
            value={length}
            onPlus={() => setLength((l) => Math.min(32, l + 1))}
            onMinus={() => setLength((l) => Math.max(8, l - 1))}
          />

          <ToggleRow
            label="Mayúsculas"
            value={includeUppercase}
            onValueChange={setIncludeUppercase}
          />
          <ToggleRow label="Números" value={includeNumbers} onValueChange={setIncludeNumbers} />
          <ToggleRow label="Símbolos" value={includeSymbols} onValueChange={setIncludeSymbols} />
        </View>

        <TouchableOpacity
          onPress={generatePassword}
          className="mt-8 w-full rounded-2xl bg-blue-600 py-4 shadow-lg shadow-blue-200">
          <Text className="text-center text-lg font-bold text-white">Generar nueva clave</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Componentes auxiliares para no repetir código
const ToggleRow = ({ label, value, onValueChange }) => (
  <View className="flex-row items-center justify-between">
    <Text className="font-medium text-slate-700">{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
      thumbColor={value ? '#3b82f6' : '#f4f3f4'}
    />
  </View>
);

const OptionRow = ({ label, value, onPlus, onMinus }) => (
  <View className="flex-row items-center justify-between">
    <Text className="font-medium text-slate-700">{label}</Text>
    <View className="flex-row items-center gap-x-4">
      <TouchableOpacity onPress={onMinus} className="rounded-lg bg-slate-100 p-2">
        <Ionicons name="remove" size={20} color="#64748b" />
      </TouchableOpacity>
      <Text className="w-6 text-center text-lg font-bold text-slate-900">{value}</Text>
      <TouchableOpacity onPress={onPlus} className="rounded-lg bg-slate-100 p-2">
        <Ionicons name="add" size={20} color="#64748b" />
      </TouchableOpacity>
    </View>
  </View>
);
