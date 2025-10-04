'use client';

import { useState } from 'react';
import { Calendar, Users, ArrowRight, Check } from 'lucide-react';
import { useStore } from '@/lib/store';
import { format } from 'date-fns';

interface TaskAssignee {
  taskId: string;
  assigneeId: string;
}

export default function VacationManager() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [action, setAction] = useState<'postpone' | 'reassign'>('postpone');
  const [taskAssignees, setTaskAssignees] = useState<TaskAssignee[]>([]);

  const { tasks, users, updateTask, currentUser } = useStore();

  // 휴가 기간의 태스크 필터링 (개선)
  const getVacationTasks = () => {
    if (!startDate || !endDate) return [];
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    console.log('=== 휴가 기간 필터링 ===');
    console.log('시작일:', format(start, 'yyyy-MM-dd HH:mm'));
    console.log('종료일:', format(end, 'yyyy-MM-dd HH:mm'));
    console.log('현재 사용자:', currentUser?.name, currentUser?.id);
    
    const filteredTasks = tasks.filter(task => {
      // 삭제되거나 완료된 태스크 제외
      if (task.isDeleted || task.completed) return false;
      
      // 내 태스크만 (현재 사용자에게 할당된 것)
      if (!task.assignees || !task.assignees.includes(currentUser?.id || '')) return false;
      
      // 마감일이 있는 경우 - 휴가 기간 내에 있는지 확인
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const isInRange = dueDate >= start && dueDate <= end;
        console.log(`태스크: ${task.title}, 마감일: ${format(dueDate, 'yyyy-MM-dd')}, 범위 내: ${isInRange}`);
        return isInRange;
      }
      
      // 마감일이 없고 오늘 할 일인 경우
      // 현재 날짜가 휴가 기간에 포함되는지 확인
      if (task.isToday) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isInRange = today >= start && today <= end;
        console.log(`태스크: ${task.title}, 오늘 할 일, 범위 내: ${isInRange}`);
        return isInRange;
      }
      
      return false;
    });

    console.log('필터링된 태스크 수:', filteredTasks.length);
    return filteredTasks;
  };

  const vacationTasks = getVacationTasks();

  // 특정 태스크의 담당자 가져오기
  const getTaskAssignee = (taskId: string) => {
    const assignment = taskAssignees.find(ta => ta.taskId === taskId);
    return assignment?.assigneeId || '';
  };

  // 특정 태스크의 담당자 설정
  const setTaskAssignee = (taskId: string, assigneeId: string) => {
    setTaskAssignees(prev => {
      const existing = prev.findIndex(ta => ta.taskId === taskId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { taskId, assigneeId };
        return updated;
      }
      return [...prev, { taskId, assigneeId }];
    });
  };

  // 모든 태스크에 동일한 담당자 일괄 적용
  const setAllTaskAssignees = (assigneeId: string) => {
    const newAssignees = vacationTasks.map(task => ({
      taskId: task.id,
      assigneeId
    }));
    setTaskAssignees(newAssignees);
  };

  // 휴가 적용
  const handleApplyVacation = () => {
    if (!startDate || !endDate) {
      alert('휴가 기간을 선택해주세요.');
      return;
    }

    if (vacationTasks.length === 0) {
      alert('처리할 작업이 없습니다.');
      return;
    }

    if (action === 'reassign') {
      // 모든 태스크에 담당자가 지정되었는지 확인
      const unassigned = vacationTasks.filter(task => !getTaskAssignee(task.id));
      if (unassigned.length > 0) {
        alert(`${unassigned.length}개의 작업에 담당자를 지정해주세요.`);
        return;
      }
    }

    const end = new Date(endDate);
    end.setDate(end.getDate() + 1); // 휴가 종료 다음날로 설정

    let successCount = 0;

    vacationTasks.forEach(task => {
      try {
        if (action === 'postpone') {
          // 미루기: 휴가 종료 다음날로 날짜 변경
          updateTask(task.id, {
            dueDate: end,
            isToday: false,
          });
          successCount++;
        } else if (action === 'reassign') {
          // 담당자 변경 (태스크별 개별 담당자)
          const newAssigneeId = getTaskAssignee(task.id);
          if (newAssigneeId) {
            const newAssignees = task.assignees.filter(id => id !== currentUser?.id);
            if (!newAssignees.includes(newAssigneeId)) {
              newAssignees.push(newAssigneeId);
            }
            updateTask(task.id, {
              assignees: newAssignees,
            });
            successCount++;
          }
        }
      } catch (error) {
        console.error(`작업 처리 실패 (${task.title}):`, error);
      }
    });

    alert(`${successCount}개의 작업이 처리되었습니다.`);
    
    // 초기화
    setStartDate('');
    setEndDate('');
    setTaskAssignees([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">휴가 설정</h2>
        </div>

        {/* 휴가 기간 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            휴가 기간 선택
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 처리 방법 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            업무 처리 방법
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="action"
                value="postpone"
                checked={action === 'postpone'}
                onChange={(e) => setAction(e.target.value as 'postpone')}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">휴가 후로 미루기</div>
                <div className="text-sm text-gray-500">
                  휴가 기간의 모든 업무를 휴가 종료 다음날로 연기합니다.
                </div>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="action"
                value="reassign"
                checked={action === 'reassign'}
                onChange={(e) => setAction(e.target.value as 'reassign')}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">다른 담당자에게 위임</div>
                <div className="text-sm text-gray-500">
                  휴가 기간의 업무를 태스크별로 선택한 담당자에게 재할당합니다.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* 일괄 담당자 선택 (위임 시에만) */}
        {action === 'reassign' && vacationTasks.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              모든 작업에 동일한 담당자 일괄 적용
            </label>
            <div className="flex gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    setAllTaskAssignees(e.target.value);
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">담당자를 선택하세요</option>
                {users
                  .filter(user => user.id !== currentUser?.id)
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {/* 영향받는 태스크 미리보기 */}
        {startDate && endDate && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              영향받는 작업 ({vacationTasks.length}개)
            </h3>
            {vacationTasks.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {vacationTasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200"
                  >
                    {/* 태스크 정보 */}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      {task.dueDate && (
                        <div className="text-xs text-gray-500">
                          마감: {format(new Date(task.dueDate), 'yyyy-MM-dd')}
                          {task.dueTime && ` ${task.dueTime}`}
                        </div>
                      )}
                      {task.isToday && !task.dueDate && (
                        <div className="text-xs text-blue-600">오늘 할 일</div>
                      )}
                    </div>

                    {/* 처리 방법 표시 */}
                    <div className="flex items-center gap-2">
                      {action === 'postpone' ? (
                        <div className="flex items-center gap-1 text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-300">
                          <ArrowRight className="w-3 h-3" />
                          <span>미루기</span>
                        </div>
                      ) : (
                        <select
                          value={getTaskAssignee(task.id)}
                          onChange={(e) => setTaskAssignee(task.id, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
                        >
                          <option value="">담당자 선택</option>
                          {users
                            .filter(user => user.id !== currentUser?.id)
                            .map(user => (
                              <option key={user.id} value={user.id}>
                                {user.name}
                              </option>
                            ))}
                        </select>
                      )}
                      
                      {action === 'reassign' && getTaskAssignee(task.id) && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">선택한 기간에 해당하는 작업이 없습니다.</p>
                <p className="text-xs text-gray-400 mt-1">
                  마감일이 있거나 &quot;오늘 할 일&quot;로 설정된 작업만 표시됩니다.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 적용 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleApplyVacation}
            disabled={!startDate || !endDate || vacationTasks.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            휴가 적용 ({vacationTasks.length}개 작업)
          </button>
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setTaskAssignees([]);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            초기화
          </button>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 안내:</strong> 휴가 설정은 현재 사용자({currentUser?.name})에게 할당된 작업만 처리합니다.
            완료된 작업과 삭제된 작업은 제외됩니다.
          </p>
          <p className="text-xs text-blue-700 mt-2">
            ✓ 마감일이 휴가 기간 내에 있는 작업<br />
            ✓ 마감일은 없지만 &quot;오늘 할 일&quot;로 설정되어 있고, 오늘이 휴가 기간에 포함되는 작업
          </p>
        </div>

        {/* 디버깅 정보 (개발용) */}
        {process.env.NODE_ENV === 'development' && startDate && endDate && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <div className="font-mono">
              <div>전체 태스크: {tasks.length}개</div>
              <div>현재 사용자 ID: {currentUser?.id}</div>
              <div>필터링된 태스크: {vacationTasks.length}개</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
