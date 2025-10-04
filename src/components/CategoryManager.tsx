'use client';

import { useState } from 'react';
import { Plus, Edit3, Trash2, GripVertical, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Category, Group } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableGroupItemProps {
  group: Group;
  categories: Category[];
  onEdit: (group: Group) => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
  isExpanded: boolean;
  onAddCategory: (groupId: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

function SortableGroupItem({
  group,
  categories,
  onEdit,
  onDelete,
  onToggleExpand,
  isExpanded,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: SortableGroupItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const groupCategories = categories.filter(c => c.groupId === group.id).sort((a, b) => a.order - b.order);

  return (
    <div ref={setNodeRef} style={style}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-2">
        <div className="flex items-center gap-3">
          <button
            className="cursor-grab hover:bg-gray-100 rounded p-1"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => onToggleExpand(group.id)}
            className="hover:bg-gray-100 rounded p-1"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>

          <Folder className="w-5 h-5 text-gray-600" />
          <span className="flex-1 font-medium text-gray-900">{group.name}</span>

          <button
            onClick={() => onEdit(group)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4 text-gray-600" />
          </button>

          <button
            onClick={() => onDelete(group.id)}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>

        {/* 카테고리 목록 */}
        {isExpanded && (
          <div className="mt-3 ml-12 space-y-2">
            {groupCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200"
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="flex-1 text-sm text-gray-700">{category.name}</span>
                <button
                  onClick={() => onEditCategory(category)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <Edit3 className="w-3 h-3 text-gray-600" />
                </button>
                <button
                  onClick={() => onDeleteCategory(category.id)}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <Trash2 className="w-3 h-3 text-red-600" />
                </button>
              </div>
            ))}
            <button
              onClick={() => onAddCategory(group.id)}
              className="w-full flex items-center gap-2 p-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-dashed border-blue-300"
            >
              <Plus className="w-4 h-4" />
              카테고리 추가
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategoryManager() {
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // 카테고리 관련 상태
  const [addingCategoryFor, setAddingCategoryFor] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryColor, setEditCategoryColor] = useState('');

  const { 
    groups,
    categories,
    addGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useStore();

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const predefinedColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
  ];

  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedGroups.findIndex(g => g.id === active.id);
      const newIndex = sortedGroups.findIndex(g => g.id === over.id);
      const newOrder = arrayMove(sortedGroups, oldIndex, newIndex);
      reorderGroups('', newOrder);
    }
  };

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      addGroup({
        name: newGroupName.trim(),
        order: groups.length,
      });
      setNewGroupName('');
      setIsAddingGroup(false);
    }
  };

  const handleStartEditGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setEditGroupName(group.name);
  };

  const handleSaveEditGroup = () => {
    if (editingGroupId && editGroupName.trim()) {
      updateGroup(editingGroupId, { name: editGroupName.trim() });
      setEditingGroupId(null);
      setEditGroupName('');
    }
  };

  const handleDeleteGroup = (id: string) => {
    if (confirm('이 그룹과 포함된 모든 카테고리를 삭제하시겠습니까?')) {
      deleteGroup(id);
    }
  };

  const toggleExpand = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // 카테고리 관련 핸들러
  const handleAddCategory = (groupId: string) => {
    setAddingCategoryFor(groupId);
  };

  const handleSaveCategory = () => {
    if (addingCategoryFor && newCategoryName.trim()) {
      const groupCategories = categories.filter(c => c.groupId === addingCategoryFor);
      const maxOrder = groupCategories.length > 0 
        ? Math.max(...groupCategories.map(c => c.order)) 
        : -1;
      
      addCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
        groupId: addingCategoryFor,
        order: maxOrder + 1,
      });
      setNewCategoryName('');
      setNewCategoryColor('#3b82f6');
      setAddingCategoryFor(null);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditCategoryName(category.name);
    setEditCategoryColor(category.color);
  };

  const handleSaveCategoryEdit = () => {
    if (editingCategoryId && editCategoryName.trim()) {
      updateCategory(editingCategoryId, { 
        name: editCategoryName.trim(),
        color: editCategoryColor
      });
      setEditingCategoryId(null);
      setEditCategoryName('');
      setEditCategoryColor('');
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('이 카테고리를 삭제하시겠습니까?')) {
      deleteCategory(id);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          그룹 및 카테고리 관리
        </h2>
        <p className="text-sm text-gray-600">
          그룹을 만들고, 그 안에 카테고리를 추가하세요.
        </p>
      </div>

      {/* Add New Group */}
      {isAddingGroup ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                그룹 이름
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddGroup();
                  } else if (e.key === 'Escape') {
                    setIsAddingGroup(false);
                    setNewGroupName('');
                  }
                }}
                placeholder="새 그룹 이름 (Enter로 추가)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddGroup}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setIsAddingGroup(false);
                  setNewGroupName('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingGroup(true)}
          className="w-full mb-4 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          새 그룹 추가
        </button>
      )}

      {/* Edit Group Modal */}
      {editingGroupId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">그룹 이름 변경</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  그룹 이름
                </label>
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEditGroup();
                    } else if (e.key === 'Escape') {
                      setEditingGroupId(null);
                      setEditGroupName('');
                    }
                  }}
                  placeholder="Enter로 저장, Esc로 취소"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveEditGroup}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setEditingGroupId(null);
                    setEditGroupName('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {addingCategoryFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">카테고리 추가</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리 이름
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveCategory();
                    } else if (e.key === 'Escape') {
                      setAddingCategoryFor(null);
                      setNewCategoryName('');
                      setNewCategoryColor('#3b82f6');
                    }
                  }}
                  placeholder="카테고리 이름 (Enter로 추가)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  색상
                </label>
                <div className="flex gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCategoryColor(color)}
                      className={`w-8 h-8 rounded-full ${
                        newCategoryColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveCategory}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  추가
                </button>
                <button
                  onClick={() => {
                    setAddingCategoryFor(null);
                    setNewCategoryName('');
                    setNewCategoryColor('#3b82f6');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategoryId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">카테고리 수정</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리 이름
                </label>
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveCategoryEdit();
                    } else if (e.key === 'Escape') {
                      setEditingCategoryId(null);
                      setEditCategoryName('');
                      setEditCategoryColor('');
                    }
                  }}
                  placeholder="Enter로 저장, Esc로 취소"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  색상
                </label>
                <div className="flex gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditCategoryColor(color)}
                      className={`w-8 h-8 rounded-full ${
                        editCategoryColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveCategoryEdit}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setEditingCategoryId(null);
                    setEditCategoryName('');
                    setEditCategoryColor('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedGroups.map(g => g.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sortedGroups.map((group) => (
              <SortableGroupItem
                key={group.id}
                group={group}
                categories={categories}
                onEdit={handleStartEditGroup}
                onDelete={handleDeleteGroup}
                onToggleExpand={toggleExpand}
                isExpanded={expandedGroups.has(group.id)}
                onAddCategory={handleAddCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sortedGroups.length === 0 && !isAddingGroup && (
        <div className="text-center py-12 text-gray-400">
          <p>그룹이 없습니다.</p>
          <p className="text-sm mt-1">새 그룹을 추가해보세요!</p>
        </div>
      )}
    </div>
  );
}
