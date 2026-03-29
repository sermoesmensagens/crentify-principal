import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { Project, ProjectMilestone, ProjectSubTask, ProjectReminder, HabitFrequency } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getLocalDateString, formatActivityDate } from '../utils';

type HubTab = 'STAGES' | 'STRATEGY' | 'CALENDAR' | 'LEMBRETES';
type MilestoneView = 'LIST' | 'TABLE' | 'GANTT';

const ProjectColors = [
  { name: 'Roxo', value: 'bg-purple-500' },
  { name: 'Verde', value: 'bg-emerald-500' },
  { name: 'Azul', value: 'bg-blue-500' },
  { name: 'Rosa', value: 'bg-pink-500' },
  { name: 'Laranja', value: 'bg-orange-500' },
  { name: 'Amarelo', value: 'bg-amber-500' },
  { name: 'Cinza', value: 'bg-zinc-500' }
];

const LOCAL_KEY = 'crentify_projects';

const Projects: React.FC = () => {
  const { session } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeHubTab, setActiveHubTab] = useState<HubTab>('STAGES');
  const [activeMilestoneView, setActiveMilestoneView] = useState<MilestoneView>('LIST');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'LIFE' as Project['category'],
    status: 'PLANNING' as Project['status']
  });
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [milestoneFormData, setMilestoneFormData] = useState({
    title: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    color: 'bg-purple-500',
    status: 'TODO' as ProjectMilestone['status']
  });
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});
  const [newSubTaskTitles, setNewSubTaskTitles] = useState<Record<string, string>>({});
  const [editingSubTask, setEditingSubTask] = useState<{ milestoneId: string, subTaskId: string, title: string } | null>(null);

  useEffect(() => {
    if (session?.user?.id) fetchProjects();
  }, [session]);

  const saveLocal = (data: Project[]) => localStorage.setItem(LOCAL_KEY, JSON.stringify(data));

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        const saved = localStorage.getItem(LOCAL_KEY);
        if (saved) setProjects(JSON.parse(saved));
        throw error;
      }

      // Check for local migration
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved && data && data.length === 0) {
        const localData: Project[] = JSON.parse(saved);
        if (localData.length > 0) {
          await migrateLocalProjects(localData);
          return;
        }
      }

      const dbProjects = (data || []).map(mapRow);
      setProjects(prev => {
        // Keep local projects that are not yet in the DB (ID might be random string)
        const localOnly = prev.filter(p => !dbProjects.find(dbp => dbp.id === p.id));
        return [...dbProjects, ...localOnly];
      });
    } catch (e) {
      console.error('Error fetching projects:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const mapRow = (p: any): Project => ({
    id: p.id, title: p.title, description: p.description, category: p.category,
    status: p.status, progress: p.progress, milestones: p.milestones || [],
    reminders: p.reminders || [],
    strategyDoc: p.strategy_doc, contentTypes: p.content_types,
    contentPilars: p.content_pilars, contentCalendar: p.content_calendar || [],
    createdAt: p.created_at, updatedAt: p.updated_at
  });

  const migrateLocalProjects = async (localData: Project[]) => {
    try {
      const formatted = localData.map(p => ({
        title: p.title, description: p.description, category: p.category,
        status: p.status, progress: p.progress, milestones: p.milestones,
        reminders: p.reminders,
        strategy_doc: p.strategyDoc, content_types: p.contentTypes,
        content_pilars: p.contentPilars, content_calendar: p.contentCalendar,
        user_id: session!.user.id
      }));
      const { data, error } = await supabase.from('projects').insert(formatted).select();
      if (error) throw error;
      setProjects((data || []).map(mapRow));
      localStorage.removeItem(LOCAL_KEY);
    } catch {
      setProjects(localData);
    }
  };

  const handleSaveProject = async () => {
    if (!formData.title || !session?.user?.id) return;
    const projectData = { ...formData, user_id: session.user.id, updated_at: new Date().toISOString() };

    try {
      if (isEditing && selectedProject) {
        const { error } = await supabase.from('projects').update(projectData).eq('id', selectedProject.id);
        if (error) throw error;
        setProjects(prev => prev.map((p: Project) => p.id === selectedProject.id ? { ...p, ...formData, updatedAt: projectData.updated_at } : p));
        setSelectedProject(prev => prev ? { ...prev, ...formData, updatedAt: projectData.updated_at } : null);
      } else {
        const { data, error } = await supabase.from('projects').insert([{ ...projectData, created_at: new Date().toISOString() }]).select();
        if (error) throw error;
        if (data) {
          const np: Project = { ...formData, id: data[0].id, progress: 0, milestones: [], reminders: [], strategyDoc: '', contentTypes: '', contentPilars: '', contentCalendar: [], createdAt: data[0].created_at, updatedAt: data[0].updated_at };
          setProjects(prev => [np, ...prev]);
          setSelectedProject(np); // Automatically select new project
        }
      }
      setShowModal(false); 
      setFormData({ title: '', description: '', category: 'LIFE', status: 'PLANNING' });
      setIsEditing(false);
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('schema cache') || msg.includes('does not exist')) {
        const lp: Project = isEditing && selectedProject
          ? { ...selectedProject, ...formData, updatedAt: new Date().toISOString() }
          : { ...formData, id: Math.random().toString(36).substr(2, 9), progress: 0, milestones: [], reminders: [], strategyDoc: '', contentTypes: '', contentPilars: '', contentCalendar: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        
        setProjects(prev => {
          const newPS = isEditing && selectedProject ? prev.map((p: Project) => p.id === lp.id ? lp : p) : [lp, ...prev];
          saveLocal(newPS);
          return newPS;
        });
        setSelectedProject(lp);
        setShowModal(false); 
        setFormData({ title: '', description: '', category: 'LIFE', status: 'PLANNING' });
        setIsEditing(false);
      } else alert(`Erro ao salvar projeto: ${msg || 'Desconhecido'}`);
    }
  };

  const updateProjectField = async (id: string, field: keyof Project, value: any) => {
    const dbFieldMap: any = { strategyDoc: 'strategy_doc', contentTypes: 'content_types', contentPilars: 'content_pilars', contentCalendar: 'content_calendar' };
    const dbField = dbFieldMap[field] || field;
    const updatedAt = new Date().toISOString();
    try {
      const { error } = await supabase.from('projects').update({ [dbField]: value, updated_at: updatedAt }).eq('id', id);
      if (error) throw error;
      apply(id, field, value, updatedAt);
    } catch (error: any) {
      if ((error?.message || '').includes('schema cache') || (error?.message || '').includes('does not exist')) {
        apply(id, field, value, updatedAt, true);
      }
    }
  };

  const apply = (id: string, field: keyof Project, value: any, updatedAt: string, local = false) => {
    setProjects(prev => {
      const up = prev.map((p: Project) => p.id === id ? { ...p, [field]: value, updatedAt } : p);
      if (local) saveLocal(up);
      return up;
    });
    setSelectedProject(prev => (prev?.id === id ? { ...prev, [field]: value, updatedAt } : prev));
  };

  const resetForm = () => { setFormData({ title: '', description: '', category: 'LIFE', status: 'PLANNING' }); setIsEditing(false); setSelectedProject(null); };

  const deleteProject = async (id: string) => {
    if (!window.confirm('Deseja excluir este projeto?')) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      setProjects(projects.filter(p => p.id !== id));
      if (selectedProject?.id === id) setSelectedProject(null);
    } catch (error: any) {
      if ((error?.message || '').includes('schema cache') || (error?.message || '').includes('does not exist')) {
        const np = projects.filter(p => p.id !== id);
        setProjects(np); saveLocal(np);
        if (selectedProject?.id === id) setSelectedProject(null);
      } else alert('Erro ao excluir projeto.');
    }
  };

  const saveMilestone = async (projectId: string) => {
    if (!milestoneFormData.title) return;
    const project = projects.find(p => p.id === projectId) || (selectedProject?.id === projectId ? selectedProject : null);
    if (!project) return;
    
    let newMs: ProjectMilestone[];
    if (editingMilestoneId) {
      newMs = project.milestones.map(m => m.id === editingMilestoneId ? { ...m, ...milestoneFormData, completed: milestoneFormData.status === 'DONE', tasks: m.tasks } : m);
    } else {
      newMs = [...project.milestones, { id: Math.random().toString(36).substr(2, 9), title: milestoneFormData.title, completed: milestoneFormData.status === 'DONE', startDate: milestoneFormData.startDate, endDate: milestoneFormData.endDate, status: milestoneFormData.status, color: milestoneFormData.color, tasks: [] }];
    }
    const progress = calcProgress(newMs);
    const updatedAt = new Date().toISOString();
    try {
      const { error } = await supabase.from('projects').update({ milestones: newMs, progress, updated_at: updatedAt }).eq('id', projectId);
      if (error) throw error;
      applyMs(projectId, newMs, progress, updatedAt);
    } catch (error: any) {
      if ((error?.message || '').includes('schema cache') || (error?.message || '').includes('does not exist')) {
        applyMs(projectId, newMs, progress, updatedAt, true);
      } else alert(`Erro ao salvar etapa: ${error?.message}`);
    }
    setMilestoneFormData({ ...milestoneFormData, title: '', status: 'TODO' });
    setEditingMilestoneId(null);
  };

  const applyMs = (projectId: string, newMs: ProjectMilestone[], progress: number, updatedAt: string, local = false) => {
    setProjects(prev => {
      const up = prev.map(p => p.id === projectId ? { ...p, milestones: newMs, progress, updatedAt } : p);
      // If project is selected but missing from list, it will be missing here too, 
      // but setSelectedProject will still catch it below.
      if (local) saveLocal(up);
      return up;
    });
    setSelectedProject(prev => (prev?.id === projectId ? { ...prev, milestones: newMs, progress, updatedAt } : prev));
  };

  const toggleMilestone = async (projectId: string, milestoneId: string) => {
    const project = projects.find((p: Project) => p.id === projectId) || (selectedProject?.id === projectId ? selectedProject : null);
    if (!project) return;
    const milestone = project.milestones.find((m: ProjectMilestone) => m.id === milestoneId);
    if (!milestone) return;

    const newCompleted = milestone.status !== 'DONE';
    const newStatus = (newCompleted ? 'DONE' : 'TODO') as ProjectMilestone['status'];

    const newMs = project.milestones.map((m: ProjectMilestone) => {
      if (m.id === milestoneId) {
        const tasks = m.tasks?.map((t: ProjectSubTask) => ({ ...t, completed: newCompleted })) || [];
        return { ...m, completed: newCompleted, status: newStatus, tasks };
      }
      return m;
    });

    const progress = calcProgress(newMs);
    const updatedAt = new Date().toISOString();
    try {
      const { error } = await supabase.from('projects').update({ milestones: newMs, progress, updated_at: updatedAt }).eq('id', projectId);
      if (error) throw error;
      applyMs(projectId, newMs, progress, updatedAt);
    } catch { applyMs(projectId, newMs, progress, updatedAt, true); }
  };

  const updateMilestoneStatus = async (projectId: string, milestoneId: string, status: ProjectMilestone['status']) => {
    const project = projects.find((p: Project) => p.id === projectId) || (selectedProject?.id === projectId ? selectedProject : null);
    if (!project) return;
    const newMs = project.milestones.map((m: ProjectMilestone) => {
      if (m.id === milestoneId) {
        const completed = status === 'DONE';
        const tasks = m.tasks?.map((t: ProjectSubTask) => ({ ...t, completed })) || [];
        return { ...m, status, completed, tasks };
      }
      return m;
    });
    const progress = calcProgress(newMs);
    const updatedAt = new Date().toISOString();
    try {
      const { error } = await supabase.from('projects').update({ milestones: newMs, progress, updated_at: updatedAt }).eq('id', projectId);
      if (error) throw error;
      applyMs(projectId, newMs, progress, updatedAt);
    } catch { applyMs(projectId, newMs, progress, updatedAt, true); }
  };

  const deleteMilestone = async (projectId: string, milestoneId: string) => {
    if (!window.confirm('Deseja excluir esta etapa?')) return;
    const project = projects.find((p: Project) => p.id === projectId) || (selectedProject?.id === projectId ? selectedProject : null);
    if (!project) return;
    const newMs = project.milestones.filter((m: ProjectMilestone) => m.id !== milestoneId);
    const progress = calcProgress(newMs);
    const updatedAt = new Date().toISOString();
    try {
      const { error } = await supabase.from('projects').update({ milestones: newMs, progress, updated_at: updatedAt }).eq('id', projectId);
      if (error) throw error;
      applyMs(projectId, newMs, progress, updatedAt);
    } catch { applyMs(projectId, newMs, progress, updatedAt, true); }
  };

  const updateSubTask = async (projectId: string, milestoneId: string, subTaskId: string, newTitle: string) => {
    const project = projects.find(p => p.id === projectId) || (selectedProject?.id === projectId ? selectedProject : null);
    if (!project || !newTitle.trim()) {
      setEditingSubTask(null);
      return;
    }

    const newMs = project.milestones?.map((m: ProjectMilestone) => {
      if (m.id === milestoneId) {
        return {
          ...m,
          tasks: m.tasks?.map((t: ProjectSubTask) => 
            t.id === subTaskId ? { ...t, title: newTitle.trim() } : t
          )
        };
      }
      return m;
    });

    const progress = calcProgress(newMs);
    const updatedAt = new Date().toISOString();
    try {
      await supabase.from('projects').update({ milestones: newMs, progress, updated_at: updatedAt }).eq('id', projectId);
      applyMs(projectId, newMs, progress, updatedAt);
      setEditingSubTask(null);
    } catch { applyMs(projectId, newMs, progress, updatedAt, true); }
  };

  const addSubTask = async (projectId: string, milestoneId: string) => {
    const title = newSubTaskTitles[milestoneId];
    if (!title) return;
    const project = projects.find((p: Project) => p.id === projectId) || (selectedProject?.id === projectId ? selectedProject : null);
    if (!project) return;

    const newMs = project.milestones.map((m: ProjectMilestone) => {
      if (m.id === milestoneId) {
        const tasks: ProjectSubTask[] = [...(m.tasks || []), { id: Math.random().toString(36).substr(2, 9), title, completed: false }];
        // If we add a task, the milestone shouldn't be "DONE" anymore if it was.
        const status = m.status === 'DONE' ? 'IN_PROGRESS' : m.status;
        return { ...m, tasks, status, completed: false };
      }
      return m;
    });

    const progress = calcProgress(newMs);
    const updatedAt = new Date().toISOString();
    try {
      await supabase.from('projects').update({ milestones: newMs, progress, updated_at: updatedAt }).eq('id', projectId);
      applyMs(projectId, newMs, progress, updatedAt);
      setNewSubTaskTitles(prev => ({ ...prev, [milestoneId]: '' }));
    } catch { applyMs(projectId, newMs, progress, updatedAt, true); }
  };

  const toggleSubTask = async (projectId: string, milestoneId: string, taskId: string) => {
    const project = projects.find((p: Project) => p.id === projectId) || (selectedProject?.id === projectId ? selectedProject : null);
    if (!project) return;

    const newMs = project.milestones.map((m: ProjectMilestone) => {
      if (m.id === milestoneId) {
        const tasks = m.tasks?.map((t: ProjectSubTask) => t.id === taskId ? { ...t, completed: !t.completed } : t) || [];
        const allDone = tasks.length > 0 && tasks.every((t: ProjectSubTask) => t.completed);
        const someDone = tasks.some((t: ProjectSubTask) => t.completed);
        return { ...m, tasks, status: (allDone ? 'DONE' : someDone ? 'IN_PROGRESS' : m.status) as any, completed: allDone };
      }
      return m;
    });

    const progress = calcProgress(newMs);
    const updatedAt = new Date().toISOString();
    try {
      await supabase.from('projects').update({ milestones: newMs, progress, updated_at: updatedAt }).eq('id', projectId);
      applyMs(projectId, newMs, progress, updatedAt);
    } catch { applyMs(projectId, newMs, progress, updatedAt, true); }
  };

  const deleteSubTask = async (projectId: string, milestoneId: string, taskId: string) => {
    const project = projects.find(p => p.id === projectId) || (selectedProject?.id === projectId ? selectedProject : null);
    if (!project) return;

    const newMs = project.milestones.map((m: ProjectMilestone) => {
      if (m.id === milestoneId) {
        const tasks = m.tasks?.filter((t: ProjectSubTask) => t.id !== taskId) || [];
        const allDone = tasks.length > 0 && tasks.every((t: ProjectSubTask) => t.completed);
        const someDone = tasks.some((t: ProjectSubTask) => t.completed);
        return { ...m, tasks, status: (allDone ? 'DONE' : someDone ? 'IN_PROGRESS' : m.status) as any, completed: allDone };
      }
      return m;
    });

    const progress = calcProgress(newMs);
    const updatedAt = new Date().toISOString();
    try {
      await supabase.from('projects').update({ milestones: newMs, progress, updated_at: updatedAt }).eq('id', projectId);
      applyMs(projectId, newMs, progress, updatedAt);
    } catch { applyMs(projectId, newMs, progress, updatedAt, true); }
  };

  const calcProgress = (ms: ProjectMilestone[]) => {
    if (!ms.length) return 0;
    let totalProjectProgress = 0;
    ms.forEach((m: ProjectMilestone) => {
      if (m.tasks && m.tasks.length > 0) {
        totalProjectProgress += (m.tasks.filter((t: ProjectSubTask) => t.completed).length / m.tasks.length) * 100;
      } else {
        totalProjectProgress += (m.status === 'DONE' || m.completed) ? 100 : 0;
      }
    });
    return Math.round(totalProjectProgress / ms.length);
  };

  const getCategoryColor = (cat: string) => {
    const map: Record<string, string> = {
      MONETIZATION: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      GROWTH: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      CONTENT: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      FINANCES: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      LIFE: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
      EDUCATION: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      SPIRITUALITY: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      EXERCISES: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    };
    return map[cat] || 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
  };

  const getCategoryLabel = (cat: string) => {
    const map: Record<string,string> = { MONETIZATION:'Monetização', GROWTH:'Crescimento', CONTENT:'Conteúdo', OTHER:'Outros', FINANCES:'Finanças', LIFE:'Vida', EDUCATION:'Educação', SPIRITUALITY:'Espiritualidade', EXERCISES:'Exercícios' };
    return map[cat] || cat;
  };

  // --- TABLE VIEW ---
  const TableView = ({ project }: { project: Project }) => (
    <div className="overflow-x-auto rounded-3xl border border-zinc-800/50 bg-[#0c0c0e]">
      <table className="w-full text-left text-xs">
        <thead className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-500 uppercase font-black tracking-widest">
          <tr>
            <th className="px-6 py-4 w-12 text-center">✓</th>
            <th className="px-6 py-4">Tarefa</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Início</th>
            <th className="px-6 py-4">Término</th>
            <th className="px-6 py-4">Cor</th>
            <th className="px-6 py-4 w-24">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {project.milestones.map(m => (
            <tr key={m.id} className="group hover:bg-zinc-800/20 transition-all">
              <td className="px-6 py-4 text-center">
                <button onClick={() => toggleMilestone(project.id, m.id)} className={`w-5 h-5 rounded-md border flex items-center justify-center mx-auto transition-all ${m.status === 'DONE' ? 'bg-green-500 border-green-500' : 'border-zinc-700 hover:border-purple-500/50'}`}>
                  {m.status === 'DONE' && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>}
                </button>
              </td>
              <td className={`px-6 py-4 font-bold ${m.status === 'DONE' ? 'text-zinc-600 line-through' : 'text-zinc-100'}`}>{m.title}</td>
              <td className="px-6 py-4">
                <select value={m.status || (m.completed ? 'DONE' : 'TODO')} onChange={e => updateMilestoneStatus(project.id, m.id, e.target.value as any)} className={`px-2 py-1 rounded-md text-[9px] font-black uppercase bg-black border border-zinc-800 outline-none ${m.status === 'DONE' ? 'text-green-500' : m.status === 'IN_PROGRESS' ? 'text-blue-400' : 'text-red-500'}`}>
                  <option value="TODO">Inicial</option>
                  <option value="IN_PROGRESS">Em Andamento</option>
                  <option value="DONE">Concluído</option>
                </select>
              </td>
              <td className="px-6 py-4 text-zinc-400">{m.startDate ? new Date(m.startDate).toLocaleDateString('pt-BR') : '-'}</td>
              <td className="px-6 py-4 text-zinc-400">{m.endDate || m.dueDate ? new Date((m.endDate || m.dueDate)!).toLocaleDateString('pt-BR') : '-'}</td>
              <td className="px-6 py-4"><div className={`w-3 h-3 rounded-full ${m.color || 'bg-purple-500'}`}></div></td>
              <td className="px-6 py-4">
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => editMilestone(m)} className="text-zinc-500 hover:text-white"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                  <button onClick={() => deleteMilestone(project.id, m.id)} className="text-zinc-700 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // --- GANTT VIEW ---
  const GanttView = ({ project }: { project: Project }) => {
    const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const getDIM = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
    const { timelineMonths, totalDays, timelineStartDate } = useMemo(() => {
      if (!project.milestones.length) {
        const now = new Date(); const m = now.getMonth(); const y = now.getFullYear(); const d = getDIM(m,y);
        return { timelineMonths: [{ month:m, year:y, days:d, name:MONTHS_PT[m] }], totalDays:d, timelineStartDate: new Date(y,m,1) };
      }
      let minD = new Date(project.milestones[0].startDate || new Date());
      let maxD = new Date(project.milestones[0].endDate || project.milestones[0].dueDate || new Date());
      project.milestones.forEach(m => {
        const s = new Date(m.startDate || new Date()); const e = new Date(m.endDate || m.dueDate || new Date());
        if (s < minD) minD = s; if (e > maxD) maxD = e;
      });
      const months = []; let cM = minD.getMonth(); let cY = minD.getFullYear(); let total = 0;
      while (cY < maxD.getFullYear() || (cY === maxD.getFullYear() && cM <= maxD.getMonth())) {
        const d = getDIM(cM,cY); months.push({ month:cM, year:cY, days:d, name:MONTHS_PT[cM] }); total += d;
        cM++; if (cM > 11) { cM = 0; cY++; }
      }
      return { timelineMonths: months, totalDays: total, timelineStartDate: new Date(minD.getFullYear(), minD.getMonth(), 1) };
    }, [project.milestones]);
    const DW = 30;
    return (
      <div className="space-y-6">
        <div className="bg-[#0c0c0e] border border-zinc-800/50 rounded-3xl p-6 relative overflow-x-auto">
          <div style={{ width: `${totalDays * DW + 200}px` }}>
            <div className="flex mb-4 border-b border-zinc-800/50 pb-2">
              <div className="w-[200px] shrink-0"></div>
              <div className="flex-1 flex">
                {timelineMonths.map((m,i) => (
                  <div key={`${m.month}-${m.year}`} className={`flex flex-col ${i!==0?'border-l border-zinc-800/30':''}`} style={{width:`${m.days*DW}px`}}>
                    <span className="text-[9px] font-black text-zinc-500 uppercase px-2 mb-1">{m.name} {m.year}</span>
                    <div className="flex px-1">
                      {Array.from({length:m.days},(_,i)=>i+1).map(d=><span key={d} className="text-[7px] text-zinc-700 font-bold w-[30px] text-center">{d}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {project.milestones.length === 0 ? (
                <div className="text-center py-10 text-zinc-700 text-[10px] font-black uppercase">Adicione tarefas para visualizar o cronograma</div>
              ) : project.milestones.map(m => {
                const sD = new Date(m.startDate || new Date());
                const eD = new Date(m.endDate || m.dueDate || new Date());
                const offset = Math.max(0, Math.floor((sD.getTime() - timelineStartDate.getTime()) / 86400000));
                const dur = Math.max(1, Math.ceil((eD.getTime() - sD.getTime()) / 86400000) + 1);
                return (
                  <div key={m.id} className="flex items-center">
                    <div className="w-[200px] shrink-0 text-[10px] font-bold text-zinc-500 truncate pr-4">{m.title}</div>
                    <div className="flex-1 h-8 relative flex items-center bg-zinc-900/10 rounded-lg">
                      <div className={`h-4 rounded-full ${m.color||'bg-purple-500'} ${m.status==='DONE'?'opacity-30':'shadow-lg'} relative group cursor-pointer transition-all hover:scale-y-125`} style={{width:`${dur*DW}px`,left:`${offset*DW}px`}}>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 bg-zinc-900 border border-zinc-800 p-2 rounded-lg z-20 whitespace-nowrap text-[9px] font-black uppercase pointer-events-none">
                          {sD.toLocaleDateString('pt-BR')} → {eD.toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- STRATEGY TAB ---
  const StrategyTab = ({ project }: { project: Project }) => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 bg-zinc-900/30 p-8 rounded-[2.5rem] border border-zinc-800/50">
          <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] mb-4">Plano Diretor e Visão</h4>
          <textarea value={project.strategyDoc||''} onChange={e=>updateProjectField(project.id,'strategyDoc',e.target.value)} placeholder="Descreva a visão de longo prazo deste projeto..." className="w-full h-64 bg-black/50 border border-zinc-800/50 rounded-2xl p-6 text-sm text-zinc-300 outline-none focus:ring-1 ring-purple-500/50 transition-all resize-none" />
        </div>
        <div className="space-y-8">
          <div className="bg-zinc-900/30 p-8 rounded-[2.5rem] border border-zinc-800/50">
            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4">Categorias / Tipos</h4>
            <textarea value={project.contentTypes||''} onChange={e=>updateProjectField(project.id,'contentTypes',e.target.value)} placeholder="Ex: Metas mensais, Hábitos, Conquistas..." className="w-full h-24 bg-black/50 border border-zinc-800/50 rounded-2xl p-6 text-sm text-zinc-300 outline-none focus:ring-1 ring-emerald-500/50 transition-all resize-none" />
          </div>
          <div className="bg-zinc-900/30 p-8 rounded-[2.5rem] border border-zinc-800/50">
            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Pilares</h4>
            <textarea value={project.contentPilars||''} onChange={e=>updateProjectField(project.id,'contentPilars',e.target.value)} placeholder="Quais são os temas principais que você abordará?" className="w-full h-24 bg-black/50 border border-zinc-800/50 rounded-2xl p-6 text-sm text-zinc-300 outline-none focus:ring-1 ring-blue-500/50 transition-all resize-none" />
          </div>
        </div>
      </div>
    </div>
  );

  // --- CALENDAR TAB ---
  const CalendarTab = ({ project }: { project: Project }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [showPostModal, setShowPostModal] = useState(false);
    const [postDate, setPostDate] = useState('');
    const [postTitle, setPostTitle] = useState('');
    const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const addPost = () => {
      if (!postTitle || !postDate) return;
      updateProjectField(project.id, 'contentCalendar', [...(project.contentCalendar||[]), { id: Math.random().toString(36).substr(2,9), title:postTitle, date:postDate, type:'AÇÃO', completed:false }]);
      setShowPostModal(false); setPostTitle('');
    };
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={()=>{ if(currentMonth===0){setCurrentMonth(11);setCurrentYear(cy=>cy-1);}else setCurrentMonth(m=>m-1); }} className="text-zinc-600 hover:text-white transition-colors">←</button>
            <h4 className="text-xl font-black uppercase tracking-tighter text-white">{MONTHS[currentMonth]} {currentYear}</h4>
            <button onClick={()=>{ if(currentMonth===11){setCurrentMonth(0);setCurrentYear(cy=>cy+1);}else setCurrentMonth(m=>m+1); }} className="text-zinc-600 hover:text-white transition-colors">→</button>
          </div>
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Calendário do Projeto</p>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=><div key={d} className="text-center text-[10px] font-black text-zinc-700 uppercase py-2">{d}</div>)}
          {Array.from({length:firstDay}).map((_,i)=><div key={`e-${i}`} className="aspect-square bg-zinc-900/10 rounded-2xl border border-zinc-800/10 opacity-20"></div>)}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const day=i+1;
            const fullDate=`${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const dayPosts=(project.contentCalendar||[]).filter(p=>p.date===fullDate);
            return (
              <div key={day} onClick={()=>{setPostDate(fullDate);setShowPostModal(true);}} className="aspect-[1/1.2] bg-zinc-900/20 border border-zinc-800/40 rounded-2xl p-2 cursor-pointer hover:border-purple-500/40 transition-all flex flex-col overflow-hidden group">
                <span className="text-[10px] font-black text-zinc-600 mb-1 group-hover:text-purple-500 transition-colors">{day}</span>
                <div className="space-y-0.5 overflow-y-auto custom-scrollbar">
                  {dayPosts.map(p=><div key={p.id} className="bg-purple-500/20 border border-purple-500/30 p-1 rounded-lg text-[8px] font-bold text-zinc-200 line-clamp-2">{p.title}</div>)}
                </div>
              </div>
            );
          })}
        </div>
        {showPostModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 w-full max-w-sm rounded-[2rem] border border-zinc-800 p-8 space-y-4">
              <h3 className="text-lg font-black uppercase text-white">Agendar Ação</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">{new Date(postDate+'T12:00:00').toLocaleDateString('pt-BR')}</p>
              <input autoFocus value={postTitle} onChange={e=>setPostTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addPost()} placeholder="Título ou ideia..." className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 ring-purple-500/30 text-white" />
              <div className="flex gap-3">
                <button onClick={()=>setShowPostModal(false)} className="flex-1 py-3 bg-zinc-800 rounded-xl text-[9px] font-black uppercase text-white">Cancelar</button>
                <button onClick={addPost} className="flex-1 py-3 bg-gradient-to-r from-brand to-brand-light rounded-xl text-[9px] font-black uppercase text-white">Agendar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const editMilestone = (m: ProjectMilestone) => {
    setMilestoneFormData({ title:m.title, startDate:m.startDate||new Date().toISOString().split('T')[0], endDate:m.endDate||m.dueDate||new Date().toISOString().split('T')[0], color:m.color||'bg-purple-500', status:m.status||(m.completed?'DONE':'TODO') });
    setEditingMilestoneId(m.id);
  };

  // --- REMINDERS TAB ---
  const RemindersTab = ({ project }: { project: Project }) => {
    const [filter, setFilter] = useState<'hoje' | 'pendentes' | 'todas'>('hoje');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [rTitle, setRTitle] = useState('');
    const [rDesc, setRDesc] = useState('');
    const [rFreq, setRFreq] = useState<HabitFrequency>('once');
    const [rDate, setRDate] = useState(getLocalDateString());
    const [rStartDate, setRStartDate] = useState(getLocalDateString());
    const [rEndDate, setREndDate] = useState(getLocalDateString());
    const [rMilestoneId, setRMilestoneId] = useState('');

    const today = getLocalDateString();
    const reminders = project.reminders || [];

    const handleSave = () => {
      if (!rTitle) return;
      const newR: ProjectReminder = {
        id: editingId || Math.random().toString(36).substr(2, 9),
        title: rTitle,
        description: rDesc,
        frequency: rFreq,
        date: rFreq !== 'period' ? rDate : undefined,
        startDate: rFreq === 'period' ? rStartDate : undefined,
        endDate: rFreq === 'period' ? rEndDate : undefined,
        milestoneId: rMilestoneId || undefined,
        completions: editingId ? (reminders.find(r => r.id === editingId)?.completions || {}) : {}
      };
      const updated = editingId ? reminders.map(r => r.id === editingId ? newR : r) : [newR, ...reminders];
      updateProjectField(project.id, 'reminders', updated);
      setShowModal(false);
    };

    const handleDelete = (id: string) => {
      if (!window.confirm('Excluir lembrete?')) return;
      updateProjectField(project.id, 'reminders', reminders.filter(r => r.id !== id));
    };

    const toggleCompletion = (id: string) => {
      const updated = reminders.map(r => {
        if (r.id === id) {
          const comps = { ...r.completions };
          comps[today] = !comps[today];
          return { ...r, completions: comps };
        }
        return r;
      });
      updateProjectField(project.id, 'reminders', updated);
    };

    const openModal = (r?: ProjectReminder) => {
      if (r) {
        setEditingId(r.id); 
        setRTitle(r.title); 
        setRDesc(r.description); 
        setRFreq(r.frequency); 
        setRDate(r.date || today); 
        setRStartDate(r.startDate || today);
        setREndDate(r.endDate || today);
        setRMilestoneId(r.milestoneId || '');
      } else {
        setEditingId(null); 
        setRTitle(''); 
        setRDesc(''); 
        setRFreq('once'); 
        setRDate(today); 
        setRStartDate(today);
        setREndDate(today);
        setRMilestoneId('');
      }
      setShowModal(true);
    };
    
    const handleMilestoneSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setRMilestoneId(val);
      if (val && !editingId) {
        const ms = project.milestones.find(m => m.id === val);
        if (ms) {
          setRTitle(ms.title);
          if (ms.startDate && ms.endDate) {
            setRFreq('period');
            setRStartDate(ms.startDate);
            setREndDate(ms.endDate);
          } else if (ms.startDate || ms.dueDate) {
            setRDate(ms.startDate || ms.dueDate || today);
          }
        }
      }
    };

    const filtered = reminders.filter(r => {
      if (filter === 'todas') return true;
      const isToday = r.frequency === 'daily' || 
        (r.frequency === 'once' && r.date === today) || 
        (r.frequency === 'period' && r.startDate && r.endDate && today >= r.startDate && today <= r.endDate) ||
        (r.frequency === 'monthly' && r.date && r.date.split('-')[2] === today.split('-')[2]) || 
        (r.frequency === 'annual' && r.date && r.date.split('-').slice(1).join('-') === today?.split('-').slice(1).join('-'));
      
      const isPastDue = () => {
        if (r.frequency === 'once' && r.date && r.date < today && !r.completions[r.date]) return true;
        if (r.frequency === 'period' && r.endDate && r.endDate < today && !r.completions[r.endDate]) return true;
        return false;
      };

      if (filter === 'hoje') return isToday;
      if (filter === 'pendentes') return isPastDue() || (isToday && !r.completions[today]);
      return false;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800/50">
            {(['hoje', 'pendentes', 'todas'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${filter === f ? 'bg-zinc-800 text-brand shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => openModal()} className="px-6 py-3 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all">+ Add Lembrete</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-800/50 rounded-3xl"><p className="text-[10px] text-zinc-600 font-black uppercase">Nenhum lembrete</p></div>
          ) : filtered.map(r => (
            <div key={r.id} className={`p-5 rounded-3xl border transition-all ${r.completions[today] ? 'bg-green-500/10 border-green-500/20' : 'bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3 items-center">
                  <button onClick={() => toggleCompletion(r.id)} className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${r.completions[today] ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-700'}`}>
                    {r.completions[today] && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}
                  </button>
                  <div>
                    <h4 className={`font-black text-sm uppercase ${r.completions[today] ? 'text-zinc-500 line-through' : 'text-white'}`}>{r.title}</h4>
                    {r.milestoneId && <p className="text-[8px] font-black text-brand uppercase mt-0.5">Etapa: {project.milestones.find(m => m.id === r.milestoneId)?.title || 'Desconhecida'}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(r)} className="text-zinc-600 hover:text-white p-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                  <button onClick={() => handleDelete(r.id)} className="text-zinc-700 hover:text-red-500 p-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
              </div>
              {r.description && <p className={`text-[10px] font-medium mb-3 ${r.completions[today] ? 'text-zinc-600' : 'text-zinc-400'}`}>{r.description}</p>}
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black bg-zinc-950 px-2 py-1 rounded text-zinc-500 uppercase tracking-widest">{formatActivityDate(r)}</span>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 w-full max-w-md rounded-[2.5rem] border border-zinc-800 p-8 space-y-6">
              <h3 className="text-xl font-black uppercase text-white">{editingId ? 'Editar Lembrete' : 'Novo Lembrete'}</h3>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Vincular a uma Etapa (Opcional)</label>
                  <select value={rMilestoneId} onChange={handleMilestoneSelect} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold outline-none text-white focus:ring-1 ring-brand/50">
                    <option value="">Nenhuma etapa vinculada</option>
                    {project.milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Título</label>
                  <input autoFocus value={rTitle} onChange={e => setRTitle(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold outline-none text-white focus:ring-1 ring-brand/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Descrição</label>
                  <textarea value={rDesc} onChange={e => setRDesc(e.target.value)} rows={2} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold outline-none text-white focus:ring-1 ring-brand/50 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Frequência</label>
                    <select value={rFreq} onChange={e => setRFreq(e.target.value as any)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold outline-none text-white focus:ring-1 ring-brand/50">
                      <option value="once">Único</option>
                      <option value="period">Período</option>
                      <option value="daily">Diário</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                      <option value="annual">Anual</option>
                    </select>
                  </div>
                  {rFreq === 'period' ? (
                    <div className="flex gap-2 col-span-2">
                       <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Início</label>
                        <input type="date" value={rStartDate} onChange={e => setRStartDate(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold outline-none text-white focus:ring-1 ring-brand/50 [&::-webkit-calendar-picker-indicator]:invert" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Fim</label>
                        <input type="date" value={rEndDate} onChange={e => setREndDate(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold outline-none text-white focus:ring-1 ring-brand/50 [&::-webkit-calendar-picker-indicator]:invert" />
                      </div>
                    </div>
                  ) : (rFreq === 'once' || rFreq === 'monthly' || rFreq === 'annual') && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Data</label>
                      <input type="date" value={rDate} onChange={e => setRDate(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold outline-none text-white focus:ring-1 ring-brand/50 [&::-webkit-calendar-picker-indicator]:invert" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-zinc-800 rounded-2xl text-[10px] font-black uppercase text-white hover:bg-zinc-700 transition-colors">Cancelar</button>
                <button onClick={handleSave} className="flex-1 py-4 bg-gradient-to-r from-brand to-brand-light rounded-2xl text-[10px] font-black uppercase text-white hover:scale-105 active:scale-95 transition-all">Salvar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase neon-text flex items-center gap-4">
            <svg className="w-10 h-10 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            Projetos
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Gerencie seus projetos de vida, finanças, saúde e muito mais.</p>
        </div>
        <div className="flex items-center gap-3">
          {isLoading && <div className="flex items-center gap-2 bg-brand/10 border border-brand/20 px-3 py-1.5 rounded-full"><div className="w-3 h-3 border-2 border-brand/20 border-t-brand rounded-full animate-spin"></div><span className="text-[9px] font-black uppercase text-brand tracking-widest">Sincronizando...</span></div>}
          <button onClick={()=>{resetForm();setShowModal(true);}} className="px-6 py-4 bg-gradient-to-r from-brand to-brand-light text-white font-black rounded-2xl shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="text-lg">+</span> Novo Projeto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Project List */}
        <div className="lg:col-span-4 space-y-4 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
          {projects.length === 0 ? (
            <div className="bg-zinc-900/40 border-2 border-dashed border-zinc-800 rounded-[2.5rem] py-20 text-center px-8">
              <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">Nenhum projeto ainda...</p>
            </div>
          ) : projects.map(project => (
            <div key={project.id} onClick={()=>{setSelectedProject(project);setActiveHubTab('STAGES');}} className={`group p-6 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden ${selectedProject?.id===project.id?'bg-zinc-900/80 border-brand/50 ring-1 ring-brand/20 shadow-2xl shadow-brand/5':'bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getCategoryColor(project.category)}`}>{getCategoryLabel(project.category)}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e=>{e.stopPropagation();setIsEditing(true);setFormData({title:project.title,description:project.description,category:project.category,status:project.status});setSelectedProject(project);setShowModal(true);}} className="p-1.5 bg-zinc-800 rounded-lg text-zinc-500 hover:text-white"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                  <button onClick={e=>{e.stopPropagation();deleteProject(project.id);}} className="p-1.5 bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                </div>
              </div>
              <h3 className="text-lg font-black text-white leading-tight mb-4">{project.title}</h3>
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
                <span className="text-zinc-500">Progresso</span>
                <span className="text-brand">{project.progress}%</span>
              </div>
              <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand to-brand-light transition-all duration-1000" style={{width:`${project.progress}%`}}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Hub */}
        <div className="lg:col-span-8">
          {selectedProject ? (
            <div className="bg-[#111113] border border-zinc-800/50 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl min-h-[600px]">
              <div className="flex border-b border-zinc-800/50 p-2">
                {[{id:'STAGES',label:'Etapas'},{id:'STRATEGY',label:'Estratégia'},{id:'CALENDAR',label:'Calendário'},{id:'LEMBRETES',label:'Lembretes'}].map(tab=>(
                  <button key={tab.id} onClick={()=>setActiveHubTab(tab.id as HubTab)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeHubTab===tab.id?'text-white':'text-zinc-600 hover:text-zinc-400'}`}>
                    {tab.label}
                    {activeHubTab===tab.id && <div className="absolute bottom-0 left-4 right-4 h-1 bg-gradient-to-r from-brand to-brand-light rounded-full"></div>}
                  </button>
                ))}
              </div>
              <div className="p-8 flex-1 overflow-y-auto max-h-[85vh] custom-scrollbar">
                {activeHubTab === 'STAGES' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <div>
                        <span className="text-[10px] font-black text-brand uppercase tracking-widest">{selectedProject.status}</span>
                        <h2 className="text-3xl font-black tracking-tighter text-white uppercase mt-1">{selectedProject.title}</h2>
                      </div>
                      <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800/50">
                        {(['LIST','TABLE','GANTT'] as MilestoneView[]).map(v=>(
                          <button key={v} onClick={()=>setActiveMilestoneView(v)} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${activeMilestoneView===v?'bg-zinc-800 text-brand shadow-xl':'text-zinc-500 hover:text-zinc-300'}`}>
                            {v==='LIST'?'Lista':v==='TABLE'?'Quadro':'Timeline'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Milestone Form */}
                    <div className="flex flex-col gap-3 bg-zinc-900/40 p-5 rounded-[2rem] border border-zinc-800/30">
                      <input value={milestoneFormData.title} onChange={e=>setMilestoneFormData({...milestoneFormData,title:e.target.value})} placeholder="Nome da etapa..." className="w-full h-12 bg-black border border-zinc-800/50 rounded-xl px-4 text-xs font-bold focus:ring-1 ring-brand/50 outline-none placeholder:text-zinc-700 text-white" />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="relative">
                          <label className="absolute -top-2 left-3 bg-zinc-900 px-2 text-[8px] font-black text-zinc-500 uppercase">Início</label>
                          <input type="date" value={milestoneFormData.startDate} onChange={e=>setMilestoneFormData({...milestoneFormData,startDate:e.target.value})} className="w-full h-12 bg-black text-white border border-zinc-800/50 rounded-xl px-4 text-[10px] font-black outline-none focus:ring-1 ring-brand/50 [&::-webkit-calendar-picker-indicator]:invert" />
                        </div>
                        <div className="relative">
                          <label className="absolute -top-2 left-3 bg-zinc-900 px-2 text-[8px] font-black text-zinc-500 uppercase">Término</label>
                          <input type="date" value={milestoneFormData.endDate} onChange={e=>setMilestoneFormData({...milestoneFormData,endDate:e.target.value})} className="w-full h-12 bg-black text-white border border-zinc-800/50 rounded-xl px-4 text-[10px] font-black outline-none focus:ring-1 ring-brand/50 [&::-webkit-calendar-picker-indicator]:invert" />
                        </div>
                        <div className="relative">
                          <label className="absolute -top-2 left-3 bg-zinc-900 px-2 text-[8px] font-black text-zinc-500 uppercase">Cor</label>
                          <select value={milestoneFormData.color} onChange={e=>setMilestoneFormData({...milestoneFormData,color:e.target.value})} className="w-full h-12 bg-black border border-zinc-800/50 rounded-xl px-4 text-[10px] font-black outline-none text-white">
                            {ProjectColors.map(c=><option key={c.value} value={c.value}>{c.name}</option>)}
                          </select>
                        </div>
                        <button onClick={()=>saveMilestone(selectedProject.id)} className="h-12 bg-gradient-to-r from-brand to-brand-light text-white rounded-xl font-black text-sm flex items-center justify-center shadow-lg transition-transform active:scale-95">
                          {editingMilestoneId ? '✓ Salvar' : '+ Adicionar'}
                        </button>
                      </div>
                    </div>

                    {/* Views */}
                    {activeMilestoneView==='LIST' && (
                      <div className="space-y-3">
                        {selectedProject.milestones.length===0 ? (
                          <div className="py-20 text-center border-2 border-dashed border-zinc-900 rounded-[2.5rem]"><p className="text-[10px] font-black uppercase text-zinc-700">Adicione etapas ao projeto.</p></div>
                        ) : selectedProject.milestones.map(m=>(
                          <div key={m.id} className="space-y-2">
                            <div className={`group p-5 bg-zinc-900/30 border border-zinc-800/40 rounded-3xl flex items-center justify-between hover:border-zinc-700 transition-all ${expandedMilestones[m.id] ? 'border-brand/30 bg-zinc-900/50' : ''}`}>
                              <div className="flex items-center gap-4 flex-1">
                                <button onClick={() => setExpandedMilestones(prev => ({ ...prev, [m.id]: !prev[m.id] }))} className={`p-1 rounded-lg transition-transform ${expandedMilestones[m.id] ? 'rotate-90' : ''}`}>
                                  <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                                </button>
                                <button onClick={()=>toggleMilestone(selectedProject.id,m.id)} className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${m.status==='DONE'?'bg-green-500 border-green-500':'border-zinc-700 hover:border-brand'}`}>
                                  {m.status==='DONE'&&<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}
                                </button>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className={`font-bold text-sm ${m.status==='DONE'?'text-zinc-600 line-through':'text-zinc-200'}`}>{m.title}</p>
                                    {m.tasks && m.tasks.length > 0 && (
                                      <span className="text-[9px] font-black text-brand uppercase">{m.tasks.filter(t=>t.completed).length}/{m.tasks.length}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${m.color||'bg-brand'}`}></div>
                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                      {m.startDate?new Date(m.startDate+'T12:00:00').toLocaleDateString('pt-BR'):'...'} → {m.endDate||m.dueDate?new Date((m.endDate||m.dueDate)!+'T12:00:00').toLocaleDateString('pt-BR'):'...'}
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${m.status==='DONE'?'bg-green-500/10 text-green-500':m.status==='IN_PROGRESS'?'bg-blue-500/10 text-blue-400':'bg-red-500/10 text-red-500'}`}>
                                      {m.status==='DONE'?'Concluído':m.status==='IN_PROGRESS'?'Em Andamento':'Aberto'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={()=>editMilestone(m)} className="p-2 text-zinc-500 hover:text-white"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                                <button onClick={()=>deleteMilestone(selectedProject.id,m.id)} className="p-2 text-zinc-700 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
                              </div>
                            </div>
                            
                            {/* Subtasks */}
                            {expandedMilestones[m.id] && (
                              <div className="ml-10 space-y-2 pb-4 animate-in slide-in-from-top-2 duration-300">
                                {m.tasks?.map(task => (
                                  <div key={task.id} className="flex items-center justify-between p-3 bg-zinc-900/20 border border-zinc-800/30 rounded-2xl group/task">
                                    <div className="flex items-center gap-3 flex-1">
                                      <button onClick={() => toggleSubTask(selectedProject.id, m.id, task.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${task.completed ? 'bg-brand/50 border-brand/50' : 'border-zinc-700 hover:border-brand/50'}`}>
                                        {task.completed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>}
                                      </button>
                                      {editingSubTask?.subTaskId === task.id ? (
                                        <input 
                                          autoFocus
                                          value={editingSubTask.title}
                                          onChange={e => setEditingSubTask({ ...editingSubTask, title: e.target.value })}
                                          onBlur={() => updateSubTask(selectedProject.id, m.id, task.id, editingSubTask.title)}
                                          onKeyDown={e => e.key === 'Enter' && updateSubTask(selectedProject.id, m.id, task.id, editingSubTask.title)}
                                          className="bg-transparent border-none text-xs text-white outline-none w-full font-medium"
                                        />
                                      ) : (
                                        <span className={`text-xs font-medium ${task.completed ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>{task.title}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover/task:opacity-100 transition-all">
                                      <button onClick={() => setEditingSubTask({ milestoneId: m.id, subTaskId: task.id, title: task.title })} className="p-1 text-zinc-500 hover:text-white transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                      </button>
                                      <button onClick={() => deleteSubTask(selectedProject.id, m.id, task.id)} className="p-1 text-zinc-800 hover:text-red-500 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <div className="flex gap-2">
                                  <input 
                                    value={newSubTaskTitles[m.id] || ''} 
                                    onChange={e => setNewSubTaskTitles(prev => ({ ...prev, [m.id]: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && addSubTask(selectedProject.id, m.id)}
                                    placeholder="Nova tarefa..." 
                                    className="flex-1 h-9 bg-black/30 border border-zinc-800/50 rounded-xl px-4 text-[10px] font-bold outline-none focus:ring-1 ring-brand/30 text-white" 
                                  />
                                  <button 
                                    onClick={() => addSubTask(selectedProject.id, m.id)}
                                    className="w-9 h-9 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-brand hover:bg-zinc-700 transition-all"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {activeMilestoneView==='TABLE' && <TableView project={selectedProject}/>}
                    {activeMilestoneView==='GANTT' && <GanttView project={selectedProject}/>}
                  </div>
                )}
                {activeHubTab==='STRATEGY' && <StrategyTab project={selectedProject}/>}
                {activeHubTab==='CALENDAR' && <CalendarTab project={selectedProject}/>}
                {activeHubTab==='LEMBRETES' && <RemindersTab project={selectedProject}/>}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-zinc-900/20 border-2 border-dashed border-zinc-800/50 rounded-[3rem] p-12 text-center">
              <div className="w-24 h-24 bg-zinc-900/50 rounded-[2.5rem] flex items-center justify-center mb-6 border border-zinc-800/50">
                <svg className="w-10 h-10 text-zinc-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
              </div>
              <h3 className="text-xl font-black text-zinc-700 uppercase tracking-tighter">Selecione um projeto</h3>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={()=>setShowModal(false)}></div>
          <div className="bg-zinc-900 w-full max-w-xl rounded-[2.5rem] border border-zinc-800 shadow-2xl relative z-10 overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-brand to-brand-light"></div>
            <div className="p-10 space-y-6">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-white">{isEditing?'Editar Projeto':'Novo Projeto'}</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Título</label>
                  <input value={formData.title} onChange={e=>setFormData({...formData,title:e.target.value})} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-bold outline-none ring-brand/30 focus:ring-2 text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Descrição</label>
                  <textarea value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})} rows={3} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-medium outline-none ring-brand/30 focus:ring-2 resize-none text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Categoria</label>
                    <select value={formData.category} onChange={e=>setFormData({...formData,category:e.target.value as any})} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-[10px] font-black uppercase outline-none text-white">
                      <option value="LIFE">Vida</option>
                      <option value="FINANCES">Finanças</option>
                      <option value="EDUCATION">Educação</option>
                      <option value="SPIRITUALITY">Espiritualidade</option>
                      <option value="EXERCISES">Exercícios</option>
                      <option value="MONETIZATION">Monetização</option>
                      <option value="GROWTH">Crescimento</option>
                      <option value="CONTENT">Conteúdo</option>
                      <option value="OTHER">Outros</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Status</label>
                    <select value={formData.status} onChange={e=>setFormData({...formData,status:e.target.value as any})} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-[10px] font-black uppercase outline-none text-white">
                      <option value="PLANNING">Planejamento</option>
                      <option value="ACTIVE">Ativo</option>
                      <option value="ON_HOLD">Pausado</option>
                      <option value="COMPLETED">Concluído</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={()=>setShowModal(false)} className="flex-1 py-4 bg-zinc-800 rounded-2xl text-[10px] font-black uppercase text-white">Cancelar</button>
                <button onClick={handleSaveProject} className="flex-[2] py-4 bg-gradient-to-r from-brand to-brand-light rounded-2xl text-[10px] font-black uppercase text-white shadow-xl">{isEditing?'Salvar':'Criar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
