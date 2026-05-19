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
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) setLocalForm(initialState);
  }, [isOpen]);

  // --- LÓGICA DE VALIDACIÓN ---
  const isFormValid = () => {
    // El nombre del servicio siempre es obligatorio
    if (!localForm.serviceName.trim()) return false;

    if (itemType === 'LOGIN') {
      return localForm.username.trim() !== '' && localForm.password.trim() !== '';
    }

    if (itemType === 'CARD') {
      return (
        localForm.cardholderName.trim() !== '' &&
        localForm.cardNumber.replace(/\s/g, '').length >= 15 && // Mínimo para Amex/Visa
        localForm.expiryDate.length === 5 &&
        localForm.cvv.length >= 3
      );
    }

    if (itemType === 'NOTE') {
      return localForm.notes.trim() !== '';
    }

    return false;
  };

  const handleLocalSave = () => {
    if (isFormValid()) {
      onSave(localForm);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\D/g, '');
    const matches = v.match(/.{1,4}/g);
    return matches ? matches.join(' ').substring(0, 19) : v;
  };

  const handleGeneratePassword = () => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setLocalForm((prev) => ({ ...prev, password: newPassword }));
    setShowPassword(true);
  };

  const formReady = isFormValid();

  return (
    <Modal animationType="slide" transparent={false} visible={isOpen} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-white">
            {/* CABECERA */}
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

            <ScrollView
              className="flex-1 px-8"
              contentContainerStyle={{ paddingVertical: 24, paddingBottom: 60 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <View className="gap-y-5">
                {/* Título / Servicio */}
                <View>
                  <Text className="mb-2 ml-1 font-semibold text-slate-600">
                    Título / Servicio *
                  </Text>
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
                      <Text className="mb-2 ml-1 font-semibold text-slate-600">Usuario *</Text>
                      <TextInput
                        className="rounded-2xl border border-slate-200 bg-slate-100 p-4"
                        autoCapitalize="none"
                        placeholder='Ej: Juan Lucena'
                        placeholderTextColor="#94a3b8"
                        value={localForm.username}
                        onChangeText={(t) => setLocalForm({ ...localForm, username: t })}
                      />
                    </View>

                    <View>
                      <Text className="mb-2 ml-1 font-semibold text-slate-600">Contraseña *</Text>
                      <View className="relative justify-center">
                        <TextInput
                          className="rounded-2xl border border-slate-200 bg-slate-100 p-4 pr-24"
                          secureTextEntry={!showPassword}
                          placeholder="••••••••"
                          placeholderTextColor="#94a3b8"
                          value={localForm.password}
                          onChangeText={(t) => setLocalForm({ ...localForm, password: t })}
                        />
                        <View className="absolute right-4 flex-row items-center gap-x-3">
                          <TouchableOpacity onPress={handleGeneratePassword}>
                            <Ionicons name="shuffle-outline" size={20} color="#f59e0b" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons
                              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                              size={22}
                              color="#94a3b8"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </>
                )}

                {/* TARJETAS */}
                {itemType === 'CARD' && (
                  <>
                    <View>
                      <Text className="mb-2 ml-1 font-semibold text-slate-600">
                        Nombre en Tarjeta *
                      </Text>
                      <TextInput
                        className="rounded-2xl border border-slate-200 bg-slate-100 p-4"
                        placeholder="Juan Lucena"
                        placeholderTextColor="#94a3b8"
                        value={localForm.cardholderName}
                        onChangeText={(t) => setLocalForm({ ...localForm, cardholderName: t })}
                      />
                    </View>
                    <View>
                      <Text className="mb-2 ml-1 font-semibold text-slate-600">
                        Número de Tarjeta *
                      </Text>
                      <TextInput
                        className="rounded-2xl border border-slate-200 bg-slate-100 p-4"
                        keyboardType="numeric"
                        placeholder="0000 0000 0000 0000"
                        placeholderTextColor="#94a3b8"
                        maxLength={19}
                        value={localForm.cardNumber}
                        onChangeText={(t) =>
                          setLocalForm({ ...localForm, cardNumber: formatCardNumber(t) })
                        }
                      />
                    </View>
                    <View className="flex-row gap-x-4">
                      {/* Sección de Tarjeta - Campo Expira */}
                      <View className="flex-1">
                        <Text className="mb-2 ml-1 font-semibold text-slate-600">Expira *</Text>
                        <TextInput
                          className="rounded-2xl border border-slate-200 bg-slate-100 p-4"
                          placeholder="MM/AA"
                          placeholderTextColor="#94a3b8"
                          keyboardType="numeric"
                          maxLength={5}
                          value={localForm.expiryDate}
                          onChangeText={(t) => {
                            // 1. Quitamos cualquier caracter que no sea número
                            let text = t.replace(/\D/g, '');

                            // 2. Validación del Mes (primeros dos dígitos)
                            if (text.length >= 2) {
                              let month = parseInt(text.substring(0, 2));
                              if (month > 12) month = 12; // Forzamos a 12 si el usuario pone algo mayor
                              if (month === 0) month = 1; // Evitamos mes 00

                              // Formateamos el mes de nuevo a string con padding (ej: "05")
                              const monthStr = month.toString().padStart(2, '0');
                              text = monthStr + text.substring(2, 4);
                            }

                            // 3. Insertar la barra "/" automáticamente
                            if (text.length > 2) {
                              text = text.substring(0, 2) + '/' + text.substring(2, 4);
                            }

                            setLocalForm({ ...localForm, expiryDate: text });
                          }}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="mb-2 ml-1 font-semibold text-slate-600">CVV *</Text>
                        <TextInput
                          className="rounded-2xl border border-slate-200 bg-slate-100 p-4"
                          secureTextEntry
                          placeholderTextColor="#94a3b8"
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
                  <Text className="mb-2 ml-1 font-semibold text-slate-600">
                    Notas Adicionales {itemType === 'NOTE' ? '*' : ''}
                  </Text>
                  <TextInput
                    className="h-32 rounded-2xl border border-slate-200 bg-slate-100 p-4 text-slate-900"
                    multiline
                    textAlignVertical="top"
                    value={localForm.notes}
                    onChangeText={(t) => setLocalForm({ ...localForm, notes: t })}
                  />
                </View>

                {/* BOTÓN CON VALIDACIÓN */}
                <TouchableOpacity
                  onPress={handleLocalSave}
                  disabled={!formReady}
                  activeOpacity={0.8}
                  className={`mt-4 rounded-2xl py-5 shadow-xl ${
                    formReady ? 'bg-blue-600 shadow-blue-300' : 'bg-slate-300 shadow-transparent'
                  }`}>
                  <Text
                    className={`text-center text-lg font-bold ${formReady ? 'text-white' : 'text-slate-500'}`}>
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
