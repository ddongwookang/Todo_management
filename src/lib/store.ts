import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Task, User, Category, Group, TaskFilter, WorkTimer, PomodoroSettings, FirebaseUser, AuthState, PendingWrite } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { shouldCreateRecurringTask, createRecurringTask } from './recurrence';
import {
  addTaskToFirestore,
  updateTaskInFirestore,
  deleteTaskFromFirestore,
  batchUpdateTasksInFirestore,
  subscribeToTasks,
} from './firestore';
import { createRepository, DataRepository } from './dataLayer';

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
  // 다중 선택 관련
  selectedTaskIds: string[];
  toggleTaskSelection: (id: string) => void;
  setSelectedTasks: (ids: string[]) => void;
  clearSelection: () => void;
  bulkDeleteTasks: (ids: string[]) => void;
  bulkCompleteTasks: (ids: string[]) => void;
  bulkAddToToday: (ids: string[]) => void;
  bulkMarkImportant: (ids: string[]) => void;
  bulkMoveToCategory: (ids: string[], categoryId: string) => void;
  bulkSetDueDate: (ids: string[], dueDate: Date) => void;
  // Undo 관련
  undo: () => boolean;
  canUndo: () => boolean;
  // Pomodoro 관련
  updatePomodoroSettings: (settings: Partial<PomodoroSettings>) => void;
  // Firebase 인증 관련
  setFirebaseUser: (user: FirebaseUser | null) => void;
  // Firestore 동기화
  initFirestoreSync: (uid: string) => () => void;
  setTasksFromFirestore: (tasks: Task[]) => void;
  syncEnabled: boolean;
  setSyncEnabled: (enabled: boolean) => void;
  // Auth 상태 관리
  setAuthState: (auth: Partial<AuthState>) => void;
  processPendingWrites: () => Promise<void>;
  getRepository: () => DataRepository;
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
      selectedTaskIds: [], // 선택된 태스크 ID 배열
      history: [], // Undo 히스토리
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
      pomodoroSettings: {
        motivationText: '집중하면 할 수 있어요! 💪',
        showMotivation: true,
        useRandomQuote: false,
        defaultQuotes: [
          '집중하면 할 수 있어요! 💪',
          '한 걸음씩 나아가고 있어요 🚀',
          '지금 이 순간에 집중하세요 🎯',
          '당신은 충분히 잘하고 있어요 ⭐',
          '작은 진전도 큰 성과입니다 🌟',
          '포기하지 마세요, 거의 다 왔어요! 🔥',
        ],
      },
      firebaseUser: null,
      syncEnabled: false,
      // Auth 상태 (초기에는 로딩 중)
      auth: {
        loading: true,
        uid: null,
      },
      pendingWrites: [],

      addTask: (taskData) => {
        const now = new Date();
        const newTask: Task = {
          ...taskData,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        };
        
        const { auth, history, pendingWrites } = get();
        
        console.log('🔵 [addTask] 호출됨:', {
          taskTitle: taskData.title,
          taskId: newTask.id,
          authLoading: auth.loading,
          authUid: auth.uid?.slice(0, 6) + '***' || 'NULL',
        });
        
        // 먼저 로컬 상태에 즉시 추가 (낙관적 업데이트)
        set((state) => ({ tasks: [...state.tasks, newTask] }));
        console.log('✅ [addTask] 로컬 상태에 추가됨');
        
        // 히스토리에 저장
        set({
          history: [
            ...history,
            {
              type: 'update' as const,
              timestamp: Date.now(),
              data: {
                tasks: [{ ...newTask, isDeleted: true }],
              },
            },
          ].slice(-10),
        });
        
        // Auth 준비 확인
        if (auth.loading) {
          console.warn('⚠️ [addTask] Auth 로딩 중, 큐에 추가');
          set({
            pendingWrites: [
              ...pendingWrites,
              {
                id: uuidv4(),
                type: 'add',
                taskData: newTask,
                timestamp: Date.now(),
              },
            ],
          });
          return;
        }
        
        // Repository를 통해 저장
        const repo = get().getRepository();
        
        repo.addTask(newTask)
          .then(() => {
            console.log('✅ [addTask] 저장 성공!');
          })
          .catch((error) => {
            console.error('❌ [addTask] 저장 실패:', error);
            // 실패 시 로컬 상태에서 제거
            set((state) => ({
              tasks: state.tasks.filter((t) => t.id !== newTask.id),
            }));
            console.log('🗑️ [addTask] 로컬 상태에서 제거됨');
          });
      },
      updateTask: (id, updates) => {
        const { tasks, history, firebaseUser, syncEnabled } = get();
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // 히스토리에 이전 상태 저장
        set({
          history: [
            ...history,
            {
              type: 'update' as const,
              timestamp: Date.now(),
              data: {
                tasks: [{ ...task }],
              },
            },
          ].slice(-10),
        });

        // 먼저 로컬 상태 즉시 업데이트 (UX 개선)
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
          ),
        }));

        // Firestore 비동기 업데이트
        if (syncEnabled && firebaseUser) {
          updateTaskInFirestore(firebaseUser.uid, id, { ...updates, updatedAt: new Date() }).catch((error) => {
            console.error('Failed to update task in Firestore:', error);
          });
        }
      },

      deleteTask: (id) => {
        const { tasks, history, firebaseUser, syncEnabled } = get();
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // 히스토리에 이전 상태 저장
        set({
          history: [
            ...history,
            {
              type: 'delete' as const,
              timestamp: Date.now(),
              data: {
                tasks: [{ ...task }],
              },
            },
          ].slice(-10),
        });

        // 먼저 로컬 상태 즉시 업데이트 (UX 개선)
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, isDeleted: true, deletedAt: new Date() } : task
          ),
        }));

        // Firestore 비동기 업데이트 (소프트 삭제)
        if (syncEnabled && firebaseUser) {
          updateTaskInFirestore(firebaseUser.uid, id, { isDeleted: true, deletedAt: new Date() }).catch((error) => {
            console.error('Failed to delete task in Firestore:', error);
          });
        }
      },

      toggleTaskComplete: (id) => {
        const { tasks, history } = get();
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // 히스토리에 이전 상태 저장
        set({
          history: [
            ...history,
            {
              type: 'complete' as const,
              timestamp: Date.now(),
              data: {
                tasks: [{ ...task }],
              },
            },
          ].slice(-10),
        });

        set((state) => {
          const currentTask = state.tasks.find(t => t.id === id);
          if (!currentTask) return state;

          const isCompleting = !currentTask.completed;
          
          // 반복 작업을 완료하면 다음 작업 자동 생성
          if (isCompleting && task.recurrence && task.recurrence.type !== 'none') {
            const now = new Date();
            // 다음 날짜는 현재 태스크의 dueDate를 기준으로 계산
            const baseDate = task.dueDate ? new Date(task.dueDate) : new Date();
            baseDate.setHours(0, 0, 0, 0);
            let nextDate = new Date(baseDate);
            
            // 다음 날짜 계산 (dueDate 기준)
            switch (task.recurrence.type) {
              case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
              case 'weekdays':
                // 평일: 월~금
                nextDate.setDate(nextDate.getDate() + 1);
                // 주말이면 월요일로
                while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
                  nextDate.setDate(nextDate.getDate() + 1);
                }
                break;
              case 'weekly':
                // weekly인 경우 daysOfWeek 설정이 있으면 사용
                if (task.recurrence.daysOfWeek && task.recurrence.daysOfWeek.length > 0) {
                  // 다음 요일 찾기
                  nextDate.setDate(nextDate.getDate() + 7);
                } else {
                  nextDate.setDate(nextDate.getDate() + 7);
                }
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 1. 날짜가 지난 태스크의 isToday 플래그 제거
        const updatedTasks = tasks.map((task) => {
          if (task.isToday && task.dueDate && !task.completed) {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            
            // 데드라인이 지났으면 isToday 제거
            if (dueDate.getTime() < today.getTime()) {
              return { ...task, isToday: false };
            }
          }
          return task;
        });
        
        // 업데이트된 태스크 적용
        if (JSON.stringify(tasks) !== JSON.stringify(updatedTasks)) {
          set({ tasks: updatedTasks });
        }
        
        // 2. 반복 태스크 생성
        const recurringTasks = updatedTasks.filter((task) => 
          task.recurrence && 
          task.recurrence.type !== 'none' && 
          !task.isDeleted &&
          !task.parentTaskId
        );

        recurringTasks.forEach((task) => {
          if (shouldCreateRecurringTask(task, updatedTasks)) {
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

      // 다중 선택 관련 함수들
      toggleTaskSelection: (id) => {
        set((state) => ({
          selectedTaskIds: state.selectedTaskIds.includes(id)
            ? state.selectedTaskIds.filter(taskId => taskId !== id)
            : [...state.selectedTaskIds, id]
        }));
      },

      setSelectedTasks: (ids) => {
        set({ selectedTaskIds: ids });
      },

      clearSelection: () => {
        set({ selectedTaskIds: [] });
      },

      bulkDeleteTasks: (ids) => {
        const { tasks, history } = get();
        const affectedTasks = tasks.filter(task => ids.includes(task.id));
        
        // 히스토리에 이전 상태 저장
        set({
          history: [
            ...history,
            {
              type: 'delete' as const,
              timestamp: Date.now(),
              data: {
                tasks: affectedTasks.map(t => ({ ...t })),
              },
            },
          ].slice(-10), // 최근 10개만 유지
        });
        
        set((state) => ({
          tasks: state.tasks.map(task =>
            ids.includes(task.id) ? { ...task, isDeleted: true, deletedAt: new Date() } : task
          ),
          selectedTaskIds: [], // 삭제 후 선택 해제
        }));
      },

      bulkCompleteTasks: (ids) => {
        const { tasks, history } = get();
        const affectedTasks = tasks.filter(task => ids.includes(task.id));
        
        // 히스토리에 이전 상태 저장
        set({
          history: [
            ...history,
            {
              type: 'complete' as const,
              timestamp: Date.now(),
              data: {
                tasks: affectedTasks.map(t => ({ ...t })),
              },
            },
          ].slice(-10), // 최근 10개만 유지
        });
        
        set((state) => ({
          tasks: state.tasks.map(task =>
            ids.includes(task.id) 
              ? { ...task, completed: true, completedAt: new Date(), isToday: false } 
              : task
          ),
          selectedTaskIds: [], // 완료 후 선택 해제
        }));
      },

      bulkAddToToday: (ids) => {
        const { tasks, history } = get();
        const affectedTasks = tasks.filter(task => ids.includes(task.id));
        
        // 히스토리에 이전 상태 저장
        set({
          history: [
            ...history,
            {
              type: 'update' as const,
              timestamp: Date.now(),
              data: {
                tasks: affectedTasks.map(t => ({ ...t })),
              },
            },
          ].slice(-10), // 최근 10개만 유지
        });
        
        set((state) => ({
          tasks: state.tasks.map(task =>
            ids.includes(task.id) ? { ...task, isToday: true } : task
          ),
          selectedTaskIds: [], // 추가 후 선택 해제
        }));
      },

      bulkMarkImportant: (ids) => {
        const { tasks, history } = get();
        const affectedTasks = tasks.filter(task => ids.includes(task.id));
        
        // 히스토리에 이전 상태 저장
        set({
          history: [
            ...history,
            {
              type: 'update' as const,
              timestamp: Date.now(),
              data: {
                tasks: affectedTasks.map(t => ({ ...t })),
              },
            },
          ].slice(-10), // 최근 10개만 유지
        });
        
        set((state) => ({
          tasks: state.tasks.map(task =>
            ids.includes(task.id) ? { ...task, isImportant: !task.isImportant } : task
          ),
          selectedTaskIds: [], // 변경 후 선택 해제
        }));
      },

      bulkMoveToCategory: (ids, categoryId) => {
        const { tasks, history } = get();
        const affectedTasks = tasks.filter(task => ids.includes(task.id));
        
        // 히스토리에 이전 상태 저장
        set({
          history: [
            ...history,
            {
              type: 'bulk' as const,
              timestamp: Date.now(),
              data: {
                tasks: affectedTasks.map(t => ({ ...t })),
              },
            },
          ].slice(-10), // 최근 10개만 유지
        });
        
        set((state) => ({
          tasks: state.tasks.map(task =>
            ids.includes(task.id) ? { ...task, categoryId } : task
          ),
          selectedTaskIds: [], // 이동 후 선택 해제
        }));
      },

      bulkSetDueDate: (ids, dueDate) => {
        const { tasks, history } = get();
        const affectedTasks = tasks.filter(task => ids.includes(task.id));
        
        // 히스토리에 이전 상태 저장
        set({
          history: [
            ...history,
            {
              type: 'update' as const,
              timestamp: Date.now(),
              data: {
                tasks: affectedTasks.map(t => ({ ...t })),
              },
            },
          ].slice(-10), // 최근 10개만 유지
        });
        
        // 오늘인지 확인
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(dueDate);
        selectedDate.setHours(0, 0, 0, 0);
        const isSelectedToday = selectedDate.getTime() === today.getTime();
        
        set((state) => ({
          tasks: state.tasks.map(task =>
            ids.includes(task.id) ? { 
              ...task, 
              dueDate,
              isToday: isSelectedToday ? task.isToday : false // 오늘이 아니면 isToday false
            } : task
          ),
          selectedTaskIds: [], // 변경 후 선택 해제
        }));
      },

      // Undo 함수
      undo: () => {
        const { history, tasks } = get();
        
        if (history.length === 0) {
          return false;
        }
        
        const lastAction = history[history.length - 1];
        const now = Date.now();
        
        // 5초 이내의 액션만 undo 가능
        if (now - lastAction.timestamp > 5000) {
          // 오래된 히스토리 제거
          set({ history: [] });
          return false;
        }
        
        // 이전 상태로 복원
        if (lastAction.data.tasks) {
          const savedTasks = lastAction.data.tasks;
          const savedTaskIds = savedTasks.map(t => t.id);
          
          // 기존 tasks 배열에서 영향받은 태스크를 찾아서 복원
          let updatedTasks = tasks.map(task => {
            const saved = savedTasks.find(t => t.id === task.id);
            return saved ? { ...saved } : task;
          });
          
          // 삭제된 태스크의 경우 배열에 다시 추가
          savedTasks.forEach(savedTask => {
            if (!tasks.find(t => t.id === savedTask.id)) {
              updatedTasks.push({ ...savedTask });
            }
          });
          
          set({
            tasks: updatedTasks,
            history: history.slice(0, -1), // 마지막 히스토리 제거
          });
          
          return true;
        }
        
        return false;
      },

      canUndo: () => {
        const { history } = get();
        if (history.length === 0) return false;
        
        const lastAction = history[history.length - 1];
        const now = Date.now();
        
        // 5초 이내의 액션만 undo 가능
        return now - lastAction.timestamp <= 5000;
      },

      // Pomodoro 설정 업데이트
      updatePomodoroSettings: (settings) => {
        set((state) => ({
          pomodoroSettings: {
            ...state.pomodoroSettings,
            ...settings,
          },
        }));
      },

      // Firebase 사용자 설정
      setFirebaseUser: (user) => {
        set({ firebaseUser: user });
      },

      // Firestore 동기화 초기화
      initFirestoreSync: (uid) => {
        console.log('🔄 [Store] initFirestoreSync 호출됨, uid:', uid);
        set({ syncEnabled: true });
        console.log('✅ [Store] syncEnabled = true');
        
        // Firestore 실시간 구독
        const unsubscribe = subscribeToTasks(uid, (firestoreTasks) => {
          console.log('📥 [Store] Firestore에서 Task 수신:', {
            count: firestoreTasks.length,
            taskIds: firestoreTasks.map(t => t.id).slice(0, 5), // 처음 5개만
          });
          
          // Firestore에서 받은 Task ID 목록
          const firestoreTaskIds = new Set(firestoreTasks.map(t => t.id));
          
          // 현재 로컬 상태 가져오기
          const currentTasks = get().tasks;
          console.log('📦 [Store] 현재 로컬 Task 개수:', currentTasks.length);
          
          // 로컬에만 있는 Task (아직 Firestore에 저장 중)
          const localOnlyTasks = currentTasks.filter(t => !firestoreTaskIds.has(t.id));
          console.log('💾 [Store] 로컬 전용 Task 개수:', localOnlyTasks.length);
          
          // Firestore Task + 로컬 전용 Task 병합
          set({ tasks: [...firestoreTasks, ...localOnlyTasks] });
          console.log('✅ [Store] Task 병합 완료, 총:', firestoreTasks.length + localOnlyTasks.length);
        });
        
        console.log('✅ [Store] Firestore 구독 설정 완료');
        return unsubscribe;
      },

      // Firestore에서 가져온 tasks 설정
      setTasksFromFirestore: (tasks) => {
        set({ tasks });
      },

      // 동기화 활성화/비활성화
      setSyncEnabled: (enabled) => {
        set({ syncEnabled: enabled });
        // 동기화 비활성화 시 로컬 tasks 초기화
        if (!enabled) {
          set({ tasks: [] });
        }
      },

      // Auth 상태 관리
      setAuthState: (authUpdates) => {
        const currentAuth = get().auth;
        const newAuth = { ...currentAuth, ...authUpdates };
        
        console.log('🔐 [Store] Auth 상태 변경:', {
          from: { loading: currentAuth.loading, uid: currentAuth.uid?.slice(0, 6) + '***' || 'NULL' },
          to: { loading: newAuth.loading, uid: newAuth.uid?.slice(0, 6) + '***' || 'NULL' },
        });
        
        set({ auth: newAuth });
        
        // uid가 준비되면 대기 중인 쓰기 처리
        if (!currentAuth.uid && newAuth.uid && !newAuth.loading) {
          console.log('✅ [Store] UID 준비 완료, 대기 중인 쓰기 처리...');
          get().processPendingWrites();
        }
      },

      // 대기 중인 쓰기 처리
      processPendingWrites: async () => {
        const { pendingWrites, auth } = get();
        
        if (pendingWrites.length === 0) {
          console.log('📭 [Store] 대기 중인 쓰기 없음');
          return;
        }
        
        if (!auth.uid || auth.loading) {
          console.warn('⚠️ [Store] UID 준비 안됨, 대기 쓰기 처리 불가');
          return;
        }
        
        console.log('🚀 [Store] 대기 중인 쓰기 처리 시작:', pendingWrites.length, '개');
        
        const repo = get().getRepository();
        
        for (const write of pendingWrites) {
          try {
            switch (write.type) {
              case 'add':
                await repo.addTask(write.taskData);
                break;
              case 'update':
                await repo.updateTask(write.taskData.id, write.taskData);
                break;
              case 'delete':
                await repo.deleteTask(write.taskData.id);
                break;
            }
            console.log('✅ [Store] 대기 쓰기 처리 성공:', write.id);
          } catch (error) {
            console.error('❌ [Store] 대기 쓰기 처리 실패:', write.id, error);
          }
        }
        
        // 처리 완료 후 큐 비우기
        set({ pendingWrites: [] });
        console.log('✅ [Store] 모든 대기 쓰기 처리 완료');
      },

      // Repository 팩토리
      getRepository: () => {
        const { auth } = get();
        
        if (auth.loading) {
          console.warn('⚠️ [Store] Auth 로딩 중');
        }
        
        return createRepository(auth.uid);
      },
    }),
    {
      name: 'todo-app-storage',
    }
  )
);
