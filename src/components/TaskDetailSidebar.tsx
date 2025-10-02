'use client';

import React, { useState } from 'react';
import { X, Users, Tag, Calendar, Repeat, Clock } from 'lucide-react';
import { Task, RecurrenceType } from '@/types';
import { useStore } from '@/lib/store';

interface TaskDetailSidebarProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskDetailSidebar({ task, isOpen, onClose }: TaskDetailSidebarProps) {
  const [editedTask, setEditedTask] = useState(task);
  
  const { updateTask, users, categories } = useStore();

  // task가 변경될 때마다 editedTask 업데이트
  React.useEffect(() => {
    setEditedTask(task);
  }, [task]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateTask(task.id, editedTask);
    onClose();
  };

  const handleAssigneeToggle = (userId: string) => {
    const newAssignees = editedTask.assignees.includes(userId)
      ? editedTask.assignees.filter(id => id !== userId)
      : [...editedTask.assignees, userId];
    
    setEditedTask({ ...editedTask, assignees: newAssignees });
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
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            제목
          </label>
          <input
            type="text"
            value={editedTask.title}
            onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Description */}
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

        {/* Assignees */}
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

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            마감일
          </label>
          
          {!editedTask.dueDate ? (
            <button
              onClick={() => {
                const today = new Date();
                setEditedTask({ 
                  ...editedTask, 
                  dueDate: today 
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-gray-500 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              기한 설정
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditedTask({ 
                    ...editedTask, 
                    dueDate: e.target.value ? new Date(e.target.value) : undefined 
                  })}
                  min={new Date().toISOString().split('T')[0]}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => setEditedTask({ 
                    ...editedTask, 
                    dueDate: undefined,
                    dueTime: undefined 
                  })}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                반복할 요일
              </label>
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

        {/* Emoji */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이모지
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {['⭐', '🔥', '💡', '📝', '🎯', '⚡', '🚀', '💼'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setEditedTask({ ...editedTask, emoji })}
                className={`w-8 h-8 text-sm rounded border transition-colors ${
                  editedTask.emoji === emoji
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={editedTask.emoji || ''}
            onChange={(e) => setEditedTask({ ...editedTask, emoji: e.target.value })}
            placeholder="직접 입력"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={2}
          />
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
