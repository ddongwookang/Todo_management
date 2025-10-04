'use client';

import { useState, useRef, useEffect } from 'react';
import { Task } from '@/types';
import TaskItem from './TaskItem';
import { useStore } from '@/lib/store';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  title?: string;
  emptyMessage?: string;
  showCompletedSection?: boolean;
  completedTasks?: Task[];
}

export default function TaskList({ tasks, title, emptyMessage = "할 일이 없습니다.", showCompletedSection = false, completedTasks = [] }: TaskListProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { reorderTasks } = useStore();

  // 미완료 태스크 (tasks는 이미 미완료만 포함)
  const incompleteTasks = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // 완료된 태스크는 prop으로 전달받음
  const sortedCompletedTasks = [...completedTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // 순서대로 정렬된 작업 목록
  const sortedTasks = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedTaskId) {
      const dragIndex = sortedTasks.findIndex(t => t.id === draggedTaskId);
      if (dragIndex !== dropIndex) {
        reorderTasks(draggedTaskId, dropIndex);
      }
    }
    
    setDraggedTaskId(null);
    setDragOverIndex(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // 태스크 아이템이 아닌 빈 영역에서만 선택 시작
    if ((e.target as HTMLElement).closest('[data-task-item]')) {
      return;
    }
    
    setIsSelecting(true);
    setSelectionStart({ x: e.clientX, y: e.clientY });
    setSelectionBox({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart) return;

    const box = {
      x: Math.min(e.clientX, selectionStart.x),
      y: Math.min(e.clientY, selectionStart.y),
      width: Math.abs(e.clientX - selectionStart.x),
      height: Math.abs(e.clientY - selectionStart.y)
    };
    setSelectionBox(box);

    // 선택 박스와 겹치는 태스크 찾기
    const selected = new Set<string>();
    sortedTasks.forEach(task => {
      const element = document.querySelector(`[data-task-id="${task.id}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (
          rect.left < box.x + box.width &&
          rect.right > box.x &&
          rect.top < box.y + box.height &&
          rect.bottom > box.y
        ) {
          selected.add(task.id);
        }
      }
    });
    setSelectedTasks(selected);
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionBox(null);
  };

  useEffect(() => {
    if (isSelecting) {
      const handleGlobalMouseUp = () => handleMouseUp();
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isSelecting]);

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      className="relative"
    >
      {title && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {title} ({tasks.length})
          </h2>
        </div>
      )}
      
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-base mb-2">{emptyMessage}</div>
          <div className="text-sm">새로운 업무를 추가해보세요!</div>
        </div>
      ) : (
        <>
          {/* 미완료 태스크 */}
          <div className="space-y-1">
            {incompleteTasks.map((task, index) => (
              <div key={task.id} className="relative">
                {/* 드래그 가이드 라인 */}
                {dragOverIndex === index && draggedTaskId !== task.id && (
                  <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full -ml-1"></div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full -mr-1"></div>
                  </div>
                )}
                <div
                  draggable
                  onDragStart={() => handleDragStart(task.id)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  data-task-item
                  data-task-id={task.id}
                  className={`transition-all ${
                    draggedTaskId === task.id ? 'opacity-40' : ''
                  } ${dragOverIndex === index && draggedTaskId !== task.id ? 'mt-2' : ''} ${
                    selectedTasks.has(task.id) ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                  }`}
                >
                  <TaskItem task={task} />
                </div>
              </div>
            ))}
          </div>

          {/* 완료된 태스크 섹션 - 조건부 표시 */}
          {showCompletedSection && sortedCompletedTasks.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
              >
                {showCompleted ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span>완료됨 {sortedCompletedTasks.length}</span>
              </button>

              {showCompleted && (
                <div className="space-y-1">
                  {sortedCompletedTasks.map((task, index) => (
                    <div key={task.id} className="relative">
                      <div
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        data-task-item
                        data-task-id={task.id}
                        className={`transition-all ${
                          draggedTaskId === task.id ? 'opacity-40' : ''
                        } ${
                          selectedTasks.has(task.id) ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                        }`}
                      >
                        <TaskItem task={task} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {/* Selection box */}
      {selectionBox && selectionBox.width > 0 && selectionBox.height > 0 && (
        <div
          className="fixed border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none z-50"
          style={{
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.width,
            height: selectionBox.height
          }}
        />
      )}
    </div>
  );
}
