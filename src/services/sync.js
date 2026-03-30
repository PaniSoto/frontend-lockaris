import api from './api';
import { syncService } from './db';
import NetInfo from '@react-native-community/netinfo';

// valida conectividad real antes de disparar las peticiones
const revisarConexion = async () => {
  const state = await NetInfo.fetch();
  console.log('Estado de la conexión:', state);
  return state.isInternetReachable;
};

// Lógica de guardado al crear o actualizar
export const saveCredential = async (credential) => {
  try {
    const isUpdate = !!credential.id;
    let response;

    if (isUpdate) {
      if (!(await revisarConexion())) {
        return;
      }

      const { id, offline, ...payload } = credential;
      console.log('la credencial:', credential);
      response = await api.put(`/api/credentials/${id}`, payload);
      console.log('Llamando a PUT en:', `/api/credentials/${id}`);
      console.log('Actualización exitosa en la API');
    } else {
      const { offline, ...payload } = credential;
      console.log('credencial al crearse', credential);
      response = await api.post('/api/credentials', payload);
      console.log('Respuesta de creación:', response.data);
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

export const deleteCredential = async (id) => {
  try {
    // Como bloqueamos borrar offline en la UI, aquí suponemos que hay red
    // Pero si falla la red en el último segundo, lanzamos error
    if (!(await revisarConexion())) {
      throw new Error('Sin conexión');
    }

    await api.delete(`/api/credentials/${id}`);

    // ¡IMPORTANTE! Borramos de la tabla de visualización para que no resucite
    syncService.deleteLocalCredential(id);

    return { success: true };
  } catch (error) {
    console.error('Error al eliminar:', error);
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

    console.log(` Sincronizando ${pending.length} acciones pendientes...`);

    for (const item of pending) {
      try {
        const payload = JSON.parse(item.data);

        if (item.action === 'DELETE') {
          const targetId = payload.id;
          console.log(` Enviando DELETE a Neon para ID: ${targetId}`);
          await api.delete(`/api/credentials/${targetId}`);
        } else if (item.action === 'UPDATE' && payload.id) {
          const { id, offline, ...body } = payload;
          await api.put(`/api/credentials/${id}`, body);
        } else if (item.action === 'CREATE') {
          const { id, offline, ...body } = payload;
          await api.post('/api/credentials', body);
        }

        // Si la petición tuvo éxito se borra de la cola local
        syncService.removePendingAction(item.id);
        console.log(` Acción ${item.action} sincronizada.`);
      } catch (e) {
        if (e.response?.status === 404 || e.response?.status === 400) {
          console.warn(
            ` Item ${item.id} descartado (No encontrado en servidor o error de formato).`
          );
          syncService.removePendingAction(item.id);
          continue;
        }

        // Si es error de conexión, paramos el bucle y se sale
        if (!e.response || e.message === 'Network Error') {
          console.log(' Seguimos sin conexión, abortando sincronización.');
          break;
        }

        console.error(` Error en ítem ${item.id}:`, e.response?.data || e.message);
      }
    }
  } catch (error) {
    console.error('Fallo general en proceso de sync:', error);
  }
};
