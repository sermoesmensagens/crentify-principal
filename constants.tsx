
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
  { id: Section.PLANOS, label: 'Planos', icon: <Compass size={20} /> },
  { id: Section.ACADEMY, label: 'Academia', icon: <GraduationCap size={20} /> },
  { id: Section.PRAYER, label: 'Oração', icon: <span className="text-[20px]">🙏</span> },
  { id: Section.HABITS, label: 'Hábitos', icon: <CalendarCheck size={20} /> },
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
