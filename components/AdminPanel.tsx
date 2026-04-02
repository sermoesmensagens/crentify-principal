
import React, { useState, useEffect, useRef } from 'react';
import { BibleData, AcademyContent, AcademyCategory, AcademyVisibility, AcademyCourse, AcademyResource, AcademyWeekCategory, AcademyDayCategory } from '../types';
import { Upload, Database, GraduationCap, Plus, Trash2, CheckCircle2, AlertTriangle, Settings, Zap, Loader2, Youtube, Edit2, FileText, X, Eye, EyeOff, Lock, Link, Image as ImageIcon, LayoutGrid, List, ImagePlus, BookOpen, Sparkles } from 'lucide-react';
import { getLogoUrl, uploadLogo, ensureBucketExists } from '../services/logoService';
import { supabase } from '../services/supabaseClient';

import { useAcademy } from '../contexts/AcademyContext';
import { useDataContext } from '../contexts/DataContext';
import { useReadingPlans } from '../contexts/ReadingPlanContext';
import { ReadingPlan, ReadingPlanContent, ReadingPlanCategory, PrayerTheme, PrayerContent, PrayerCategory, PrayerWeekCategory, PrayerDayCategory } from '../types';
import { parseReadingPlanWithAi } from '../services/geminiService';
import { usePrayer } from '../contexts/PrayerContext';

const AdminPanel: React.FC = () => {
  const { bibleData, updateBibleData: setBibleData, cloudSyncStatus } = useDataContext();
  const { 
    courses: academyCourses, 
    setAcademyCourses, 
    content: academyContent, 
    setAcademyContent, 
    categories: academyCategories, 
    setAcademyCategories,
    weekCategories,
    setWeekCategories,
    dayCategories,
    setDayCategories
  } = useAcademy();
  
  const { 
    plans: readingPlans, 
    setPlans: setReadingPlans, 
    planContent: readingPlanContent, 
    setPlanContent: setReadingPlanContent, 
    categories: readingPlanCategories,
    setCategories: setReadingPlanCategories
  } = useReadingPlans();

  const {
    themes: prayerThemes,
    setThemes: setPrayerThemes,
    content: prayerContent,
    setContent: setPrayerContent,
    categories: prayerCategories,
    setCategories: setPrayerCategories,
    weekCategories: prayerWeekCategories,
    setWeekCategories: setPrayerWeekCategories,
    dayCategories: prayerDayCategories,
    setDayCategories: setPrayerDayCategories
  } = usePrayer();

  const [categoryToManage, setCategoryToManage] = useState<'weeks' | 'days' | 'readingWeeks' | 'readingDays' | 'plans' | 'prayerCategories' | 'prayerWeeks' | 'prayerDays' | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bible' | 'courses' | 'lessons' | 'prayerThemes' | 'prayerContent' | 'plans' | 'users' | 'config'>('bible');
  const [profiles, setProfiles] = useState<{ id: string, email: string, created_at: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados para Importação Inteligente (IA)
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
  const [smartImportText, setSmartImportText] = useState('');
  const [isProcessingSmartImport, setIsProcessingSmartImport] = useState(false);
  const [smartImportResult, setSmartImportResult] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [isWaitingForQuota, setIsWaitingForQuota] = useState(false);

  // Estados para upload de logo
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string>('/logo-v2.png');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Carrega o logo atual e usuários ao montar
  useEffect(() => {
    getLogoUrl().then(url => setCurrentLogoUrl(url));
    ensureBucketExists(); // Garante que o bucket existe

    // Carregar usuários
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProfiles(data);
      }
    };
    fetchProfiles();
  }, []);

  // Estados de Cursos
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState<Partial<AcademyCourse>>({
    title: '',
    description: '',
    categoryId: academyCategories?.[0]?.id || '1',
    thumbnailUrl: '',
    visibility: 'público'
  });

  // Estados de Aulas (Lições)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [newModule, setNewModule] = useState<Partial<AcademyContent>>({
    title: '',
    description: '',
    courseId: '',
    categoryId: academyCategories?.[0]?.id || '1',
    type: 'video',
    url: '',
    week: '',
    day: '',
    resources: [],
    visibility: 'público'
  });

  const [resourceForm, setResourceForm] = useState<Partial<AcademyResource>>({
    type: 'video',
    title: '',
    url: '',
    content: '',
    duration: '',
    instruction: ''
  });
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);

  // Estados de Planos de Leitura
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState<Partial<ReadingPlan>>({
    title: '',
    description: '',
    durationDays: 7,
    categoryId: readingPlanCategories?.[0]?.id || '1',
    thumbnailUrl: '',
    visibility: 'público',
    isAiGenerated: false
  });

  const [editingPlanContentId, setEditingPlanContentId] = useState<string | null>(null);
  const [newPlanContent, setNewPlanContent] = useState<Partial<ReadingPlanContent>>({
    title: '',
    planId: '',
    week: 'Semana 1',
    day: 'Dia 1',
    resources: []
  });

  const [readingResourceForm, setReadingResourceForm] = useState<Partial<AcademyResource>>({
    type: 'leitura',
    title: '',
    duration: '1 cap',
    instruction: ''
  });

  // Estados de Oração
  const [editingPrayerThemeId, setEditingPrayerThemeId] = useState<string | null>(null);
  const [newPrayerTheme, setNewPrayerTheme] = useState<Partial<PrayerTheme>>({
    title: '',
    description: '',
    categoryId: prayerCategories?.[0]?.id || '1',
    thumbnailUrl: '',
    visibility: 'público'
  });

  const [editingPrayerContentId, setEditingPrayerContentId] = useState<string | null>(null);
  const [newPrayerContent, setNewPrayerContent] = useState<Partial<PrayerContent>>({
    title: '',
    description: '',
    themeId: '',
    categoryId: prayerCategories?.[0]?.id || '1',
    type: 'video',
    week: '',
    day: '',
    resources: [],
    visibility: 'público'
  });

  // Normalizador Ultra-Tolerante (Lida com múltiplos formatos de JSON bíblico)
  const normalizeBibleData = (raw: any): BibleData => {
    let rawBooks = Array.isArray(raw) ? raw : (raw.books || raw.Books || raw.biblia || raw.Bible || []);

    if (!Array.isArray(rawBooks) || rawBooks.length === 0) {
      throw new Error("Estrutura JSON não reconhecida. Certifique-se de que o arquivo contém uma lista de livros.");
    }

    return {
      books: rawBooks.map((b: any) => {
        const bookName = b.name || b.nome || b.book || b.label || 'Livro';
        const rawChapters = b.chapters || b.capitulos || b.content || [];

        return {
          name: bookName,
          chapters: (Array.isArray(rawChapters) ? rawChapters : []).map((c: any, i: number) => {
            // Se o capítulo for uma lista direta de strings (versículos)
            if (Array.isArray(c) && typeof c[0] === 'string') {
              return {
                number: i + 1,
                verses: c.map((text: string, j: number) => ({ number: j + 1, text }))
              };
            }

            // Se o capítulo for um objeto com lista de versículos
            const rawVerses = c.verses || c.versiculos || c.content || (Array.isArray(c) ? c : []);
            return {
              number: c.number || i + 1,
              verses: (Array.isArray(rawVerses) ? rawVerses : []).map((v: any, j: number) => {
                if (typeof v === 'string') return { number: j + 1, text: v };
                return {
                  number: v.number || v.versiculo || j + 1,
                  text: v.text || v.texto || v.v || ''
                };
              })
            };
          })
        };
      })
    };
  };

  const handleBibleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonText = event.target?.result as string;
        const parsed = JSON.parse(jsonText);
        const normalized = normalizeBibleData(parsed);

        // Grava no IndexedDB através da função do App.tsx
        console.log("Processando Bíblia...");
        await setBibleData(normalized);
        console.log("Bíblia processada e salva localmente.");

        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } catch (err: any) {
        console.error("Erro na importação:", err);
        setError(err.message || "Erro desconhecido ao processar JSON.");
      } finally {
        setIsProcessing(false);
        e.target.value = ''; // Reseta o input
      }
    };

    reader.onerror = () => {
      setError("Erro físico na leitura do arquivo.");
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handleAddOrUpdateCourse = () => {
    if (!newCourse.title) return;

    if (editingCourseId) {
      setAcademyCourses(academyCourses.map(c =>
        c.id === editingCourseId ? { ...c, ...newCourse as AcademyCourse } : c
      ));
      setEditingCourseId(null);
    } else {
      const course: AcademyCourse = {
        id: Date.now().toString(),
        title: newCourse.title!,
        description: newCourse.description || '',
        categoryId: newCourse.categoryId || '1',
        thumbnailUrl: newCourse.thumbnailUrl,
        visibility: newCourse.visibility || 'público',
        createdAt: new Date().toISOString()
      };
      setAcademyCourses([course, ...academyCourses]);
    }

    setNewCourse({ title: '', description: '', categoryId: academyCategories?.[0]?.id || '1', thumbnailUrl: '', visibility: 'público' });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleAddOrUpdateModule = () => {
    if (!newModule.title || !newModule.courseId) return;

    if (editingModuleId) {
      const updatedModule = { ...newModule } as AcademyContent;
      console.log('✏️ ADMIN DEBUG - Editando aula:', updatedModule);
      const updatedContent = academyContent.map(item =>
        item.id === editingModuleId ? { ...item, ...updatedModule } : item
      );
      setAcademyContent(updatedContent);
      setEditingModuleId(null);
    } else {
      const content: AcademyContent = {
        id: Date.now().toString(),
        title: newModule.title!,
        description: newModule.description || '',
        courseId: newModule.courseId,
        categoryId: newModule.categoryId || '1',
        type: newModule.resources && newModule.resources.length > 1 ? 'mixed' : (newModule.type || 'video'),
        week: newModule.week || 'Semana 1',
        day: newModule.day || 'Segunda',
        resources: newModule.resources || [],
        visibility: newModule.visibility || 'público'
      };
      console.log('📚 ADMIN DEBUG - Criando nova aula:', content);
      console.log('📚 ADMIN DEBUG - Recursos da aula:', content.resources);
      setAcademyContent([content, ...academyContent]);
    }

    setNewModule({ title: '', description: '', courseId: '', categoryId: academyCategories?.[0]?.id || '1', type: 'video', url: '', week: '', day: '', resources: [], visibility: 'público' });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const addResource = () => {
    if (!resourceForm.title) return;

    if (editingResourceId) {
      const updatedResource = { ...resourceForm } as AcademyResource;
      console.log('✏️ ADMIN DEBUG - Editando recurso:', updatedResource);
      setNewModule({
        ...newModule,
        resources: (newModule.resources || []).map(r =>
          r.id === editingResourceId ? { ...r, ...updatedResource } : r
        )
      });
      setEditingResourceId(null);
    } else {
      const resource: AcademyResource = {
        id: Date.now().toString(),
        type: resourceForm.type || 'video',
        title: resourceForm.title,
        url: resourceForm.url,
        content: resourceForm.content,
        duration: resourceForm.duration,
        instruction: resourceForm.instruction
      };
      console.log('➕ ADMIN DEBUG - Adicionando novo recurso:', resource);
      setNewModule({
        ...newModule,
        resources: [...(newModule.resources || []), resource]
      });
    }
    setResourceForm({ type: 'video', title: '', url: '', content: '', duration: '', instruction: '' });
  };

  const removeResource = (id: string) => {
    setNewModule({
      ...newModule,
      resources: (newModule.resources || []).filter(r => r.id !== id)
    });
  };

  const handleAddOrUpdatePlan = () => {
    if (!newPlan.title) return;

    if (editingPlanId) {
      setReadingPlans(readingPlans.map(p =>
        p.id === editingPlanId ? { ...p, ...newPlan as ReadingPlan } : p
      ));
      setEditingPlanId(null);
      // Opcional: resetar o seletor de plano no editor de conteúdo
      setNewPlanContent({ ...newPlanContent, planId: '' });
    } else {
      const plan: ReadingPlan = {
        id: Date.now().toString(),
        title: newPlan.title!,
        description: newPlan.description || '',
        durationDays: newPlan.durationDays || 7,
        categoryId: newPlan.categoryId || '1',
        thumbnailUrl: newPlan.thumbnailUrl,
        visibility: newPlan.visibility || 'público',
        isAiGenerated: false,
        createdAt: new Date().toISOString()
      };
      setReadingPlans([plan, ...readingPlans]);
    }

    setNewPlan({ title: '', description: '', durationDays: 7, categoryId: readingPlanCategories?.[0]?.id || '1', thumbnailUrl: '', visibility: 'público' });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleAddOrUpdatePlanContent = () => {
    if (!newPlanContent.planId || !newPlanContent.day) return;

    // Auto-generate title if blank
    let finalTitle = newPlanContent.title;
    if (!finalTitle) {
      const verses = newPlanContent.resources?.filter(r => r.type === 'leitura').map(r => r.title).join(', ');
      finalTitle = verses ? `Leitura: ${verses}` : 'Leitura do Dia';
    }

    if (editingPlanContentId) {
      setReadingPlanContent(readingPlanContent.map(item =>
        item.id === editingPlanContentId ? { ...item, ...newPlanContent as ReadingPlanContent, title: finalTitle } : item
      ));
      setEditingPlanContentId(null);
    } else {
      const content: ReadingPlanContent = {
        id: Date.now().toString(),
        title: finalTitle,
        planId: newPlanContent.planId,
        week: newPlanContent.week || 'Semana 1',
        day: newPlanContent.day,
        resources: newPlanContent.resources || []
      };
      setReadingPlanContent([content, ...readingPlanContent]);
    }

    setNewPlanContent({ 
      title: '', 
      planId: editingPlanId || '', 
      week: newPlanContent.week || 'Semana 1', 
      day: newPlanContent.day || 'Dia 1', 
      resources: [] 
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const parseReadingPlanLocally = (text: string) => {
    console.log("🛠️ Iniciando processamento local (Fallback)...");
    const lines = text.split('\n');
    const result: any[] = [];
    let currentWeek = 'Semana 1';
    let currentDay = '';
    
    const bibleBooks = [
      'Gênesis', 'Êxodo', 'Levítico', 'Números', 'Deuteronômio', 'Josué', 'Juízes', 'Rute', '1 Samuel', '2 Samuel', '1 Reis', '2 Reis', '1 Crônicas', '2 Crônicas', 'Esdras', 'Neemias', 'Ester', 'Jó', 'Salmos', 'Provérbios', 'Eclesiastes', 'Cantares', 'Isaías', 'Jeremias', 'Lamentações', 'Ezequiel', 'Daniel', 'Oseias', 'Joel', 'Amós', 'Obadias', 'Jonas', 'Miqueias', 'Naum', 'Habacuque', 'Sofonias', 'Ageu', 'Zacarias', 'Malaquias',
      'Mateus', 'Marcos', 'Lucas', 'João', 'Atos', 'Romanos', '1 Coríntios', '2 Coríntios', 'Gálatas', 'Efésios', 'Filipenses', 'Colossenses', '1 Tessalonicenses', '2 Tessalonicenses', '1 Timóteo', '2 Timóteo', 'Tito', 'Filemom', 'Hebreus', 'Tiago', '1 Pedro', '2 Pedro', '1 João', '2 João', '3 João', 'Judas', 'Apocalipse'
    ];

    lines.forEach(line => {
      if (!line.trim()) return;
      const weekMatch = line.match(/Semana\s*(\d+)/i);
      if (weekMatch) currentWeek = `Semana ${weekMatch[1]}`;
      const dayMatch = line.match(/(Dia\s*\d+|Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo)/i);
      if (dayMatch) currentDay = dayMatch[0];
      const foundVerses: string[] = [];
      bibleBooks.forEach(book => {
        const regex = new RegExp(`\\b${book}\\s+\\d+([\\:\\-]\\d+)?([\\,\\s]+\\d+([\\:\\-]\\d+)?)*`, 'gi');
        const matches = line.match(regex);
        if (matches) foundVerses.push(...matches);
      });
      if (foundVerses.length > 0) {
        result.push({
          week: currentWeek,
          day: currentDay || `Dia ${result.length + 1}`,
          title: `Leitura: ${foundVerses.join(', ')}`,
          verses: foundVerses
        });
      }
    });
    return result;
  };

  const handleSmartImport = async () => {
    if (!smartImportText.trim() || !newPlanContent.planId) {
      setError("Selecione um plano e cole o texto do PDF primeiro.");
      return;
    }

    setIsProcessingSmartImport(true);
    setSmartImportResult([]);
    setError(null);

    try {
      const lines = smartImportText.split('\n');
      const chunkSize = 300;
      const chunks: string[] = [];
      
      for (let i = 0; i < lines.length; i += chunkSize) {
        chunks.push(lines.slice(i, i + chunkSize).join('\n'));
      }

      setImportProgress({ current: 0, total: chunks.length });
      
      const allExtractedData: any[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        setImportProgress(prev => ({ ...prev, current: i + 1 }));
        
        // Adicionar delay gradual entre chunks para evitar erro 429 (Quota Exceeded) do Gemini
        if (i > 0) {
          setIsWaitingForQuota(true);
          await new Promise(resolve => setTimeout(resolve, 6000));
          setIsWaitingForQuota(false);
        }

        try {
          const result = await parseReadingPlanWithAi(chunks[i]);
          if (Array.isArray(result)) {
            allExtractedData.push(...result);
          }
        } catch (aiErr) {
          console.warn("IA falhou por cota. Ativando Processador Local...", aiErr);
          // Se a IA falhou, tentamos o parser local para não perder o texto do usuário
          const localResult = parseReadingPlanLocally(chunks[i]);
          if (localResult.length > 0) {
            allExtractedData.push(...localResult);
          } else {
             // Se nem o local achou nada, aí repassamos o erro
             throw aiErr;
          }
        }
      }

      setSmartImportResult(allExtractedData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Erro na importação IA:", err);
      // Personalizar mensagem para o usuário
      if (err.message?.includes('429')) {
        setError("Limite diário do Google atingido. Ativamos o 'Processador Local' para tentar extrair o que foi possível sem a IA.");
      } else {
        setError(err.message || "Erro ao processar.");
      }
    } finally {
      setIsProcessingSmartImport(false);
    }
  };

  const confirmSmartImport = () => {
    if (smartImportResult.length === 0) return;

    const newContents = smartImportResult.map((item, idx) => ({
      id: `ai-${Date.now()}-${idx}`,
      planId: newPlanContent.planId,
      week: item.week || 'Semana 1',
      day: item.day || `Dia ${idx + 1}`,
      title: item.title || 'Leitura do Dia',
      resources: (item.verses || []).map((v: string, vIdx: number) => ({
        id: `ai-res-${Date.now()}-${idx}-${vIdx}`,
        type: 'leitura',
        title: v,
        duration: '1 cap',
        instruction: 'Leia com atenção este trecho das Escrituras.'
      }))
    })) as ReadingPlanContent[];

    setReadingPlanContent([...readingPlanContent, ...newContents]);
    setIsSmartImportOpen(false);
    setSmartImportResult([]);
    setSmartImportText('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const addReadingResource = () => {
    if (!readingResourceForm.title) return;
    const resource: AcademyResource = {
      id: Date.now().toString(),
      type: readingResourceForm.type || 'leitura',
      title: readingResourceForm.title,
      duration: readingResourceForm.duration,
      instruction: readingResourceForm.instruction
    };
    setNewPlanContent({
      ...newPlanContent,
      resources: [...(newPlanContent.resources || []), resource]
    });
    setReadingResourceForm({ type: 'leitura', title: '', duration: '1 cap', instruction: '' });
  };

  const removeReadingResource = (id: string) => {
    setNewPlanContent({
      ...newPlanContent,
      resources: (newPlanContent.resources || []).filter(r => r.id !== id)
    });
  };

  const handleAddOrUpdatePrayerTheme = () => {
    if (!newPrayerTheme.title) return;

    if (editingPrayerThemeId) {
      setPrayerThemes(prayerThemes.map(t =>
        t.id === editingPrayerThemeId ? { ...t, ...newPrayerTheme as PrayerTheme } : t
      ));
      setEditingPrayerThemeId(null);
    } else {
      const theme: PrayerTheme = {
        id: Date.now().toString(),
        title: newPrayerTheme.title!,
        description: newPrayerTheme.description || '',
        categoryId: newPrayerTheme.categoryId || '1',
        thumbnailUrl: newPrayerTheme.thumbnailUrl,
        visibility: newPrayerTheme.visibility || 'público',
        createdAt: new Date().toISOString()
      };
      setPrayerThemes([theme, ...prayerThemes]);
    }

    setNewPrayerTheme({ title: '', description: '', categoryId: prayerCategories?.[0]?.id || '1', thumbnailUrl: '', visibility: 'público' });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleAddOrUpdatePrayerContent = () => {
    if (!newPrayerContent.title || !newPrayerContent.themeId) return;

    if (editingPrayerContentId) {
      setPrayerContent(prayerContent.map(item =>
        item.id === editingPrayerContentId ? { ...item, ...newPrayerContent as PrayerContent } : item
      ));
      setEditingPrayerContentId(null);
    } else {
      const content: PrayerContent = {
        id: Date.now().toString(),
        title: newPrayerContent.title!,
        description: newPrayerContent.description || '',
        themeId: newPrayerContent.themeId,
        categoryId: newPrayerContent.categoryId || '1',
        type: newPrayerContent.resources && newPrayerContent.resources.length > 1 ? 'mixed' : (newPrayerContent.type || 'video'),
        week: newPrayerContent.week || 'Semana 1',
        day: newPrayerContent.day || 'Segunda',
        resources: newPrayerContent.resources || [],
        visibility: newPrayerContent.visibility || 'público'
      };
      setPrayerContent([content, ...prayerContent]);
    }

    setNewPrayerContent({ title: '', description: '', themeId: '', categoryId: prayerCategories?.[0]?.id || '1', type: 'video', week: '', day: '', resources: [], visibility: 'público' });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const addPrayerResource = () => {
    if (!resourceForm.title) return;

    if (editingResourceId) {
      setNewPrayerContent({
        ...newPrayerContent,
        resources: (newPrayerContent.resources || []).map(r =>
          r.id === editingResourceId ? { ...r, ...resourceForm as AcademyResource } : r
        )
      });
      setEditingResourceId(null);
    } else {
      const resource: AcademyResource = {
        id: Date.now().toString(),
        type: resourceForm.type || 'video',
        title: resourceForm.title,
        url: resourceForm.url,
        content: resourceForm.content,
        duration: resourceForm.duration,
        instruction: resourceForm.instruction
      };
      setNewPrayerContent({
        ...newPrayerContent,
        resources: [...(newPrayerContent.resources || []), resource]
      });
    }
    setResourceForm({ type: 'video', title: '', url: '', content: '', duration: '', instruction: '' });
  };

  const removePrayerResource = (id: string) => {
    setNewPrayerContent({
      ...newPrayerContent,
      resources: (newPrayerContent.resources || []).filter(r => r.id !== id)
    });
  };

  return (
    <div className="flex flex-col space-y-10 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase neon-text flex items-center gap-4">
            <Settings size={42} className="text-brand" />
            Admin
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Controle de Dados e Infraestrutura.</p>
        </div>
        <div className="flex bg-[#161b22] p-1.5 rounded-2xl border border-white/5 shadow-2xl overflow-x-auto custom-scrollbar">
          {(['bible', 'courses', 'lessons', 'prayerThemes', 'prayerContent', 'plans', 'users', 'config'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 md:px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-gray-600 hover:text-gray-300'}`}
            >
              {tab === 'bible' ? 'Escrituras' : 
               tab === 'courses' ? 'Cursos Academy' : 
               tab === 'lessons' ? 'Aulas Academy' : 
               tab === 'prayerThemes' ? 'Temas Oração' : 
               tab === 'prayerContent' ? 'Aulas Oração' : 
               tab === 'plans' ? 'Planos' : 
               tab === 'users' ? 'Usuários' : 'Config'}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Lado Esquerdo: Formulários */}
        <div className={`lg:col-span-12 xl:col-span-7 bg-[#161b22] p-10 rounded-[56px] border shadow-2xl space-y-10 relative overflow-hidden group transition-all duration-500 ${(editingModuleId || editingCourseId) ? 'border-brand/40 ring-1 ring-brand/20' : 'border-white/5'}`}>
          <div className="absolute top-0 right-0 p-16 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none select-none">
            {activeTab === 'bible' ? <Database size={180} className="text-brand" /> : activeTab === 'courses' ? <LayoutGrid size={180} className="text-brand" /> : <GraduationCap size={180} className="text-brand" />}
          </div>

          {activeTab === 'bible' && (
            <div className="space-y-10 animate-in slide-in-from-left duration-500">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-brand/10 text-brand rounded-[28px] flex items-center justify-center border border-brand/20 shadow-xl">
                  <Database size={36} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Bíblia Digital</h2>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">
                      {bibleData ? `${bibleData.books.length} Livros em Memória Local` : 'Aguardando Importação JSON'}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${cloudSyncStatus['crentify_bible_data'] ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${cloudSyncStatus['crentify_bible_data'] ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                        {cloudSyncStatus['crentify_bible_data'] ? 'Sincronizado na Nuvem' : 'Não Detectado na Nuvem'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {!cloudSyncStatus['crentify_bible_data'] && bibleData && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl flex items-start gap-4 mx-2">
                  <AlertTriangle className="text-rose-500 flex-shrink-0" size={20} />
                  <p className="text-[10px] font-bold text-rose-200/60 leading-relaxed uppercase tracking-wide">
                    A Bíblia está salva localmente, mas <span className="text-rose-400">não foi detectada na nuvem</span>.
                    Tente subir o arquivo novamente e verifique o console (F12) para erros.
                  </p>
                </div>
              )}

              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/10 rounded-[40px] cursor-pointer bg-black/20 hover:border-brand/40 hover:bg-brand/5 transition-all group/upload relative">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-brand" size={48} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand animate-pulse text-center">
                      Gravando Dados Localmente...<br />
                      <span className="text-[8px] opacity-50 mt-1 block">A sincronização com a nuvem continuará em segundo plano</span>
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className="text-gray-700 mb-4 group-hover/upload:text-brand transition-all" size={48} />
                    <p className="text-[11px] font-black uppercase text-gray-500 tracking-[0.3em] text-center max-w-xs px-10">Importar Arquivo JSON (NVI, Almeida, etc)</p>
                    <input type="file" className="hidden" accept=".json" onChange={handleBibleUpload} />
                  </>
                )}
              </label>
            </div>
          )}


          {activeTab === 'courses' && (
            <div className="space-y-10 animate-in slide-in-from-right duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-brand/10 text-brand rounded-[28px] flex items-center justify-center border border-brand/20 shadow-xl">
                    <LayoutGrid size={36} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                      {editingCourseId ? 'Editar Curso' : 'Novo Curso Academy'}
                    </h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">Gerencie trilhas de conhecimento</p>
                  </div>
                </div>
                {editingCourseId && (
                  <button onClick={() => { setEditingCourseId(null); setNewCourse({ title: '', description: '', thumbnailUrl: '', visibility: 'público' }); }} className="text-rose-500 hover:scale-110 transition-all"><X size={24} /></button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Título do Curso</label>
                  <input type="text" placeholder="Ex: Teologia Sistemática" value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-[22px] px-8 py-5 text-white font-black outline-none focus:ring-2 focus:ring-brand/30 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Capa (URL)</label>
                  <div className="relative">
                    <ImageIcon size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700" />
                    <input type="text" placeholder="https://..." value={newCourse.thumbnailUrl} onChange={e => setNewCourse({ ...newCourse, thumbnailUrl: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-[22px] pl-14 pr-8 py-5 text-white font-black outline-none focus:ring-2 focus:ring-brand/30 transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Categoria</label>
                  <div className="relative">
                    <select value={newCourse.categoryId} onChange={e => setNewCourse({ ...newCourse, categoryId: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[22px] px-8 py-5 font-black outline-none cursor-pointer hover:border-brand/30 transition-all">
                      {academyCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Visibilidade</label>
                  <div className="relative">
                    <select value={newCourse.visibility} onChange={e => setNewCourse({ ...newCourse, visibility: e.target.value as AcademyVisibility })} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[22px] px-8 py-5 font-black outline-none cursor-pointer hover:border-brand/30 transition-all">
                      <option value="público">Público</option>
                      <option value="não listado">Não Listado</option>
                      <option value="privado">Privado</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea placeholder="Objetivo do curso..." value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[32px] px-8 py-5 font-medium outline-none focus:ring-2 focus:ring-brand/30 h-32 resize-none" />
                </div>
              </div>

              <button onClick={handleAddOrUpdateCourse} className="w-full bg-brand text-white py-6 rounded-[28px] font-black uppercase tracking-[0.3em] shadow-xl shadow-brand/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4">
                {editingCourseId ? <CheckCircle2 size={24} /> : <Plus size={24} strokeWidth={3} />}
                {editingCourseId ? 'SALVAR CURSO' : 'CRIAR CURSO'}
              </button>
            </div>
          )}

          {activeTab === 'lessons' && (
            <div className="space-y-10 animate-in slide-in-from-right duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-brand/10 text-brand rounded-[28px] flex items-center justify-center border border-brand/20 shadow-xl">
                    <GraduationCap size={36} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                      {editingModuleId ? 'Editar Aula' : 'Nova Aula'}
                    </h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">Adicione conteúdos e recursos</p>
                  </div>
                </div>
                {editingModuleId && (
                  <button onClick={() => { setEditingModuleId(null); setNewModule({ title: '', description: '', courseId: '', resources: [], visibility: 'público' }); }} className="text-rose-500 hover:scale-110 transition-all"><X size={24} /></button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Título do Bloco (Dia)</label>
                  <input type="text" placeholder="Ex: Estudo, Descanso..." value={newModule.title} onChange={e => setNewModule({ ...newModule, title: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-[22px] px-8 py-5 text-white font-black outline-none focus:ring-2 focus:ring-brand/30 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Pertence ao Curso</label>
                  <div className="relative">
                    <select value={newModule.courseId} onChange={e => {
                      const course = academyCourses.find(c => c.id === e.target.value);
                      setNewModule({ ...newModule, courseId: e.target.value, categoryId: course?.categoryId });
                    }} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[22px] px-8 py-5 font-black outline-none cursor-pointer hover:border-brand/30 transition-all">
                      <option value="">Selecione um curso...</option>
                      {academyCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Semana (Grupo)</label>
                    <button onClick={() => setCategoryToManage('weeks')} className="text-[9px] font-black text-brand hover:underline uppercase tracking-tighter transition-all">Gerenciar</button>
                  </div>
                  <select 
                    value={newModule.week || ''} 
                    onChange={e => setNewModule({ ...newModule, week: e.target.value })} 
                    className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[22px] px-8 py-5 font-black outline-none cursor-pointer hover:border-brand/30 transition-all appearance-none"
                  >
                    <option value="">Selecione a Semana...</option>
                    {weekCategories.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Dia da Semana</label>
                    <button onClick={() => setCategoryToManage('days')} className="text-[9px] font-black text-brand hover:underline uppercase tracking-tighter transition-all">Gerenciar</button>
                  </div>
                  <select 
                    value={newModule.day || ''} 
                    onChange={e => setNewModule({ ...newModule, day: e.target.value })} 
                    className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[22px] px-8 py-5 font-black outline-none cursor-pointer hover:border-brand/30 transition-all appearance-none"
                  >
                    <option value="">Selecione o Dia...</option>
                    {dayCategories.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Gerenciamento de Recursos */}
              <div className="space-y-6 pt-6 border-t border-white/5">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Recursos da Aula</h3>

                <div className="bg-black/20 p-8 rounded-[40px] border border-white/5 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-3">
                      <select value={resourceForm.type} onChange={e => setResourceForm({ ...resourceForm, type: e.target.value as any })} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-xl px-4 py-3 text-[10px] font-black outline-none">
                        <option value="leitura">Leitura Bíblica</option>
                        <option value="video">Vídeo (YT)</option>
                        <option value="link">Link Externo</option>
                        <option value="text">Texto Livre</option>
                      </select>
                    </div>
                    <div className="md:col-span-6">
                      <input type="text" placeholder="Nome da Tarefa (ex: Leitura de Êxodo 20)" value={resourceForm.title} onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-xl px-6 py-3 text-white text-[10px] font-black outline-none" />
                    </div>
                    <div className="md:col-span-3">
                      <input type="text" placeholder="Tempo (ex: 15 min)" value={resourceForm.duration || ''} onChange={e => setResourceForm({ ...resourceForm, duration: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-xl px-6 py-3 text-white text-[10px] font-black outline-none" />
                    </div>
                  </div>

                  <div className="relative">
                    <textarea placeholder="Como Fazer (Instruções da Tarefa)..." value={resourceForm.instruction || ''} onChange={e => setResourceForm({ ...resourceForm, instruction: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl px-6 py-4 text-xs font-medium outline-none h-20 resize-none custom-scrollbar" />
                  </div>

                  {resourceForm.type !== 'text' && resourceForm.type !== 'leitura' ? (
                    <div className="relative">
                      <Link size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="text" placeholder="URL do Vídeo / Link Externo" value={resourceForm.url} onChange={e => setResourceForm({ ...resourceForm, url: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-xl pl-12 pr-6 py-3 text-white text-[10px] font-medium outline-none" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea placeholder="Conteúdo (Se for texto livre ou versículos de leitura)..." value={resourceForm.content} onChange={e => setResourceForm({ ...resourceForm, content: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-2xl px-6 py-4 text-xs font-medium outline-none h-32 resize-none custom-scrollbar" />
                      <p className="text-[8px] text-gray-500 uppercase font-bold text-right">Limite sugerido: ~3000 caracteres por recurso</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={addResource} className="flex-1 bg-white/5 border border-white/10 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand hover:border-brand transition-all flex items-center justify-center gap-2">
                      {editingResourceId ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                      {editingResourceId ? 'ATUALIZAR RECURSO' : 'ADICIONAR RECURSO'}
                    </button>
                    {editingResourceId && (
                      <button onClick={() => { setEditingResourceId(null); setResourceForm({ type: 'video', title: '', url: '', content: '' }); }} className="px-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de Recursos Adicionados */}
                <div className="space-y-3">
                  {newModule.resources?.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-[#0b0e14]/50 rounded-2xl border border-white/5 group">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-brand transition-colors">
                          {r.type === 'video' ? <Youtube size={14} /> : r.type === 'text' ? <FileText size={14} /> : <Link size={14} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-tight">{r.title}</p>
                          <span className="text-[8px] text-gray-500 font-bold uppercase">{r.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingResourceId(r.id); setResourceForm(r); }} className="text-gray-700 hover:text-brand transition-colors p-1">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => removeResource(r.id)} className="text-gray-700 hover:text-rose-500 transition-colors p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleAddOrUpdateModule} className="w-full bg-brand text-white py-6 rounded-[28px] font-black uppercase tracking-[0.3em] shadow-xl shadow-brand/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4">
                {editingModuleId ? <CheckCircle2 size={24} /> : <Zap size={24} strokeWidth={3} />}
                {editingModuleId ? 'SALVAR AULA' : 'PUBLICAR AULA'}
              </button>
            </div>
          )}

          {activeTab === 'prayerThemes' && (
            <div className="space-y-10 animate-in slide-in-from-right duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-[28px] flex items-center justify-center border border-emerald-500/20 shadow-xl">
                    <span className="text-3xl">🙏</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                      {editingPrayerThemeId ? 'Editar Tema' : 'Novo Tema de Oração'}
                    </h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">Crie trilhas de oração guiada</p>
                  </div>
                </div>
                {editingPrayerThemeId && (
                  <button onClick={() => { setEditingPrayerThemeId(null); setNewPrayerTheme({ title: '', description: '', thumbnailUrl: '', visibility: 'público' }); }} className="text-rose-500 hover:scale-110 transition-all"><X size={24} /></button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Título do Tema de Oração</label>
                  <input type="text" placeholder="Ex: Soberania de Deus" value={newPrayerTheme.title} onChange={e => setNewPrayerTheme({ ...newPrayerTheme, title: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-[22px] px-8 py-5 text-white font-black outline-none focus:ring-2 focus:ring-brand/30 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Capa (URL)</label>
                  <div className="relative">
                    <ImageIcon size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700" />
                    <input type="text" placeholder="https://..." value={newPrayerTheme.thumbnailUrl} onChange={e => setNewPrayerTheme({ ...newPrayerTheme, thumbnailUrl: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-[22px] pl-14 pr-8 py-5 text-white font-black outline-none focus:ring-2 focus:ring-brand/30 transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Categoria de Oração</label>
                    <button onClick={() => setCategoryToManage('prayerCategories')} className="text-[9px] font-black text-brand hover:underline uppercase tracking-tighter transition-all">Gerenciar</button>
                  </div>
                  <select value={newPrayerTheme.categoryId} onChange={e => setNewPrayerTheme({ ...newPrayerTheme, categoryId: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[22px] px-8 py-5 font-black outline-none cursor-pointer hover:border-brand/30 transition-all">
                    {prayerCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Visibilidade</label>
                  <select value={newPrayerTheme.visibility} onChange={e => setNewPrayerTheme({ ...newPrayerTheme, visibility: e.target.value as AcademyVisibility })} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[22px] px-8 py-5 font-black outline-none cursor-pointer hover:border-brand/30 transition-all">
                    <option value="público">Público</option>
                    <option value="não listado">Não Listado</option>
                    <option value="privado">Privado</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea placeholder="Propósito deste tema de oração..." value={newPrayerTheme.description} onChange={e => setNewPrayerTheme({ ...newPrayerTheme, description: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[32px] px-8 py-5 font-medium outline-none focus:ring-2 focus:ring-brand/30 h-32 resize-none" />
                </div>
              </div>

              <button onClick={handleAddOrUpdatePrayerTheme} className="w-full bg-brand text-white py-6 rounded-[28px] font-black uppercase tracking-[0.3em] shadow-xl shadow-brand/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4">
                {editingPrayerThemeId ? <CheckCircle2 size={24} /> : <Plus size={24} strokeWidth={3} />}
                {editingPrayerThemeId ? 'SALVAR TEMA ORAÇÃO' : 'CRIAR TEMA ORAÇÃO'}
              </button>
            </div>
          )}

          {activeTab === 'prayerContent' && (
            <div className="space-y-10 animate-in slide-in-from-right duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-[28px] flex items-center justify-center border border-emerald-500/20 shadow-xl">
                    <GraduationCap size={36} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                      {editingPrayerContentId ? 'Editar Conteúdo' : 'Novo Conteúdo de Oração'}
                    </h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">Adicione vídeos e guias de oração</p>
                  </div>
                </div>
                {editingPrayerContentId && (
                  <button onClick={() => { setEditingPrayerContentId(null); setNewPrayerContent({ title: '', description: '', themeId: '', resources: [], visibility: 'público' }); }} className="text-rose-500 hover:scale-110 transition-all"><X size={24} /></button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Título do Conteúdo</label>
                  <input type="text" placeholder="Ex: Adoração Início" value={newPrayerContent.title} onChange={e => setNewPrayerContent({ ...newPrayerContent, title: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-[22px] px-8 py-5 text-white font-black outline-none focus:ring-2 focus:ring-brand/30 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Pertence ao Tema (Oração)</label>
                  <div className="relative">
                    <select value={newPrayerContent.themeId} onChange={e => {
                      const theme = prayerThemes.find(t => t.id === e.target.value);
                      setNewPrayerContent({ ...newPrayerContent, themeId: e.target.value, categoryId: theme?.categoryId });
                    }} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[22px] px-8 py-5 font-black outline-none cursor-pointer hover:border-brand/30 transition-all">
                      <option value="">Selecione um tema de oração...</option>
                      {prayerThemes.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Cronograma (Semanas/Meses)</label>
                    <button onClick={() => setCategoryToManage('prayerWeeks')} className="text-[9px] font-black text-brand hover:underline uppercase tracking-tighter transition-all">Gerenciar</button>
                  </div>
                  <select 
                    value={newPrayerContent.week || ''} 
                    onChange={e => setNewPrayerContent({ ...newPrayerContent, week: e.target.value })} 
                    className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[22px] px-8 py-5 font-black outline-none cursor-pointer hover:border-brand/30 transition-all"
                  >
                    <option value="">Selecione o Bloco...</option>
                    {prayerWeekCategories.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Dia da Jornada</label>
                    <button onClick={() => setCategoryToManage('prayerDays')} className="text-[9px] font-black text-brand hover:underline uppercase tracking-tighter transition-all">Gerenciar</button>
                  </div>
                  <select 
                    value={newPrayerContent.day || ''} 
                    onChange={e => setNewPrayerContent({ ...newPrayerContent, day: e.target.value })} 
                    className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[22px] px-8 py-5 font-black outline-none cursor-pointer hover:border-brand/30 transition-all"
                  >
                    <option value="">Selecione o Dia...</option>
                    {prayerDayCategories.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              </div>

               {/* Gerenciamento de Recursos de Oração */}
               <div className="space-y-6 pt-6 border-t border-white/5">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Guia de Oração</h3>

                <div className="bg-black/20 p-8 rounded-[40px] border border-white/5 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-3">
                      <select value={resourceForm.type} onChange={e => setResourceForm({ ...resourceForm, type: e.target.value as any })} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-xl px-4 py-3 text-[10px] font-black outline-none">
                        <option value="video">Vídeo Guiado</option>
                        <option value="text">Instrução Texto</option>
                        <option value="leitura">Base Bíblica</option>
                      </select>
                    </div>
                    <div className="md:col-span-6">
                      <input type="text" placeholder="Nome do Passo de Oração" value={resourceForm.title} onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-xl px-6 py-3 text-white text-[10px] font-black outline-none" />
                    </div>
                    <div className="md:col-span-3">
                      <input type="text" placeholder="Timer (ex: 5 min)" value={resourceForm.duration || ''} onChange={e => setResourceForm({ ...resourceForm, duration: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-xl px-6 py-3 text-white text-[10px] font-black outline-none" />
                    </div>
                  </div>

                  <div className="relative">
                    <textarea placeholder="Instrução detalhada de como orar este tópico..." value={resourceForm.instruction || ''} onChange={e => setResourceForm({ ...resourceForm, instruction: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl px-6 py-4 text-xs font-medium outline-none h-20 resize-none custom-scrollbar" />
                  </div>

                  {resourceForm.type === 'video' ? (
                    <div className="relative">
                      <Link size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="text" placeholder="URL do YouTube" value={resourceForm.url} onChange={e => setResourceForm({ ...resourceForm, url: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-xl pl-12 pr-6 py-3 text-white text-[10px] font-medium outline-none" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                       <textarea placeholder="Conteúdo textual..." value={resourceForm.content} onChange={e => setResourceForm({ ...resourceForm, content: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-2xl px-6 py-4 text-xs font-medium outline-none h-32 resize-none custom-scrollbar" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={addPrayerResource} className="flex-1 bg-white/5 border border-white/10 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand hover:border-brand transition-all flex items-center justify-center gap-2">
                      {editingResourceId ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                      {editingResourceId ? 'ATUALIZAR PASSO' : 'ADICIONAR PASSO'}
                    </button>
                    {editingResourceId && (
                      <button onClick={() => { setEditingResourceId(null); setResourceForm({ type: 'video', title: '', url: '', content: '' }); }} className="px-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de Recursos Adicionados */}
                <div className="space-y-3">
                  {(newPrayerContent.resources || []).map(r => (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-[#0b0e14]/50 rounded-2xl border border-white/5 group">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-brand transition-colors">
                          {r.type === 'video' ? <Youtube size={14} /> : <FileText size={14} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-tight">{r.title}</p>
                          <span className="text-[8px] text-gray-500 font-bold uppercase">{r.type} • {r.duration || 'Livre'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingResourceId(r.id); setResourceForm(r); }} className="text-gray-700 hover:text-brand transition-colors p-1">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => removePrayerResource(r.id)} className="text-gray-700 hover:text-rose-500 transition-colors p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleAddOrUpdatePrayerContent} className="w-full bg-brand text-white py-6 rounded-[28px] font-black uppercase tracking-[0.3em] shadow-xl shadow-brand/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4">
                {editingPrayerContentId ? <CheckCircle2 size={24} /> : <CheckCircle2 size={24} strokeWidth={3} />}
                {editingPrayerContentId ? 'SALVAR CONTEÚDO' : 'PUBLICAR CONTEÚDO'}
              </button>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="space-y-12 animate-in slide-in-from-right duration-500">
              {/* --- GESTÃO DE PLANOS (HEADER) --- */}
              <section className="space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-brand/10 text-brand rounded-[28px] flex items-center justify-center border border-brand/20 shadow-xl">
                      <ImageIcon size={36} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                        {editingPlanId ? 'Editar Plano' : 'Novo Plano de Leitura'}
                      </h2>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">Crie trilhas de leitura bíblica</p>
                    </div>
                  </div>
                  {editingPlanId && (
                    <button onClick={() => { setEditingPlanId(null); setNewPlan({ title: '', description: '', durationDays: 7 }); }} className="text-rose-500 hover:scale-110 transition-all"><X size={24} /></button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Título do Plano</label>
                    <input type="text" placeholder="Ex: Vida de José" value={newPlan.title} onChange={e => setNewPlan({ ...newPlan, title: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-[22px] px-8 py-5 text-white font-black outline-none focus:ring-2 focus:ring-brand/30 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Capa (URL)</label>
                    <input type="text" placeholder="https://..." value={newPlan.thumbnailUrl} onChange={e => setNewPlan({ ...newPlan, thumbnailUrl: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-[22px] px-8 py-5 text-white font-black outline-none focus:ring-2 focus:ring-brand/30 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Duração (Dias)</label>
                    <input type="number" value={newPlan.durationDays} onChange={e => setNewPlan({ ...newPlan, durationDays: Number(e.target.value) })} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[22px] px-8 py-5 font-black outline-none" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Categoria</label>
                      <button onClick={() => setCategoryToManage('plans')} className="text-[9px] font-black text-brand hover:underline uppercase tracking-tighter transition-all">Gerenciar</button>
                    </div>
                    <select value={newPlan.categoryId} onChange={e => setNewPlan({ ...newPlan, categoryId: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[22px] px-8 py-5 font-black outline-none hover:border-brand/30 transition-all">
                      {readingPlanCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Descrição</label>
                    <textarea placeholder="O que o usuário aprenderá..." value={newPlan.description} onChange={e => setNewPlan({ ...newPlan, description: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[32px] px-8 py-5 font-medium outline-none h-24 resize-none" />
                  </div>
                </div>

                <button onClick={handleAddOrUpdatePlan} className="w-full bg-brand text-white py-6 rounded-[28px] font-black uppercase tracking-[0.3em] shadow-xl shadow-brand/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4">
                  {editingPlanId ? <CheckCircle2 size={24} /> : <Plus size={24} strokeWidth={3} />}
                  {editingPlanId ? 'SALVAR PLANO' : 'CRIAR PLANO'}
                </button>
              </section>

              {/* --- GESTÃO DE CONTEÚDO (DIAS/LEITURAS) --- */}
              <section className="space-y-10 pt-12 border-t border-white/5">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-[28px] flex items-center justify-center border border-blue-500/20 shadow-xl">
                    <List size={36} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                      {editingPlanContentId ? 'Editar Detalhe' : 'Novo Detalhe de Leitura'}
                    </h2>
                    <div className="flex items-center gap-4">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">Vincule versículos a dias específicos</p>
                      <button 
                        onClick={() => setIsSmartImportOpen(true)}
                        className="bg-brand/10 text-brand border border-brand/20 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all flex items-center gap-2"
                      >
                         <Sparkles size={12} /> Importação Inteligente (IA)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Pertence ao Plano</label>
                    <select value={newPlanContent.planId} onChange={e => setNewPlanContent({ ...newPlanContent, planId: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[22px] px-8 py-5 font-black outline-none hover:border-brand/30 transition-all">
                      <option value="">Selecione um plano...</option>
                      {readingPlans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Semana</label>
                    <input type="text" placeholder="Semana 1" value={newPlanContent.week} onChange={e => setNewPlanContent({ ...newPlanContent, week: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-[22px] px-8 py-5 text-white font-black outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Dia</label>
                    <input type="text" placeholder="Dia 1" value={newPlanContent.day} onChange={e => setNewPlanContent({ ...newPlanContent, day: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-[22px] px-8 py-5 text-white font-black outline-none" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Título/Reflexão do Bloco (Tema do Dia)</label>
                      <button 
                        onClick={() => {
                          const verses = newPlanContent.resources?.filter(r => r.type === 'leitura').map(r => r.title).join(', ') || '';
                          if (verses) {
                            setNewPlanContent({ ...newPlanContent, title: `Reflexão: ${verses}` });
                          } else {
                            alert('Adicione primeiro os versículos para gerar uma reflexão.');
                          }
                        }}
                        className="text-[9px] font-black text-brand hover:underline uppercase tracking-tighter transition-all flex items-center gap-1"
                      >
                         <Zap size={10} /> Auto-Completar
                      </button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Ex: Paz que excede entendimento" 
                      value={newPlanContent.title} 
                      onChange={e => setNewPlanContent({ ...newPlanContent, title: e.target.value })} 
                      className="w-full bg-[#0b0e14] border border-white/5 rounded-[22px] px-8 py-5 text-white font-black outline-none focus:ring-2 focus:ring-brand/30 transition-all shadow-inner" 
                    />
                  </div>
                </div>

                {/* Recursos de Leitura */}
                <div className="bg-black/20 p-8 rounded-[40px] border border-white/5 space-y-6">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Adicionar Versículos/Leitura</h3>
                  {/* Lista de Versículos sendo adicionados */}
                  {newPlanContent.resources && newPlanContent.resources.length > 0 && (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2 mt-4">
                      {newPlanContent.resources.map(res => (
                        <div key={res.id} className="bg-[#0b0e14] border border-white/5 rounded-xl p-4 flex justify-between items-center group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                              <BookOpen size={14} />
                            </div>
                            <span className="text-[10px] font-black text-white uppercase">{res.title}</span>
                          </div>
                          <button onClick={() => removeReadingResource(res.id)} className="text-gray-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-8">
                      <input type="text" placeholder="Referência (Ex: Mateus 5 (1 cap))" value={readingResourceForm.title} onChange={e => setReadingResourceForm({ ...readingResourceForm, title: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-xl px-6 py-4 text-white text-[10px] font-black outline-none" />
                    </div>
                    <div className="md:col-span-4">
                      <input type="text" placeholder="Duração (10 min)" value={readingResourceForm.duration} onChange={e => setReadingResourceForm({ ...readingResourceForm, duration: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-xl px-6 py-4 text-white text-[10px] font-black outline-none" />
                    </div>
                    <div className="md:col-span-12">
                      <button onClick={addReadingResource} className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 hover:border-blue-500 transition-all flex items-center justify-center gap-2">
                        <Plus size={16} /> ADICIONAR LEITURA
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {newPlanContent.resources?.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-4 bg-[#0b0e14] rounded-xl border border-white/5">
                        <span className="text-[10px] font-black text-white uppercase tracking-tight">{r.title} ({r.duration})</span>
                        <button onClick={() => setNewPlanContent({ ...newPlanContent, resources: newPlanContent.resources?.filter(res => res.id !== r.id) })} className="text-rose-500 hover:scale-110 transition-all"><Trash2 size={16}/></button>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleAddOrUpdatePlanContent} className="w-full bg-blue-600 text-white py-6 rounded-[28px] font-black uppercase tracking-[0.3em] shadow-xl shadow-blue-500/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4">
                  {editingPlanContentId ? <CheckCircle2 size={24} /> : <Zap size={24} strokeWidth={3} />}
                  {editingPlanContentId ? 'SALVAR DETALHE' : 'PUBLICAR DETALHE'}
                </button>
              </section>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-10 animate-in slide-in-from-right duration-500">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-brand/10 text-brand rounded-[28px] flex items-center justify-center border border-brand/20 shadow-xl">
                  <ImagePlus size={36} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Logo do App</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">Atualização dinâmica sem precisar de deploy</p>
                </div>
              </div>

              {/* Preview do Logo Atual */}
              <div className="flex flex-col items-center gap-6 p-10 bg-[#1a1e26] rounded-[40px] border border-white/5">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Logo Atual</p>
                <img
                  src={currentLogoUrl}
                  alt="Logo Atual"
                  className="w-32 h-32 object-contain rounded-2xl"
                  style={{ filter: 'saturate(1.5) brightness(1.15) hue-rotate(-10deg)' }}
                  onError={(e) => { e.currentTarget.src = '/logo-v2.png'; }}
                />
              </div>

              {/* Upload de Novo Logo */}
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/10 rounded-[40px] cursor-pointer bg-black/20 hover:border-brand/40 hover:bg-brand/5 transition-all group/upload relative">
                {isUploadingLogo ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-brand" size={48} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand animate-pulse">
                      Fazendo Upload...
                    </span>
                  </div>
                ) : (
                  <>
                    <ImagePlus className="text-gray-700 mb-4 group-hover/upload:text-brand transition-all" size={48} />
                    <p className="text-[11px] font-black uppercase text-gray-500 tracking-[0.3em] text-center max-w-xs px-10">Selecionar Novo Logo (PNG, JPG, WebP)</p>
                    <input
                      type="file"
                      ref={logoInputRef}
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setIsUploadingLogo(true);
                        setError(null);

                        try {
                          const newUrl = await uploadLogo(file);
                          if (newUrl) {
                            setCurrentLogoUrl(newUrl);
                            // Dispara evento para atualizar logo em outros componentes
                            window.dispatchEvent(new CustomEvent('logoUpdated', { detail: newUrl }));
                            setSuccess(true);
                            setTimeout(() => setSuccess(false), 3000);
                          } else {
                            setError('Falha ao fazer upload do logo. Verifique as permissões do bucket.');
                          }
                        } catch (err: any) {
                          setError(err.message || 'Erro ao fazer upload');
                        } finally {
                          setIsUploadingLogo(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </>
                )}
              </label>

              <div className="bg-brand/5 border border-brand/20 p-6 rounded-3xl">
                <p className="text-[10px] font-bold text-brand/80 leading-relaxed uppercase tracking-wide text-center">
                  💡 <span className="text-brand">DICA:</span> O novo logo aparecerá automaticamente na Sidebar e na página de Login após o upload. Não é necessário fazer deploy!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-10 animate-in slide-in-from-right duration-500">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-brand/10 text-brand rounded-[28px] flex items-center justify-center border border-brand/20 shadow-xl">
                  <LayoutGrid size={36} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Gestão de Usuários</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">Visualize todos os membros da plataforma</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {profiles.length === 0 ? (
                  <div className="p-10 text-center bg-black/20 rounded-[40px] border border-white/5">
                    <p className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Nenhum usuário encontrado ou tabela ainda não configurada.</p>
                  </div>
                ) : (
                  profiles.map(profile => (
                    <div key={profile.id} className="flex items-center justify-between p-6 bg-[#0b0e14]/50 rounded-[32px] border border-white/5 hover:border-brand/30 transition-all group">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 group-hover:text-brand transition-colors font-black text-xs">
                          {profile.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">{profile.email}</p>
                          <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">ID: {profile.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-brand uppercase tracking-widest">
                          Membro desde
                        </p>
                        <p className="text-[10px] text-gray-500 font-black">
                          {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {success && (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-[32px] text-emerald-500 text-center font-black uppercase text-[10px] tracking-widest animate-in zoom-in shadow-2xl flex items-center justify-center gap-3">
              <CheckCircle2 size={18} /> Operação concluída com êxito!
            </div>
          )}
          {error && (
            <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-[32px] text-rose-500 text-center font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3">
              <AlertTriangle size={18} /> Erro: {error}
            </div>
          )}

          {/* Modal de Gerenciamento de Categorias (Semanas/Dias) */}
          {categoryToManage && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="bg-[#161b22] border border-white/10 rounded-[48px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                      Gerenciar {
                        categoryToManage === 'weeks' ? 'Semanas' : 
                        categoryToManage === 'plans' ? 'Categorias de Plano' : 
                        categoryToManage === 'prayerCategories' ? 'Categorias de Oração' :
                        categoryToManage === 'prayerWeeks' ? 'Blocos de Oração' :
                        categoryToManage === 'prayerDays' ? 'Dias de Oração' :
                        'Dias'
                      }
                    </h3>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Adicione ou exclua opções</p>
                  </div>
                  <button onClick={() => { setCategoryToManage(null); setNewCatName(''); }} className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all"><X size={20}/></button>
                </div>
                
                <div className="p-8 space-y-6">
                  {/* Novo Input */}
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={
                        categoryToManage === 'weeks' ? "Ex: Semana 4" : 
                        categoryToManage === 'plans' ? "Ex: Bíblia em 180 Dias" : 
                        categoryToManage === 'prayerCategories' ? "Ex: Gratidão" :
                        categoryToManage === 'prayerWeeks' ? "Ex: 7 Dias de Fogo" :
                        categoryToManage === 'prayerDays' ? "Ex: Dia 1" :
                        "Ex: Terça-feira"
                      }
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      className="flex-1 bg-[#0b0e14] border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-brand/30"
                    />
                    <button 
                      onClick={() => {
                        if (!newCatName.trim()) return;
                        const newCat = { id: Date.now().toString(), name: newCatName.trim(), color: '#9d5cff' };
                        if (categoryToManage === 'weeks') setWeekCategories([...weekCategories, newCat]);
                        else if (categoryToManage === 'plans') setReadingPlanCategories([...readingPlanCategories, newCat]);
                        else if (categoryToManage === 'prayerCategories') setPrayerCategories([...prayerCategories, newCat]);
                        else if (categoryToManage === 'prayerWeeks') setPrayerWeekCategories([...prayerWeekCategories, newCat]);
                        else if (categoryToManage === 'prayerDays') setPrayerDayCategories([...prayerDayCategories, newCat]);
                        else setDayCategories([...dayCategories, newCat]);
                        setNewCatName('');
                      }}
                      className="bg-brand text-white p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  {/* Lista */}
                  <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                    {(
                      categoryToManage === 'weeks' ? weekCategories : 
                      categoryToManage === 'plans' ? readingPlanCategories : 
                      categoryToManage === 'prayerCategories' ? prayerCategories :
                      categoryToManage === 'prayerWeeks' ? prayerWeekCategories :
                      categoryToManage === 'prayerDays' ? prayerDayCategories :
                      dayCategories
                    ).map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl group">
                        <span className="text-xs font-black text-white uppercase tracking-tight">{cat.name}</span>
                        <button 
                          onClick={() => {
                            if (categoryToManage === 'weeks') setWeekCategories(weekCategories.filter(w => w.id !== cat.id));
                            else if (categoryToManage === 'plans') setReadingPlanCategories((readingPlanCategories || []).filter(p => p.id !== cat.id));
                            else if (categoryToManage === 'prayerCategories') setPrayerCategories(prayerCategories.filter(c => c.id !== cat.id));
                            else if (categoryToManage === 'prayerWeeks') setPrayerWeekCategories(prayerWeekCategories.filter(w => w.id !== cat.id));
                            else if (categoryToManage === 'prayerDays') setPrayerDayCategories(prayerDayCategories.filter(d => d.id !== cat.id));
                            else setDayCategories(dayCategories.filter(d => d.id !== cat.id));
                          }}
                          className="text-gray-600 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 bg-brand/5 border-t border-white/5">
                  <button onClick={() => setCategoryToManage(null)} className="w-full py-4 bg-white/5 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/10 hover:bg-white/10 transition-all">Fechar</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lado Direito: Listagem */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-8">
          {activeTab === 'courses' ? (
            <div className="bg-[#161b22] p-10 rounded-[48px] border border-white/5 shadow-2xl">
              <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-8">Cursos Ativos ({academyCourses.length})</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {academyCourses.map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-6 rounded-[32px] border transition-all group ${editingCourseId === item.id ? 'bg-brand/10 border-brand' : 'bg-[#0b0e14]/50 border-white/5 hover:border-brand/30'}`}>
                    <div className="flex items-center gap-4 overflow-hidden">
                      {item.thumbnailUrl && (
                        <img src={item.thumbnailUrl} alt={item.title} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                      )}
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-white uppercase truncate tracking-tight">{item.title}</p>
                          {item.visibility === 'privado' && <Lock size={12} className="text-rose-500" />}
                        </div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                          {academyCategories.find(c => c.id === item.categoryId)?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => { setEditingCourseId(item.id); setNewCourse(item); setActiveTab('courses'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-gray-500 hover:text-brand transition-colors p-2">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => {
                        if (confirm('Excluir curso e todas as suas aulas?')) {
                          setAcademyCourses(academyCourses.filter(c => c.id !== item.id));
                          setAcademyContent(academyContent.filter(a => a.courseId !== item.id));
                        }
                      }} className="text-gray-500 hover:text-rose-500 transition-colors p-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'lessons' ? (
            <div className="bg-[#161b22] p-10 rounded-[48px] border border-white/5 shadow-2xl">
              <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-8">Aulas Ativas ({academyContent.length})</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {academyContent.map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-6 rounded-[32px] border transition-all group ${editingModuleId === item.id ? 'bg-brand/10 border-brand' : 'bg-[#0b0e14]/50 border-white/5 hover:border-brand/30'}`}>
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center border border-brand/20 flex-shrink-0">
                        <List size={20} />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-white uppercase truncate tracking-tight">{item.title}</p>
                        </div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                          {academyCourses.find(c => c.id === item.courseId)?.title || 'Curso não encontrado'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => { setEditingModuleId(item.id); setNewModule(item); setActiveTab('lessons'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-gray-500 hover:text-brand transition-colors p-2">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => { if (confirm('Excluir aula?')) setAcademyContent(academyContent.filter(c => c.id !== item.id)); }} className="text-gray-500 hover:text-rose-500 transition-colors p-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'prayerThemes' ? (
            <div className="bg-[#161b22] p-10 rounded-[48px] border border-white/5 shadow-2xl">
              <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-8">Temas de Oração Ativos ({prayerThemes.length})</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {prayerThemes.map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-6 rounded-[32px] border transition-all group ${editingPrayerThemeId === item.id ? 'bg-brand/10 border-brand' : 'bg-[#0b0e14]/50 border-white/5 hover:border-brand/30'}`}>
                    <div className="flex items-center gap-4 overflow-hidden">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.title} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl">🙏</div>
                      )}
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-white uppercase truncate tracking-tight">{item.title}</p>
                          {item.visibility === 'privado' && <Lock size={12} className="text-rose-500" />}
                        </div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                          {prayerCategories.find(c => c.id === item.categoryId)?.name || 'Sem Categoria'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => { setEditingPrayerThemeId(item.id); setNewPrayerTheme(item); setActiveTab('prayerThemes'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-gray-500 hover:text-brand transition-colors p-2">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => {
                        if (confirm('Excluir este tema de oração?')) {
                          setPrayerThemes(prayerThemes.filter(t => t.id !== item.id));
                          setPrayerContent(prayerContent.filter(c => c.themeId !== item.id));
                        }
                      }} className="text-gray-500 hover:text-rose-500 transition-colors p-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'prayerContent' ? (
            <div className="bg-[#161b22] p-10 rounded-[48px] border border-white/5 shadow-2xl">
              <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-8">Conteúdos de Oração ({prayerContent.length})</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {prayerContent.map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-6 rounded-[32px] border transition-all group ${editingPrayerContentId === item.id ? 'bg-brand/10 border-brand' : 'bg-[#0b0e14]/50 border-white/5 hover:border-brand/30'}`}>
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20 flex-shrink-0 text-lg">
                        🙏
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-white uppercase truncate tracking-tight">{item.title}</p>
                        </div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                          {prayerThemes.find(t => t.id === item.themeId)?.title || 'Tema não encontrado'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => { setEditingPrayerContentId(item.id); setNewPrayerContent(item); setActiveTab('prayerContent'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-gray-500 hover:text-brand transition-colors p-2">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => { if (confirm('Excluir este conteúdo?')) setPrayerContent(prayerContent.filter(c => c.id !== item.id)); }} className="text-gray-500 hover:text-rose-500 transition-colors p-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'plans' ? (
            <div className="space-y-8">
              {/* Lista de Planos */}
              <div className="bg-[#161b22] p-10 rounded-[48px] border border-white/5 shadow-2xl">
                <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-8">Planos Existentes ({readingPlans.length})</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {readingPlans.map(item => (
                    <div key={item.id} className={`flex items-center justify-between p-5 rounded-[28px] border transition-all group ${editingPlanId === item.id ? 'bg-brand/10 border-brand' : 'bg-[#0b0e14]/50 border-white/5 hover:border-brand/30'}`}>
                      <div className="flex items-center gap-4 truncate">
                         {item.thumbnailUrl && <img src={item.thumbnailUrl} className="w-10 h-10 rounded-xl object-cover" />}
                         <div className="truncate">
                           <p className="text-sm font-black text-white uppercase truncate tracking-tight">{item.title}</p>
                           <p className="text-[8px] text-gray-500 font-bold uppercase">{item.durationDays} Dias</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => { 
                          setEditingPlanId(item.id); 
                          setNewPlan(item); 
                          setNewPlanContent(prev => ({ ...prev, planId: item.id }));
                        }} className="p-2 text-gray-500 hover:text-brand transition-colors"><Edit2 size={16}/></button>
                        <button onClick={() => setReadingPlans(readingPlans.filter(p => p.id !== item.id))} className="p-2 text-gray-500 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lista de Conteúdos do Plano Selecionado */}
              <div className="bg-[#161b22] p-10 rounded-[48px] border border-white/5 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">
                    {editingPlanId ? `Leituras deste Plano (${readingPlanContent.filter(c => c.planId === editingPlanId).length})` : `Todas as Leituras (${readingPlanContent.length})`}
                  </h3>
                  {editingPlanId && (
                    <span className="text-[8px] bg-brand/20 text-brand px-3 py-1 rounded-full font-black">FILTRADO</span>
                  )}
                </div>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {(editingPlanId 
                    ? readingPlanContent.filter(c => c.planId === editingPlanId)
                    : readingPlanContent
                  ).map(item => (
                    <div key={item.id} className={`flex flex-col p-5 rounded-[28px] border transition-all group ${editingPlanContentId === item.id ? 'bg-blue-500/10 border-blue-500' : 'bg-[#0b0e14]/50 border-white/5 hover:border-blue-500/30'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white uppercase truncate tracking-tight">{item.week} - {item.day}</p>
                          <p className="text-[8px] text-gray-500 font-bold uppercase truncate">{readingPlans.find(p => p.id === item.planId)?.title || 'Plano não selecionado'}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => { setEditingPlanContentId(item.id); setNewPlanContent(item); }} className="p-2 text-gray-500 hover:text-blue-500 transition-colors"><Edit2 size={16}/></button>
                          <button onClick={() => setReadingPlanContent(readingPlanContent.filter(c => c.id !== item.id))} className="p-2 text-gray-500 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                        </div>
                      </div>
                      
                      {/* Resumo dos Versículos */}
                      <div className="flex flex-wrap gap-2">
                        {item.resources.slice(0, 3).map(res => (
                          <span key={res.id} className="text-[7px] bg-white/5 text-gray-400 px-2 py-1 rounded-md border border-white/5 font-bold uppercase">{res.title}</span>
                        ))}
                        {item.resources.length > 3 && (
                          <span className="text-[7px] text-gray-600 font-bold">+{item.resources.length - 3}</span>
                        )}
                        {item.resources.length === 0 && (
                          <span className="text-[7px] text-gray-600 font-black italic">Sem versículos</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {editingPlanId && readingPlanContent.filter(c => c.planId === editingPlanId).length === 0 && (
                    <div className="py-10 text-center border border-dashed border-white/5 rounded-3xl">
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Nenhuma leitura vinculada a este plano ainda.</p>
                      <button onClick={() => setNewPlanContent({ ...newPlanContent, planId: editingPlanId })} className="text-[10px] font-black text-brand uppercase mt-2 hover:underline">Adicionar a primeira leitura</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-brand/5 p-12 rounded-[56px] border border-brand/20 text-center">
              <Database className="text-brand mx-auto mb-6" size={48} />
              <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Banco de Dados Bíblico</h4>
              <p className="text-xs text-gray-500 font-bold leading-relaxed uppercase tracking-widest">Importe arquivos JSON para atualizar as escrituras em tempo real para todos os usuários.</p>
            </div>
          )}
      </div>

      {/* Modal de Importação Inteligente */}
      {isSmartImportOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-[#161b22] border border-white/10 rounded-[48px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-3xl flex flex-col my-auto">
            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-brand/10 to-transparent">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-brand/20 text-brand rounded-3xl flex items-center justify-center shadow-xl">
                  <Sparkles size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Mentor IA: Importação Inteligente</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Transforme PDFs e textos brutos em planos estruturados</p>
                </div>
              </div>
              <button onClick={() => setIsSmartImportOpen(false)} className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all"><X size={24}/></button>
            </div>
            
            <div className="p-10 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              {smartImportResult.length === 0 ? (
                <div className="space-y-6">
                  <div className="bg-brand/5 border border-brand/20 p-6 rounded-3xl space-y-4">
                    <p className="text-xs font-bold text-gray-400 leading-relaxed uppercase tracking-wide">
                      💡 <span className="text-brand">COMO USAR:</span> Selecione o texto do seu PDF de leitura, copie e cole abaixo. A IA irá identificar as semanas, dias e versículos para você.
                    </p>
                    
                    {/* Seletor de Plano de Backup dentro do Modal */}
                    <div className="space-y-2 border-t border-brand/10 pt-4">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Vincular ao Plano:</label>
                      <select 
                        value={newPlanContent.planId} 
                        onChange={e => setNewPlanContent({ ...newPlanContent, planId: e.target.value })} 
                        className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-2xl px-6 py-4 text-xs font-black outline-none hover:border-brand/30 transition-all shadow-inner"
                      >
                        <option value="">Selecione um plano...</option>
                        {readingPlans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Alerta de Erro dentro do Modal */}
                  {error && (
                    <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-rose-500 text-center font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-3 animate-in shake">
                      <AlertTriangle size={14} /> {error}
                    </div>
                  )}
                  
                  <div className="relative">
                    <textarea 
                      placeholder="Cole o texto do plano aqui (Ex: Semana 1, Dia 1 - Gênesis 1-3...)"
                      value={smartImportText}
                      onChange={e => setSmartImportText(e.target.value)}
                      className="w-full h-80 bg-[#0b0e14] border border-white/5 text-white rounded-[32px] p-8 font-medium outline-none focus:ring-2 focus:ring-brand/30 resize-none custom-scrollbar shadow-inner text-sm leading-relaxed"
                    />
                  </div>

                  <button 
                    onClick={handleSmartImport}
                    disabled={isProcessingSmartImport || !smartImportText.trim()}
                    className="w-full bg-brand text-white py-6 rounded-[28px] font-black uppercase tracking-[0.3em] shadow-xl shadow-brand/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {isProcessingSmartImport ? (
                      <>
                        <Loader2 size={24} className={isWaitingForQuota ? "text-brand/30" : "animate-spin text-brand"} />
                        {isWaitingForQuota 
                          ? `RESPEITANDO LIMITE... (6s)` 
                          : (importProgress.total > 1 ? `IA PROCESSANDO (${importProgress.current}/${importProgress.total})` : 'IA ANALISANDO TEXTO...')
                        }
                      </>
                    ) : (
                      <>
                        <Sparkles size={24} />
                        INICIAR EXTRAÇÃO INTELIGENTE
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Extração concluída: {smartImportResult.length} Dias Encontrados</h4>
                    <button onClick={() => setSmartImportResult([])} className="text-[10px] font-black text-gray-500 hover:text-white uppercase underline underline-offset-4">Limpar e Tentar Novamente</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {smartImportResult.map((item, idx) => (
                      <div key={idx} className="bg-[#0b0e14] border border-white/5 p-6 rounded-3xl space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-black text-brand uppercase tracking-widest">{item.week} • {item.day}</span>
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                        <p className="text-xs font-black text-white uppercase tracking-tight line-clamp-1">{item.title}</p>
                        <div className="flex flex-wrap gap-1">
                          {(item.verses || []).map((v: string) => (
                            <span key={v} className="text-[8px] bg-white/5 text-gray-400 px-2 py-1 rounded-md border border-white/5 font-bold">{v}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={confirmSmartImport}
                    className="w-full bg-emerald-600 text-white py-6 rounded-[28px] font-black uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4"
                  >
                    <Plus size={24} />
                    CONFIRMAR E IMPORTAR TUDO
                  </button>
                </div>
              )}
            </div>

            <div className="p-10 bg-brand/5 border-t border-white/5 text-center">
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">O Mentor IA processa os dados com 98% de precisão teológica.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default AdminPanel;
