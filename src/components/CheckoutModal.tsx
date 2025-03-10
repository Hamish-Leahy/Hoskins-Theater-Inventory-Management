import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Calendar, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, addDays } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

type CheckoutForm = {
  expected_return_date: string;
  notes: string;
};

type CheckoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: {
    id: string;
    name: string;
    categories: {
      name: string;
    };
  };
};

export function CheckoutModal({ isOpen, onClose, onSuccess, item }: CheckoutModalProps) {
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CheckoutForm>({
    defaultValues: {
      expected_return_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    }
  });

  const onSubmit = async (data: CheckoutForm) => {
    try {
      const { error } = await supabase
        .from('checkouts')
        .insert([{
          item_id: item.id,
          user_id: user.id,
          checkout_date: new Date().toISOString(),
          expected_return_date: new Date(data.expected_return_date).toISOString(),
          notes: data.notes,
          status: 'checked_out'
        }]);

      if (error) throw error;

      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error checking out item:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-xl font-semibold text-gray-900">Check Out Item</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center bg-blue-50 p-4 rounded-lg">
            <div>
              <p className="font-medium text-blue-900">{item.name}</p>
              <p className="text-sm text-blue-700">{item.categories?.name}</p>
              <p className="text-xs text-blue-600 mt-1">Checking out as: {user.email}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <div className="flex items-center mb-1">
                <Calendar className="h-4 w-4 mr-1" />
                Expected Return Date
              </div>
            </label>
            <input
              type="date"
              {...register('expected_return_date', { required: 'Return date is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              min={format(new Date(), 'yyyy-MM-dd')}
            />
            {errors.expected_return_date && (
              <p className="mt-1 text-sm text-red-600">{errors.expected_return_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              <div className="flex items-center mb-1">
                <Clock className="h-4 w-4 mr-1" />
                Notes
              </div>
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Add any notes about the checkout..."
            />
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
              Check Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}