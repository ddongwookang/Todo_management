'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, StopCircle, Coffee, Clock } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function WorkTimer() {
  const { workTimer, startWork, startBreak, endWork } = useStore();
  const [currentTime, setCurrentTime] = useState('');
  const [showEndMessage, setShowEndMessage] = useState(false);

  // 시간 포맷 함수 (시:분:초)
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}시간 ${minutes}분 ${secs}초`;
  };

  // 현재 작동 중인 시간 계산
  const getCurrentElapsedTime = (): number => {
    if (workTimer.status === 'working' && workTimer.workStartTime) {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - new Date(workTimer.workStartTime).getTime()) / 1000);
      return workTimer.totalWorkTime + elapsed;
    } else if (workTimer.status === 'break' && workTimer.breakStartTime) {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - new Date(workTimer.breakStartTime).getTime()) / 1000);
      return elapsed;
    }
    return workTimer.status === 'working' ? workTimer.totalWorkTime : workTimer.totalBreakTime;
  };

  // 1초마다 시간 업데이트
  useEffect(() => {
    if (workTimer.status !== 'stopped') {
      const interval = setInterval(() => {
        setCurrentTime(formatTime(getCurrentElapsedTime()));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [workTimer]);

  // 근무 시작
  const handleStartWork = () => {
    setShowEndMessage(false);
    if (workTimer.status === 'break') {
      // 휴식 중이면 휴식 시간 누적하고 근무 재개
      const now = new Date();
      if (workTimer.breakStartTime) {
        const breakDuration = Math.floor((now.getTime() - new Date(workTimer.breakStartTime).getTime()) / 1000);
        useStore.setState((state) => ({
          workTimer: {
            ...state.workTimer,
            totalBreakTime: state.workTimer.totalBreakTime + breakDuration,
          },
        }));
      }
    }
    startWork();
    setCurrentTime(formatTime(workTimer.totalWorkTime));
  };

  // 휴식 시작
  const handleStartBreak = () => {
    startBreak();
    setCurrentTime('0시간 0분 0초');
  };

  // 퇴근
  const handleEndWork = () => {
    endWork();
    setShowEndMessage(true);
    setCurrentTime('');
    
    // 3초 후 메시지 숨김
    setTimeout(() => {
      setShowEndMessage(false);
    }, 5000);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2 shadow-sm">
      {/* 타이틀 */}
      <div className="flex items-center gap-1 mb-2">
        <h3 className="text-xs font-medium text-gray-700">근무 시간</h3>
      </div>

      {/* 퇴근 완료 메시지 */}
      {showEndMessage && (
        <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded">
          <div className="text-center">
            <p className="text-xs font-bold text-green-700 mb-1">수고하셨습니다! 🎉</p>
            <p className="text-xs text-green-600">
              근무: <span className="font-bold">{formatTime(workTimer.totalWorkTime)}</span> / 
              휴식: <span className="font-bold">{formatTime(workTimer.totalBreakTime)}</span>
            </p>
          </div>
        </div>
      )}

      {/* 상태 표시 */}
      {workTimer.status !== 'stopped' && (
        <div className="mb-1 p-1.5 bg-gray-50 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {workTimer.status === 'working' ? (
                <>
                  <Play className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium text-green-700">근무 중</span>
                </>
              ) : (
                <>
                  <Coffee className="w-3 h-3 text-orange-600" />
                  <span className="text-xs font-medium text-orange-700">휴식 중</span>
                </>
              )}
            </div>
            <div className="text-xs font-bold text-gray-900">
              {currentTime || formatTime(getCurrentElapsedTime())}
            </div>
          </div>
        </div>
      )}

      {/* 누적 시간 표시 (stopped 상태일 때만) */}
      {workTimer.status === 'stopped' && !showEndMessage && (workTimer.totalWorkTime > 0 || workTimer.totalBreakTime > 0) && (
        <div className="mb-1 p-1.5 bg-gray-50 rounded space-y-0.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">근무:</span>
            <span className="font-bold text-gray-900">{formatTime(workTimer.totalWorkTime)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">휴식:</span>
            <span className="font-bold text-gray-900">{formatTime(workTimer.totalBreakTime)}</span>
          </div>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-1">
        {workTimer.status === 'stopped' ? (
          <button
            onClick={handleStartWork}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs"
          >
            <Play className="w-3 h-3" />
            근무 시작
          </button>
        ) : (
          <>
            {workTimer.status === 'working' ? (
              <button
                onClick={handleStartBreak}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-xs"
              >
                <Coffee className="w-3 h-3" />
                휴식
              </button>
            ) : (
              <button
                onClick={handleStartWork}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs"
              >
                <Play className="w-3 h-3" />
                근무 재개
              </button>
            )}
            <button
              onClick={handleEndWork}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
            >
              <StopCircle className="w-3 h-3" />
              퇴근
            </button>
          </>
        )}
      </div>
    </div>
  );
}

