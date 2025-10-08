'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store';
import ClientOnly from '@/components/ClientOnly';
import Sidebar from '@/components/Sidebar';
import TaskInput from '@/components/TaskInput';
import TaskList from '@/components/TaskList';
import SearchBar from '@/components/SearchBar';
import CategoryManager from '@/components/CategoryManager';
import TrashView from '@/components/TrashView';
import PlannedScheduleView from '@/components/PlannedScheduleView';
import VacationManager from '@/components/VacationManager';
import PomodoroTimer from '@/components/PomodoroTimer';
import Toast from '@/components/Toast';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function Home() {
  const [activeView, setActiveView] = useState('today');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // useStore를 먼저 호출하여 undo, canUndo를 사용 가능하게 함
  const { 
    getTodayTasks, 
    getFilteredTasks, 
    getCompletedTasks,
    getDeletedTasks,
    getImportantTasks,
    getUserTasks,
    currentUser,
    processRecurringTasks,
    categories,
    groups,
    undo,
    canUndo
  } = useStore();
  
  // History 가져오기
  const history = useStore((state) => state.history);
  
  // tasks를 구독하여 실시간 업데이트
  const tasks = useStore((state) => state.tasks);
  
  // 모바일 감지 및 사이드바 자동 숨김
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    handleResize(); // 초기 실행
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Ctrl+Z 키보드 단축키 (Undo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        const success = undo();
        if (success) {
          setToastMessage('작업이 취소되었습니다');
          setShowToast(true);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);
  
  // Undo 버튼 클릭 핸들러
  const handleUndoClick = () => {
    const success = undo();
    if (success) {
      setToastMessage('작업이 취소되었습니다');
      setShowToast(true);
    }
  };
  

  // Process recurring tasks on app load and periodically
  useEffect(() => {
    processRecurringTasks();
    
    // Check every minute for new recurring tasks
    const interval = setInterval(() => {
      processRecurringTasks();
    }, 60000); // 1 minute
    
    return () => clearInterval(interval);
  }, [processRecurringTasks]);

  // 오늘 할 일 카운트 실시간 계산 (useMemo로 최적화)
  const todayTaskCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      if (task.completed || task.isDeleted) return false;
      
      const conditionA = task.isToday === true;
      
      let conditionB = false;
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        conditionB = dueDate.getTime() === today.getTime();
      }
      
      return conditionA || conditionB;
    }).length;
  }, [tasks]); // tasks가 변경될 때마다 재계산

  // getCurrentTasks를 useMemo로 최적화하여 tasks 변경 시 자동 재계산
  const currentTasks = useMemo(() => {
    const filteredTasks = getFilteredTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (activeView) {
      case 'today':
        // 오늘 할 일: 엄격한 조건 - A 또는 B만 허용
        return filteredTasks.filter(task => {
          if (task.completed) return false;
          
          const conditionA = task.isToday === true;
          
          let conditionB = false;
          if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            conditionB = dueDate.getTime() === today.getTime();
          }
          
          return conditionA || conditionB;
        });
      
      case 'all':
        return filteredTasks;
      
      case 'important':
        return filteredTasks.filter(task => task.isImportant && !task.completed);
      
      case 'planned':
        return filteredTasks.filter(task => task.dueDate && !task.completed);
      
      case 'assigned':
        return currentUser ? getUserTasks(currentUser.id).filter(t => !t.completed && !t.isDeleted) : [];
      
      case 'completed':
        return getCompletedTasks();
      
      default:
        if (activeView.startsWith('category-')) {
          const categoryId = activeView.replace('category-', '');
          return filteredTasks.filter(task => task.categoryId === categoryId && !task.completed);
        }
        return [];
    }
  }, [tasks, activeView, getFilteredTasks, currentUser, getUserTasks, getCompletedTasks]);

  const getCurrentTasks = () => currentTasks;

  const getCompletedTasksForToday = () => {
    if (activeView === 'today') {
      const filteredTasks = getFilteredTasks();
      return filteredTasks.filter(task => task.isToday && task.completed);
    }
    return [];
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'pomodoro':
        return '뽀모도로';
      case 'vacation':
        return '휴가 설정';
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
      <div className="flex h-screen bg-gray-50 relative">
        {/* Sidebar - 데스크톱에서는 항상 표시, 모바일에서는 오버레이 */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed md:static inset-y-0 left-0 z-30
          transition-transform duration-300 ease-in-out
        `}>
          <Sidebar activeView={activeView} onViewChange={(view) => {
            setActiveView(view);
            // 모바일에서 메뉴 선택 시 사이드바 자동 닫기
            if (window.innerWidth < 768) {
              setSidebarOpen(false);
            }
          }} />
        </div>

        {/* 모바일 오버레이 */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden bg-white w-full">
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* 햄버거 메뉴 버튼 */}
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="메뉴 토글"
                  >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {getViewTitle()}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  {/* Undo 버튼 */}
                  <button
                    onClick={handleUndoClick}
                    disabled={!canUndo()}
                    className={`
                      px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium
                      transition-all duration-200
                      ${canUndo() 
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }
                    `}
                    title="Ctrl+Z"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span className="hidden sm:inline">실행 취소</span>
                  </button>
                  
                  {/* Google 로그인 버튼 */}
                  <GoogleAuthButton />
                </div>
              </div>
            </div>

              {/* Task Input - only show for task views */}
              {!['trash', 'categories', 'vacation', 'pomodoro'].includes(activeView) && <TaskInput />}

              {/* Content */}
              {activeView === 'pomodoro' ? (
                <PomodoroTimer />
              ) : activeView === 'vacation' ? (
                <VacationManager />
              ) : activeView === 'categories' ? (
                <CategoryManager />
              ) : activeView === 'trash' ? (
                <TrashView tasks={getCurrentTasks()} />
              ) : activeView === 'all' ? (
                <PlannedScheduleView tasks={getCurrentTasks()} />
              ) : (
                <TaskList 
                  tasks={getCurrentTasks()} 
                  emptyMessage={getEmptyMessage()}
                  showCompletedSection={activeView === 'today'}
                  completedTasks={getCompletedTasksForToday()}
                />
              )}

            </div>
          </div>
        </div>
      </div>
      
      {/* Toast 알림 */}
      <Toast 
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </ClientOnly>
  );
}
