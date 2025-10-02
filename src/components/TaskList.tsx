'use client';

import { Task } from '@/types';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  title?: string;
  emptyMessage?: string;
}

export default function TaskList({ tasks, title, emptyMessage = "할 일이 없습니다." }: TaskListProps) {
  return (
    <div>
      {title && (
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {title} ({tasks.length})
        </h2>
      )}
      
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-base mb-2">{emptyMessage}</div>
          <div className="text-sm">새로운 업무를 추가해보세요!</div>
        </div>
      ) : (
        <div className="space-y-1">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
