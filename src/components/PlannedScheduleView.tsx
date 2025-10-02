'use client';

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
  const now = new Date();
  
  const groupTasksByDate = (tasks: Task[]): GroupedTasks => {
    const grouped: GroupedTasks = {
      yesterday: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      nextWeek: [],
      laterWeeks: {}
    };

    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // 월요일 시작
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const nextWeekStart = addWeeks(thisWeekStart, 1);
    const nextWeekEnd = addWeeks(thisWeekEnd, 1);

    tasks.forEach(task => {
      const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
      
      if (isYesterday(taskDate)) {
        grouped.yesterday.push(task);
      } else if (isToday(taskDate)) {
        grouped.today.push(task);
      } else if (isTomorrow(taskDate)) {
        grouped.tomorrow.push(task);
      } else if (isWithinInterval(taskDate, { start: thisWeekStart, end: thisWeekEnd })) {
        grouped.thisWeek.push(task);
      } else if (isWithinInterval(taskDate, { start: nextWeekStart, end: nextWeekEnd })) {
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

  const groupedTasks = groupTasksByDate(tasks);

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
      <div className="text-center py-12 text-gray-500">
        <div className="text-base mb-2">계획된 일정이 없습니다.</div>
        <div className="text-sm">새로운 업무를 추가해보세요!</div>
      </div>
    );
  }

  return (
    <div>
      {/* 이전 */}
      {renderTaskGroup('이전', groupedTasks.yesterday, '어제')}
      
      {/* 오늘 */}
      {renderTaskGroup('오늘', groupedTasks.today, format(now, 'M월 d일'))}
      
      {/* 내일 */}
      {renderTaskGroup('내일', groupedTasks.tomorrow, format(addDays(now, 1), 'M월 d일'))}
      
      {/* 이번 주 */}
      {renderTaskGroup(
        '이번 주', 
        groupedTasks.thisWeek, 
        `${format(startOfWeek(now, { weekStartsOn: 1 }), 'M월 d일')} - ${format(endOfWeek(now, { weekStartsOn: 1 }), 'M월 d일')}`
      )}
      
      {/* 다음 주 */}
      {renderTaskGroup(
        '다음 주', 
        groupedTasks.nextWeek,
        `${format(addWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1), 'M월 d일')} - ${format(addWeeks(endOfWeek(now, { weekStartsOn: 1 }), 1), 'M월 d일')}`
      )}
      
      {/* 그 이후 주차별 */}
      {Object.entries(groupedTasks.laterWeeks)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([weekKey, weekTasks]) => {
          const weekStart = new Date(weekKey);
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          return renderTaskGroup(
            `${format(weekStart, 'M월 d일')} 주차`,
            weekTasks,
            `${format(weekStart, 'M월 d일')} - ${format(weekEnd, 'M월 d일')}`
          );
        })}
    </div>
  );
}
