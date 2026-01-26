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

export const saveUserData = (
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
    localStorage.setItem(KEYS.PROJECTS, JSON.stringify(data.projects));
    localStorage.setItem(KEYS.MEMBERS, JSON.stringify(data.members));
    localStorage.setItem(KEYS.BRANDING, JSON.stringify(data.branding));
    localStorage.setItem(KEYS.THEME, JSON.stringify(data.theme));
    localStorage.setItem(KEYS.LANG, JSON.stringify(data.lang));
  } catch (e) {
    console.error("Error saving data to local storage", e);
  }
};

export const loadUserData = (_ignoredKey: string) => {
  // Directly load from static keys (Legacy Data)
  const getParsedItem = (key: string, defaultValue: any) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  };

  return {
    projects: getParsedItem(KEYS.PROJECTS, []),
    members: getParsedItem(KEYS.MEMBERS, []),
    branding: getParsedItem(KEYS.BRANDING, null),
    theme: getParsedItem(KEYS.THEME, 'dark'),
    lang: getParsedItem(KEYS.LANG, 'pt')
  };
};