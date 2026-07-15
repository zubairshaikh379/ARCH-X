export interface UserProfile {
  id: string;
  username: string;
  callsign: string;
  accentColor: 'slate' | 'emerald' | 'cyan' | 'amber' | 'rose' | 'indigo';
  xp: number;
  level: number;
  completedCourses: string[];
  completedOsint: string[];
  mfaEnabled: boolean;
  avatar: string;
  bio: string;
  email: string;
  lastDiagnosticsRun: number; // unix timestamp — prevents XP farming
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface CommunityIdea {
  id: string;
  user_id?: string;
  title: string;
  desc: string;
  category: 'Feature' | 'Challenge' | 'Bug' | 'Content' | 'Other';
  votes: number;
  author: string;
  timestamp: number;
}

export type VmStatus = 'off' | 'provisioning' | 'running';
export type AppPage = 'landing' | 'auth';
export type AppTab = 'home' | 'courses' | 'osint' | 'community' | 'profile' | 'settings';

export const DEFAULT_PROFILE: UserProfile = {
  id: '',
  username: '',
  callsign: 'Security Operator',
  accentColor: 'cyan',
  xp: 0,
  level: 1,
  completedCourses: [],
  completedOsint: [],
  mfaEnabled: false,
  avatar: '',
  bio: '',
  email: '',
  lastDiagnosticsRun: 0,
};

export const ACCENT_COLORS: Record<UserProfile['accentColor'], { css: string; label: string; hex: string }> = {
  slate:   { css: '#94a3b8', label: 'Slate',   hex: '#94a3b8' },
  emerald: { css: '#10b981', label: 'Emerald',  hex: '#10b981' },
  cyan:    { css: '#22d3ee', label: 'Cyan',     hex: '#22d3ee' },
  amber:   { css: '#f59e0b', label: 'Amber',    hex: '#f59e0b' },
  rose:    { css: '#f43f5e', label: 'Rose',     hex: '#f43f5e' },
  indigo:  { css: '#6366f1', label: 'Indigo',   hex: '#6366f1' },
};
