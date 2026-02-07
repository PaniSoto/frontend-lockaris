import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddCredentialModal({ isOpen, onClose, onSave, itemType }) {
  const initialState = {
    serviceName: '',
    username: '',
    password: '',
    notes: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  };

  const [localForm, setLocalForm] = useState(initialState);

  // Limpiar el formulario cada vez que el modal se abre
  useEffect(() => {
    if (isOpen) setLocalForm(initialState);
  }, [isOpen]);

  const handleLocalSave = () => {
    // Envía los datos recolectados al componente padre
    onSave(localForm);
  };

  return (
    <Modal animationType="slide" transparent visible={isOpen} onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="h-[85%] rounded-t-[40px] bg-white p-8">
          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold tracking-widest text-blue-500 uppercase">
                Crear Nuevo
              </Text>
              <Text className="text-2xl font-bold text-slate-900">
                {itemType === 'LOGIN' ? 'Login' : itemType === 'CARD' ? 'Tarjeta' : 'Nota'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={32} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={[{ key: 'form' }]}
            showsVerticalScrollIndicator={false}
            renderItem={() => (
              <View className="gap-y-4 pb-20">
                <View>
                  <Text className="mb-1 ml-1 font-medium text-slate-500">Título / Servicio</Text>
                  <TextInput
                    className="rounded-2xl bg-slate-100 p-4 text-slate-900"
                    placeholder="Ej: Netflix, Amazon..."
                    value={localForm.serviceName}
                    onChangeText={(t) => setLocalForm({ ...localForm, serviceName: t })}
                  />
                </View>

                {/* CAMPOS DEL LOGIN */}
                {itemType === 'LOGIN' && (
                  <>
                    <View>
                      <Text className="mb-1 ml-1 font-medium text-slate-500">Usuario</Text>
                      <TextInput
                        className="rounded-2xl bg-slate-100 p-4"
                        autoCapitalize="none"
                        value={localForm.username}
                        onChangeText={(t) => setLocalForm({ ...localForm, username: t })}
                      />
                    </View>
                    <View>
                      <Text className="mb-1 ml-1 font-medium text-slate-500">Contraseña</Text>
                      <TextInput
                        className="rounded-2xl bg-slate-100 p-4"
                        secureTextEntry
                        value={localForm.password}
                        onChangeText={(t) => setLocalForm({ ...localForm, password: t })}
                      />
                    </View>
                  </>
                )}

                {/* CAMPOS DE LAS TARJETAS */}
                {itemType === 'CARD' && (
                  <>
                    <View>
                      <Text className="mb-1 ml-1 font-medium text-slate-500">
                        Nombre en Tarjeta
                      </Text>
                      <TextInput
                        className="rounded-2xl bg-slate-100 p-4 uppercase"
                        placeholder="JUAN PEREZ"
                        value={localForm.cardholderName}
                        onChangeText={(t) => setLocalForm({ ...localForm, cardholderName: t })}
                      />
                    </View>
                    <View>
                      <Text className="mb-1 ml-1 font-medium text-slate-500">Número</Text>
                      <TextInput
                        className="rounded-2xl bg-slate-100 p-4"
                        keyboardType="numeric"
                        placeholder="**** **** **** ****"
                        value={localForm.cardNumber}
                        onChangeText={(t) => setLocalForm({ ...localForm, cardNumber: t })}
                      />
                    </View>
                    <View className="flex-row gap-x-4">
                      <View className="flex-1">
                        <Text className="mb-1 ml-1 font-medium text-slate-500">Expira</Text>
                        <TextInput
                          className="rounded-2xl bg-slate-100 p-4"
                          placeholder="MM/AA"
                          value={localForm.expiryDate}
                          onChangeText={(t) => setLocalForm({ ...localForm, expiryDate: t })}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="mb-1 ml-1 font-medium text-slate-500">CVV</Text>
                        <TextInput
                          className="rounded-2xl bg-slate-100 p-4"
                          secureTextEntry
                          keyboardType="numeric"
                          value={localForm.cvv}
                          onChangeText={(t) => setLocalForm({ ...localForm, cvv: t })}
                        />
                      </View>
                    </View>
                  </>
                )}

                {/* CAMPO DE LAS NOTAS */}
                <View>
                  <Text className="mb-1 ml-1 font-medium text-slate-500">Notas</Text>
                  <TextInput
                    className="h-24 rounded-2xl bg-slate-100 p-4 text-slate-900"
                    multiline
                    textAlignVertical="top"
                    value={localForm.notes}
                    onChangeText={(t) => setLocalForm({ ...localForm, notes: t })}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleLocalSave}
                  className="mt-4 rounded-2xl bg-blue-600 py-4 shadow-lg shadow-blue-200">
                  <Text className="text-center text-lg font-bold text-white">
                    Guardar en Bóveda
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
