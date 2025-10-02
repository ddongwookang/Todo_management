'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function TaskInput() {
  const [title, setTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedTitle, setLastSubmittedTitle] = useState('');
  const addTask = useStore((state) => state.addTask);
  const currentUser = useStore((state) => state.currentUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    
    if (!trimmedTitle || !currentUser || isSubmitting) return;
    
    // 중복 방지: 같은 제목을 연속으로 제출하는 것을 방지
    if (trimmedTitle === lastSubmittedTitle) {
      console.log('중복 제출 방지:', trimmedTitle);
      return;
    }

    setIsSubmitting(true);
    setLastSubmittedTitle(trimmedTitle);
    
    try {
      addTask({
        title: trimmedTitle,
        completed: false,
        isToday: true, // 자동으로 오늘 할 일로 설정
        assignees: [currentUser.id],
        recurrence: { type: 'none' },
      });

      setTitle('');
      setIsExpanded(false);
      
      // 1초 후 lastSubmittedTitle 초기화
      setTimeout(() => {
        setLastSubmittedTitle('');
      }, 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSubmitting) {
      e.preventDefault();
      handleSubmit(e as any);
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setTitle('');
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 mb-4">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Plus className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onKeyDown={handleKeyDown}
            placeholder="작업 추가"
            className="flex-1 text-base border-none outline-none placeholder-gray-400 bg-transparent py-2"
            autoFocus
          />
        </div>
        
        {isExpanded && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Enter로 빠르게 추가하거나 Esc로 취소
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setTitle('');
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="px-4 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
