'use client';

import { useState } from 'react';
import { X, Users, Tag, Calendar, Repeat } from 'lucide-react';
import { Task, RecurrenceType } from '@/types';
import { useStore } from '@/lib/store';

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  const [editedTask, setEditedTask] = useState(task);
  
  const { updateTask, users, categories } = useStore();

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">업무 상세</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목
            </label>
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={editedTask.description || ''}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="업무에 대한 상세 설명을 입력하세요..."
            />
          </div>


          {/* Assignees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              담당자 (다중 선택 가능)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAssigneeToggle(user.id)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    editedTask.assignees.includes(user.id)
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {user.name.charAt(0)}
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              카테고리
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setEditedTask({ ...editedTask, categoryId: category.id })}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    editedTask.categoryId === category.id
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Repeat className="w-4 h-4 inline mr-1" />
              반복 설정
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  반복할 요일 선택
                </label>
                <div className="flex gap-2 flex-wrap">
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
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-primary-100 border-primary-300 text-primary-700'
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

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              마감일
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setEditedTask({ 
                  ...editedTask, 
                  dueDate: e.target.value ? new Date(e.target.value) : undefined 
                })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <input
                type="time"
                value={editedTask.dueTime || ''}
                onChange={(e) => setEditedTask({ 
                  ...editedTask, 
                  dueTime: e.target.value || undefined 
                })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {(editedTask.dueDate || editedTask.dueTime) && (
              <button
                type="button"
                onClick={() => setEditedTask({ 
                  ...editedTask, 
                  dueDate: undefined,
                  dueTime: undefined 
                })}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                마감일 제거
              </button>
            )}
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이모지
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {['⭐', '🔥', '💡', '📝', '🎯', '⚡', '🚀', '💼', '📞', '🏠', '🛒', '🎉', '❤️', '🌟'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setEditedTask({ ...editedTask, emoji })}
                  className={`w-10 h-10 text-lg rounded-lg border transition-colors ${
                    editedTask.emoji === emoji
                      ? 'bg-primary-100 border-primary-300'
                      : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={editedTask.emoji || ''}
                onChange={(e) => setEditedTask({ ...editedTask, emoji: e.target.value })}
                placeholder="직접 입력하거나 위에서 선택"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                maxLength={2}
              />
              <button
                type="button"
                onClick={() => setEditedTask({ ...editedTask, emoji: undefined })}
                className="px-3 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50"
              >
                제거
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
