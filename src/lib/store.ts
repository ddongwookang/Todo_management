import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Task, User, Category, Group, TaskFilter, WorkTimer } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { shouldCreateRecurringTask, createRecurringTask } from './recurrence';

interface AppStore extends AppState {
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  reorderTasks: (taskId: string, newOrder: number) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  setCurrentUser: (user: User) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (categories: Category[]) => void;
  addGroup: (group: Omit<Group, 'id'>) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  reorderGroups: (groupId: string, groups: Group[]) => void;
  restoreTask: (id: string) => void;
  permanentDeleteTask: (id: string) => void;
  setFilter: (filter: Partial<TaskFilter>) => void;
  clearFilter: () => void;
  addCustomEmoji: (emoji: string) => void;
  getFilteredTasks: () => Task[];
  getTodayTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getDeletedTasks: () => Task[];
  getImportantTasks: () => Task[];
  getUserTasks: (userId: string) => Task[];
  processRecurringTasks: () => void;
  startWork: () => void;
  startBreak: () => void;
  endWork: () => void;
  updateWorkTimer: () => void;
}

const defaultUsers: User[] = [
  { id: '1', name: '나', email: 'me@example.com' },
];

const defaultGroups: Group[] = [
  { id: 'group-1', name: '개인', order: 0 },
  { id: 'group-2', name: '업무', order: 1 },
];

const defaultCategories: Category[] = [
  { id: 'cat-1', name: '할 일', color: '#3b82f6', groupId: 'group-1', order: 0 },
  { id: 'cat-2', name: '취미', color: '#10b981', groupId: 'group-1', order: 1 },
  { id: 'cat-3', name: '프로젝트', color: '#f59e0b', groupId: 'group-2', order: 0 },
  { id: 'cat-4', name: '회의', color: '#ef4444', groupId: 'group-2', order: 1 },
];

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      users: defaultUsers,
      groups: defaultGroups,
      categories: defaultCategories,
      tasks: [
        {
          id: '1',
          title: '프로젝트 기획서 작성',
          description: '새로운 프로젝트의 기획서를 작성하고 팀원들과 검토',
          completed: false,
          isToday: true,
          isImportant: true,
          assignees: ['1'],
          categoryId: 'cat-3',
          createdAt: new Date(),
          updatedAt: new Date(),
          recurrence: { type: 'none' },
          isDeleted: false,
          emoji: '📝',
          subtasks: [],
        },
        {
          id: '2',
          title: '운동하기',
          description: '헬스장에서 1시간 운동',
          completed: false,
          isToday: false,
          isImportant: false,
          assignees: ['1'],
          categoryId: '4',
          createdAt: new Date(),
          updatedAt: new Date(),
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 내일
          recurrence: { type: 'daily' },
          isDeleted: false,
          emoji: '💪',
          subtasks: [],
        },
        {
          id: '3',
          title: 'React 학습',
          description: 'Next.js 14의 새로운 기능들 학습',
          completed: false,
          isToday: false,
          isImportant: false,
          assignees: ['1'],
          categoryId: '3',
          createdAt: new Date(),
          updatedAt: new Date(),
          recurrence: { type: 'weekdays' },
          isDeleted: false,
          emoji: '📚',
          subtasks: [],
        },
        {
          id: '4',
          title: '장보기',
          description: '주말 장보기 목록 작성',
          completed: true,
          isToday: false,
          isImportant: false,
          assignees: ['1'],
          categoryId: '2',
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: new Date(),
          recurrence: { type: 'weekly' },
          isDeleted: false,
          emoji: '🛒',
          subtasks: [],
        },
      ],
      currentUser: defaultUsers[0],
      filter: {},
      customEmojis: ['⭐', '🔥', '💡', '📝', '🎯', '⚡', '🚀', '💼'],
      workTimer: {
        status: 'stopped',
        totalWorkTime: 0,
        totalBreakTime: 0,
      },

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
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, isDeleted: true, deletedAt: new Date() } : task
          ),
        }));
      },

      toggleTaskComplete: (id) => {
        set((state) => {
          const task = state.tasks.find(t => t.id === id);
          if (!task) return state;

          const isCompleting = !task.completed;
          
          // 반복 작업을 완료하면 다음 작업 자동 생성
          if (isCompleting && task.recurrence && task.recurrence.type !== 'none') {
            const now = new Date();
            let nextDate = new Date(now);
            
            // 다음 날짜 계산
            switch (task.recurrence.type) {
              case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
              case 'weekdays':
                // 평일: 월~금
                nextDate.setDate(nextDate.getDate() + 1);
                // 금요일이면 월요일로 (3일 추가)
                if (nextDate.getDay() === 6) { // 토요일
                  nextDate.setDate(nextDate.getDate() + 2);
                } else if (nextDate.getDay() === 0) { // 일요일
                  nextDate.setDate(nextDate.getDate() + 1);
                }
                break;
              case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
              case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            }
            
            // 다음 작업 생성 (parentTaskId가 있든 없든 항상 생성)
            const newTask = {
              ...task,
              id: uuidv4(),
              completed: false,
              isToday: false, // 다음 날짜이므로 isToday는 false
              dueDate: nextDate,
              createdAt: now,
              updatedAt: now,
              completedAt: undefined,
              parentTaskId: task.parentTaskId || task.id, // 원본 태스크 ID 유지
            };
            
            return {
              tasks: state.tasks.map((t) =>
                t.id === id
                  ? { 
                      ...t, 
                      completed: true, 
                      completedAt: now,
                      updatedAt: now,
                      isToday: false, // 완료되면 오늘 할 일에서 제거
                    }
                  : t
              ).concat(newTask),
            };
          }

          return {
            tasks: state.tasks.map((t) =>
              t.id === id
                ? { 
                    ...t, 
                    completed: !t.completed, 
                    completedAt: !t.completed ? new Date() : undefined,
                    updatedAt: new Date() 
                  }
                : t
            ),
          };
        });
      },

      reorderTasks: (taskId, newOrder) => {
        set((state) => {
          const tasks = [...state.tasks];
          const taskIndex = tasks.findIndex(t => t.id === taskId);
          
          if (taskIndex === -1) return state;
          
          const [movedTask] = tasks.splice(taskIndex, 1);
          tasks.splice(newOrder, 0, movedTask);
          
          // 순서 재정렬
          const reorderedTasks = tasks.map((task, index) => ({
            ...task,
            order: index
          }));
          
          return { tasks: reorderedTasks };
        });
      },

      addUser: (userData) => {
        const newUser: User = { ...userData, id: uuidv4() };
        set((state) => ({ users: [...state.users, newUser] }));
      },

      setCurrentUser: (user) => {
        set({ currentUser: user });
      },

      addCategory: (categoryData) => {
        const groupCategories = get().categories.filter(c => c.groupId === categoryData.groupId);
        const newCategory: Category = {
          ...categoryData,
          id: uuidv4(),
          order: groupCategories.length,
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
        }));
      },

      reorderCategories: (categories) => {
        const reorderedCategories = categories.map((cat, index) => ({
          ...cat,
          order: index
        }));
        set({ categories: reorderedCategories });
      },

      addGroup: (groupData) => {
        const newGroup: Group = {
          ...groupData,
          id: uuidv4(),
        };
        set((state) => ({ groups: [...state.groups, newGroup] }));
      },

      updateGroup: (id, updates) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, ...updates } : group
          ),
        }));
      },

      deleteGroup: (id) => {
        // 그룹을 삭제하면 그룹에 속한 카테고리들도 삭제
        const categoriesToDelete = get().categories.filter(c => c.groupId === id).map(c => c.id);
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          categories: state.categories.filter((category) => category.groupId !== id),
          // 삭제된 카테고리에 속한 태스크들의 categoryId도 제거
          tasks: state.tasks.map((task) =>
            categoriesToDelete.includes(task.categoryId || '') ? { ...task, categoryId: undefined } : task
          ),
        }));
      },

      reorderGroups: (groupId, categories) => {
        // groupId 파라미터는 사용하지 않지만 호환성을 위해 유지
        const reorderedGroups = categories.map((group, index) => ({
          ...group,
          order: index
        }));
        set({ groups: reorderedGroups });
      },

      restoreTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, isDeleted: false, deletedAt: undefined } : task
          ),
        }));
      },

      permanentDeleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      setFilter: (newFilter) => {
        set((state) => ({
          filter: { ...state.filter, ...newFilter },
        }));
      },

      clearFilter: () => {
        set({ filter: {} });
      },

      addCustomEmoji: (emoji) => {
        set((state) => {
          if (!state.customEmojis.includes(emoji)) {
            return { customEmojis: [...state.customEmojis, emoji] };
          }
          return state;
        });
      },

      getFilteredTasks: () => {
        const { tasks, filter } = get();
        return tasks.filter((task) => {
          if (task.isDeleted) return false;
          
          // Search filter
          if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            const matchesTitle = task.title.toLowerCase().includes(searchLower);
            const matchesDescription = task.description?.toLowerCase().includes(searchLower) || false;
            const matchesAssignee = task.assignees.some(assigneeId => {
              const user = get().users.find(u => u.id === assigneeId);
              return user?.name.toLowerCase().includes(searchLower) || false;
            });
            if (!matchesTitle && !matchesDescription && !matchesAssignee) return false;
          }
          
          // Assignee filter
          if (filter.assigneeId) {
            if (!task.assignees.includes(filter.assigneeId)) return false;
          }
          
          // Category filter
          if (filter.categoryId) {
            if (task.categoryId !== filter.categoryId) return false;
          }
          
          // Completed filter
          if (filter.completed !== undefined) {
            if (task.completed !== filter.completed) return false;
          }
          
          // Today filter
          if (filter.isToday !== undefined) {
            if (task.isToday !== filter.isToday) return false;
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
        return tasks.filter((task) => 
          (task.assignedTo === userId || task.assignees.includes(userId)) && !task.isDeleted
        );
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

      // Work Timer functions
      startWork: () => {
        set((state) => ({
          workTimer: {
            ...state.workTimer,
            status: 'working',
            workStartTime: new Date(),
            breakStartTime: undefined,
          },
        }));
      },

      startBreak: () => {
        const { workTimer } = get();
        const now = new Date();
        
        // 근무 시간 누적
        if (workTimer.workStartTime) {
          const workDuration = Math.floor((now.getTime() - new Date(workTimer.workStartTime).getTime()) / 1000);
          set((state) => ({
            workTimer: {
              ...state.workTimer,
              status: 'break',
              totalWorkTime: state.workTimer.totalWorkTime + workDuration,
              breakStartTime: now,
              workStartTime: undefined,
            },
          }));
        }
      },

      endWork: () => {
        const { workTimer } = get();
        const now = new Date();
        
        // 현재 상태에 따라 시간 누적
        if (workTimer.status === 'working' && workTimer.workStartTime) {
          const workDuration = Math.floor((now.getTime() - new Date(workTimer.workStartTime).getTime()) / 1000);
          set((state) => ({
            workTimer: {
              status: 'stopped',
              totalWorkTime: state.workTimer.totalWorkTime + workDuration,
              totalBreakTime: state.workTimer.totalBreakTime,
              workStartTime: undefined,
              breakStartTime: undefined,
            },
          }));
        } else if (workTimer.status === 'break' && workTimer.breakStartTime) {
          const breakDuration = Math.floor((now.getTime() - new Date(workTimer.breakStartTime).getTime()) / 1000);
          set((state) => ({
            workTimer: {
              status: 'stopped',
              totalWorkTime: state.workTimer.totalWorkTime,
              totalBreakTime: state.workTimer.totalBreakTime + breakDuration,
              workStartTime: undefined,
              breakStartTime: undefined,
            },
          }));
        }
      },

      updateWorkTimer: () => {
        // 이 함수는 UI에서 시간을 업데이트하기 위해 호출됨
        // 실제로 상태를 변경하지 않고, 리렌더링만 트리거
        const { workTimer } = get();
        set({ workTimer: { ...workTimer } });
      },
    }),
    {
      name: 'todo-app-storage',
    }
  )
);
