
export enum Section {
  DASHBOARD = 'dashboard',
  BIBLE = 'bible',
  MENTOR = 'mentor',
  DIARY = 'diary',
  HABITS = 'habits',
  WORKFLOW = 'workflow',
  PROJECTS = 'projects',
  ADMIN = 'admin',
  ACADEMY = 'academy',
  STUDIES = 'studies',
  PLANOS = 'planos'
}

export interface AcademyProgressRecord {
  completed: boolean;
  timeSpent?: number; // Time in seconds
  completedAt?: string; // ISO date string
}

export interface AcademyProgress {
  completedLessons: string[]; // Legacy compatibility (list of completed resource IDs)
  records?: Record<string, AcademyProgressRecord>; // New: resourceId -> record mapping
}

export interface StudyProgress {
  completedLessons: string[]; // Array of UserLesson.id
}

export interface AcademyCategory {
  id: string;
  name: string;
}

export interface AcademyWeekCategory {
  id: string;
  name: string;
}

export interface AcademyDayCategory {
  id: string;
  name: string;
}

export type AcademyVisibility = 'público' | 'não listado' | 'privado';

export interface AcademyResource {
  id: string;
  type: 'video' | 'link' | 'text' | 'leitura';
  title: string;
  url?: string; // For video or link
  content?: string; // For text
  duration?: string; // e.g. "15 min", "1 cap"
  instruction?: string; // Support for "COMO FAZER" instructions
}

export interface AcademyCourse {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  thumbnailUrl?: string;
  visibility: AcademyVisibility;
  createdAt: string;
}

export interface AcademyContent {
  id: string;
  courseId: string; // New: Lessons now belong to a course
  title: string;
  description: string;
  categoryId: string;
  type: 'video' | 'text' | 'audio' | 'mixed'; // mixed for multi-resource
  url?: string; // Legacy/Default url
  week?: string; // e.g. "Semana 1" or "1"
  day?: string; // e.g. "Segunda", "Sábado - Descanso"
  resources?: AcademyResource[]; // New: list of resources
  visibility?: AcademyVisibility;
}

export interface AcademyReflection {
  id: string;
  contentId: string;
  title: string;
  text: string;
  date: string;
}

export interface BibleNote {
  id: string;
  bookName: string;
  chapter: number;
  verse: number;
  verseText: string;
  content: string;
  date: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'free' | 'plan' | 'testimony' | 'routine';
}

export type HabitFrequency = 'daily' | 'weekly' | 'period' | 'annual' | 'once' | 'monthly';

export interface SpiritualHabitCategory {
  id: string;
  name: string;
}

export interface SpiritualHabit {
  id: string;
  category: string;
  description: string;
  frequency: HabitFrequency;
  selectedDays?: number[];
  startDate?: string;
  endDate?: string;
  date?: string;
  time?: string;
  completions: Record<string, boolean>;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  youtubeUrl?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  daysOfWeek: number[]; // 0-6 (Sun-Sat)
  exercises: WorkoutExercise[];
  createdAt: string;
}

export interface WorkoutSet {
  setNumber: number;
  completed: boolean;
  reps?: number;
  weight?: number;
}

export interface ActivityExerciseSession {
  exerciseId: string;
  name: string;
  sets: WorkoutSet[];
}

export interface PhysicalActivity {
  id: string;
  type: string;
  duration: number;
  calories: number;
  date: string;
  notes: string;
  workoutTemplateId?: string;
  exercises?: ActivityExerciseSession[];
}

export interface Recipe {
  id: string;
  title: string;
  instructions: string;
  imageUrl?: string;
  youtubeUrl?: string;
  date: string;
}

export interface MealRecord {
  id: string;
  type: 'Café da Manhã' | 'Almoço' | 'Jantar' | 'Lanche' | 'Outro';
  date: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface HealthHabit {
  id: string;
  category: string;
  description: string;
  frequency: HabitFrequency;
  selectedDays?: number[];
  startDate?: string;
  endDate?: string;
  date?: string;
  time?: string;
  completions: Record<string, boolean>;
}

export interface HealthCategory {
  id: string;
  name: string;
}

export interface BibleData {
  books: {
    name: string;
    chapters: {
      number: number;
      verses: {
        number: number;
        text: string;
      }[];
    }[];
  }[];
}

export interface BibleProgress {
  completedChapters: Record<string, number[]>;
  completionDates?: Record<string, Record<number, string>>; // bookName -> chapterNumber -> ISO date string
}

export interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  recurringGroupId?: string; // Links all installments of the same recurring series
}

export interface Installment {
  id: string;
  number: number;
  amount: number;
  date: string;
  isPaid: boolean;
  isLaunched: boolean;
}

export interface FinancialPlan {
  id: string;
  description: string;
  type: 'income' | 'expense';
  totalAmount: number;
  installmentAmount: number;
  installmentsCount: number;
  startDate: string;
  category: string;
  installments: Installment[];
}

export interface WorkflowTask {
  id: string;
  category: string; // Custom user-defined category
  description: string;
  frequency: HabitFrequency;
  selectedDays?: number[];
  startDate?: string;
  endDate?: string;
  date?: string;
  time?: string; // NEW: Time of day for the task (HH:MM format)
  completions: Record<string, boolean>;
}

export interface WorkflowCategory {
  id: string;
  name: string;
  color?: string;
}

export interface FinanceReminder {
  id: string;
  category: string;
  description: string;
  amount?: number;
  frequency: HabitFrequency;
  selectedDays?: number[];
  startDate?: string;
  endDate?: string;
  date?: string;
  time?: string;
  completions: Record<string, boolean>;
  linkedTransactionId?: string;
}

export interface UserShare {
  id: string;
  owner_id: string;
  shared_with_email: string;
  module: string;
  permission: 'viewer' | 'editor';
  created_at: string;
}

export interface StudyItem {
  id: string;
  category: string;
  description: string;
  courseId?: string; // Optional link to an AcademyCourse.id
  frequency: HabitFrequency;
  selectedDays?: number[];
  startDate?: string;
  endDate?: string;
  date?: string;
  time?: string;
  completions: Record<string, boolean>;
}

export interface StudyCategory {
  id: string;
  name: string;
}

export interface UserLesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  resources: AcademyResource[];
  createdAt: string;
}

export interface UserCourse {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface ProjectSubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectReminder {
  id: string;
  title: string;
  description: string;
  frequency: HabitFrequency;
  selectedDays?: number[];
  startDate?: string;
  endDate?: string;
  date?: string;
  time?: string;
  completions: Record<string, boolean>;
  milestoneId?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  completed: boolean;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  color?: string;
  tasks?: ProjectSubTask[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: 'MONETIZATION' | 'GROWTH' | 'CONTENT' | 'OTHER' | 'FINANCES' | 'LIFE' | 'EDUCATION' | 'SPIRITUALITY' | 'EXERCISES';
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  progress: number;
  milestones: ProjectMilestone[];
  reminders?: ProjectReminder[];
  strategyDoc?: string;
  contentTypes?: string;
  contentPilars?: string;
  contentCalendar?: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
    completed: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}