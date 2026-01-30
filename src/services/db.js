import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';

// 1. Conexión a la base de datos
const db = SQLite.openDatabaseSync('lockaris_db_1');

// 2. Inicialización de tablas
export const initDB = () => {
  // Tabla de Usuarios
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      email TEXT UNIQUE,
      createdAt TEXT
    );
  `);

  // Tabla de Credenciales
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

  // NUEVA: Tabla de Sincronización Pendiente
  db.execSync(`
    CREATE TABLE IF NOT EXISTS pending_sync (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
  `);
};

// 3. Servicio de Datos y Sincronización
export const syncService = {
  // Guarda lo que viene de la nube (limpia y reescribe)
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
        credentialsArray.forEach(c => {
          statement.executeSync([
            c.id, c.type, c.serviceName, c.notes || '', c.username || '', c.url || '',
            c.encryptedPassword || '', c.cardholderName || '', c.encryptedCardNumber || '',
            c.encryptedCvv || '', c.expiryDate || '', c.iv, c.createdAt, c.updatedAt, c.userId
          ]);
        });
      } finally {
        statement.finalizeSync();
      }
    });
  },

  getLocalCredentials: () => {
    return db.getAllSync('SELECT * FROM credentials ORDER BY serviceName ASC');
  },

  // --- LÓGICA OFFLINE ---
  queueAction: (data, action) => {
    db.runSync(
      'INSERT INTO pending_sync (data, action, timestamp) VALUES (?, ?, ?)',
      [JSON.stringify(data), action, Date.now()]
    );
  },

  getPendingActions: () => {
    return db.getAllSync('SELECT * FROM pending_sync ORDER BY timestamp ASC');
  },

  removePendingAction: (id) => {
    db.runSync('DELETE FROM pending_sync WHERE id = ?', [id]);
  }
};

// 4. Servicio de Autenticación
export const authService = {
  setSession: (user) => {
    db.runSync('DELETE FROM users');
    db.runSync(
      'INSERT INTO users (id, name, email, createdAt) VALUES (?, ?, ?, ?)',
      [user.id, user.name, user.email, new Date().toISOString()]
    );
  },
  getCurrentUser: () => db.getFirstSync('SELECT * FROM users'),
  logout: async () => {
    db.runSync('DELETE FROM users');
    db.runSync('DELETE FROM credentials'); 
    db.runSync('DELETE FROM pending_sync');
    await SecureStore.deleteItemAsync('userToken');
  }
};

export default db;