import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import api from '@/services/api';
import { saveCredential } from '@/services/sync';
import { syncService } from '@/services/db';
import ViewCredentialModal from '@/components/ViewCredentialModal';
import AddCredentialModal from '@/components/AddCredentialModal';

const VaultScreen = () => {
  // Estado de los datos
  const [credentials, setCredentials] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Estados de control de UI
  const [menuOpen, setMenuOpen] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [itemType, setItemType] = useState('LOGIN');
  const [selectedCredential, setSelectedCredential] = useState(null);

  // --- RECARGA DE DATOS ---
  const fetchCredentials = async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);

      // Carga local
      const localData = syncService.getLocalCredentials();
      setCredentials([...localData]);

      // Verificación de la red
      const state = await NetInfo.fetch();
      if (state.isConnected && state.isInternetReachable) {
        // Obtener los datos de la nube
        const response = await api.get('/api/credentials');

        // Se limpian los datos que están en proceso de borrado local
        const cloudData = response.data
          .filter((item) => !deletedIdsRef.current.has(item.id))
          .sort((a, b) =>
            (a.serviceName || '').localeCompare(b.serviceName || '', undefined, {
              sensitivity: 'base',
            })
          );

        // 5. Se guarda en SQLite y refresca la pantalla
        syncService.saveCredentialsFromCloud(cloudData);
        setCredentials([...cloudData]);
      }
    } catch (error) {
      console.log('Trabajando en modo local.');
    } finally {
      setRefreshing(false);
    }
  };

  // --- AUTOMATIZACIÓN DE RED ---
  useEffect(() => {
    // Escucha cambios de conexión en tiempo real
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = !!(state.isConnected && state.isInternetReachable);
      fetchCredentials(true);

      setIsOfflineMode(!isConnected);
    });

    return () => unsubscribe();
  }, [isOfflineMode]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('event_refresh_messages', () => {
      fetchCredentials();
    });

    return () => {
      subscription.remove();
    };
  }, [fetchCredentials]);

  // --- LÓGICA DE ACCIONES ---

  const handleCreate = async (formData) => {
    const tempId = `temp-${Date.now()}`;
    const newItem = { ...formData, id: tempId, type: itemType };

    setAddModalVisible(false);
    setCredentials((prev) => [newItem, ...prev]); //esto guarda en la lista inmediatamente

    try {
      const state = await NetInfo.fetch();

      if (state.isConnected) {
        await saveCredential({ ...formData, type: itemType });
        fetchCredentials(true);
      } else {
        await saveCredential({ ...formData, type: itemType });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear localmente.');
      fetchCredentials(true);
    }
  };

  const handleUpdate = async (updatedData) => {
    setCredentials((prev) =>
      prev.map((item) => (item.id === updatedData.id ? { ...item, ...updatedData } : item))
    );
    setSelectedCredential(null);

    try {
      await saveCredential(updatedData);
    } catch (error) {
      console.error('Error en update:', error);
      fetchCredentials(true);
    }
  };

  const deletedIdsRef = useRef(new Set());

  const handleDeleteSuccess = (deletedId) => {
    setCredentials((prev) => prev.filter((item) => item.id !== deletedId));
    setSelectedCredential(null);

    deletedIdsRef.current.add(deletedId);

    setTimeout(() => {
      deletedIdsRef.current.delete(deletedId);
    }, 10000);
  };

  const openCreationModal = (type) => {
    setItemType(type);
    setMenuOpen(false);
    setAddModalVisible(true);
  };

  // --- RENDERIZADO DE LAS FILAS ---
  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => setSelectedCredential(item)}
      activeOpacity={0.7}
      className="mb-3 flex-row items-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <View
        className={`mr-4 h-12 w-12 items-center justify-center rounded-xl ${
          item.type === 'CARD'
            ? 'bg-emerald-50'
            : item.type === 'NOTE'
              ? 'bg-orange-50'
              : 'bg-blue-50'
        }`}>
        <Ionicons
          name={
            item.type === 'CARD'
              ? 'card-outline'
              : item.type === 'NOTE'
                ? 'document-text-outline'
                : 'lock-closed-outline'
          }
          size={24}
          color={item.type === 'CARD' ? '#10b981' : item.type === 'NOTE' ? '#f59e0b' : '#3b82f6'}
        />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-slate-900">{item.serviceName}</Text>
        <Text className="text-sm text-slate-500" numberOfLines={1}>
          {item.type === 'NOTE'
            ? item.notes
              ? item.notes
              : 'Nota Segura'
            : item.type === 'CARD'
              ? `**** ${item.cardNumber?.slice(-4) || ''}`
              : item.username || 'Sin usuario'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between bg-white px-6 pt-14 pb-6 shadow-sm">
        <View>
          <Text className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            Mi Bóveda
          </Text>
          <Text className="text-2xl font-bold text-slate-900">Lockaris</Text>
        </View>
        <Ionicons
          name={isOfflineMode ? 'cloud-offline' : 'shield-checkmark'}
          size={22}
          color={isOfflineMode ? '#f59e0b' : '#10b981'}
        />
      </View>

      <FlatList
        data={credentials}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCredentials()}
            colors={['#3b82f6']}
          />
        }
      />

      {menuOpen && (
        <View className="absolute right-8 bottom-28 z-50 items-end gap-y-3">
          {[
            {
              label: 'Nota',
              type: 'NOTE',
              icon: 'document-text',
              color: '#f59e0b',
              bg: 'bg-orange-100',
            },
            {
              label: 'Tarjeta',
              type: 'CARD',
              icon: 'card',
              color: '#10b981',
              bg: 'bg-emerald-100',
            },
            { label: 'Login', type: 'LOGIN', icon: 'key', color: '#3b82f6', bg: 'bg-blue-100' },
          ].map((btn) => (
            <TouchableOpacity
              key={btn.type}
              onPress={() => openCreationModal(btn.type)}
              className="flex-row items-center rounded-full bg-white px-4 py-2 shadow-lg">
              <Text className="mr-2 font-bold text-slate-600">{btn.label}</Text>
              <View className={`rounded-full p-2 ${btn.bg}`}>
                <Ionicons name={btn.icon} size={20} color={btn.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        className={`absolute right-8 bottom-10 z-50 h-16 w-16 items-center justify-center rounded-full shadow-xl ${menuOpen ? 'bg-slate-800' : 'bg-blue-600'}`}
        onPress={() => setMenuOpen(!menuOpen)}>
        <Ionicons name={menuOpen ? 'close' : 'add'} size={32} color="white" />
      </TouchableOpacity>

      <ViewCredentialModal
        isOpen={!!selectedCredential}
        data={selectedCredential}
        onClose={() => setSelectedCredential(null)}
        onUpdate={handleUpdate}
        onDeleteSuccess={handleDeleteSuccess}
        isOfflineMode={isOfflineMode}
      />

      <AddCredentialModal
        isOpen={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleCreate}
        itemType={itemType}
      />
    </View>
  );
};

export default VaultScreen;
