import React from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type CategoryForm = {
  name: string;
  description: string;
  parent_id?: string;
  color?: string;
  icon?: string;
};

type EditCategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Array<{ id: string; name: string }>;
  category: {
    id: string;
    name: string;
    description: string;
    parent_id: string | null;
    color: string;
    icon: string | null;
  };
};

export function EditCategoryModal({ isOpen, onClose, onSuccess, categories, category }: EditCategoryModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CategoryForm>({
    defaultValues: {
      name: category.name,
      description: category.description,
      parent_id: category.parent_id || undefined,
      color: category.color,
      icon: category.icon || undefined,
    }
  });

  const onSubmit = async (data: CategoryForm) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', category.id);

      if (error) throw error;

      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  if (!isOpen) return null;

  const availableParents = categories.filter(c => c.id !== category.id);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-xl font-semibold text-gray-900">Edit Category</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              {...register('name', { required: 'Name is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Parent Category</label>
            <select
              {...register('parent_id')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">None (Top Level)</option>
              {availableParents.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <select
              {...register('color')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="blue">Blue</option>
              <option value="red">Red</option>
              <option value="green">Green</option>
              <option value="yellow">Yellow</option>
              <option value="purple">Purple</option>
              <option value="pink">Pink</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}