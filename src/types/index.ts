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
  order: number;
}

export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  isToday: boolean;
  assignees: string[]; // User IDs
  categoryId?: string;
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
}

export interface TaskFilter {
  assigneeId?: string;
  categoryId?: string;
  completed?: boolean;
  isToday?: boolean;
  search?: string;
}

export interface AppState {
  users: User[];
  categories: Category[];
  tasks: Task[];
  currentUser: User | null;
  filter: TaskFilter;
}
