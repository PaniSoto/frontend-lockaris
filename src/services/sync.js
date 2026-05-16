import api from './api';
import { syncService } from './db';
import NetInfo from '@react-native-community/netinfo';

const revisarConexion = async () => {
  const state = await NetInfo.fetch();
  console.log('Estado de la conexión:', state);
  return state.isInternetReachable;
};

export const saveCredential = async (credential) => {
  try {
    const isUpdate = !!credential.id;
    let response;

    if (isUpdate) {
      if (!(await revisarConexion())) throw new Error('Sin conexión');

      const { id, ...payload } = credential;
      response = await api.put(`/api/credentials/${id}`, payload);

      // ¡AQUÍ ESTÁ EL TRUCO!
      // En lugar de confiar ciegamente en lo que devuelve la API (que viene encriptado),
      // actualizamos el local usando los datos del formulario 'credential'
      // pero le añadimos el ID y fechas que nos dé el servidor.
      if (response.data) {
        syncService.updateCredentialLocal({
          ...credential, 
          ...response.data, // Priorizamos ID y Timestamps del servidor
          notes: credential.notes, // Nos aseguramos de que la nota sea el texto plano
          password: credential.password // Nos aseguramos de que el password sea el texto plano
        });
      }
    } else {
      const { ...payload } = credential;
      response = await api.post('/api/credentials', payload);
      if (response.data) {
        syncService.saveLocalCredential(response.data);
      }
    }
    return response.data;
  } catch (error) {
    if (error.message === 'Sin conexión' || error.isOffline) {
      syncService.updateCredentialLocal({ ...credential, offline: true });
      syncService.queueAction(credential, credential.id ? 'UPDATE' : 'CREATE');
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
