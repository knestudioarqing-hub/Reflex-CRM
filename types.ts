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

export interface WorkLog {
  id: string;
  date: string;
  hours: number;
  description?: string;
  userId?: string;
}

export interface ProjectNote {
  id: string;
  content: string;
  timestamp: string;
  user: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: 'planning' | 'modeling' | 'coordination' | 'completed';
  isActive: boolean; // New field to categorize as Active or Inactive
  startDate: string; // Replaces LOD slot
  deadline: string; // Used as Delivery Date
  progress: number;
  // lod: string; // Removed as requested
  teamMembers: string[]; // IDs of members
  description?: string;
  history: HistoryEntry[];
  workLogs: WorkLog[]; // Array to store daily hours
  tasks: Task[]; // Array to store project tasks
  notes: ProjectNote[]; // Array to store project observations/comments
}

export interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

export interface BackupData {
  projects: Project[];
  members: Member[];
  branding: Branding;
  theme: Theme;
  lang: Language;
  timestamp: number;
}