'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function SearchBar() {
  const [searchInput, setSearchInput] = useState('');
  const [isComposing, setIsComposing] = useState(false); // 한글 입력 중 감지
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { filter, setFilter } = useStore();

  // 디바운스 검색 (0.3초)
  useEffect(() => {
    // 한글 입력(조합) 중이면 디바운스 적용 안함
    if (isComposing) return;
    
    // 기존 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // 새 타이머 설정
    debounceTimerRef.current = setTimeout(() => {
      setFilter({ search: searchInput.trim() || undefined });
    }, 300); // 0.3초 디바운스
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchInput, isComposing, setFilter]);
  
  // filter.search가 외부에서 초기화되면 input도 동기화
  useEffect(() => {
    if (!filter.search && searchInput) {
      setSearchInput('');
    }
  }, [filter.search]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleClear = () => {
    setSearchInput('');
    setFilter({ search: undefined });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-3">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="제목, 메모, 담당자 검색..."
          className="flex-1 border-none outline-none placeholder-gray-400 bg-transparent text-sm py-1"
        />
        {searchInput && (
          <button
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="검색 초기화"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
