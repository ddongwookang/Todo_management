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
} from 'firebase/firestore';
import { db } from './firebase';
import { Task } from '@/types';

// Task를 Firestore 형식으로 변환
export const taskToFirestore = (task: Task) => {
  return {
    ...task,
    createdAt: task.createdAt ? Timestamp.fromDate(new Date(task.createdAt)) : Timestamp.now(),
    updatedAt: task.updatedAt ? Timestamp.fromDate(new Date(task.updatedAt)) : Timestamp.now(),
    deletedAt: task.deletedAt ? Timestamp.fromDate(new Date(task.deletedAt)) : null,
    dueDate: task.dueDate ? Timestamp.fromDate(new Date(task.dueDate)) : null,
    pomodoro: task.pomodoro ? {
      ...task.pomodoro,
      endTime: task.pomodoro.endTime ? Timestamp.fromDate(new Date(task.pomodoro.endTime)) : null,
    } : undefined,
  };
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
  console.log('💾 [Firestore] addTaskToFirestore 호출됨:', {
    uid,
    taskId: task.id,
    taskTitle: task.title,
  });
  
  // task.id를 Firestore 문서 ID로 사용
  const taskRef = doc(db, `users/${uid}/tasks`, task.id);
  console.log('📍 [Firestore] 문서 경로:', `users/${uid}/tasks/${task.id}`);
  
  // id는 Firestore 문서 ID로 사용하므로 데이터에서 제거
  const { id, ...taskWithoutId } = task;
  const taskData = taskToFirestore(taskWithoutId as Task);
  console.log('📦 [Firestore] 변환된 Task 데이터 준비 완료');
  
  try {
    // setDoc으로 문서 생성 (id는 문서 경로로 사용됨)
    await setDoc(taskRef, taskData);
    console.log('✅ [Firestore] setDoc 성공!');
    return task.id;
  } catch (error: any) {
    console.error('❌ [Firestore] setDoc 실패:', error);
    console.error('  - 에러 코드:', error.code);
    console.error('  - 에러 메시지:', error.message);
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
  }
  if (updateData.dueDate !== undefined) {
    updateData.dueDate = updateData.dueDate ? Timestamp.fromDate(new Date(updateData.dueDate)) : null;
  }
  if (updateData.deletedAt !== undefined) {
    updateData.deletedAt = updateData.deletedAt ? Timestamp.fromDate(new Date(updateData.deletedAt)) : null;
  }
  if (updateData.pomodoro) {
    updateData.pomodoro = {
      ...updateData.pomodoro,
      endTime: updateData.pomodoro.endTime ? Timestamp.fromDate(new Date(updateData.pomodoro.endTime)) : null,
    };
  }
  
  await updateDoc(taskRef, updateData);
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
    console.log('📨 [Firestore] onSnapshot 트리거됨, 문서 개수:', snapshot.size);
    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      const task = firestoreToTask(doc.id, doc.data());
      tasks.push(task);
      console.log('  - Task:', doc.id, task.title);
    });
    console.log('✅ [Firestore] Task 변환 완료, callback 호출 중...');
    callback(tasks);
  }, (error) => {
    console.error('❌ [Firestore] 구독 에러:', error);
    console.error('  - 에러 코드:', error.code);
    console.error('  - 에러 메시지:', error.message);
  });
  
  console.log('✅ [Firestore] onSnapshot 설정 완료');
  return unsubscribe;
};

