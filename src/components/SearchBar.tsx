'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function SearchBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isComposing, setIsComposing] = useState(false); // 한글 입력 중 감지
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { filter, setFilter, clearFilter, users, categories, currentUser } = useStore();

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

  const handleAssigneeFilter = (assigneeId: string) => {
    setFilter({ 
      assigneeId: assigneeId === filter.assigneeId ? undefined : assigneeId 
    });
  };

  const handleCategoryFilter = (categoryId: string) => {
    setFilter({ 
      categoryId: categoryId === filter.categoryId ? undefined : categoryId 
    });
  };

  // search는 제외하고 나머지 필터만 카운트
  const activeFiltersCount = Object.keys(filter).filter(key => 
    key !== 'search' && filter[key as keyof typeof filter] !== undefined
  ).length;

  const handleClearAll = () => {
    setSearchInput('');
    clearFilter();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-3">
      {/* Search input */}
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder="업무, 담당자, 내용 검색..."
          className="flex-1 border-none outline-none placeholder-gray-400 bg-transparent text-sm py-1"
        />
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-1 rounded-lg transition-colors relative ${
            isExpanded || activeFiltersCount > 0
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
        {(activeFiltersCount > 0 || searchInput) && (
          <button
            onClick={handleClearAll}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="검색 및 필터 초기화"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assignee filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                담당자
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleAssigneeFilter(currentUser?.id || '')}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    filter.assigneeId === currentUser?.id
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  내 업무만
                </button>
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAssigneeFilter(user.id)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      filter.assigneeId === user.id
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {user.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryFilter(category.id)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      filter.categoryId === category.id
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
