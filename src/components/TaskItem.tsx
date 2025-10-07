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
}

export default function TaskItem({ task }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showDetailSidebar, setShowDetailSidebar] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [showDescription, setShowDescription] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [pomodoroTime, setPomodoroTime] = useState('');
  const [showRecurrenceMenu, setShowRecurrenceMenu] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  const { 
    toggleTaskComplete, 
    updateTask, 
    deleteTask,
    users,
    categories 
  } = useStore();

  const category = categories.find(c => c.id === task.categoryId);
  const assigneeNames = task.assignees
    .map(id => users.find(u => u.id === id)?.name)
    .filter(Boolean)
    .join(', ');

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

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      updateTask(task.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
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

  // Pomodoro Timer Update
  useEffect(() => {
    if (task.pomodoro?.enabled && task.pomodoro?.endTime) {
      const updateTimer = () => {
        const now = new Date();
        const end = new Date(task.pomodoro!.endTime!);
        const diff = end.getTime() - now.getTime();

        if (diff <= 0) {
          setPomodoroTime('완료!');
          // 타이머 종료 시 비활성화
          updateTask(task.id, { 
            pomodoro: { enabled: false, endTime: undefined } 
          });
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          if (hours > 0) {
            setPomodoroTime(`${hours}시간 ${minutes}분 ${seconds}초`);
          } else if (minutes > 0) {
            setPomodoroTime(`${minutes}분 ${seconds}초`);
          } else {
            setPomodoroTime(`${seconds}초`);
          }
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setPomodoroTime('');
    }
  }, [task.pomodoro, task.id, updateTask]);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'task',
      taskId: task.id
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <>
      <div 
        draggable
        onDragStart={handleDragStart}
        className={`rounded-lg p-2 border border-gray-300 hover:border-gray-400 transition-all cursor-move relative bg-white ${
          !task.completed ? 'hover:bg-gray-50' : ''
        } ${
          task.completed ? 'opacity-60' : ''
        }`}
        onClick={() => setShowDetailSidebar(true)}
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
          {isEditing ? (
              <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              className="w-full text-sm font-medium border-none outline-none bg-gray-50 px-2 py-1 rounded"
              autoFocus
            />
          ) : (
            <div className="flex items-center justify-between flex-1">
              <div className="flex-1">
                <h3 
                  className={`text-sm font-normal cursor-pointer hover:text-blue-600 ${
                    task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setShowDetailSidebar(true);
                  }}
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
                        {task.dueTime && ` ${task.dueTime}`}
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
