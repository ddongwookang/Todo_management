'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import ClientOnly from '@/components/ClientOnly';
import Sidebar from '@/components/Sidebar';
import TaskInput from '@/components/TaskInput';
import TaskList from '@/components/TaskList';
import SearchBar from '@/components/SearchBar';
import CategoryManager from '@/components/CategoryManager';
import TrashView from '@/components/TrashView';
import PlannedScheduleView from '@/components/PlannedScheduleView';

export default function Home() {
  const [activeView, setActiveView] = useState('today');
  
  const { 
    getTodayTasks, 
    getFilteredTasks, 
    getCompletedTasks,
    getDeletedTasks,
    getImportantTasks,
    getUserTasks,
    currentUser,
    processRecurringTasks,
    categories
  } = useStore();

  // Process recurring tasks on app load
  useEffect(() => {
    processRecurringTasks();
  }, [processRecurringTasks]);

  const getCurrentTasks = () => {
    switch (activeView) {
      case 'today':
        return getTodayTasks();
      case 'important':
        return getImportantTasks();
      case 'all':
        return getFilteredTasks().filter(task => !task.completed);
      case 'assigned':
        return getFilteredTasks().filter(task => !task.completed);
      case 'completed':
        return getCompletedTasks();
      case 'my-tasks':
        return getUserTasks(currentUser?.id || '').filter(task => !task.completed);
      case 'trash':
        return getDeletedTasks();
      default:
        // Handle category views
        if (activeView.startsWith('category-')) {
          const categoryId = activeView.replace('category-', '');
          return getFilteredTasks().filter(task => 
            task.categoryId === categoryId && !task.completed
          );
        }
        return [];
    }
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'today':
        return '오늘 할 일';
      case 'important':
        return '중요한 업무';
      case 'all':
        return '계획된 일정';
      case 'assigned':
        return '모든 업무';
      case 'completed':
        return '완료된 업무';
      case 'my-tasks':
        return '나에게 할당된 업무';
      case 'trash':
        return '휴지통';
      case 'categories':
        return '카테고리 관리';
      default:
        if (activeView.startsWith('category-')) {
          const categoryId = activeView.replace('category-', '');
          const category = categories.find(c => c.id === categoryId);
          return category ? category.name : '카테고리';
        }
        return '업무';
    }
  };

  const getEmptyMessage = () => {
    switch (activeView) {
      case 'today':
        return '오늘 할 일이 없습니다.';
      case 'important':
        return '중요한 업무가 없습니다.';
      case 'all':
      case 'assigned':
        return '할 일이 없습니다.';
      case 'completed':
        return '완료된 업무가 없습니다.';
      case 'my-tasks':
        return '나에게 할당된 업무가 없습니다.';
      default:
        return '업무가 없습니다.';
    }
  };

  return (
    <ClientOnly fallback={
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">로딩 중...</div>
        </div>
      </div>
    }>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {getViewTitle()}
                </h1>
                <div className="text-sm text-gray-500">
                  {activeView === 'today' && `${getTodayTasks().length}개 목록`}
                </div>
              </div>
            </div>

              {/* Task Input - only show for task views */}
              {!['trash', 'categories'].includes(activeView) && <TaskInput />}

              {/* Content */}
              {activeView === 'categories' ? (
                <CategoryManager />
              ) : activeView === 'trash' ? (
                <TrashView tasks={getCurrentTasks()} />
              ) : activeView === 'all' ? (
                <PlannedScheduleView tasks={getCurrentTasks()} />
              ) : (
                <TaskList 
                  tasks={getCurrentTasks()} 
                  emptyMessage={getEmptyMessage()}
                />
              )}

            </div>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}
