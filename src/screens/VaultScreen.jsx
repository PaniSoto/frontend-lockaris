import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [credentials, setCredentials] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [ui, setUi] = useState({ menuOpen: false, addModalVisible: false, itemType: 'LOGIN' });
  const [selectedCredential, setSelectedCredential] = useState(null);
  const deletedIdsRef = useRef(new Set());

  const fetchCredentials = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);

      // Carga inmediata desde SQLite
      const localData = syncService.getLocalCredentials();
      setCredentials([...localData]);

      const state = await NetInfo.fetch();
      if (state.isConnected && state.isInternetReachable) {
        const { data } = await api.get('/api/credentials');
        const cloudData = data
          .filter((item) => !deletedIdsRef.current.has(item.id))
          .sort((a, b) => (a.serviceName || '').localeCompare(b.serviceName || ''));

        syncService.saveCredentialsFromCloud(cloudData);
        setCredentials([...cloudData]);
      }
    } catch (error) {
      console.log('Modo local activo');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOfflineMode(!(state.isConnected && state.isInternetReachable));
      fetchCredentials(true);
    });
    const sub = DeviceEventEmitter.addListener('event_refresh_messages', () => fetchCredentials());
    return () => {
      unsubscribe();
      sub.remove();
    };
  }, [fetchCredentials]);

  const handleAction = async (type, data) => {
    if (type === 'CREATE') {
      // 1. Crear el objeto con ID temporal y el tipo correcto
      const newItem = {
        ...data,
        id: `temp-${Date.now()}`,
        type: ui.itemType,
        createdAt: new Date().toISOString(),
      };

      // Actualiza la interfaz de inmediato
      setCredentials((prev) => [newItem, ...prev]);
      setUi((prev) => ({ ...prev, addModalVisible: false }));

      // 3. GUARDADO LOCAL OBLIGATORIO
      // Se asegura de que si cierras la app sin conexión, el dato no se pierda
      syncService.saveLocalCredential(newItem);

      try {
        // Se intenta guardar en la nube
        await saveCredential({ ...data, type: ui.itemType });

        // Si tiene éxito, se refresca para cambiar el ID 'temp' por el de la DB
        fetchCredentials(true);
      } catch (e) {
        // 5. Si falla la red, se registra la acción en la cola de pendientes
        syncService.queueAction(newItem, 'CREATE');

        Alert.alert(
          'Modo Offline',
          'La credencial se guardó en el dispositivo y se sincronizará cuando tengas internet.'
        );
      }
    }
  };

  const renderItem = ({ item }) => (
    <VaultItem item={item} onPress={() => setSelectedCredential(item)} />
  );

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between bg-white px-6 pt-14 pb-6 shadow-sm">
        <View>
          <Text className="text-2xl font-extrabold text-slate-900">Bóveda</Text>
        </View>
        <Ionicons
          name={isOfflineMode ? 'cloud-offline' : 'shield-checkmark'}
          size={24}
          color={isOfflineMode ? '#f59e0b' : '#10b981'}
        />
      </View>

      <FlatList
        data={credentials}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchCredentials} />}
      />

      {ui.menuOpen && (
        <FloatingMenu
          onSelect={(type) =>
            setUi({ ...ui, itemType: type, menuOpen: false, addModalVisible: true })
          }
        />
      )}

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setUi({ ...ui, menuOpen: !ui.menuOpen })}
        className={`absolute right-6 bottom-10 z-50 h-16 w-16 items-center justify-center rounded-full shadow-xl ${ui.menuOpen ? 'bg-slate-800' : 'bg-blue-600'}`}>
        <Ionicons name={ui.menuOpen ? 'close' : 'add'} size={32} color="white" />
      </TouchableOpacity>

      <ViewCredentialModal
        isOpen={!!selectedCredential}
        data={selectedCredential}
        onClose={() => setSelectedCredential(null)}
        onUpdate={(d) => {
          setCredentials((prev) => prev.map((i) => (i.id === d.id ? d : i)));
          setSelectedCredential(null);
          saveCredential(d);
        }}
        onDeleteSuccess={(id) => {
          setCredentials((prev) => prev.filter((i) => i.id !== id));
          deletedIdsRef.current.add(id);
          setSelectedCredential(null);
        }}
        isOfflineMode={isOfflineMode}
      />

      <AddCredentialModal
        isOpen={ui.addModalVisible}
        onClose={() => setUi({ ...ui, addModalVisible: false })}
        onSave={(data) => handleAction('CREATE', data)}
        itemType={ui.itemType}
      />
    </View>
  );
};

const VaultItem = ({ item, onPress }) => {
  const config = {
    CARD: { icon: 'card-outline', color: '#10b981', bg: 'bg-emerald-50' },
    NOTE: { icon: 'document-text-outline', color: '#f59e0b', bg: 'bg-orange-50' },
    LOGIN: { icon: 'lock-closed-outline', color: '#3b82f6', bg: 'bg-blue-50' },
  }[item.type] || { icon: 'key-outline', color: '#64748b', bg: 'bg-slate-50' };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <View className={`mr-4 h-12 w-12 items-center justify-center rounded-xl ${config.bg}`}>
        <Ionicons name={config.icon} size={22} color={config.color} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-slate-900">{item.serviceName}</Text>
        <Text className="text-xs text-slate-500" numberOfLines={1}>
          {item.type === 'CARD'
            ? `**** ${item.cardNumber?.slice(-4)}`
            : item.type === 'NOTE'
              ? item.notes || 'Nota vacía'
              : item.username || 'Sin usuario'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </TouchableOpacity>
  );
};

const FloatingMenu = ({ onSelect }) => (
  <View className="absolute right-6 bottom-28 z-50 items-end gap-y-3">
    {[
      { label: 'Nota', type: 'NOTE', icon: 'document-text', color: '#f59e0b', bg: 'bg-orange-100' },
      { label: 'Tarjeta', type: 'CARD', icon: 'card', color: '#10b981', bg: 'bg-emerald-100' },
      { label: 'Login', type: 'LOGIN', icon: 'key', color: '#3b82f6', bg: 'bg-blue-100' },
    ].map((btn) => (
      <TouchableOpacity
        key={btn.type}
        onPress={() => onSelect(btn.type)}
        className="flex-row items-center rounded-full bg-white px-4 py-2 shadow-lg">
        <Text className="mr-3 font-semibold text-slate-600">{btn.label}</Text>
        <View className={`rounded-full p-2 ${btn.bg}`}>
          <Ionicons name={btn.icon} size={18} color={btn.color} />
        </View>
      </TouchableOpacity>
    ))}
  </View>
);

export default VaultScreen;
