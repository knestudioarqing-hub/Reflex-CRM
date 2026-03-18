import { Project, Member, Branding, Language, Theme } from '../types';

// Static keys for local storage (Original Configuration)
const KEYS = {
  PROJECTS: 'REFLEX_CRM_PROJECTS',
  MEMBERS: 'REFLEX_CRM_MEMBERS',
  BRANDING: 'REFLEX_CRM_BRANDING',
  THEME: 'REFLEX_CRM_THEME',
  LANG: 'REFLEX_CRM_LANG'
};

export const getPublicIP = async (): Promise<string> => {
  return 'local-user';
};

// IndexedDB implementation to solve 5MB LocalStorage limit
const DB_NAME = 'ReflexCRM_DB';
const STORE_NAME = 'reflex_store';
let dbPromise: Promise<IDBDatabase> | null = null;

const initDB = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
};

const idbGet = async (key: string): Promise<any> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const idbSet = async (key: string, val: any): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const request = tx.objectStore(STORE_NAME).put(val, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const saveUserData = async (
  _ignoredKey: string, // Kept for signature compatibility but ignored
  data: { 
    projects: Project[], 
    members: Member[], 
    branding: Branding,
    theme: Theme,
    lang: Language
  }
) => {
  try {
    // Save to IndexedDB (virtually unlimited)
    await idbSet(KEYS.PROJECTS, data.projects);
    await idbSet(KEYS.MEMBERS, data.members);
    await idbSet(KEYS.BRANDING, data.branding);
    await idbSet(KEYS.THEME, data.theme);
    await idbSet(KEYS.LANG, data.lang);
  } catch (e) {
    console.warn("Failed to save to IndexedDB, falling back to localStorage", e);
    try {
      localStorage.setItem(KEYS.PROJECTS, JSON.stringify(data.projects));
      localStorage.setItem(KEYS.MEMBERS, JSON.stringify(data.members));
      localStorage.setItem(KEYS.BRANDING, JSON.stringify(data.branding));
      localStorage.setItem(KEYS.THEME, JSON.stringify(data.theme));
      localStorage.setItem(KEYS.LANG, JSON.stringify(data.lang));
    } catch (e2) {
      console.error("Storage memory failed entirely", e2);
    }
  }
};

export const loadUserData = async (_ignoredKey: string) => {
  const getParsedItem = async (key: string, defaultValue: any) => {
    // 1. Try IndexedDB first
    try {
      const idbVal = await idbGet(key);
      if (idbVal !== undefined) return idbVal;
    } catch (e) {
      console.warn("IDB read failed, trying localStorage", e);
    }

    // 2. Migration: load from LocalStorage if IndexedDB is empty
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  };

  return {
    projects: await getParsedItem(KEYS.PROJECTS, []),
    members: await getParsedItem(KEYS.MEMBERS, []),
    branding: await getParsedItem(KEYS.BRANDING, null),
    theme: await getParsedItem(KEYS.THEME, 'dark'),
    lang: await getParsedItem(KEYS.LANG, 'pt')
  };
};