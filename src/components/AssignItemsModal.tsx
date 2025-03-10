import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Package, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Item = {
  id: string;
  name: string;
  categories: {
    name: string;
  };
};

type AssignItemForm = {
  item_id: string;
  notes?: string;
};

type AssignItemsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showId: string;
};

export function AssignItemsModal({ isOpen, onClose, onSuccess, showId }: AssignItemsModalProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AssignItemForm>();

  useEffect(() => {
    if (isOpen) {
      fetchAvailableItems();
    }
  }, [isOpen, showId]);

  async function fetchAvailableItems() {
    try {
      setLoading(true);
      
      // First, get all items currently assigned to this show
      const { data: assignedItems } = await supabase
        .from('show_items')
        .select('item_id')
        .eq('show_id', showId)
        .eq('status', 'assigned');

      // Get all available items
      let query = supabase
        .from('items')
        .select(`
          id,
          name,
          categories (
            name
          )
        `);

      // Only apply the filter if there are assigned items
      if (assignedItems && assignedItems.length > 0) {
        const assignedItemIds = assignedItems.map(item => item.item_id);
        query = query.not('id', 'in', `(${assignedItemIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching available items:', error);
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data: AssignItemForm) => {
    try {
      const { error } = await supabase
        .from('show_items')
        .insert([{
          show_id: showId,
          item_id: data.item_id,
          notes: data.notes,
          status: 'assigned'
        }]);

      if (error) throw error;

      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning item:', error);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categories.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-8 border w-full max-w-2xl shadow-xl rounded-xl bg-white">
        <div className="flex justify-between items-center pb-6 border-b border-gray-200">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Assign Items</h3>
            <p className="mt-1 text-sm text-gray-500">Add items to the show</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading items...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No items available</div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          {...register('item_id', { required: 'Please select an item' })}
                          value={item.id}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <div className="flex items-center">
                            <Package className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{item.name}</span>
                          </div>
                          <p className="text-sm text-gray-500">{item.categories.name}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {errors.item_id && (
              <p className="text-sm text-red-600">{errors.item_id.message}</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Add any notes about this assignment..."
              />
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
                Assign Item
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}