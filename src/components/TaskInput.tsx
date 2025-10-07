'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function TaskInput() {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addTask = useStore((state) => state.addTask);
  const currentUser = useStore((state) => state.currentUser);
  const clearSelection = useStore((state) => state.clearSelection);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    
    if (!trimmedTitle || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      addTask({
        title: trimmedTitle,
        completed: false,
        isToday: true,
        assignees: [currentUser.id],
        recurrence: { type: 'none' },
      });
      setTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 sm:gap-3">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => clearSelection()} // 입력 필드 클릭 시 선택 해제
            placeholder="작업 추가"
            className="flex-1 text-sm sm:text-base border-none outline-none placeholder-gray-400 bg-transparent py-2 min-w-0"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex-shrink-0"
          >
            {isSubmitting ? '추가 중...' : '추가'}
          </button>
        </div>
      </form>
    </div>
  );
}
