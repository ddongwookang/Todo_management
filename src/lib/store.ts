import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Task, User, Category, TaskFilter } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { shouldCreateRecurringTask, createRecurringTask } from './recurrence';

interface AppStore extends AppState {
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  restoreTask: (id: string) => void;
  permanentDeleteTask: (id: string) => void;
  cleanupOldDeletedTasks: () => void;
  toggleTaskComplete: (id: string) => void;
  toggleTaskToday: (id: string) => void;
  
  // User actions
  addUser: (user: Omit<User, 'id'>) => void;
  setCurrentUser: (user: User) => void;
  
  // Category actions
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (categories: Category[]) => void;
  
  // Filter actions
  setFilter: (filter: Partial<TaskFilter>) => void;
  clearFilter: () => void;
  
  // Utility functions
  getFilteredTasks: () => Task[];
  getTodayTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getUserTasks: (userId: string) => Task[];
  getDeletedTasks: () => Task[];
  getImportantTasks: () => Task[];
  
  // Recurring tasks
  processRecurringTasks: () => void;
}

const defaultUsers: User[] = [
  { id: '1', name: '나', email: 'me@example.com' },
  { id: '2', name: '팀원1', email: 'team1@example.com' },
  { id: '3', name: '팀원2', email: 'team2@example.com' },
];

const defaultCategories: Category[] = [
  { id: '1', name: '업무', color: '#3b82f6', order: 0 },
  { id: '2', name: '개인', color: '#10b981', order: 1 },
  { id: '3', name: '가정', color: '#f59e0b', order: 2 },
];

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      users: defaultUsers,
      categories: defaultCategories,
      tasks: [],
      currentUser: defaultUsers[0],
      filter: {},

      addTask: (taskData) => {
        const now = new Date();
        const newTask: Task = {
          ...taskData,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        };
        
        // 중복 방지: 같은 제목의 태스크가 최근 2초 내에 생성되었는지 확인
        const { tasks } = get();
        const recentDuplicate = tasks.find(task => 
          task.title === newTask.title && 
          !task.isDeleted &&
          Math.abs(now.getTime() - new Date(task.createdAt).getTime()) < 2000
        );
        
        if (recentDuplicate) {
          console.log('중복 태스크 생성 방지:', newTask.title);
          return;
        }
        
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date() }
              : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, isDeleted: true, deletedAt: new Date(), updatedAt: new Date() }
              : task
          ),
        }));
      },

      restoreTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, isDeleted: false, deletedAt: undefined, updatedAt: new Date() }
              : task
          ),
        }));
      },

      permanentDeleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      cleanupOldDeletedTasks: () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        set((state) => ({
          tasks: state.tasks.filter((task) => 
            !task.isDeleted || 
            !task.deletedAt || 
            new Date(task.deletedAt) > sevenDaysAgo
          ),
        }));
      },

      toggleTaskComplete: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  completed: !task.completed,
                  completedAt: !task.completed ? new Date() : undefined,
                  isToday: !task.completed ? false : task.isToday, // Remove from today when completed
                  updatedAt: new Date(),
                }
              : task
          ),
        }));
      },

      toggleTaskToday: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, isToday: !task.isToday, updatedAt: new Date() }
              : task
          ),
        }));
      },

      addUser: (userData) => {
        const newUser: User = { ...userData, id: uuidv4() };
        set((state) => ({ users: [...state.users, newUser] }));
      },

      setCurrentUser: (user) => {
        set({ currentUser: user });
      },

      addCategory: (categoryData) => {
        const newCategory: Category = {
          ...categoryData,
          id: uuidv4(),
          order: get().categories.length,
        };
        set((state) => ({ categories: [...state.categories, newCategory] }));
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id ? { ...category, ...updates } : category
          ),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
          tasks: state.tasks.map((task) =>
            task.categoryId === id ? { ...task, categoryId: undefined } : task
          ),
        }));
      },

      reorderCategories: (categories) => {
        set({ categories });
      },

      setFilter: (newFilter) => {
        set((state) => ({ filter: { ...state.filter, ...newFilter } }));
      },

      clearFilter: () => {
        set({ filter: {} });
      },

      getFilteredTasks: () => {
        const { tasks, filter } = get();
        return tasks.filter((task) => {
          // Exclude deleted tasks
          if (task.isDeleted) return false;
          
          if (filter.assigneeId && !task.assignees.includes(filter.assigneeId)) {
            return false;
          }
          if (filter.categoryId && task.categoryId !== filter.categoryId) {
            return false;
          }
          if (filter.completed !== undefined && task.completed !== filter.completed) {
            return false;
          }
          if (filter.isToday !== undefined && task.isToday !== filter.isToday) {
            return false;
          }
          if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            const titleMatch = task.title.toLowerCase().includes(searchLower);
            const descriptionMatch = task.description?.toLowerCase().includes(searchLower);
            const assigneeMatch = task.assignees.some((assigneeId) => {
              const user = get().users.find((u) => u.id === assigneeId);
              return user?.name.toLowerCase().includes(searchLower);
            });
            if (!titleMatch && !descriptionMatch && !assigneeMatch) {
              return false;
            }
          }
          return true;
        });
      },

      getTodayTasks: () => {
        const { tasks } = get();
        return tasks.filter((task) => task.isToday && !task.completed && !task.isDeleted);
      },

      getCompletedTasks: () => {
        const { tasks } = get();
        return tasks.filter((task) => task.completed && !task.isDeleted);
      },

      getUserTasks: (userId) => {
        const { tasks } = get();
        return tasks.filter((task) => task.assignees.includes(userId) && !task.isDeleted);
      },

      getDeletedTasks: () => {
        const { tasks } = get();
        return tasks.filter((task) => task.isDeleted);
      },

      getImportantTasks: () => {
        const { tasks } = get();
        // 중요한 업무는 isToday가 true인 업무로 정의
        return tasks.filter((task) => task.isToday && !task.completed && !task.isDeleted);
      },

      processRecurringTasks: () => {
        const { tasks } = get();
        const newTasks: Task[] = [];

        // Find original recurring tasks (not generated ones)
        const originalRecurringTasks = tasks.filter(task => 
          task.recurrence.type !== 'none' && !task.parentTaskId
        );

        originalRecurringTasks.forEach((task) => {
          if (shouldCreateRecurringTask(task, tasks)) {
            const recurringTask = createRecurringTask(task);
            newTasks.push(recurringTask);
          }
        });

        if (newTasks.length > 0) {
          set((state) => ({
            tasks: [...state.tasks, ...newTasks],
          }));
        }

        // Cleanup old deleted tasks (7 days)
        get().cleanupOldDeletedTasks();
      },
    }),
    {
      name: 'todo-app-storage',
      skipHydration: true,
    }
  )
);
