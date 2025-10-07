'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, Calendar, Users, Trash2, Edit3, Settings, Star, Clock, MoreVertical, ChevronDown, ChevronRight, Repeat } from 'lucide-react';
import { Task } from '@/types';
import { useStore } from '@/lib/store';
import TaskDetailSidebar from './TaskDetailSidebar';
import { format, isToday, isTomorrow } from 'date-fns';
import { isRedDay, getHolidayName } from '@/lib/holidays';

interface TaskItemProps {
  task: Task;
  isSelected?: boolean;
  onTaskClick?: (taskId: string, shiftKey: boolean, ctrlOrMetaKey: boolean) => void;
}

export default function TaskItem({ task, isSelected = false, onTaskClick }: TaskItemProps) {
  const [showDetailSidebar, setShowDetailSidebar] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [showDescription, setShowDescription] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [pomodoroTime, setPomodoroTime] = useState('');
  const [showRecurrenceMenu, setShowRecurrenceMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    toggleTaskComplete, 
    updateTask, 
    deleteTask,
    users,
    categories,
    selectedTaskIds,
    toggleTaskSelection,
    clearSelection,
    bulkDeleteTasks,
    bulkCompleteTasks,
    bulkAddToToday,
    bulkMarkImportant,
    bulkSetDueDate
  } = useStore();

  const category = categories.find(c => c.id === task.categoryId);
  const assigneeNames = task.assignees
    .map(id => users.find(u => u.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  // 시간 포맷 함수 (24시간 → 12시간 + 오전/오후)
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours < 12 ? '오전' : '오후';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return '오늘';
    if (isTomorrow(date)) return '내일';
    const day = date.getDay();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[day];
  };

  const formatDateWithWeekday = (date: Date) => {
    const month = date.getMonth() + 1;
    const dayNum = date.getDate();
    const dayOfWeek = getDateLabel(date);
    return `${month}월 ${dayNum}일 (${dayOfWeek})`;
  };

  const renderDateWithColor = (date: Date) => {
    const now = new Date();
    const isPast = date < new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isHolidayOrWeekend = isRedDay(date);
    
    if (isToday(date)) {
      return <span className="text-blue-600 font-medium">오늘</span>;
    }
    if (isTomorrow(date)) {
      return <span>내일</span>;
    }
    
    const dateText = formatDateWithWeekday(date);
    const holidayName = getHolidayName(date);
    
    if (isPast) {
      return (
        <span className="text-red-600">
          {dateText}
          {holidayName && ` (${holidayName})`}
        </span>
      );
    }
    
    if (isHolidayOrWeekend) {
      return (
        <span className="text-yellow-600">
          {dateText}
          {holidayName && ` (${holidayName})`}
        </span>
      );
    }
    
    return (
      <span>
        {dateText}
        {holidayName && ` (${holidayName})`}
      </span>
    );
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menuHeight = 400; // 예상 메뉴 높이
    const menuWidth = 200; // 예상 메뉴 너비
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    let x = e.clientX;
    let y = e.clientY;
    
    // 화면 하단을 벗어나면 위쪽으로 표시
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10; // 10px 여유
    }
    
    // 화면 우측을 벗어나면 왼쪽으로 표시
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }
    
    // 최소값 보정
    x = Math.max(10, x);
    y = Math.max(10, y);
    
    setContextMenuPosition({ x, y });
    setShowContextMenu(true);
  };

  const handleMarkImportant = () => {
    updateTask(task.id, { isImportant: !task.isImportant });
    setShowContextMenu(false);
  };

  const handleMarkCompleted = () => {
    updateTask(task.id, { completed: !task.completed });
    setShowContextMenu(false);
  };

  const handleAddToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // 데드라인을 오늘로 설정 (isToday는 유지)
    updateTask(task.id, { dueDate: today });
    setShowContextMenu(false);
  };

  const handleAddToTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    // 데드라인을 내일로 설정 → isToday를 false로 변경
    updateTask(task.id, { dueDate: tomorrow, isToday: false });
    setShowContextMenu(false);
  };

  const handleAddToTodayList = () => {
    // 오늘 할 일 목록에 추가/제거 토글 (데드라인은 유지)
    updateTask(task.id, { isToday: !task.isToday });
    setShowContextMenu(false);
  };

  const handleSelectDate = () => {
    setShowContextMenu(false);
    setShowDatePicker(true);
  };

  const handleDateSelect = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    // 선택한 날짜가 오늘이 아니면 isToday를 false로 설정
    const isSelectedToday = selectedDate.getTime() === today.getTime();
    updateTask(task.id, { 
      dueDate: date, 
      isToday: isSelectedToday ? task.isToday : false 
    });
    setShowDatePicker(false);
  };

  const handleDeleteTask = () => {
    const confirmed = window.confirm(
      '이 작업을 삭제하시겠습니까?\n\n삭제된 작업은 휴지통으로 이동되며, 7일간 보관됩니다.'
    );
    if (confirmed) {
      updateTask(task.id, { isDeleted: true });
    }
    setShowContextMenu(false);
  };

  // 캘린더 날짜 생성
  const generateCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    // 이전 달의 빈 칸
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // 현재 달의 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const changeMonth = (delta: number) => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCalendarMonth(newMonth);
  };


  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showContextMenu]);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker]);

  // Pomodoro Timer Update (마감시간 기반)
  useEffect(() => {
    if (task.pomodoro?.enabled && task.dueDate && task.dueTime) {
      const updateTimer = () => {
        const now = new Date();
        
        // dueDate와 dueTime을 조합하여 마감 시간 생성
        const dueDate = new Date(task.dueDate!);
        const [hours, minutes] = task.dueTime!.split(':').map(Number);
        dueDate.setHours(hours, minutes, 0, 0);
        
        const diff = dueDate.getTime() - now.getTime();

        if (diff <= 0) {
          setPomodoroTime('마감!');
        } else {
          const totalHours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          
          if (totalHours > 0) {
            setPomodoroTime(`${totalHours}h ${mins}m ${secs}s`);
          } else if (mins > 0) {
            setPomodoroTime(`${mins}m ${secs}s`);
          } else {
            setPomodoroTime(`${secs}s`);
          }
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setPomodoroTime('');
    }
  }, [task.pomodoro, task.dueDate, task.dueTime, task.id]);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'task',
      taskId: task.id
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  // 다중 선택 핸들러
  const handleTaskClick = (e: React.MouseEvent) => {
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    
    if (isShift || isCtrlOrMeta) {
      e.stopPropagation();
      
      // 부모 컴포넌트로 전달하여 범위 선택 처리
      if (onTaskClick) {
        onTaskClick(task.id, isShift, isCtrlOrMeta);
      } else {
        // 콜백이 없으면 기본 토글
        toggleTaskSelection(task.id);
      }
    } else {
      // 일반 클릭: 선택 해제 후 상세 보기
      if (selectedTaskIds.length > 0) {
        clearSelection();
      }
      if (!isSelected) {
        setShowDetailSidebar(true);
      }
    }
  };

  // 제목 더블클릭 편집
  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  };

  // 제목 저장
  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      updateTask(task.id, { title: editedTitle.trim() });
    } else {
      setEditedTitle(task.title);
    }
    setIsEditingTitle(false);
  };

  // 제목 편집 키 이벤트
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(task.title);
      setIsEditingTitle(false);
    }
  };

  // 다중 선택 컨텍스트 메뉴 핸들러
  const handleBulkAction = (action: string, data?: any) => {
    const tasksToProcess = selectedTaskIds.length > 0 ? selectedTaskIds : [task.id];
    
    switch(action) {
      case 'delete':
        bulkDeleteTasks(tasksToProcess);
        break;
      case 'complete':
        bulkCompleteTasks(tasksToProcess);
        break;
      case 'addToToday':
        bulkAddToToday(tasksToProcess);
        break;
      case 'markImportant':
        bulkMarkImportant(tasksToProcess);
        break;
      case 'setDueToday':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        bulkSetDueDate(tasksToProcess, today);
        break;
      case 'setDueTomorrow':
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        bulkSetDueDate(tasksToProcess, tomorrow);
        break;
      case 'setDueDate':
        if (data?.date) {
          bulkSetDueDate(tasksToProcess, data.date);
        }
        break;
    }
    setShowContextMenu(false);
  };

  return (
    <>
      <div 
        draggable
        onDragStart={handleDragStart}
        className={`rounded-lg p-2 border border-gray-300 hover:border-gray-400 transition-all relative bg-white ${
          !task.completed ? 'hover:bg-gray-50' : ''
        } ${
          task.completed ? 'opacity-60' : ''
        } ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'cursor-move'
        }`}
        onClick={handleTaskClick}
        onContextMenu={handleContextMenu}
      >
      <div className="flex items-center gap-2">
        {/* Complete checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskComplete(task.id);
          }}
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            task.completed
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'border-gray-300 hover:border-blue-500'
          }`}
        >
          {task.completed && <Check className="w-3 h-3" />}
        </button>

        <div className="flex-1 min-w-0">
          {/* Title */}
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="w-full text-sm font-medium border border-blue-500 outline-none bg-white px-2 py-1 rounded focus:ring-2 focus:ring-blue-300"
              autoFocus
            />
          ) : (
            <div className="flex items-center justify-between flex-1">
              <div className="flex-1">
                <h3 
                  className={`text-sm font-normal cursor-pointer hover:text-blue-600 ${
                    task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                  onDoubleClick={handleTitleDoubleClick}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <div className="mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDescription(!showDescription);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                    >
                      <span>{showDescription ? '메모 숨기기' : '메모 보기'}</span>
                      <span>{showDescription ? '▲' : '▼'}</span>
                    </button>
                    {showDescription && (
                      <div className="text-xs text-gray-600 mt-1 p-2 bg-gray-50 rounded whitespace-pre-wrap break-words">
                        {task.description}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Meta information */}
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  {/* Assignees */}
                  {assigneeNames && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{assigneeNames}</span>
                    </div>
                  )}

                  {/* Category */}
                  {category && (
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                  )}

                  {/* Due date */}
                  {task.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {renderDateWithColor(new Date(task.dueDate))}
                        {task.dueTime && ` ${formatTime(task.dueTime)}`}
                      </span>
                    </div>
                  )}

                  {/* Pomodoro Timer */}
                  {pomodoroTime && (
                    <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{pomodoroTime}</span>
                    </div>
                  )}

                  {/* Recurrence Indicator */}
                  {task.recurrence && task.recurrence.type !== 'none' && (
                    <div className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-medium">
                      <Repeat className="w-3 h-3" />
                      <span className="text-xs">
                        {task.recurrence.type === 'daily' ? '매일' :
                         task.recurrence.type === 'weekly' ? '매주' :
                         task.recurrence.type === 'monthly' ? '매월' :
                         task.recurrence.type === 'weekdays' ? '평일' : '반복'}
                      </span>
                    </div>
                  )}
                  
                  {/* Created date */}
                  {!task.dueDate && !task.completed && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{renderDateWithColor(new Date(task.createdAt))}</span>
                    </div>
                  )}

                  {/* Completed date */}
                  {task.completed && task.completedAt && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="w-3 h-3" />
                      <span>
                        {format(new Date(task.completedAt), 'yyyy.MM.dd HH:mm')} 완료
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Important star */}
              <div className="ml-2 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTask(task.id, { isImportant: !task.isImportant });
                  }}
                  className="transition-colors"
                >
                  <Star 
                    className={`w-4 h-4 ${
                      task.isImportant 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subtasks Section - 노출만 */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-2 pl-8 space-y-1">
          {/* Subtasks Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSubtasks(!showSubtasks);
            }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            {showSubtasks ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            단계 ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
          </button>

          {/* Subtasks List - 읽기 전용 */}
          {showSubtasks && (
            <div className="space-y-1">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <div
                    className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                      subtask.completed
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {subtask.completed && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span className={`text-xs flex-1 ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-48"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
        >
          {/* 다중 선택 모드일 때 */}
          {selectedTaskIds.length >= 1 && selectedTaskIds.includes(task.id) ? (
            <>
              <div className="px-4 py-2 text-sm font-semibold text-gray-700 bg-blue-50">
                {selectedTaskIds.length}개 항목 선택됨
              </div>
              <div className="border-t border-gray-100 my-1"></div>
              
              <button
                onClick={() => handleBulkAction('markImportant')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                중요로 표시
              </button>
              
              <button
                onClick={() => handleBulkAction('complete')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                완료 처리
              </button>
              
              <button
                onClick={() => handleBulkAction('addToToday')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-blue-500" />
                오늘 하루에 추가
              </button>
              
              <div className="border-t border-gray-100 my-1"></div>
              
              {/* 다중 선택 기한 변경 옵션 */}
              <button
                onClick={() => handleBulkAction('setDueToday')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-green-500" />
                기한: 오늘까지
              </button>
              
              <button
                onClick={() => handleBulkAction('setDueTomorrow')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-orange-500" />
                기한: 내일까지
              </button>
              
              <div className="border-t border-gray-100 my-1"></div>
              
              <button
                onClick={() => handleBulkAction('delete')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                선택 항목 삭제
              </button>
              
              <button
                onClick={() => {
                  clearSelection();
                  setShowContextMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                선택 해제
              </button>
            </>
          ) : (
            /* 단일 선택 모드 */
            <>
              <button
                onClick={handleMarkImportant}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                {task.isImportant ? '중요로 표시 해제' : '중요로 표시'}
              </button>
              
              <button
                onClick={handleMarkCompleted}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {task.completed ? '완료 해제' : '완료됨으로 표시'}
              </button>
              
              <div className="border-t border-gray-100 my-1"></div>
              
              <button
                onClick={handleAddToTodayList}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-blue-500" />
                {task.isToday ? '나의 하루에서 제거' : '오늘 하루에 추가'}
              </button>
              
              <div className="border-t border-gray-100 my-1"></div>
            </>
          )}
          
          <button
            onClick={handleAddToToday}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            오늘까지
          </button>
          
          <button
            onClick={handleAddToTomorrow}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            내일까지
          </button>
          
          <button
            onClick={handleSelectDate}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            날짜 선택
          </button>
          
          <button
            onClick={() => {
              setShowRecurrenceMenu(true);
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <Repeat className="w-4 h-4" />
            반복 설정
          </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            onClick={handleDeleteTask}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            작업 삭제
          </button>
        </div>
      )}

      {/* Custom Calendar Picker */}
      {showDatePicker && (
        <div
          ref={datePickerRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            minWidth: '320px'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                changeMonth(-1);
              }}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ◀
            </button>
            <span className="font-semibold">
              {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                changeMonth(1);
              }}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ▶
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
              <div
                key={i}
                className={`text-center text-xs font-medium py-1 ${
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((date, index) => {
              const isTodayDate = date && isToday(date);
              const isPast = date && date < new Date(new Date().setHours(0, 0, 0, 0));
              const isSunday = date && date.getDay() === 0;
              const isSaturday = date && date.getDay() === 6;
              
              return (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (date && !isPast) {
                      handleDateSelect(date);
                    }
                  }}
                  disabled={!date || !!isPast}
                  className={`
                    aspect-square p-2 text-sm rounded transition-colors
                    ${!date ? 'invisible' : ''}
                    ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50'}
                    ${isTodayDate ? 'bg-blue-500 text-white font-bold hover:bg-blue-600' : ''}
                    ${!isTodayDate && isSunday && !isPast ? 'text-red-500' : ''}
                    ${!isTodayDate && isSaturday && !isPast ? 'text-blue-500' : ''}
                    ${!isTodayDate && !isSunday && !isSaturday && !isPast ? 'text-gray-700' : ''}
                  `}
                >
                  {date ? date.getDate() : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Detail Sidebar */}
      <TaskDetailSidebar
        task={task}
        isOpen={showDetailSidebar}
        onClose={() => setShowDetailSidebar(false)}
      />
    </>
  );
}
