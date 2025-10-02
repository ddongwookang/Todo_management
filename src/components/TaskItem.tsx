'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, Calendar, Users, Trash2, Edit3, Settings, Star, Clock, MoreVertical } from 'lucide-react';
import { Task } from '@/types';
import { useStore } from '@/lib/store';
import TaskDetailSidebar from './TaskDetailSidebar';

interface TaskItemProps {
  task: Task;
}

export default function TaskItem({ task }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showDetailSidebar, setShowDetailSidebar] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef<HTMLDivElement>(null);
  
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
    updateTask(task.id, { isToday: true });
    setShowContextMenu(false);
  };

  const handleAddToTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    updateTask(task.id, { dueDate: tomorrow });
    setShowContextMenu(false);
  };

  const handleSelectDate = () => {
    setShowContextMenu(false);
    setShowDetailSidebar(true);
  };

  const handleDeleteTask = () => {
    updateTask(task.id, { isDeleted: true });
    setShowContextMenu(false);
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


  return (
    <>
      <div 
        className={`bg-white rounded-lg border-0 p-3 hover:bg-gray-50 transition-colors cursor-pointer relative ${
          task.completed ? 'opacity-60' : ''
        }`}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', JSON.stringify({
            taskId: task.id,
            type: 'task'
          }));
        }}
        onClick={() => setShowDetailSidebar(true)}
        onContextMenu={handleContextMenu}
      >
      <div className="flex items-center gap-3">
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
              className="w-full text-lg font-medium border-none outline-none bg-gray-50 px-2 py-1 rounded"
              autoFocus
            />
          ) : (
            <div className="flex items-center justify-between flex-1">
              <div className="flex-1">
                <h3 
                  className={`text-base font-normal cursor-pointer hover:text-blue-600 ${
                    task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                  onClick={() => setShowDetailSidebar(true)}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <div className="text-xs text-gray-400 mt-1 truncate">
                    {task.description}
                  </div>
                )}
                
                {/* Meta information */}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
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
                        {new Date(task.dueDate).toLocaleDateString('ko-KR')}
                        {task.dueTime && ` ${task.dueTime}`}
                      </span>
                    </div>
                  )}
                  
                  {/* Created date */}
                  {!task.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(task.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Custom emoji or today star */}
              <div className="ml-2">
                <div className="w-4 h-4 text-base">
                  {task.emoji || (task.isToday ? '⭐' : '')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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

      {/* Task Detail Sidebar */}
      <TaskDetailSidebar
        task={task}
        isOpen={showDetailSidebar}
        onClose={() => setShowDetailSidebar(false)}
      />
    </>
  );
}
