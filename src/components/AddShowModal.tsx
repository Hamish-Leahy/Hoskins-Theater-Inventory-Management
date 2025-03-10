import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Calendar, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ShowForm = {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
};

type AddShowModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddShowModal({ isOpen, onClose, onSuccess }: AddShowModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ShowForm>({
    defaultValues: {
      status: 'upcoming'
    }
  });

  const onSubmit = async (data: ShowForm) => {
    try {
      const { error } = await supabase
        .from('shows')
        .insert([data]);

      if (error) throw error;

      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding show:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-8 border w-full max-w-2xl shadow-xl rounded-xl bg-white">
        <div className="flex justify-between items-center pb-6 border-b border-gray-200">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Add New Show</h3>
            <p className="mt-1 text-sm text-gray-500">Create a new show in the archive</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Show Name
            </label>
            <input
              {...register('name', { required: 'Show name is required' })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter show name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              <div className="flex items-center mb-1">
                <FileText className="h-4 w-4 mr-1" />
                Description
              </div>
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter show description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center mb-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  Start Date
                </div>
              </label>
              <input
                type="date"
                {...register('start_date', { required: 'Start date is required' })}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center mb-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  End Date
                </div>
              </label>
              <input
                type="date"
                {...register('end_date', { required: 'End date is required' })}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              {...register('status')}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Show
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}