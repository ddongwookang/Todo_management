export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  groupId: string; // 이제 Category가 Group에 속함
  order: number;
}

export interface Group {
  id: string;
  name: string;
  order: number;
  categories?: Category[];
}

export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  isToday: boolean;
  isImportant?: boolean; // 중요 표시
  assignees: string[]; // User IDs
  assignedTo?: string; // 단일 할당자 (하위 호환성)
  categoryId?: string; // 카테고리 ID (카테고리는 그룹에 속함)
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  dueTime?: string; // HH:MM 형식
  emoji?: string; // 커스텀 이모지
  recurrence: {
    type: RecurrenceType;
    interval?: number; // for weekly/monthly
    daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  };
  parentTaskId?: string; // for recurring tasks
  isDeleted: boolean;
  deletedAt?: Date;
  order?: number; // 순서
  subtasks?: SubTask[]; // 서브태스크
  pomodoro?: {
    enabled: boolean;
    endTime?: Date;
  };
}

export interface TaskFilter {
  assigneeId?: string;
  categoryId?: string;
  completed?: boolean;
  isToday?: boolean;
  search?: string;
}

export interface WorkTimer {
  status: 'stopped' | 'working' | 'break';
  workStartTime?: Date;
  breakStartTime?: Date;
  totalWorkTime: number; // seconds
  totalBreakTime: number; // seconds
}

export interface HistoryAction {
  type: 'delete' | 'complete' | 'update' | 'bulk';
  timestamp: number;
  data: {
    tasks?: Task[];
    previousState?: Partial<Task>[];
  };
}

export interface PomodoroSettings {
  motivationText: string;
  showMotivation: boolean;
  useRandomQuote: boolean;
  defaultQuotes: string[];
}

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId?: string; // 'google.com' or 'microsoft.com'
}

export interface AuthState {
  loading: boolean;
  uid: string | null;
}

export interface PendingWrite {
  id: string;
  type: 'add' | 'update' | 'delete' | 'complete';
  taskData: any;
  timestamp: number;
}

export interface AppState {
  users: User[];
  categories: Category[];
  groups: Group[];
  tasks: Task[];
  currentUser: User | null;
  filter: TaskFilter;
  customEmojis: string[];
  workTimer: WorkTimer;
  history: HistoryAction[];
  pomodoroSettings: PomodoroSettings;
  firebaseUser: FirebaseUser | null;
  // 새로운 Auth 상태
  auth: AuthState;
  pendingWrites: PendingWrite[];
}
