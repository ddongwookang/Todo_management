import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
  writeBatch,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, app } from './firebase';
import { Task, RecurrenceType } from '@/types';
import { cleanUndefined } from './utils';

// Task를 Firestore 형식으로 변환 (undefined 제거 + 기본값 강제)
export const taskToFirestore = (task: Task) => {
  const firestoreTask: any = {
    // 필수 필드
    title: task.title || '',
    isDeleted: task.isDeleted ?? false,
    completed: task.completed ?? false,
    
    // 타임스탬프 (서버 시간 사용)
    createdAt: task.createdAt ? Timestamp.fromDate(new Date(task.createdAt)) : serverTimestamp(),
    updatedAt: task.updatedAt ? Timestamp.fromDate(new Date(task.updatedAt)) : serverTimestamp(),
    deletedAt: task.deletedAt ? Timestamp.fromDate(new Date(task.deletedAt)) : null,
    completedAt: task.completedAt ? Timestamp.fromDate(new Date(task.completedAt)) : null,
    
    // 옵션 필드 (기본값: null)
    dueDate: task.dueDate ? Timestamp.fromDate(new Date(task.dueDate)) : null,
    dueTime: task.dueTime || null,
    description: task.description || null,
    categoryId: task.categoryId || null,
    
    // 플래그 필드
    isToday: task.isToday ?? false,
    isImportant: task.isImportant ?? false,
    
    // 배열 필드 (기본값: [])
    assignees: task.assignees || [],
    subtasks: task.subtasks || [],
    
    // 객체 필드
    recurrence: task.recurrence || { type: 'none' as RecurrenceType },
    pomodoro: task.pomodoro ? {
      enabled: task.pomodoro.enabled ?? false,
      endTime: task.pomodoro.endTime ? Timestamp.fromDate(new Date(task.pomodoro.endTime)) : null,
    } : null,
    
    // 기타 옵션 필드
    order: task.order ?? 0,
    emoji: task.emoji || null,
    parentTaskId: task.parentTaskId || null,
    assignedTo: task.assignedTo || null,
  };
  
  // undefined 제거
  return cleanUndefined(firestoreTask);
};

// Firestore 데이터를 Task 형식으로 변환
export const firestoreToTask = (id: string, data: any): Task => {
  return {
    ...data,
    id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    deletedAt: data.deletedAt?.toDate() || undefined,
    dueDate: data.dueDate?.toDate() || undefined,
    pomodoro: data.pomodoro ? {
      ...data.pomodoro,
      endTime: data.pomodoro.endTime?.toDate() || undefined,
    } : undefined,
  } as Task;
};

// Firestore에 Task 추가
export const addTaskToFirestore = async (uid: string, task: Task) => {
  // ===== 1. 쓰기 직전 정보 로깅 =====
  console.info('📝 [write] ===== 태스크 생성 시작 =====');
  console.info('[write] projectId =', app.options.projectId);
  console.info('[write] uid =', uid);
  console.info('[write] taskId =', task.id);
  console.info('[write] path =', `users/${uid}/tasks/${task.id}`);
  
  // task.id를 Firestore 문서 ID로 사용
  const taskRef = doc(db, `users/${uid}/tasks`, task.id);
  
  // id는 Firestore 문서 ID로 사용하므로 데이터에서 제거
  const { id, ...taskWithoutId } = task;
  const taskData = taskToFirestore(taskWithoutId as Task);
  
  // ===== 2. payload 전체 로깅 (undefined 확인) =====
  console.info('[payload] 원본 Task 필드:');
  console.info('  - pomodoro:', task.pomodoro);
  console.info('  - description:', task.description);
  console.info('  - categoryId:', task.categoryId);
  console.info('  - recurrence:', task.recurrence);
  
  console.info('[payload] cleanUndefined 적용 후:', JSON.stringify(taskData, null, 2));
  
  try {
    // ===== 3. setDoc 실행 (merge: true) =====
    await setDoc(taskRef, taskData, { merge: true });
    console.info('✅ [write] setDoc 성공! (merge: true)');
    
    // ===== 4. 쓰기 직후 검증 =====
    console.info('🔍 [verify] 문서 존재 여부 확인 중...');
    const snap = await getDoc(taskRef);
    console.info('[verify] exists =', snap.exists());
    if (snap.exists()) {
      const data = snap.data();
      console.info('[verify] data =', {
        title: data.title,
        isDeleted: data.isDeleted,
        completed: data.completed,
        pomodoro: data.pomodoro,
        description: data.description,
        categoryId: data.categoryId,
      });
    } else {
      console.error('❌ [verify] 문서가 존재하지 않습니다!');
    }
    
    return task.id;
  } catch (error: any) {
    // ===== 5. 에러 로깅 =====
    console.error('❌ [write:ERROR] ===== 쓰기 실패 =====');
    console.error('[write:ERROR] code =', error.code);
    console.error('[write:ERROR] message =', error.message);
    console.error('[write:ERROR] name =', error.name);
    console.error('[write:ERROR] full error =', error);
    throw error;
  }
};

// Firestore에서 Task 업데이트
export const updateTaskInFirestore = async (uid: string, taskId: string, updates: Partial<Task>) => {
  const taskRef = doc(db, `users/${uid}/tasks`, taskId);
  const updateData: any = { ...updates };
  
  // Date 객체를 Timestamp로 변환
  if (updateData.updatedAt) {
    updateData.updatedAt = Timestamp.fromDate(new Date(updateData.updatedAt));
  } else {
    updateData.updatedAt = serverTimestamp();
  }
  
  if (updateData.dueDate !== undefined) {
    updateData.dueDate = updateData.dueDate ? Timestamp.fromDate(new Date(updateData.dueDate)) : null;
  }
  if (updateData.deletedAt !== undefined) {
    updateData.deletedAt = updateData.deletedAt ? Timestamp.fromDate(new Date(updateData.deletedAt)) : null;
  }
  if (updateData.pomodoro !== undefined) {
    if (updateData.pomodoro) {
      updateData.pomodoro = {
        enabled: updateData.pomodoro.enabled ?? false,
        endTime: updateData.pomodoro.endTime ? Timestamp.fromDate(new Date(updateData.pomodoro.endTime)) : null,
      };
    } else {
      updateData.pomodoro = null;
    }
  }
  
  // undefined 제거
  const cleanedData = cleanUndefined(updateData);
  
  console.info('[updateTask] cleanUndefined 적용 후:', JSON.stringify(cleanedData, null, 2));
  
  await updateDoc(taskRef, cleanedData);
};

// Firestore에서 Task 삭제
export const deleteTaskFromFirestore = async (uid: string, taskId: string) => {
  const taskRef = doc(db, `users/${uid}/tasks`, taskId);
  await deleteDoc(taskRef);
};

// Firestore에서 여러 Task 업데이트 (batch)
export const batchUpdateTasksInFirestore = async (uid: string, updates: { id: string; data: Partial<Task> }[]) => {
  const batch = writeBatch(db);
  
  updates.forEach(({ id, data }) => {
    const taskRef = doc(db, `users/${uid}/tasks`, id);
    const updateData: any = { ...data };
    
    // Date 객체를 Timestamp로 변환
    if (updateData.updatedAt) {
      updateData.updatedAt = Timestamp.fromDate(new Date(updateData.updatedAt));
    }
    if (updateData.dueDate !== undefined) {
      updateData.dueDate = updateData.dueDate ? Timestamp.fromDate(new Date(updateData.dueDate)) : null;
    }
    if (updateData.deletedAt !== undefined) {
      updateData.deletedAt = updateData.deletedAt ? Timestamp.fromDate(new Date(updateData.deletedAt)) : null;
    }
    
    batch.update(taskRef, updateData);
  });
  
  await batch.commit();
};

// Firestore에서 Task 실시간 구독
export const subscribeToTasks = (uid: string, callback: (tasks: Task[]) => void) => {
  console.log('👂 [Firestore] subscribeToTasks 설정 중, uid:', uid);
  const tasksRef = collection(db, `users/${uid}/tasks`);
  console.log('📍 [Firestore] 구독 경로:', `users/${uid}/tasks`);
  
  const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
    console.info('📨 [sync] ===== onSnapshot 트리거 =====');
    console.info('[sync] tasks 수신:', snapshot.docs.length, '개');
    console.info('[sync] 문서 개수:', snapshot.size);
    
    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      const task = firestoreToTask(doc.id, doc.data());
      tasks.push(task);
      console.info('  - Task:', doc.id.slice(0, 8) + '...', task.title);
    });
    
    console.info('✅ [sync] Task 변환 완료, callback 호출 중...');
    callback(tasks);
  }, (error) => {
    console.error('❌ [Firestore] 구독 에러:', error);
    console.error('  - 에러 코드:', error.code);
    console.error('  - 에러 메시지:', error.message);
  });
  
  console.log('✅ [Firestore] onSnapshot 설정 완료');
  return unsubscribe;
};

