'use client';

import { useState } from 'react';
import { 
  Calendar, 
  List, 
  Star, 
  CheckCircle, 
  Users, 
  Tag, 
  Trash2, 
  RotateCcw,
  Plane,
  ChevronDown,
  ChevronRight,
  Folder,
  Plus,
  Timer,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import SearchBar from './SearchBar';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { 
    tasks, 
    currentUser, 
    categories,
    groups,
    updateTask,
    filter,
  } = useStore();

  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const filteredTasks = tasks.filter(task => !task.isDeleted);
  const todayTasks = filteredTasks.filter(task => task.isToday && !task.completed);
  const allTasks = filteredTasks.filter(task => !task.completed);
  const completedTasks = filteredTasks.filter(task => task.completed);
  const deletedTasks = tasks.filter(task => task.isDeleted);
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
      count: allTasks.filter(task => task.isImportant).length,
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
      name: '나에게 할당된 할 일',
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
      id: 'pomodoro',
      name: '뽀모도로',
      icon: Timer,
      count: 0,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      id: 'vacation',
      name: '휴가 설정',
      icon: Plane,
      count: 0,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
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

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-screen overflow-y-auto flex flex-col">
      <div className="flex-1 p-4">
        {/* User Profile */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
            {currentUser?.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-gray-900">{currentUser?.name}</div>
            <div className="text-sm text-gray-500">{currentUser?.email}</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <SearchBar />
        </div>

        {/* Menu Items */}
        <nav className="space-y-1 mb-6">
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

        {/* Groups & Categories Section */}
        {sortedGroups.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
              그룹 및 카테고리
            </h3>
            <div className="space-y-1">
              {sortedGroups.map((group) => {
                const groupCategories = categories
                  .filter(c => c.groupId === group.id)
                  .sort((a, b) => a.order - b.order);
                const isExpanded = expandedGroups.has(group.id);
                
                return (
                  <div key={group.id}>
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroupExpand(group.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <Folder className="w-4 h-4 text-gray-600" />
                      <span className="flex-1 text-left font-medium">{group.name}</span>
                      <span className="text-xs text-gray-500">
                        {groupCategories.length}
                      </span>
                    </button>

                    {/* Categories under this Group */}
                    {isExpanded && groupCategories.length > 0 && (
                      <div className="ml-6 mt-1 space-y-1">
                        {groupCategories.map((category) => {
                          const categoryTasks = allTasks.filter(task => task.categoryId === category.id);
                          const isCategoryActive = activeView === `category-${category.id}`;
                          
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
                                isCategoryActive
                                  ? 'bg-white border border-gray-200'
                                  : 'text-gray-700 hover:bg-gray-100'
                              } ${
                                dragOverCategory === category.id ? 'ring-2 ring-blue-500 ring-opacity-50 border-blue-400 border-2 border-dashed' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                <span>{category.name}</span>
                              </div>
                              {categoryTasks.length > 0 && (
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  isCategoryActive ? 'bg-gray-200 text-gray-600' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {categoryTasks.length}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
