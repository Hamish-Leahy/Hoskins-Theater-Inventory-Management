import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Edit, Trash2, QrCode, Plus, Search, ArrowUpRight, ArrowDownLeft, Filter, X, SlidersHorizontal } from 'lucide-react';
import { AddItemModal } from '../components/AddItemModal';
import { EditItemModal } from '../components/EditItemModal';
import { CheckoutModal } from '../components/CheckoutModal';
import { useAuth } from '../contexts/AuthContext';

type Filters = {
  search: string;
  category: string;
  location: string;
  status: string;
  condition: string;
  minRating: string;
  maxRating: string;
  dateRange: {
    from: string;
    to: string;
  };
};

export function Inventory() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<number>(0);
  const { user } = useAuth();

  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    location: '',
    status: '',
    condition: '',
    minRating: '',
    maxRating: '',
    dateRange: {
      from: '',
      to: ''
    }
  });

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      const uniqueLocations = [...new Set(items.map(item => item.location).filter(Boolean))];
      setLocations(uniqueLocations.sort());
    }
  }, [items]);

  useEffect(() => {
    const count = Object.entries(filters).reduce((acc, [key, value]) => {
      if (key === 'dateRange') {
        return acc + (value.from || value.to ? 1 : 0);
      }
      return acc + (value ? 1 : 0);
    }, 0);
    setActiveFilters(count);
  }, [filters]);

  async function fetchItems() {
    try {
      // First get all items currently assigned to shows
      const { data: assignedItems } = await supabase
        .from('show_items')
        .select('item_id')
        .eq('status', 'assigned');

      // Build the query for items
      let query = supabase
        .from('items')
        .select(`
          *,
          categories (
            name
          ),
          checkouts (
            id,
            actual_return_date,
            checkout_date,
            user_id,
            status
          )
        `)
        .order('name');

      // If there are assigned items, exclude them from the results
      if (assignedItems && assignedItems.length > 0) {
        const assignedItemIds = assignedItems.map(item => item.item_id);
        query = query.not('id', 'in', `(${assignedItemIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      location: '',
      status: '',
      condition: '',
      minRating: '',
      maxRating: '',
      dateRange: {
        from: '',
        to: ''
      }
    });
  };

  const getItemStatus = (item: any) => {
    const activeCheckout = item.checkouts?.find((c: any) => !c.actual_return_date);
    if (!activeCheckout) return { status: 'available', checkedOutBy: null };
    return { 
      status: 'checked_out',
      checkedOutBy: activeCheckout.user_id
    };
  };

  const filteredItems = items.filter(item => {
    const { status: itemStatus } = getItemStatus(item);
    
    // Search filter
    const matchesSearch = !filters.search || 
      item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.serial_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.part_number?.toLowerCase().includes(filters.search.toLowerCase());

    // Category filter
    const matchesCategory = !filters.category || item.category_id === filters.category;

    // Location filter
    const matchesLocation = !filters.location || item.location === filters.location;

    // Status filter
    const matchesStatus = !filters.status || itemStatus === filters.status;

    // Condition filter
    const matchesCondition = !filters.condition || item.condition === filters.condition;

    // Rating filter
    const matchesRating = (!filters.minRating || (item.rating && item.rating >= parseInt(filters.minRating))) &&
                         (!filters.maxRating || (item.rating && item.rating <= parseInt(filters.maxRating)));

    // Date range filter
    const matchesDateRange = (!filters.dateRange.from || !item.purchase_date || 
                             new Date(item.purchase_date) >= new Date(filters.dateRange.from)) &&
                            (!filters.dateRange.to || !item.purchase_date || 
                             new Date(item.purchase_date) <= new Date(filters.dateRange.to));

    return matchesSearch && matchesCategory && matchesLocation && 
           matchesStatus && matchesCondition && matchesRating && matchesDateRange;
  });

  async function handleDeleteItem(id: string) {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleCheckout = (item) => {
    setSelectedItem(item);
    setIsCheckoutModalOpen(true);
  };

  const handleCheckIn = async (item) => {
    try {
      const activeCheckout = item.checkouts.find(c => !c.actual_return_date);
      if (!activeCheckout) return;

      const { error } = await supabase
        .from('checkouts')
        .update({
          actual_return_date: new Date().toISOString(),
          status: 'returned'
        })
        .eq('id', activeCheckout.id);

      if (error) throw error;
      fetchItems();
    } catch (error) {
      console.error('Error checking in item:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filteredItems.length} items found
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <SlidersHorizontal className="h-5 w-5 mr-2" />
            Filters
            {activeFilters > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {activeFilters}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Item
          </button>
        </div>
      </div>

      {/* Enhanced Filter Panel */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search items..."
                  className="pl-9 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="checked_out">Checked Out</option>
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
                value={filters.condition}
                onChange={(e) => handleFilterChange('condition', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Any Condition</option>
                <option value="new">New</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            {/* Rating Range */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Rating
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Rating
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={filters.maxRating}
                  onChange={(e) => handleFilterChange('maxRating', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange.from}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, from: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange.to}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, to: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (!value || (typeof value === 'object' && !value.from && !value.to)) return null;
                
                if (key === 'dateRange') {
                  if (value.from || value.to) {
                    return (
                      <span key={key} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        Date Range: {value.from || 'Any'} to {value.to || 'Any'}
                        <X
                          className="ml-2 h-4 w-4 cursor-pointer"
                          onClick={() => handleFilterChange(key, { from: '', to: '' })}
                        />
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <span key={key} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {key}: {value}
                    <X
                      className="ml-2 h-4 w-4 cursor-pointer"
                      onClick={() => handleFilterChange(key, '')}
                    />
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    No items found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const { status, checkedOutBy } = getItemStatus(item);
                  const isCheckedOut = status === 'checked_out';
                  const canCheckIn = isCheckedOut && (checkedOutBy === user?.id);
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.categories?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.location || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isCheckedOut
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {isCheckedOut ? 'Checked Out' : 'Available'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-3">
                          {!isCheckedOut ? (
                            <button
                              onClick={() => handleCheckout(item)}
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                              title="Check Out"
                            >
                              <ArrowUpRight className="h-5 w-5" />
                            </button>
                          ) : canCheckIn && (
                            <button
                              onClick={() => handleCheckIn(item)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                              title="Check In"
                            >
                              <ArrowDownLeft className="h-5 w-5" />
                            </button>
                          )}
                          <button className="text-blue-600 hover:text-blue-900">
                            <QrCode className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchItems}
        categories={categories}
      />

      {selectedItem && (
        <>
          <EditItemModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedItem(null);
            }}
            onSuccess={fetchItems}
            categories={categories}
            item={selectedItem}
          />

          <CheckoutModal
            isOpen={isCheckoutModalOpen}
            onClose={() => {
              setIsCheckoutModalOpen(false);
              setSelectedItem(null);
            }}
            onSuccess={fetchItems}
            item={selectedItem}
          />
        </>
      )}
    </div>
  );
}