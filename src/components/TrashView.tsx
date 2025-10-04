'use client';

import { RotateCcw, Trash2, Calendar } from 'lucide-react';
import { Task } from '@/types';
import { useStore } from '@/lib/store';

interface TrashViewProps {
  tasks: Task[];
}

export default function TrashView({ tasks }: TrashViewProps) {
  const { restoreTask, permanentDeleteTask, users, categories } = useStore();

  const getDaysUntilDeletion = (deletedAt: Date) => {
    const now = new Date();
    const sevenDaysLater = new Date(deletedAt);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    
    const diffTime = sevenDaysLater.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Trash2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <div className="text-lg mb-2">휴지통이 비어있습니다</div>
        <div className="text-sm">삭제된 업무가 없습니다.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          휴지통 ({tasks.length})
        </h2>
        <p className="text-sm text-gray-600">
          삭제된 업무는 7일 동안 보관되며, 이후 자동으로 영구 삭제됩니다.
        </p>
      </div>

      {/* Bulk actions */}
      {tasks.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 font-medium">
              일괄 작업
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (confirm('모든 업무를 복구하시겠습니까?')) {
                    tasks.forEach(task => restoreTask(task.id));
                  }
                }}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                모두 복구
              </button>
              <button
                onClick={() => {
                  if (confirm('모든 업무를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                    tasks.forEach(task => permanentDeleteTask(task.id));
                  }
                }}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                모두 영구 삭제
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {tasks.map((task) => {
          const category = categories.find(c => c.id === task.categoryId);
          const assigneeNames = task.assignees
            .map(id => users.find(u => u.id === id)?.name)
            .filter(Boolean)
            .join(', ');
          
          const daysLeft = task.deletedAt ? getDaysUntilDeletion(new Date(task.deletedAt)) : 0;

          return (
            <div
              key={task.id}
              className="bg-white rounded-lg border border-gray-200 p-4 opacity-75"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <h3 className="text-lg font-medium text-gray-700 line-through">
                    {task.title}
                  </h3>

                  {/* Meta information */}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {/* Assignees */}
                    {assigneeNames && (
                      <div className="flex items-center gap-1">
                        <span>{assigneeNames}</span>
                      </div>
                    )}

                    {/* Category */}
                    {category && (
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </div>
                    )}

                    {/* Deleted date */}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {task.deletedAt 
                          ? new Date(task.deletedAt).toLocaleDateString('ko-KR')
                          : '알 수 없음'
                        }에 삭제됨
                      </span>
                    </div>

                    {/* Days until permanent deletion */}
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      daysLeft <= 1 
                        ? 'bg-red-100 text-red-700' 
                        : daysLeft <= 3 
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {daysLeft === 0 ? '오늘 삭제 예정' : `${daysLeft}일 후 삭제`}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {/* Restore button */}
                  <button
                    onClick={() => restoreTask(task.id)}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    title="복구"
                  >
                    <RotateCcw className="w-4 h-4" />
                    복구
                  </button>

                  {/* Permanent delete button */}
                  <button
                    onClick={() => {
                      if (confirm('이 업무를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                        permanentDeleteTask(task.id);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    title="영구 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                    영구 삭제
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
