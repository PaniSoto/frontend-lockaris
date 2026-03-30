import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
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

  useEffect(() => {
    if (isOpen) setLocalForm(initialState);
  }, [isOpen]);

  const handleLocalSave = () => {
    onSave(localForm);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\D/g, '');
    const matches = v.match(/.{1,4}/g);
    return matches ? matches.join(' ').substring(0, 19) : v;
  };

  return (
    <Modal animationType="slide" transparent={false} visible={isOpen} onRequestClose={onClose}>
      {/* Usamos KeyboardAvoidingView para que el teclado empuje el contenido */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-white">
            {/* CABECERA: Se mantiene fija arriba */}
            <View className="flex-row items-center justify-between border-b border-slate-200 bg-slate-50 p-8 pt-16">
              <View>
                <Text className="text-xs font-bold tracking-widest text-blue-500 uppercase">
                  Crear Nuevo
                </Text>
                <Text className="text-2xl font-bold text-slate-900">
                  {itemType === 'LOGIN' ? 'Login' : itemType === 'CARD' ? 'Tarjeta' : 'Nota'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} className="p-1">
                <Ionicons name="close-circle" size={36} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {/* FORMULARIO: Con Scroll para que nada quede oculto tras el teclado */}
            <ScrollView
              className="flex-1 px-8"
              contentContainerStyle={{ paddingVertical: 24, paddingBottom: 60 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <View className="gap-y-5">
                {/* Título / Servicio */}
                <View>
                  <Text className="mb-2 ml-1 font-semibold text-slate-600">Título / Servicio</Text>
                  <TextInput
                    className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-slate-900"
                    placeholder="Ej: Netflix, Amazon..."
                    placeholderTextColor="#94a3b8"
                    value={localForm.serviceName}
                    onChangeText={(t) => setLocalForm({ ...localForm, serviceName: t })}
                  />
                </View>

                {/* LOGIN */}
                {itemType === 'LOGIN' && (
                  <>
                    <View>
                      <Text className="mb-2 ml-1 font-semibold text-slate-600">Usuario</Text>
                      <TextInput
                        className="rounded-2xl border border-slate-200 bg-slate-100 p-4"
                        autoCapitalize="none"
                        value={localForm.username}
                        onChangeText={(t) => setLocalForm({ ...localForm, username: t })}
                      />
                    </View>
                    <View>
                      <Text className="mb-2 ml-1 font-semibold text-slate-600">Contraseña</Text>
                      <TextInput
                        className="rounded-2xl border border-slate-200 bg-slate-100 p-4"
                        secureTextEntry
                        value={localForm.password}
                        onChangeText={(t) => setLocalForm({ ...localForm, password: t })}
                      />
                    </View>
                  </>
                )}

                {/* TARJETAS */}
                {itemType === 'CARD' && (
                  <>
                    <View>
                      <Text className="mb-2 ml-1 font-semibold text-slate-600">
                        Nombre en Tarjeta
                      </Text>
                      <TextInput
                        className="rounded-2xl border border-slate-200 bg-slate-100 p-4 uppercase"
                        placeholder="JUAN PEREZ"
                        value={localForm.cardholderName}
                        onChangeText={(t) => setLocalForm({ ...localForm, cardholderName: t })}
                      />
                    </View>
                    <View>
                      <Text className="mb-2 ml-1 font-semibold text-slate-600">
                        Número de Tarjeta
                      </Text>
                      <TextInput
                        className="rounded-2xl border border-slate-200 bg-slate-100 p-4"
                        keyboardType="numeric"
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        value={localForm.cardNumber}
                        onChangeText={(t) =>
                          setLocalForm({ ...localForm, cardNumber: formatCardNumber(t) })
                        }
                      />
                    </View>
                    <View className="flex-row gap-x-4">
                      <View className="flex-1">
                        <Text className="mb-2 ml-1 font-semibold text-slate-600">Expira</Text>
                        <TextInput
                          className="rounded-2xl border border-slate-200 bg-slate-100 p-4"
                          placeholder="MM/AA"
                          keyboardType="numeric"
                          maxLength={5}
                          value={localForm.expiryDate}
                          onChangeText={(t) => {
                            let text = t.replace(/\D/g, '');
                            if (text.length > 2)
                              text = text.substring(0, 2) + '/' + text.substring(2, 4);
                            setLocalForm({ ...localForm, expiryDate: text });
                          }}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="mb-2 ml-1 font-semibold text-slate-600">CVV</Text>
                        <TextInput
                          className="rounded-2xl border border-slate-200 bg-slate-100 p-4"
                          secureTextEntry
                          keyboardType="numeric"
                          maxLength={4}
                          placeholder="123"
                          value={localForm.cvv}
                          onChangeText={(t) =>
                            setLocalForm({ ...localForm, cvv: t.replace(/\D/g, '') })
                          }
                        />
                      </View>
                    </View>
                  </>
                )}

                {/* NOTAS */}
                <View>
                  <Text className="mb-2 ml-1 font-semibold text-slate-600">Notas Adicionales</Text>
                  <TextInput
                    className="h-32 rounded-2xl border border-slate-200 bg-slate-100 p-4 text-slate-900"
                    multiline
                    textAlignVertical="top"
                    value={localForm.notes}
                    onChangeText={(t) => setLocalForm({ ...localForm, notes: t })}
                  />
                </View>

                {/* BOTÓN: Con un poco de margen extra para que no pegue al teclado */}
                <TouchableOpacity
                  onPress={handleLocalSave}
                  activeOpacity={0.8}
                  className="mt-4 rounded-2xl bg-blue-600 py-5 shadow-xl shadow-blue-300">
                  <Text className="text-center text-lg font-bold text-white">
                    Guardar en Bóveda
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
