'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, Tag, Calendar, Repeat, Clock, Timer, GripVertical } from 'lucide-react';
import { Task, RecurrenceType, SubTask } from '@/types';
import { useStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import { isRedDay, getHolidayName } from '@/lib/holidays';
import { isToday as isTodayFn } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskDetailSidebarProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskDetailSidebar({ task, isOpen, onClose }: TaskDetailSidebarProps) {
  const [editedTask, setEditedTask] = useState(task);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');
  const [remainingTime, setRemainingTime] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  const { updateTask, toggleTaskComplete, users, categories, customEmojis, addCustomEmoji } = useStore();

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // task가 변경될 때마다 editedTask 업데이트
  React.useEffect(() => {
    setEditedTask(task);
  }, [task]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 뽀모도로 타이머 업데이트
  useEffect(() => {
    if (!editedTask.pomodoro?.enabled || !editedTask.pomodoro?.endTime) {
      setRemainingTime('');
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(editedTask.pomodoro!.endTime!);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setRemainingTime('00시간 00분 00초');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setRemainingTime(`${String(hours).padStart(2, '0')}시간 ${String(minutes).padStart(2, '0')}분 ${String(seconds).padStart(2, '0')}초`);
    }, 1000);

    return () => clearInterval(interval);
  }, [editedTask.pomodoro]);

  if (!isOpen) return null;

  const handleSave = () => {
    // 제목이 비어있으면 저장하지 않음
    if (!editedTask.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    updateTask(task.id, editedTask);
    onClose();
  };

  const handleAssigneeToggle = (userId: string) => {
    const newAssignees = editedTask.assignees.includes(userId)
      ? editedTask.assignees.filter(id => id !== userId)
      : [...editedTask.assignees, userId];
    
    setEditedTask({ ...editedTask, assignees: newAssignees });
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: SubTask = {
      id: uuidv4(),
      title: newSubtaskTitle.trim(),
      completed: false,
      order: (editedTask.subtasks?.length || 0)
    };

    const updatedSubtasks = [...(editedTask.subtasks || []), newSubtask];
    
    // store에 반영 (useEffect가 자동으로 editedTask 업데이트)
    updateTask(task.id, {
      subtasks: updatedSubtasks
    });
    
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = editedTask.subtasks?.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    
    // store에 반영 (useEffect가 자동으로 editedTask 업데이트)
    updateTask(task.id, {
      subtasks: updatedSubtasks
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = editedTask.subtasks?.filter(st => st.id !== subtaskId);
    
    // store에 반영 (useEffect가 자동으로 editedTask 업데이트)
    updateTask(task.id, {
      subtasks: updatedSubtasks
    });
  };

  const handleEditSubtask = (subtaskId: string) => {
    const subtask = editedTask.subtasks?.find(st => st.id === subtaskId);
    if (subtask) {
      setEditingSubtaskId(subtaskId);
      setEditingSubtaskTitle(subtask.title);
    }
  };

  const handleSaveSubtaskEdit = () => {
    if (!editingSubtaskTitle.trim()) return;

    const updatedSubtasks = editedTask.subtasks?.map(st =>
      st.id === editingSubtaskId ? { ...st, title: editingSubtaskTitle.trim() } : st
    );
    
    // store에 반영 (useEffect가 자동으로 editedTask 업데이트)
    updateTask(task.id, {
      subtasks: updatedSubtasks
    });

    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
  };

  // Handle subtask drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = editedTask.subtasks?.findIndex(st => st.id === active.id) ?? -1;
      const newIndex = editedTask.subtasks?.findIndex(st => st.id === over.id) ?? -1;

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedSubtasks = arrayMove(editedTask.subtasks || [], oldIndex, newIndex);
        // Update order field
        const updatedSubtasks = reorderedSubtasks.map((st, index) => ({
          ...st,
          order: index
        }));
        
        updateTask(task.id, { subtasks: updatedSubtasks });
      }
    }
  };

  const handleTogglePomodoro = () => {
    const newPomodoro = {
      enabled: !editedTask.pomodoro?.enabled,
      endTime: editedTask.pomodoro?.endTime
    };
    
    // 즉시 store에 저장
    updateTask(task.id, { pomodoro: newPomodoro });
  };

  const handleSetPomodoroMinutes = (minutes: number) => {
    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + minutes);
    
    const newPomodoro = {
      enabled: true,
      endTime
    };
    
    // 즉시 store에 저장
    updateTask(task.id, { pomodoro: newPomodoro });
    setCustomMinutes('');
  };

  const handleSetCustomPomodoroTime = () => {
    const minutes = parseInt(customMinutes);
    if (isNaN(minutes) || minutes <= 0) return;
    
    handleSetPomodoroMinutes(minutes);
  };

  // 타이머에 시간 추가
  const handleAddPomodoroTime = (minutes: number) => {
    if (!editedTask.pomodoro?.endTime) return;
    
    const currentEndTime = new Date(editedTask.pomodoro.endTime);
    currentEndTime.setMinutes(currentEndTime.getMinutes() + minutes);
    
    updateTask(task.id, { 
      pomodoro: { 
        enabled: true, 
        endTime: currentEndTime 
      } 
    });
  };

  // 타이머 제거
  const handleRemovePomodoro = () => {
    updateTask(task.id, { 
      pomodoro: { 
        enabled: false, 
        endTime: undefined 
      } 
    });
  };

  // 날짜 설정 함수들
  const updateRecurrenceForDate = (date: Date, currentTask: Task) => {
    // weekly 반복인 경우, 선택한 날짜의 요일로 자동 업데이트
    if (currentTask.recurrence && currentTask.recurrence.type === 'weekly') {
      const dayOfWeek = date.getDay(); // 0 (일요일) ~ 6 (토요일)
      return {
        ...currentTask,
        dueDate: date,
        recurrence: {
          ...currentTask.recurrence,
          daysOfWeek: [dayOfWeek] // 선택한 요일로 자동 설정
        }
      };
    }
    return { ...currentTask, dueDate: date };
  };

  const handleSetToday = () => {
    const today = new Date();
    const updated = updateRecurrenceForDate(today, editedTask);
    setEditedTask(updated);
    setShowDatePicker(false);
  };

  const handleSetTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const updated = updateRecurrenceForDate(tomorrow, editedTask);
    setEditedTask(updated);
    setShowDatePicker(false);
  };

  const handleDateSelect = (date: Date) => {
    const updated = updateRecurrenceForDate(date, editedTask);
    setEditedTask(updated);
    setShowDatePicker(false);
  };

  // 캘린더 날짜 생성 (TaskItem과 동일)
  const generateCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
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

  const recurrenceOptions: { value: RecurrenceType; label: string }[] = [
    { value: 'none', label: '반복 없음' },
    { value: 'daily', label: '매일' },
    { value: 'weekdays', label: '평일 (월-금)' },
    { value: 'weekly', label: '매주' },
    { value: 'monthly', label: '매월' },
  ];

  return (
    <div>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">작업 세부 정보</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 1. Title with Complete Toggle */}
        <div>
          <div className="flex gap-3 items-start mb-4">
            <button
              onClick={() => {
                toggleTaskComplete(task.id);
                onClose();
              }}
              className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                task.completed
                  ? 'bg-blue-500 border-blue-500'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              {task.completed && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <div className="flex-1">
              <input
                type="text"
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                placeholder="작업 제목을 입력하세요"
                className="w-full text-lg font-medium border-none outline-none focus:ring-0 p-0"
              />
            </div>
          </div>
        </div>

        {/* 2. Subtasks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            단계
          </label>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={editedTask.subtasks?.map(st => st.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {editedTask.subtasks?.map((subtask) => (
                  <SortableSubtaskItem
                    key={subtask.id}
                    subtask={subtask}
                    isEditing={editingSubtaskId === subtask.id}
                    editingTitle={editingSubtaskTitle}
                    onToggle={() => handleToggleSubtask(subtask.id)}
                    onEdit={() => handleEditSubtask(subtask.id)}
                    onSave={handleSaveSubtaskEdit}
                    onDelete={() => handleDeleteSubtask(subtask.id)}
                    onEditTitleChange={setEditingSubtaskTitle}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <form onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // 약간의 지연을 두고 실행하여 isComposing 상태가 확실히 업데이트되도록
            setTimeout(() => {
              if (!isComposing) {
                handleAddSubtask();
              }
            }, 0);
          }} className="flex items-center gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => {
                e.stopPropagation();
                setNewSubtaskTitle(e.target.value);
              }}
              onCompositionStart={() => {
                setIsComposing(true);
              }}
              onCompositionEnd={() => {
                setIsComposing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isComposing) {
                  // 조합이 완료되었으면 form submit 허용 (preventDefault 하지 않음)
                  // form의 onSubmit이 자동으로 처리함
                }
              }}
              placeholder="단계 추가"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
            >
              추가
            </button>
          </form>
        </div>

        {/* 3. Deadline */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            기한 설정
          </label>
          
          {!editedTask.dueDate ? (
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-gray-500 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              기한 설정
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`flex-1 px-3 py-2 border rounded-lg text-left hover:bg-gray-50 ${
                    editedTask.dueDate && isRedDay(new Date(editedTask.dueDate))
                      ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                      : 'border-gray-300'
                  }`}
                >
                  {editedTask.dueDate ? new Date(editedTask.dueDate).toLocaleDateString('ko-KR') : '날짜 선택'}
                  {editedTask.dueDate && getHolidayName(new Date(editedTask.dueDate)) && (
                    <span className="ml-2 text-xs text-yellow-600 font-medium">
                      {getHolidayName(new Date(editedTask.dueDate))}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditedTask({ 
                      ...editedTask, 
                      dueDate: undefined,
                      dueTime: undefined 
                    });
                    setShowDatePicker(false);
                  }}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-300"
                >
                  제거
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <input
                  type="time"
                  value={editedTask.dueTime || ''}
                  onChange={(e) => setEditedTask({ 
                    ...editedTask, 
                    dueTime: e.target.value || undefined 
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Date Picker Popup */}
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 w-full max-w-sm">
              {/* 오늘/내일 버튼 */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleSetToday}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  오늘
                </button>
                <button
                  onClick={handleSetTomorrow}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  내일
                </button>
              </div>

              {/* 커스텀 캘린더 */}
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    ◀
                  </button>
                  <span className="font-semibold">
                    {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
                  </span>
                  <button
                    onClick={() => changeMonth(1)}
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
                    const isTodayDate = date && isTodayFn(date);
                    const isPast = date && date < new Date(new Date().setHours(0, 0, 0, 0));
                    const isSunday = date && date.getDay() === 0;
                    const isSaturday = date && date.getDay() === 6;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
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
            </div>
          )}
        </div>

        {/* 4. Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            메모
          </label>
          <textarea
            value={editedTask.description || ''}
            onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="메모 추가..."
          />
        </div>

        {/* 5. Pomodoro Timer */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <input
              type="checkbox"
              checked={editedTask.pomodoro?.enabled || false}
              onChange={handleTogglePomodoro}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <Timer className="w-4 h-4" />
            뽀모도로 타이머
          </label>
          
          {editedTask.pomodoro?.enabled && (
            <div className="space-y-3">
              {/* 타이머가 이미 설정되어 있으면 시간 조절 버튼 표시 */}
              {editedTask.pomodoro?.endTime ? (
                <div className="space-y-3">
                  {/* 남은 시간 표시 */}
                  {remainingTime && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <div className="text-sm text-blue-600 mb-1">남은 시간</div>
                      <div className="text-lg font-semibold text-blue-700">{remainingTime}</div>
                    </div>
                  )}
                  
                  {/* 시간 추가/제거 버튼 */}
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600 mb-1">시간 추가</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddPomodoroTime(5)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                      >
                        +5분
                      </button>
                      <button
                        onClick={() => handleAddPomodoroTime(10)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                      >
                        +10분
                      </button>
                      <button
                        onClick={() => handleAddPomodoroTime(30)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                      >
                        +30분
                      </button>
                    </div>
                    
                    {/* 타이머 제거 버튼 */}
                    <button
                      onClick={handleRemovePomodoro}
                      className="w-full px-3 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      타이머 종료
                    </button>
                  </div>
                </div>
              ) : (
                /* 타이머 설정 */
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 mb-1">타이머 설정 (분)</div>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => handleSetPomodoroMinutes(25)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300"
                    >
                      25분
                    </button>
                    <button
                      onClick={() => handleSetPomodoroMinutes(45)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300"
                    >
                      45분
                    </button>
                    <button
                      onClick={() => handleSetPomodoroMinutes(60)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300"
                    >
                      60분
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSetCustomPomodoroTime()}
                      placeholder="커스텀 (분)"
                      step="1"
                      min="1"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSetCustomPomodoroTime}
                      className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      시작
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 6. Assignees */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            담당자
          </label>
          <div className="space-y-2">
            {users.map((user) => (
              <label
                key={user.id}
                className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={editedTask.assignees.includes(user.id)}
                  onChange={() => handleAssigneeToggle(user.id)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 inline mr-1" />
            카테고리
          </label>
          <div className="space-y-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name="category"
                  checked={editedTask.categoryId === category.id}
                  onChange={() => setEditedTask({ ...editedTask, categoryId: category.id })}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm">{category.name}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Recurrence */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Repeat className="w-4 h-4 inline mr-1" />
            반복
          </label>
          <select
            value={editedTask.recurrence.type}
            onChange={(e) => setEditedTask({ 
              ...editedTask, 
              recurrence: { 
                ...editedTask.recurrence, 
                type: e.target.value as RecurrenceType,
                daysOfWeek: e.target.value === 'weekly' ? [] : editedTask.recurrence.daysOfWeek
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {recurrenceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Weekly days selection */}
          {editedTask.recurrence.type === 'weekly' && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  반복할 요일
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const weekdays = [1, 2, 3, 4, 5]; // 월-금
                    const currentDays = editedTask.recurrence.daysOfWeek || [];
                    const hasAllWeekdays = weekdays.every(day => currentDays.includes(day));
                    
                    setEditedTask({
                      ...editedTask,
                      recurrence: {
                        ...editedTask.recurrence,
                        daysOfWeek: hasAllWeekdays 
                          ? currentDays.filter(d => !weekdays.includes(d))
                          : [...new Set([...currentDays, ...weekdays])]
                      }
                    });
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  평일
                </button>
              </div>
              <div className="flex gap-1">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => {
                  const isSelected = editedTask.recurrence.daysOfWeek?.includes(index) || false;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const currentDays = editedTask.recurrence.daysOfWeek || [];
                        const newDays = isSelected
                          ? currentDays.filter(d => d !== index)
                          : [...currentDays, index];
                        setEditedTask({
                          ...editedTask,
                          recurrence: {
                            ...editedTask.recurrence,
                            daysOfWeek: newDays
                          }
                        });
                      }}
                      className={`flex-1 py-2 text-xs rounded border transition-colors ${
                        isSelected
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          저장
        </button>
      </div>
      </div>
    </div>
  );
}

// Sortable Subtask Item Component
interface SortableSubtaskItemProps {
  subtask: SubTask;
  isEditing: boolean;
  editingTitle: string;
  onToggle: () => void;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onEditTitleChange: (title: string) => void;
}

function SortableSubtaskItem({
  subtask,
  isEditing,
  editingTitle,
  onToggle,
  onEdit,
  onSave,
  onDelete,
  onEditTitleChange,
}: SortableSubtaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 group bg-white"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
          subtask.completed
            ? 'bg-blue-500 border-blue-500 text-white'
            : 'border-gray-300 hover:border-blue-500'
        }`}
      >
        {subtask.completed && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Title or Edit Input */}
      {isEditing ? (
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSave();
            }
            if (e.key === 'Escape') {
              onEdit(); // Cancel edit
            }
          }}
          autoFocus
          className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none"
        />
      ) : (
        <span
          onClick={onEdit}
          className={`flex-1 text-sm cursor-pointer ${
            subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'
          }`}
        >
          {subtask.title}
        </span>
      )}

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
