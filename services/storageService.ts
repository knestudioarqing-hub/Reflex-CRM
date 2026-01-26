import { Project, Member, Branding, Language, Theme } from '../types';

// Helper to get public IP for visualization purposes
export const getPublicIP = async (): Promise<string> => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return '127.0.0.1'; // Fallback
    }
};

// Legacy keys from the previous version (static local storage)
const LEGACY_KEYS = {
  PROJECTS: 'REFLEX_CRM_PROJECTS',
  MEMBERS: 'REFLEX_CRM_MEMBERS',
  BRANDING: 'REFLEX_CRM_BRANDING',
  THEME: 'REFLEX_CRM_THEME',
  LANG: 'REFLEX_CRM_LANG'
};

export const saveUserData = (
  accessKey: string,
  data: { 
    projects: Project[], 
    members: Member[], 
    branding: Branding,
    theme: Theme,
    lang: Language
  }
) => {
  if (!accessKey) return;
  
  // Create namespaced keys based on the access code
  const prefix = `REFLEX_${accessKey}_`;
  
  try {
    localStorage.setItem(`${prefix}PROJECTS`, JSON.stringify(data.projects));
    localStorage.setItem(`${prefix}MEMBERS`, JSON.stringify(data.members));
    localStorage.setItem(`${prefix}BRANDING`, JSON.stringify(data.branding));
    localStorage.setItem(`${prefix}THEME`, JSON.stringify(data.theme));
    localStorage.setItem(`${prefix}LANG`, JSON.stringify(data.lang));
  } catch (e) {
    console.error("Error saving data to local storage", e);
  }
};

export const loadUserData = (accessKey: string) => {
  if (!accessKey) return null;

  const prefix = `REFLEX_${accessKey}_`;

  const getParsedItem = (key: string, legacyKey: string, defaultValue: any) => {
    // 1. Try to load data associated with the specific Access Key
    const specificItem = localStorage.getItem(`${prefix}${key}`);
    if (specificItem) return JSON.parse(specificItem);

    // 2. Data Recovery / Migration:
    // If no specific data exists for this key, try to load "Legacy" data 
    // (data saved before the Unique Key system was implemented).
    // This ensures users don't lose their previous work.
    const legacyItem = localStorage.getItem(legacyKey);
    if (legacyItem) {
        console.log(`Recovering legacy data for ${key}`);
        return JSON.parse(legacyItem);
    }

    return defaultValue;
  };

  return {
    projects: getParsedItem('PROJECTS', LEGACY_KEYS.PROJECTS, []),
    members: getParsedItem('MEMBERS', LEGACY_KEYS.MEMBERS, []),
    branding: getParsedItem('BRANDING', LEGACY_KEYS.BRANDING, null),
    theme: getParsedItem('THEME', LEGACY_KEYS.THEME, 'dark'),
    lang: getParsedItem('LANG', LEGACY_KEYS.LANG, 'pt')
  };
};