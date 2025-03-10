import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Package, DollarSign, MapPin, FileText, Receipt, PenTool as Tool } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ItemForm = {
  name: string;
  category_id: string;
  description: string;
  purchase_date: string;
  purchase_price: number;
  condition: string;
  location: string;
  manual_url?: string;
  receipt_url?: string;
  serial_number?: string;
  rating?: number;
  warranty?: string;
  technical_specs?: string;
  part_number?: string;
  stock?: number;
};

type EditItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Array<{ id: string; name: string }>;
  item: any;
};

export function EditItemModal({ isOpen, onClose, onSuccess, categories, item }: EditItemModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ItemForm>({
    defaultValues: {
      name: item.name,
      category_id: item.category_id,
      description: item.description,
      purchase_date: item.purchase_date,
      purchase_price: item.purchase_price,
      condition: item.condition,
      location: item.location,
      manual_url: item.manual_url,
      receipt_url: item.receipt_url,
      serial_number: item.serial_number,
      rating: item.rating,
      warranty: item.warranty,
      technical_specs: item.technical_specs,
      part_number: item.part_number,
      stock: item.stock || 1,
    }
  });

  const onSubmit = async (data: ItemForm) => {
    try {
      // Convert empty strings to null for optional fields
      const formattedData = {
        ...data,
        purchase_price: data.purchase_price ? parseFloat(data.purchase_price.toString()) : null,
        manual_url: data.manual_url || null,
        receipt_url: data.receipt_url || null,
        purchase_date: data.purchase_date || null,
        rating: data.rating || null,
        stock: data.stock || 1
      };

      const { error } = await supabase
        .from('items')
        .update(formattedData)
        .eq('id', item.id);

      if (error) throw error;

      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-8 border w-full max-w-3xl shadow-xl rounded-xl bg-white">
        <div className="flex justify-between items-center pb-6 border-b border-gray-200">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Edit Item</h3>
            <p className="mt-1 text-sm text-gray-500">Update item details</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center mb-1">
                    <Package className="h-4 w-4 mr-1" />
                    Name
                  </div>
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter item name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  {...register('category_id', { required: 'Category is required' })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
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
                placeholder="Enter item description"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Purchase Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center mb-1">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Purchase Price
                  </div>
                </label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    {...register('purchase_price')}
                    className="block w-full pl-7 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                <input
                  type="date"
                  {...register('purchase_date')}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Item Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center mb-1">
                    <Tool className="h-4 w-4 mr-1" />
                    Condition
                  </div>
                </label>
                <select
                  {...register('condition')}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="new">New</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center mb-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    Location
                  </div>
                </label>
                <input
                  {...register('location')}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter storage location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                <input
                  {...register('serial_number')}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter serial number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Part Number</label>
                <input
                  {...register('part_number')}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter part number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  {...register('rating')}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Stock</label>
                <input
                  type="number"
                  min="0"
                  {...register('stock')}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Technical Specifications</label>
              <textarea
                {...register('technical_specs')}
                rows={3}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter technical specifications"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Documentation</h4>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Manual URL</label>
                <input
                  type="url"
                  {...register('manual_url')}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="https://"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Receipt URL</label>
                <input
                  type="url"
                  {...register('receipt_url')}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="https://"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Warranty</label>
                <input
                  {...register('warranty')}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter warranty information"
                />
              </div>
            </div>
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}