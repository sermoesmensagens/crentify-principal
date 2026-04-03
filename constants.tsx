
import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  BookMarked,
  Briefcase,
  Settings,
  CalendarCheck,
  GraduationCap,
  Compass
} from 'lucide-react';
import { Section } from './types';

export const ADMIN_EMAILS = [
  'andrea.marcelamkt@gmail.com',
  'sermoes.mensagens@gmail.com',
  'robson28.carvalho@gmail.com'
];

export const NAV_ITEMS = [
  { id: Section.DASHBOARD, label: 'Início', icon: <LayoutDashboard size={20} /> },
  { id: Section.BIBLE, label: 'Bíblia', icon: <BookOpen size={20} /> },
  { id: Section.PLANOS, label: 'Planos', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M4 22v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
      <path d="M10 14h4v8h-4z" />
      <path d="M12 14v8" />
    </svg>
  ) },
  { id: Section.ACADEMY, label: 'Academia', icon: <GraduationCap size={20} /> },
  { id: Section.PRAYER, label: 'Oração', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C9.5 5.5 8 9.5 8 13v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-6c0-3.5-1.5-7.5-4-11Z" />
      <path d="M12 2v19" />
    </svg>
  ) },
  { id: Section.CULTOS, label: 'Cultos', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9L12 2z" />
      <path d="M12 7v8" />
      <path d="M10 9h4" />
    </svg>
  ) },
  { id: Section.MENTOR, label: 'Mentor IA', icon: <MessageSquare size={20} /> },
  { id: Section.DIARY, label: 'Minhas Notas', icon: <BookMarked size={20} /> },
  { id: Section.WORKFLOW, label: 'Tarefas', icon: <Briefcase size={20} /> },
  { id: Section.PROJECTS, label: 'Projetos', icon: <Briefcase size={20} /> },
  { id: Section.ADMIN, label: 'Admin', icon: <Settings size={20} /> },
];

export const WP_CONFIG = {
  apiUrl: 'https://youcrente.com/wp-json/wp/v2/posts',
  username: 'andreamarcela2',
  password: 'PBUG j8W7 dGKR xYlM rerd 2AL2'
};
