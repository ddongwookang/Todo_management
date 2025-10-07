'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

export default function PomodoroTimer() {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(true);
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60);
  const [showSettings, setShowSettings] = useState(false);

  // 타이머 실행
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // 시간 종료 → 모드 전환
      if (isFocusMode) {
        // 집중 → 휴식
        setIsFocusMode(false);
        setTimeLeft(breakMinutes * 60);
      } else {
        // 휴식 → 집중
        setIsFocusMode(true);
        setTimeLeft(focusMinutes * 60);
      }
      setIsRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, isFocusMode, focusMinutes, breakMinutes]);

  // 시간 포맷 (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 시작/일시정지
  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  // 초기화
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(isFocusMode ? focusMinutes * 60 : breakMinutes * 60);
  };

  // 설정 저장
  const handleSaveSettings = () => {
    setIsRunning(false);
    setTimeLeft(isFocusMode ? focusMinutes * 60 : breakMinutes * 60);
    setShowSettings(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">뽀모도로 타이머</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="설정"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 설정 패널 */}
      {showSettings && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              집중 시간 (분)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={focusMinutes}
              onChange={(e) => {
                const val = e.target.value;
                // 빈 문자열이면 임시로 빈 값 허용
                if (val === '') {
                  setFocusMinutes('' as any);
                } else {
                  setFocusMinutes(Math.max(1, parseInt(val) || 1));
                }
              }}
              onBlur={(e) => {
                // 포커스를 잃을 때 빈 값이면 1로 설정
                if (e.target.value === '') {
                  setFocusMinutes(1);
                }
              }}
              onFocus={(e) => e.target.select()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              휴식 시간 (분)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={breakMinutes}
              onChange={(e) => {
                const val = e.target.value;
                // 빈 문자열이면 임시로 빈 값 허용
                if (val === '') {
                  setBreakMinutes('' as any);
                } else {
                  setBreakMinutes(Math.max(1, parseInt(val) || 1));
                }
              }}
              onBlur={(e) => {
                // 포커스를 잃을 때 빈 값이면 1로 설정
                if (e.target.value === '') {
                  setBreakMinutes(1);
                }
              }}
              onFocus={(e) => e.target.select()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSaveSettings}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            설정 저장
          </button>
        </div>
      )}

      {/* 모드 표시 */}
      <div className="text-center mb-4">
        <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${
          isFocusMode 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {isFocusMode ? '🎯 집중 시간' : '☕ 휴식 시간'}
        </span>
      </div>

      {/* 타이머 디스플레이 */}
      <div className="text-center mb-6">
        <div className={`text-6xl font-bold ${
          isFocusMode ? 'text-red-600' : 'text-green-600'
        }`}>
          {formatTime(timeLeft)}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          {isFocusMode 
            ? `집중 시간 ${focusMinutes}분` 
            : `휴식 시간 ${breakMinutes}분`
          }
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handlePlayPause}
          className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-all ${
            isRunning
              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              일시정지
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              시작
            </>
          )}
        </button>
        
        <button
          onClick={handleReset}
          className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          title="초기화"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* 진행 상태 바 */}
      <div className="mt-6">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              isFocusMode ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{
              width: `${((isFocusMode ? focusMinutes * 60 : breakMinutes * 60) - timeLeft) / 
                      (isFocusMode ? focusMinutes * 60 : breakMinutes * 60) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}

