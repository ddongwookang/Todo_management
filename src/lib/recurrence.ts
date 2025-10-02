import { Task, RecurrenceType } from '@/types';
import { addDays, addWeeks, addMonths, isWeekend, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export function shouldCreateRecurringTask(task: Task, existingTasks: Task[]): boolean {
  if (task.recurrence.type === 'none') return false;
  if (task.isDeleted) return false;
  if (task.parentTaskId) return false; // 이미 생성된 반복 업무는 제외

  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  
  // Check if there's already a task for today from this recurring task
  const todayTaskExists = existingTasks.some(t => 
    t.parentTaskId === task.id && 
    format(new Date(t.createdAt), 'yyyy-MM-dd') === today &&
    !t.isDeleted
  );
  
  if (todayTaskExists) return false;

  const lastCreated = new Date(task.createdAt); // updatedAt 대신 createdAt 사용
  
  switch (task.recurrence.type) {
    case 'daily':
      // Create if it's a new day and at least 1 day has passed
      const daysDiff = Math.floor((now.getTime() - lastCreated.getTime()) / (24 * 60 * 60 * 1000));
      return daysDiff >= 1;
    
    case 'weekdays':
      // Create if it's a weekday and a new day
      if (isWeekend(now)) return false;
      const weekdaysDiff = Math.floor((now.getTime() - lastCreated.getTime()) / (24 * 60 * 60 * 1000));
      return weekdaysDiff >= 1;
    
    case 'weekly':
      // Create if it's been a week
      const weeksDiff = Math.floor((now.getTime() - lastCreated.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weeksDiff >= 1;
    
    case 'monthly':
      // Create if it's been a month
      const monthsDiff = (now.getFullYear() - lastCreated.getFullYear()) * 12 + 
                        (now.getMonth() - lastCreated.getMonth());
      return monthsDiff >= 1;
    
    default:
      return false;
  }
}

export function createRecurringTask(originalTask: Task): Task {
  const now = new Date();
  
  return {
    ...originalTask,
    id: uuidv4(),
    completed: false,
    isToday: true, // Automatically add to today for new recurring tasks
    createdAt: now,
    updatedAt: now,
    completedAt: undefined,
    isDeleted: false,
    parentTaskId: originalTask.id,
    title: originalTask.title, // Keep original title without suffix
  };
}

export function getRecurrenceLabel(type: RecurrenceType): string {
  switch (type) {
    case 'daily':
      return '매일';
    case 'weekdays':
      return '평일';
    case 'weekly':
      return '매주';
    case 'monthly':
      return '매월';
    default:
      return '';
  }
}

export function getNextRecurrenceDate(task: Task): Date | null {
  if (task.recurrence.type === 'none') return null;
  
  const baseDate = new Date(task.updatedAt);
  
  switch (task.recurrence.type) {
    case 'daily':
      return addDays(baseDate, 1);
    
    case 'weekdays':
      let nextDate = addDays(baseDate, 1);
      while (isWeekend(nextDate)) {
        nextDate = addDays(nextDate, 1);
      }
      return nextDate;
    
    case 'weekly':
      return addWeeks(baseDate, task.recurrence.interval || 1);
    
    case 'monthly':
      return addMonths(baseDate, task.recurrence.interval || 1);
    
    default:
      return null;
  }
}
