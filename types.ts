import React from 'react';

export type Language = 'en' | 'pt';
export type Theme = 'dark' | 'light';

export interface Branding {
  companyName: string;
  primaryColor: string; // Hex code or Tailwind color class prefix
  logoUrl: string | null;
}

export interface Member {
  id: string;
  name: string;
  role: string;
  avatar?: string; // Optional URL
}

export interface HistoryEntry {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: 'planning' | 'modeling' | 'coordination' | 'completed';
  isActive: boolean; // New field to categorize as Active or Inactive
  deadline: string;
  progress: number;
  lod: string; // Level of Development (e.g., LOD 300)
  teamMembers: string[]; // IDs of members
  description?: string;
  history: HistoryEntry[];
}

export interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}