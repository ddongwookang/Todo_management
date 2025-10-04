'use client';

import { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function SearchBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { filter, setFilter, clearFilter, users, categories, currentUser } = useStore();

  const handleSearchChange = (search: string) => {
    setFilter({ search: search || undefined });
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

  const activeFiltersCount = Object.keys(filter).filter(key => 
    filter[key as keyof typeof filter] !== undefined
  ).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-3">
      {/* Search input */}
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={filter.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
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
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilter}
            className="p-1 text-gray-400 hover:text-gray-600"
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
