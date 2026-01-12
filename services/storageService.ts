import { Project, Member, Branding, Language, Theme } from '../types';

const IP_API_URL = 'https://api.ipify.org?format=json';

export const getUserIP = async (): Promise<string> => {
  try {
    const response = await fetch(IP_API_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('Could not fetch IP address, falling back to local-user.', error);
    return 'local-user';
  }
};

const getStorageKey = (ip: string, key: string) => `REFLEX_${ip}_${key}`;

export const saveUserData = (
  ip: string, 
  data: { 
    projects: Project[], 
    members: Member[], 
    branding: Branding,
    theme: Theme,
    lang: Language
  }
) => {
  if (!ip) return;
  try {
    localStorage.setItem(getStorageKey(ip, 'PROJECTS'), JSON.stringify(data.projects));
    localStorage.setItem(getStorageKey(ip, 'MEMBERS'), JSON.stringify(data.members));
    localStorage.setItem(getStorageKey(ip, 'BRANDING'), JSON.stringify(data.branding));
    localStorage.setItem(getStorageKey(ip, 'THEME'), JSON.stringify(data.theme));
    localStorage.setItem(getStorageKey(ip, 'LANG'), JSON.stringify(data.lang));
  } catch (e) {
    console.error("Error saving data to local storage", e);
  }
};

export const loadUserData = (ip: string) => {
  if (!ip) return null;
  
  const getParsedItem = (key: string, defaultValue: any) => {
    const item = localStorage.getItem(getStorageKey(ip, key));
    return item ? JSON.parse(item) : defaultValue;
  };

  return {
    projects: getParsedItem('PROJECTS', []),
    members: getParsedItem('MEMBERS', []),
    branding: getParsedItem('BRANDING', null), // Null triggers default in App
    theme: getParsedItem('THEME', 'dark'),
    lang: getParsedItem('LANG', 'pt')
  };
};
