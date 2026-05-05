import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';

const db = SQLite.openDatabaseSync('lockaris_db_1');

export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      email TEXT UNIQUE,
      createdAt TEXT
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS credentials (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      serviceName TEXT NOT NULL,
      notes TEXT,
      username TEXT,
      url TEXT,
      encryptedPassword TEXT,
      cardholderName TEXT,
      encryptedCardNumber TEXT,
      encryptedCvv TEXT,
      expiryDate TEXT,
      iv TEXT NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      userId TEXT,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS pending_sync (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
  `);
};

export const syncService = {
  // Guarda/Actualiza una sola credencial en el móvil (Evita que resuciten datos viejos)
  saveLocalCredential: (c) => {
    db.runSync(
      `INSERT OR REPLACE INTO credentials (
        id, type, serviceName, notes, username, url, 
        encryptedPassword, cardholderName, encryptedCardNumber, 
        encryptedCvv, expiryDate, iv, createdAt, updatedAt, userId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id,
        c.type,
        c.serviceName,
        c.notes || '',
        c.username || '',
        c.url || '',
        c.password || c.encryptedPassword || '', // Unificado
        c.cardholderName || '',
        c.cardNumber || c.encryptedCardNumber || '', // Unificado
        c.cvv || c.encryptedCvv || '', // Unificado
        c.expiryDate || '',
        c.iv || 'pending',
        c.createdAt || new Date().toISOString(),
        c.updatedAt || new Date().toISOString(),
        c.userId || null,
      ]
    );
  },

  updateCredentialLocal: (c) => {
    try {
      db.runSync(
        `UPDATE credentials SET 
          type = ?, serviceName = ?, notes = ?, username = ?, url = ?, 
          encryptedPassword = ?, cardholderName = ?, encryptedCardNumber = ?, 
          encryptedCvv = ?, expiryDate = ?, iv = ?, updatedAt = ?
        WHERE id = ?`,
        [
          c.type,
          c.serviceName,
          c.notes || '',
          c.username || '',
          c.url || '',
          c.password || c.encryptedPassword || '',
          c.cardholderName || '',
          c.cardNumber || c.encryptedCardNumber || '',
          c.cvv || c.encryptedCvv || '',
          c.expiryDate || '',
          c.iv || 'pending',
          c.updatedAt || new Date().toISOString(),
          c.id,
        ]
      );
    } catch (error) {
      console.error('Error actualizando local:', error);
    }
  },

  // ELIMINA de la tabla de visualización (Para que no se vea offline)
  deleteLocalCredential: (id) => {
    db.runSync('DELETE FROM credentials WHERE id = ?', [id]);
  },

  saveCredentialsFromCloud: (credentialsArray) => {
    db.withTransactionSync(() => {
      db.runSync('DELETE FROM credentials');
      const statement = db.prepareSync(`
        INSERT INTO credentials (
          id, type, serviceName, notes, username, url, 
          encryptedPassword, cardholderName, encryptedCardNumber, 
          encryptedCvv, expiryDate, iv, createdAt, updatedAt, userId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      try {
        credentialsArray.forEach((c) => {
          statement.executeSync([
            c.id,
            c.type,
            c.serviceName,
            c.notes || '',
            c.username || '',
            c.url || '',
            c.password || c.encryptedPassword || '', // 👈 CORREGIDO AQUÍ TAMBIÉN
            c.cardholderName || '',
            c.cardNumber || c.encryptedCardNumber || '', // 👈 CORREGIDO AQUÍ TAMBIÉN
            c.cvv || c.encryptedCvv || '', // 👈 CORREGIDO AQUÍ TAMBIÉN
            c.expiryDate || '',
            c.iv || 'pending',
            c.createdAt,
            c.updatedAt,
            c.userId,
          ]);
        });
      } finally {
        statement.finalizeSync();
      }
    });
  },

  getLocalCredentials: () => {
    const rows = db.getAllSync('SELECT * FROM credentials ORDER BY serviceName ASC');
    return rows.map((c) => ({
      ...c,
      // Mapeo inverso: Aseguramos que el objeto que sale de la DB tenga los nombres que el Modal espera
      cardNumber: c.encryptedCardNumber || '',
      password: c.encryptedPassword || '',
      cvv: c.encryptedCvv || '',
    }));
  },

  queueAction: (data, action) => {
    db.runSync('INSERT INTO pending_sync (data, action, timestamp) VALUES (?, ?, ?)', [
      JSON.stringify(data),
      action,
      Date.now(),
    ]);
  },

  getPendingActions: () => {
    return db.getAllSync('SELECT * FROM pending_sync ORDER BY timestamp ASC');
  },

  removePendingAction: (id) => {
    db.runSync('DELETE FROM pending_sync WHERE id = ?', [id]);
  },
};

export const authService = {
  setSession: (user) => {
    db.runSync('DELETE FROM users');
    db.runSync('INSERT INTO users (id, name, email, createdAt) VALUES (?, ?, ?, ?)', [
      user.id,
      user.name,
      user.email,
      new Date().toISOString(),
    ]);
  },

  getCurrentUser: () => db.getFirstSync('SELECT * FROM users'),

  updateUser: (id, name, email) => {
    db.runSync('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);
    return db.getFirstSync('SELECT * FROM users WHERE id = ?', [id]);
  },

  // --- GESTIÓN DE TOKEN ---
  getToken: async () => {
    return await SecureStore.getItemAsync('userToken');
  },

  saveToken: async (token) => {
    await SecureStore.setItemAsync('userToken', token);
  },

  // --- GESTIÓN DE BIOMETRÍA ---
  saveBiometricPreference: async (enabled) => {
    await SecureStore.setItemAsync('useBiometrics', enabled ? 'true' : 'false');
  },

  getBiometricPreference: async () => {
    const res = await SecureStore.getItemAsync('useBiometrics');
    if (res === null) return null;
    return res === 'true';
  },

  // --- CIERRE DE SESIÓN ---
  logout: async () => {
    db.runSync('DELETE FROM users');
    db.runSync('DELETE FROM credentials');
    db.runSync('DELETE FROM pending_sync');
    await SecureStore.deleteItemAsync('userToken');
  },
};

export default db;
