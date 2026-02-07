import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { deleteCredential } from '@/services/sync';

export default function ViewCredentialModal({
  isOpen,
  onClose,
  data,
  onUpdate,
  onDeleteSuccess,
  isOfflineMode,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showSensitive, setShowSensitive] = useState({});
  const [copiedField, setCopiedField] = useState(null);

  // Sincroniza el formulario interno cuando se abre el modal con nuevos datos
  useEffect(() => {
    if (isOpen && data) {
      setEditForm({ ...data });
      setShowSensitive({});
    }
    if (!isOpen) {
      setIsEditing(false);
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const theme = {
    bg: isOfflineMode
      ? 'bg-gray-400'
      : data.type === 'CARD'
        ? 'bg-emerald-600'
        : data.type === 'NOTE'
          ? 'bg-amber-600'
          : 'bg-blue-600',
  };

  // Lógica de generación aleatoria
  const handleGeneratePassword = () => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setEditForm((prev) => ({ ...prev, password: newPassword }));
    setShowSensitive((prev) => ({ ...prev, password: true }));
  };

  const handleSave = () => {
    if (!editForm.serviceName) return Alert.alert('Error', 'El título es obligatorio');
    const finalData = { ...editForm, id: data.id };
    onUpdate(finalData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      '¿Eliminar esta información?',
      'Esta acción no se puede deshacer. Si estás sin conexión, se eliminará permanentemente al sincronizar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteCredential(data.id);
              if (result) {
                onClose();

                if (onDeleteSuccess) onDeleteSuccess(data.id);

                if (result.offline) {
                  Alert.alert(
                    'Modo Offline',
                    'Se eliminará del servidor automáticamente cuando tengas red.'
                  );
                }
              }
            } catch (error) {
              console.error('Error al eliminar la credencial:', error);
              Alert.alert('Error', 'No se pudo eliminar la credencial.');
            }
          },
        },
      ]
    );
  };

  const toggleVisibility = (key) => {
    setShowSensitive((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Función auxiliar para crear filas de datos uniformes
  const renderField = (
    label,
    key,
    secure = false,
    multiline = false,
    canCopy = false,
    extraAction = null
  ) => (
    <View className="mb-4">
      <Text className="mb-1 ml-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
        {label}
      </Text>
      <View
        className={`rounded-2xl border bg-slate-50 ${isEditing ? 'border-blue-300 bg-white' : 'border-slate-100'} flex-row items-center p-4`}>
        <TextInput
          className="flex-1 py-0 text-base text-slate-800"
          value={editForm[key] ? String(editForm[key]) : ''}
          onChangeText={(t) => setEditForm((prev) => ({ ...prev, [key]: t }))}
          editable={isEditing}
          secureTextEntry={secure && !showSensitive[key]}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
        />

        <View className="flex-row items-center gap-x-3">
          {/* Botón para copiar */}
          {editForm[key] && canCopy && (
            <TouchableOpacity
              onPress={() => {
                Clipboard.setStringAsync(String(editForm[key]));
                setCopiedField(key);
                setTimeout(() => setCopiedField(null), 2000);
              }}>
              <Ionicons
                name={copiedField === key ? 'checkmark' : 'copy-outline'}
                size={18}
                color={copiedField === key ? '#22c55e' : '#94a3b8'}
              />
            </TouchableOpacity>
          )}
          {/* Botón aleatorio para contraseñas */}
          {isEditing && extraAction && (
            <TouchableOpacity onPress={extraAction}>
              <Ionicons name="shuffle-outline" size={20} color="#f59e0b" />
            </TouchableOpacity>
          )}
          {/* Botón para ver u ocultar los datos sensibles */}
          {secure && (
            <TouchableOpacity onPress={() => toggleVisibility(key)}>
              <Ionicons
                name={showSensitive[key] ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#94a3b8"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <Modal animationType="fade" transparent visible={isOpen}>
      <View className="flex-1 items-center justify-center bg-black/60 px-4">
        <View className="max-h-[85%] w-full overflow-hidden rounded-3xl bg-white shadow-2xl">
          <View className="flex-row items-center justify-between border-b border-slate-100 p-5">
            <Text className="text-xl font-bold text-slate-800">
              {isEditing
                ? 'Editando...'
                : data.type === 'CARD'
                  ? 'Tarjeta'
                  : data.type === 'NOTE'
                    ? 'Nota'
                    : 'Login'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
            {renderField(
              data.type === 'CARD' ? 'Banco' : 'Servicio',
              'serviceName',
              false,
              false,
              false
            )}

            {data.type === 'LOGIN' && (
              <>
                {renderField('Usuario', 'username', false, false, true)}
                {renderField('Contraseña', 'password', true, false, true, handleGeneratePassword)}
              </>
            )}

            {data.type === 'CARD' && (
              <>
                {renderField('Titular', 'cardholderName', false, false, false)}
                {renderField('Número', 'cardNumber', true, false, true)}
                <View className="flex-row gap-x-4">
                  <View className="flex-1">
                    {renderField('Expira', 'expiryDate', false, false, false)}
                  </View>
                  <View className="flex-1">{renderField('CVV', 'cvv', true, false, true)}</View>
                </View>
              </>
            )}

            {(data.type === 'NOTE' || isEditing || editForm.notes) &&
              renderField('Notas', 'notes', false, true, data.type === 'NOTE')}

            <View className="mt-4 flex-row gap-x-3">
              {isEditing ? (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      setEditForm({ ...data });
                      setIsEditing(false);
                    }}
                    className="flex-1 rounded-2xl bg-slate-100 py-4">
                    <Text className="text-center font-bold text-slate-600">Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    className={`flex-1 rounded-2xl py-4 ${theme.bg}`}>
                    <Text className="text-center font-bold text-white">Guardar</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={onClose}
                    className="flex-1 rounded-2xl bg-slate-100 py-4">
                    <Text className="text-center font-bold text-slate-600">Cerrar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={isOfflineMode}
                    onPress={() => setIsEditing(true)}
                    className={`flex-1 rounded-2xl py-4 ${theme.bg} flex-row items-center justify-center gap-2`}>
                    <Ionicons name="pencil" size={16} color="white" />
                    <Text className="text-center font-bold text-white">Editar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {!isEditing && (
              <TouchableOpacity
                disabled={isOfflineMode}
                onPress={handleDelete}
                className={`mt-6 mb-8 flex-row items-center justify-center p-2 ${isOfflineMode ? 'opacity-50' : ''}`}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                <Text className="ml-2 font-semibold text-red-500">Eliminar permanentemente</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
