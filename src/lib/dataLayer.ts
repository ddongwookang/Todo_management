/**
 * 데이터 레이어: Firestore vs localStorage 통합
 * 
 * 단일 인터페이스로 모든 CRUD 작업을 처리하며,
 * 로그인 상태에 따라 자동으로 적절한 저장소를 선택합니다.
 */

import { Task } from '@/types';
import {
  addTaskToFirestore,
  updateTaskInFirestore,
  deleteTaskFromFirestore,
  subscribeToTasks as firestoreSubscribe,
} from './firestore';

export interface DataRepository {
  addTask: (task: Task) => Promise<string>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  subscribe: (callback: (tasks: Task[]) => void) => () => void;
}

/**
 * Firestore 기반 Repository
 */
export function createFirestoreRepo(uid: string): DataRepository {
  // uid 검증
  if (!uid || uid === 'undefined' || uid === 'null') {
    console.error('❌ [DataLayer] Invalid uid:', uid);
    throw new Error(`Invalid uid: ${uid}`);
  }

  console.info('📦 [DataLayer] Firestore Repository 생성됨, uid:', uid.slice(0, 6) + '***');

  return {
    addTask: async (task: Task) => {
      const path = `users/${uid}/tasks/${task.id}`;
      console.info('💾 [Firestore Write] ADD:', path);
      
      try {
        await addTaskToFirestore(uid, task);
        console.info('✅ [Firestore Write] ADD 성공:', path);
        return task.id;
      } catch (error: any) {
        console.error('❌ [Firestore Write] ADD 실패:', path, error);
        throw error;
      }
    },

    updateTask: async (id: string, updates: Partial<Task>) => {
      const path = `users/${uid}/tasks/${id}`;
      console.info('💾 [Firestore Write] UPDATE:', path);
      
      try {
        await updateTaskInFirestore(uid, id, updates);
        console.info('✅ [Firestore Write] UPDATE 성공:', path);
      } catch (error: any) {
        console.error('❌ [Firestore Write] UPDATE 실패:', path, error);
        throw error;
      }
    },

    deleteTask: async (id: string) => {
      const path = `users/${uid}/tasks/${id}`;
      console.info('💾 [Firestore Write] DELETE:', path);
      
      try {
        await updateTaskInFirestore(uid, id, { isDeleted: true, deletedAt: new Date() });
        console.info('✅ [Firestore Write] DELETE 성공:', path);
      } catch (error: any) {
        console.error('❌ [Firestore Write] DELETE 실패:', path, error);
        throw error;
      }
    },

    subscribe: (callback: (tasks: Task[]) => void) => {
      console.info('👂 [Firestore Subscribe] 구독 시작, uid:', uid.slice(0, 6) + '***');
      return firestoreSubscribe(uid, callback);
    },
  };
}

/**
 * localStorage 기반 Repository
 */
export function createLocalRepo(): DataRepository {
  console.info('📦 [DataLayer] localStorage Repository 생성됨');
  const STORAGE_KEY = 'todo-app-tasks';

  const getTasks = (): Task[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ [localStorage] Read 실패:', error);
      return [];
    }
  };

  const saveTasks = (tasks: Task[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      console.info('✅ [localStorage] 저장 성공, 개수:', tasks.length);
    } catch (error) {
      console.error('❌ [localStorage] 저장 실패:', error);
    }
  };

  return {
    addTask: async (task: Task) => {
      console.info('💾 [localStorage Write] ADD:', task.id);
      const tasks = getTasks();
      tasks.push(task);
      saveTasks(tasks);
      return task.id;
    },

    updateTask: async (id: string, updates: Partial<Task>) => {
      console.info('💾 [localStorage Write] UPDATE:', id);
      const tasks = getTasks();
      const index = tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date() };
        saveTasks(tasks);
      }
    },

    deleteTask: async (id: string) => {
      console.info('💾 [localStorage Write] DELETE:', id);
      const tasks = getTasks();
      const index = tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], isDeleted: true, deletedAt: new Date() };
        saveTasks(tasks);
      }
    },

    subscribe: (callback: (tasks: Task[]) => void) => {
      console.info('👂 [localStorage Subscribe] 초기 로드');
      // localStorage는 실시간 구독이 없으므로 초기 로드만
      callback(getTasks());
      return () => {};
    },
  };
}

/**
 * Repository 팩토리: Auth 상태에 따라 적절한 저장소 반환
 */
export function createRepository(uid: string | null): DataRepository {
  if (uid) {
    return createFirestoreRepo(uid);
  } else {
    return createLocalRepo();
  }
}

