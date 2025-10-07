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
import VacationManager from '@/components/VacationManager';
import Toast from '@/components/Toast';

export default function Home() {
  const [activeView, setActiveView] = useState('today');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showUndoHistory, setShowUndoHistory] = useState(false);
  
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
  
  // History 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showUndoHistory) {
        const target = e.target as HTMLElement;
        if (!target.closest('.history-dropdown') && !target.closest('.history-button')) {
          setShowUndoHistory(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUndoHistory]);

  // Process recurring tasks on app load and periodically
  useEffect(() => {
    processRecurringTasks();
    
    // Check every minute for new recurring tasks
    const interval = setInterval(() => {
      processRecurringTasks();
    }, 60000); // 1 minute
    
    return () => clearInterval(interval);
  }, [processRecurringTasks]);

  // 오늘 할 일 카운트 실시간 계산
  const getTodayTaskCount = () => {
    const { tasks } = useStore.getState();
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
  };

  const getCurrentTasks = () => {
    const filteredTasks = getFilteredTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (activeView) {
      case 'today':
        // 오늘 할 일: 엄격한 조건 - A 또는 B만 허용
        // A: 사용자가 명시적으로 '오늘 하루에 추가'한 태스크 (isToday = true)
        // B: 데드라인이 정확히 오늘인 태스크 (dueDate == today)
        return filteredTasks.filter(task => {
          if (task.completed) return false;
          
          // 조건 A: '오늘 하루에 추가'로 명시 추가된 태스크
          const conditionA = task.isToday === true;
          
          // 조건 B: 데드라인이 정확히 오늘인 태스크
          let conditionB = false;
          if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            conditionB = dueDate.getTime() === today.getTime();
          }
          
          // A 또는 B 중 하나라도 만족하면 표시
          return conditionA || conditionB;
        });
      case 'important':
        return filteredTasks.filter(task => task.isImportant && !task.completed);
      case 'all':
        return filteredTasks.filter(task => !task.completed);
      case 'assigned':
        return filteredTasks.filter(task => !task.completed);
      case 'completed':
        return filteredTasks.filter(task => task.completed);
      case 'my-tasks':
        return filteredTasks.filter(task => 
          task.assignees.includes(currentUser?.id || '') && !task.completed
        );
      case 'trash':
        return getDeletedTasks();
      default:
        // Handle category views
        if (activeView.startsWith('category-')) {
          const categoryId = activeView.replace('category-', '');
          return filteredTasks.filter(task => 
            task.categoryId === categoryId && !task.completed
          );
        }
        return [];
    }
  };

  const getCompletedTasksForToday = () => {
    if (activeView === 'today') {
      const filteredTasks = getFilteredTasks();
      return filteredTasks.filter(task => task.isToday && task.completed);
    }
    return [];
  };

  const getViewTitle = () => {
    switch (activeView) {
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
                  {/* Undo 버튼 그룹 */}
                  <div className="flex items-center gap-1 relative">
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
                    
                    {/* History 버튼 */}
                    {history.length > 0 && (
                      <button
                        onClick={() => setShowUndoHistory(!showUndoHistory)}
                        className="history-button px-2 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        title="작업 기록"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                    
                    {/* History 드롭다운 */}
                    {showUndoHistory && history.length > 0 && (
                      <div className="history-dropdown absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                        <div className="p-3 border-b border-gray-100">
                          <h3 className="text-sm font-semibold text-gray-900">최근 작업 내역</h3>
                          <p className="text-xs text-gray-500 mt-1">{history.length}개의 취소 가능한 작업</p>
                        </div>
                        <div className="p-2">
                          {history.slice().reverse().map((item, index) => {
                            const timeAgo = Math.floor((Date.now() - item.timestamp) / 1000);
                            const canUndoThis = timeAgo <= 5;
                            
                            return (
                              <div
                                key={index}
                                className={`p-2 rounded text-xs mb-1 ${
                                  canUndoThis ? 'bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-500'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {item.type === 'delete' ? '🗑️ 삭제' :
                                     item.type === 'complete' ? '✓ 완료' :
                                     item.type === 'update' ? '✏️ 수정' :
                                     '📦 일괄 작업'}
                                  </span>
                                  <span className={canUndoThis ? 'text-blue-600' : 'text-gray-400'}>
                                    {timeAgo}초 전
                                  </span>
                                </div>
                                <div className="mt-1 text-gray-600">
                                  {item.data.tasks?.length || 0}개 항목
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs sm:text-sm text-gray-500">
                    {activeView === 'today' && `${getTodayTaskCount()}개 목록`}
                  </div>
                </div>
              </div>
            </div>

              {/* Task Input - only show for task views */}
              {!['trash', 'categories', 'vacation'].includes(activeView) && <TaskInput />}

              {/* Content */}
              {activeView === 'vacation' ? (
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
