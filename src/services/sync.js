import api from './api';
import { syncService } from './db';

/**
 * Guarda o Actualiza una credencial
 */
export const saveCredential = async (credential) => {
  try {
    const isUpdate = !!credential.id;
    let response;

    if (isUpdate) {
      const { id, offline, ...payload } = credential;
      response = await api.put(`/api/credentials/${id}`, payload);
      console.log('Actualización exitosa en la API');
    } else {
      const { offline, ...payload } = credential;
      response = await api.post('/api/credentials', payload);
      console.log('Creación exitosa en la API');
    }

    return response.data;
  } catch (error) {
    const isNoConnection =
      error.isOffline || error.message === 'Network Error' || error.code === 'ECONNABORTED';

    if (isNoConnection) {
      const actionType = credential.id ? 'UPDATE' : 'CREATE';
      console.log(`Modo Offline: Encolando acción ${actionType}`);
      syncService.queueAction(credential, actionType);
      return { ...credential, offline: true };
    }
    throw error;
  }
};

/**
 * Elimina una credencial
 */
export const deleteCredential = async (id) => {
  try {
    await api.delete(`/api/credentials/${id}`);
    console.log('Eliminación exitosa en la API');
    return { success: true, offline: false };
  } catch (error) {
    const isNoConnection =
      error.isOffline || error.message === 'Network Error' || error.code === 'ECONNABORTED';

    if (isNoConnection) {
      console.log('Modo Offline: Encolando eliminación para ID:', id);
      // Guardamos el id explícitamente en el objeto data de la cola
      syncService.queueAction({ id }, 'DELETE');
      return { success: true, offline: true };
    }
    throw error;
  }
};

/**
 * Procesa la cola secuencialmente
 */
export const syncPendingChanges = async () => {
  try {
    const pending = syncService.getPendingActions();
    if (pending.length === 0) return;

    console.log(`🔄 Sincronizando ${pending.length} acciones pendientes...`);

    for (const item of pending) {
      try {
        const payload = JSON.parse(item.data);

        if (item.action === 'DELETE') {
          // Aseguramos que payload.id sea el UUID de Neon
          const targetId = payload.id;
          console.log(`🗑️ Enviando DELETE a Neon para ID: ${targetId}`);
          await api.delete(`/api/credentials/${targetId}`);
        } else if (item.action === 'UPDATE' && payload.id) {
          const { id, offline, ...body } = payload;
          await api.put(`/api/credentials/${id}`, body);
        } else if (item.action === 'CREATE') {
          const { id, offline, ...body } = payload;
          await api.post('/api/credentials', body);
        }

        // Si la petición tuvo éxito, borramos de la cola local
        syncService.removePendingAction(item.id);
        console.log(`✅ Acción ${item.action} sincronizada.`);
      } catch (e) {
        // ERROR CRÍTICO: Si el servidor dice 404, el registro ya no existe o el ID está mal.
        // Lo borramos de la cola para no trabar el resto de la sincronización.
        if (e.response?.status === 404 || e.response?.status === 400) {
          console.warn(
            `⚠️ Ítem ${item.id} descartado (No encontrado en servidor o error de formato).`
          );
          syncService.removePendingAction(item.id);
          continue;
        }

        // Si es error de conexión, paramos el bucle y salimos
        if (!e.response || e.message === 'Network Error') {
          console.log('📶 Seguimos sin conexión, abortando sincronización.');
          break;
        }

        console.error(`❌ Error en ítem ${item.id}:`, e.response?.data || e.message);
      }
    }
  } catch (error) {
    console.error('Fallo general en proceso de sync:', error);
  }
};
