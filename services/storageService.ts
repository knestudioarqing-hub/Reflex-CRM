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

  const getParsedItem = (key: string, defaultValue: any) => {
    const item = localStorage.getItem(`${prefix}${key}`);
    return item ? JSON.parse(item) : defaultValue;
  };

  // Check if this key has data, if not try to migrate or return defaults
  // For this implementation, we just return defaults for a new key
  return {
    projects: getParsedItem('PROJECTS', []),
    members: getParsedItem('MEMBERS', []),
    branding: getParsedItem('BRANDING', null),
    theme: getParsedItem('THEME', 'dark'),
    lang: getParsedItem('LANG', 'pt')
  };
};