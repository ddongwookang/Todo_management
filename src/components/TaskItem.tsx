'use client';

import { useState } from 'react';
import { Check, Calendar, Users, Trash2, Edit3, Settings } from 'lucide-react';
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
  
  const { 
    toggleTaskComplete, 
    toggleTaskToday, 
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


  return (
    <div 
      className={`bg-white rounded-lg border-0 p-3 hover:bg-gray-50 transition-colors cursor-pointer ${
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

      {/* Task Detail Sidebar */}
      <TaskDetailSidebar
        task={task}
        isOpen={showDetailSidebar}
        onClose={() => setShowDetailSidebar(false)}
      />
    </div>
  );
}
