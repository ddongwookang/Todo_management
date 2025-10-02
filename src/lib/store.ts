import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Task, User, Category, TaskFilter } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { shouldCreateRecurringTask, createRecurringTask } from './recurrence';

interface AppStore extends AppState {
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  setCurrentUser: (user: User) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  getFilteredTasks: () => Task[];
  getTodayTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getDeletedTasks: () => Task[];
  getImportantTasks: () => Task[];
  getUserTasks: (userId: string) => Task[];
  processRecurringTasks: () => void;
}

const defaultUsers: User[] = [
  { id: '1', name: '나', email: 'me@example.com' },
];

const defaultCategories: Category[] = [
  { id: '1', name: '업무', color: '#3b82f6', order: 0 },
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
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      toggleTaskComplete: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, completed: !task.completed, updatedAt: new Date() }
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

      getFilteredTasks: () => {
        const { tasks } = get();
        return tasks.filter((task) => !task.isDeleted);
      },

      getTodayTasks: () => {
        const { tasks } = get();
        return tasks.filter((task) => task.isToday && !task.completed && !task.isDeleted);
      },

      getCompletedTasks: () => {
        const { tasks } = get();
        return tasks.filter((task) => task.completed && !task.isDeleted);
      },

      getDeletedTasks: () => {
        const { tasks } = get();
        return tasks.filter((task) => task.isDeleted);
      },

      getImportantTasks: () => {
        const { tasks } = get();
        return tasks.filter((task) => task.isImportant && !task.completed && !task.isDeleted);
      },

      getUserTasks: (userId: string) => {
        const { tasks } = get();
        return tasks.filter((task) => task.assignedTo === userId && !task.isDeleted);
      },

      processRecurringTasks: () => {
        const { tasks } = get();
        const recurringTasks = tasks.filter((task) => 
          task.recurrence && 
          task.recurrence.type !== 'none' && 
          !task.isDeleted &&
          !task.parentTaskId
        );

        recurringTasks.forEach((task) => {
          if (shouldCreateRecurringTask(task, tasks)) {
            const newTask = createRecurringTask(task);
            set((state) => ({ tasks: [...state.tasks, newTask] }));
          }
        });
      },
    }),
    {
      name: 'todo-app-storage',
    }
  )
);
