import { openDB } from 'idb';
import { User } from '../types';

const DB_NAME = 'auth-db';
const DB_VERSION = 1;

interface AuthDB {
  users: {
    key: string;
    value: User & { password: string };
    indexes: { 'by-email': string };
  };
}

export async function initAuthDb() {
  return openDB<AuthDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('users')) {
        const store = db.createObjectStore('users', { keyPath: 'id' });
        store.createIndex('by-email', 'email', { unique: true });
        
        // Create default admin user
        store.add({
          id: '1',
          email: 'admin@example.com',
          password: 'admin123', // In production, this should be hashed
          name: 'Admin User',
          role: 'admin'
        });
      }
    },
  });
}

export async function login(email: string, password: string): Promise<User> {
  const db = await initAuthDb();
  const tx = db.transaction('users', 'readonly');
  const store = tx.objectStore('users');
  const index = store.index('by-email');
  
  const user = await index.get(email);
  
  if (!user || user.password !== password) {
    throw new Error('Invalid email or password');
  }
  
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function useAuth() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function setAuth(user: User | null) {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
}