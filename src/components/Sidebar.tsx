'use client';

import { Calendar, Star, List, CheckCircle, Tag, Trash2, RotateCcw, Users } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useState } from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  
  const { 
    getTodayTasks, 
    getFilteredTasks, 
    getCompletedTasks,
    getDeletedTasks,
    categories,
    currentUser,
    updateTask
  } = useStore();

  const todayTasks = getTodayTasks();
  const allTasks = getFilteredTasks().filter(task => !task.completed && !task.isDeleted);
  const completedTasks = getCompletedTasks();
  const deletedTasks = getDeletedTasks();
  const myTasks = allTasks.filter(task => task.assignees.includes(currentUser?.id || ''));

  const menuItems = [
    {
      id: 'today',
      name: '오늘 할 일',
      icon: Calendar,
      count: todayTasks.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      id: 'important',
      name: '중요',
      icon: Star,
      count: allTasks.filter(task => task.isToday).length,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      id: 'all',
      name: '계획된 일정',
      icon: List,
      count: allTasks.length,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    },
    {
      id: 'assigned',
      name: '모두',
      icon: RotateCcw,
      count: allTasks.length,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      id: 'completed',
      name: '완료됨',
      icon: CheckCircle,
      count: completedTasks.length,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      id: 'my-tasks',
      name: '나에게 할당됨',
      icon: Users,
      count: myTasks.length,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
    },
    {
      id: 'categories',
      name: '카테고리 관리',
      icon: Tag,
      count: 0,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      id: 'trash',
      name: '휴지통',
      icon: Trash2,
      count: deletedTasks.length,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  ];

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4">
        {/* User Profile */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
            {currentUser?.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-gray-900">{currentUser?.name}</div>
            <div className="text-sm text-gray-500">{currentUser?.email}</div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? `${item.bgColor} ${item.color} ${item.borderColor} border`
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.count > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    isActive ? 'bg-white bg-opacity-70' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Categories Section */}
        {categories.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              카테고리
            </h3>
            <div className="space-y-1">
              {categories.map((category) => {
                const categoryTasks = allTasks.filter(task => task.categoryId === category.id);
                const isActive = activeView === `category-${category.id}`;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => onViewChange(`category-${category.id}`)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverCategory(category.id);
                    }}
                    onDragLeave={() => {
                      setDragOverCategory(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                      if (data.type === 'task') {
                        updateTask(data.taskId, { categoryId: category.id });
                      }
                      setDragOverCategory(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : dragOverCategory === category.id
                        ? 'bg-blue-100 text-blue-900 border-2 border-blue-300 border-dashed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                    {categoryTasks.length > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                        {categoryTasks.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
