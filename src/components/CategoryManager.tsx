'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2, GripVertical } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function CategoryManager() {
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const { categories, addCategory, updateCategory, deleteCategory } = useStore();

  const predefinedColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#ec4899', // pink
    '#6b7280', // gray
  ];

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    addCategory({
      name: newCategoryName.trim(),
      color: newCategoryColor,
      order: categories.length,
    });

    setNewCategoryName('');
    setNewCategoryColor('#3b82f6');
    setIsAdding(false);
  };

  const handleEditStart = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setEditingId(categoryId);
      setEditName(category.name);
      setEditColor(category.color);
    }
  };

  const handleEditSave = () => {
    if (!editName.trim() || !editingId) return;

    updateCategory(editingId, {
      name: editName.trim(),
      color: editColor,
    });

    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: 'add' | 'edit') => {
    if (e.key === 'Enter') {
      if (action === 'add') {
        handleAddCategory();
      } else {
        handleEditSave();
      }
    }
    if (e.key === 'Escape') {
      if (action === 'add') {
        setIsAdding(false);
        setNewCategoryName('');
      } else {
        handleEditCancel();
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">카테고리 관리</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600"
        >
          <Plus className="w-4 h-4" />
          추가
        </button>
      </div>

      <div className="space-y-3">
        {/* Existing categories */}
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
            
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0" 
              style={{ backgroundColor: category.color }}
            />

            {editingId === category.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'edit')}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  autoFocus
                />
                <div className="flex gap-1">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditColor(color)}
                      className={`w-6 h-6 rounded-full border-2 ${
                        editColor === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={handleEditSave}
                    className="px-2 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600"
                  >
                    저장
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                  >
                    취소
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="flex-1 font-medium text-gray-900">
                  {category.name}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditStart(category.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Add new category */}
        {isAdding && (
          <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
            <GripVertical className="w-4 h-4 text-gray-400" />
            
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0" 
              style={{ backgroundColor: newCategoryColor }}
            />

            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'add')}
              placeholder="카테고리 이름"
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />

            <div className="flex gap-1">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewCategoryColor(color)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    newCategoryColor === color ? 'border-gray-400' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="flex gap-1">
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="px-2 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewCategoryName('');
                }}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {categories.length === 0 && !isAdding && (
        <div className="text-center py-6 text-gray-500">
          <div className="text-sm">아직 카테고리가 없습니다.</div>
          <div className="text-xs mt-1">업무를 분류하기 위해 카테고리를 추가해보세요!</div>
        </div>
      )}
    </div>
  );
}
