import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FolderTree, Plus, Edit2, Trash, ChevronRight, ChevronDown, Box, AlertCircle } from 'lucide-react';
import { AddCategoryModal } from '../components/AddCategoryModal';
import { EditCategoryModal } from '../components/EditCategoryModal';

type Category = {
  id: string;
  name: string;
  description: string;
  parent_id: string | null;
  color: string;
  icon: string | null;
  created_at: string;
  _count?: {
    items: number;
  };
};

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          items (count)
        `)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      // Check if category has items
      const { data: items } = await supabase
        .from('items')
        .select('id')
        .eq('category_id', id);

      if (items && items.length > 0) {
        alert('Cannot delete category that contains items. Please move or delete the items first.');
        return;
      }

      // Check if category has subcategories
      const { data: subcategories } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', id);

      if (subcategories && subcategories.length > 0) {
        alert('Cannot delete category that has subcategories. Please delete or move the subcategories first.');
        return;
      }

      if (!window.confirm('Are you sure you want to delete this category?')) {
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Failed to delete category. Please try again.');
    }
  };

  const getColorClass = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800',
      red: 'bg-red-100 text-red-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      purple: 'bg-purple-100 text-purple-800',
      pink: 'bg-pink-100 text-pink-800',
    };
    return colors[color] || colors.blue;
  };

  const renderCategoryTree = (parentId: string | null = null, level = 0) => {
    const categoryItems = categories.filter(c => c.parent_id === parentId);
    
    if (categoryItems.length === 0) return null;

    return (
      <div className={`space-y-4 ${level > 0 ? 'ml-6 mt-2' : ''}`}>
        {categoryItems.map((category) => {
          const hasChildren = categories.some(c => c.parent_id === category.id);
          const isExpanded = expandedCategories.has(category.id);
          const childCount = categories.filter(c => c.parent_id === category.id).length;
          
          return (
            <div key={category.id} className="bg-white rounded-lg shadow-sm">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className={`p-1 rounded hover:bg-gray-100 ${!hasChildren && 'invisible'}`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                    <div className={`p-2 rounded-lg ${getColorClass(category.color)}`}>
                      <FolderTree className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {category.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500 space-x-2">
                      <span>{category._count?.items || 0} items</span>
                      {childCount > 0 && (
                        <span>• {childCount} subcategories</span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Edit category"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete category"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {isExpanded && renderCategoryTree(category.id, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your inventory categories and subcategories
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <Box className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new category.</p>
        </div>
      ) : (
        renderCategoryTree(null)
      )}

      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchCategories}
        categories={categories}
      />

      {selectedCategory && (
        <EditCategoryModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCategory(null);
          }}
          onSuccess={fetchCategories}
          categories={categories}
          category={selectedCategory}
        />
      )}
    </div>
  );
}