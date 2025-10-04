'use client';

import { useState } from 'react';
import { Task } from '@/types';
import TaskItem from './TaskItem';
import { format, isToday, isTomorrow, isYesterday, startOfWeek, endOfWeek, isWithinInterval, addWeeks, addDays } from 'date-fns';

interface PlannedScheduleViewProps {
  tasks: Task[];
}

interface GroupedTasks {
  yesterday: Task[];
  today: Task[];
  tomorrow: Task[];
  thisWeek: Task[];
  nextWeek: Task[];
  laterWeeks: { [key: string]: Task[] };
}

export default function PlannedScheduleView({ tasks }: PlannedScheduleViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'thisWeek' | 'nextWeek'>('all');
  const now = new Date();
  
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const nextWeekStart = addWeeks(thisWeekStart, 1);
  const nextWeekEnd = addWeeks(thisWeekEnd, 1);

  const filteredTasks = activeTab === 'all' ? tasks : 
    activeTab === 'thisWeek' ? tasks.filter(t => {
      const taskDate = t.dueDate ? new Date(t.dueDate) : new Date(t.createdAt);
      return isWithinInterval(taskDate, { start: thisWeekStart, end: thisWeekEnd });
    }) :
    tasks.filter(t => {
      const taskDate = t.dueDate ? new Date(t.dueDate) : new Date(t.createdAt);
      return isWithinInterval(taskDate, { start: nextWeekStart, end: nextWeekEnd });
    });

  const groupTasksByDate = (tasks: Task[]): GroupedTasks => {
    const grouped: GroupedTasks = {
      yesterday: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      nextWeek: [],
      laterWeeks: {}
    };

    const thisWeekStart2 = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd2 = endOfWeek(now, { weekStartsOn: 1 });
    const nextWeekStart2 = addWeeks(thisWeekStart2, 1);
    const nextWeekEnd2 = addWeeks(thisWeekEnd2, 1);

    tasks.forEach(task => {
      const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
      
      if (isYesterday(taskDate)) {
        grouped.yesterday.push(task);
      } else if (isToday(taskDate)) {
        grouped.today.push(task);
      } else if (isTomorrow(taskDate)) {
        grouped.tomorrow.push(task);
      } else if (isWithinInterval(taskDate, { start: thisWeekStart2, end: thisWeekEnd2 })) {
        grouped.thisWeek.push(task);
      } else if (isWithinInterval(taskDate, { start: nextWeekStart2, end: nextWeekEnd2 })) {
        grouped.nextWeek.push(task);
      } else {
        const weekKey = format(startOfWeek(taskDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        if (!grouped.laterWeeks[weekKey]) {
          grouped.laterWeeks[weekKey] = [];
        }
        grouped.laterWeeks[weekKey].push(task);
      }
    });

    return grouped;
  };

  const renderTaskGroup = (title: string, tasks: Task[], subtitle?: string) => {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          <div className="text-sm text-gray-400">{tasks.length}개 항목</div>
        </div>
        <div className="space-y-1">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  };

  if (tasks.length === 0) {
    return (
      <>
        {/* Week Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setActiveTab('thisWeek')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'thisWeek'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            이번주 ({format(thisWeekStart, 'M/d')} - {format(thisWeekEnd, 'M/d')})
          </button>
          <button
            onClick={() => setActiveTab('nextWeek')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'nextWeek'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            다음주 ({format(nextWeekStart, 'M/d')} - {format(nextWeekEnd, 'M/d')})
          </button>
        </div>
        <div className="text-center py-12 text-gray-500">
          <div className="text-base mb-2">계획된 일정이 없습니다.</div>
          <div className="text-sm">새로운 업무를 추가해보세요!</div>
        </div>
      </>
    );
  }

  const groupedTasks = groupTasksByDate(filteredTasks);

  return (
    <div>
      {/* Week Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setActiveTab('thisWeek')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'thisWeek'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          이번주 ({format(thisWeekStart, 'M/d')} - {format(thisWeekEnd, 'M/d')})
        </button>
        <button
          onClick={() => setActiveTab('nextWeek')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'nextWeek'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          다음주 ({format(nextWeekStart, 'M/d')} - {format(nextWeekEnd, 'M/d')})
        </button>
      </div>
      
      <div>
        {/* 이전 */}
        {renderTaskGroup('이전', groupedTasks.yesterday, '어제')}
        
        {/* 오늘 */}
        {renderTaskGroup('오늘', groupedTasks.today, format(now, 'M월 d일'))}
        
        {/* 내일 */}
        {renderTaskGroup('내일', groupedTasks.tomorrow, format(addDays(now, 1), 'M월 d일'))}
        
        {/* 이번 주 */}
        {renderTaskGroup('이번 주', groupedTasks.thisWeek, `${format(thisWeekStart, 'M월 d일')} - ${format(thisWeekEnd, 'M월 d일')}`)}
        
        {/* 다음 주 */}
        {renderTaskGroup('다음 주', groupedTasks.nextWeek, `${format(nextWeekStart, 'M월 d일')} - ${format(nextWeekEnd, 'M월 d일')}`)}
        
        {/* 이후 주차들 */}
        {Object.entries(groupedTasks.laterWeeks)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .map(([weekKey, weekTasks]) => {
            const weekStart = new Date(weekKey);
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            return renderTaskGroup(
              `${format(weekStart, 'M월 d일')} 주`,
              weekTasks,
              `${format(weekStart, 'M월 d일')} - ${format(weekEnd, 'M월 d일')}`
            );
          })}
      </div>
    </div>
  );
}
