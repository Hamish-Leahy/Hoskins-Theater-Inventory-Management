import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Theater,
  FileText,
  Upload,
  Plus,
  Calendar,
  Package,
  Search,
  FolderOpen,
  X,
  Download,
  Clock,
  AlertCircle,
  Trash2,
  AlertOctagon
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { AddShowModal } from '../components/AddShowModal';
import { AssignItemsModal } from '../components/AssignItemsModal';
import { UploadFilesModal } from '../components/UploadFilesModal';

type Show = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  description: string;
  status: string;
};

type ShowFile = {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  description: string;
};

type ShowItem = {
  id: string;
  item: {
    name: string;
    categories: {
      name: string;
    };
  };
  assigned_date: string;
  return_date: string | null;
  status: string;
};

export function ShowArchive() {
  const [shows, setShows] = useState<Show[]>([]);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [showFiles, setShowFiles] = useState<ShowFile[]>([]);
  const [showItems, setShowItems] = useState<ShowItem[]>([]);
  const [isAddShowModalOpen, setIsAddShowModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAssignItemModalOpen, setIsAssignItemModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchShows();
  }, []);

  useEffect(() => {
    if (selectedShow) {
      fetchShowFiles(selectedShow.id);
      fetchShowItems(selectedShow.id);
    }
  }, [selectedShow]);

  async function fetchShows() {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setShows(data || []);
    } catch (error) {
      console.error('Error fetching shows:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchShowFiles(showId: string) {
    try {
      const { data, error } = await supabase
        .from('show_files')
        .select('*')
        .eq('show_id', showId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setShowFiles(data || []);
    } catch (error) {
      console.error('Error fetching show files:', error);
    }
  }

  async function fetchShowItems(showId: string) {
    try {
      const { data, error } = await supabase
        .from('show_items')
        .select(`
          *,
          item:items (
            name,
            categories (
              name
            )
          )
        `)
        .eq('show_id', showId)
        .order('assigned_date', { ascending: false });

      if (error) throw error;
      setShowItems(data || []);
    } catch (error) {
      console.error('Error fetching show items:', error);
    }
  }

  const handleUnassignItem = async (itemId: string) => {
    if (!selectedShow) return;
    
    if (!window.confirm('Are you sure you want to unassign this item from the show?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('show_items')
        .delete()
        .eq('show_id', selectedShow.id)
        .eq('item_id', itemId);

      if (error) throw error;
      
      // Refresh show items
      fetchShowItems(selectedShow.id);
    } catch (error) {
      console.error('Error unassigning item:', error);
    }
  };

  const handleDeleteShow = async (showId: string) => {
    if (!window.confirm('Are you sure you want to delete this show? This will also remove all assigned items and uploaded files.')) {
      return;
    }

    try {
      // Delete show files from storage
      const { data: files } = await supabase
        .from('show_files')
        .select('file_url')
        .eq('show_id', showId);

      if (files) {
        for (const file of files) {
          const filePath = file.file_url.split('/').pop();
          if (filePath) {
            await supabase.storage
              .from('show-files')
              .remove([`shows/${showId}/${filePath}`]);
          }
        }
      }

      // Delete the show (cascade will handle related records)
      const { error } = await supabase
        .from('shows')
        .delete()
        .eq('id', showId);

      if (error) throw error;

      setSelectedShow(null);
      fetchShows();
    } catch (error) {
      console.error('Error deleting show:', error);
    }
  };

  const filteredShows = shows.filter(show =>
    show.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    show.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Show Archive</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage show files and assigned equipment
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAddShowModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Show
          </button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Shows List */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search shows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading shows...</div>
            ) : filteredShows.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No shows found</div>
            ) : (
              filteredShows.map((show) => (
                <div
                  key={show.id}
                  onClick={() => setSelectedShow(show)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedShow?.id === show.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Theater className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {show.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {format(new Date(show.start_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          show.status
                        )}`}
                      >
                        {show.status}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteShow(show.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete show"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Show Details */}
        <div className="col-span-8">
          {selectedShow ? (
            <div className="space-y-6">
              {/* Show Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedShow.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedShow.description}
                    </p>
                    <div className="mt-2 flex items-center space-x-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(selectedShow.start_date), 'MMM d, yyyy')} -{' '}
                        {format(new Date(selectedShow.end_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                      </button>
                      <button
                        onClick={() => setIsAssignItemModalOpen(true)}
                        className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Assign Items
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Files Grid */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Show Files
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {showFiles.map((file) => (
                    <div
                      key={file.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <FileText className="h-8 w-8 text-blue-500" />
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-gray-900">
                              {file.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <a
                          href={file.file_url}
                          download
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Download className="h-5 w-5" />
                        </a>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {file.description}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Uploaded {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigned Items */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assigned Items
                </h3>
                <div className="divide-y divide-gray-200">
                  {showItems.map((item) => (
                    <div key={item.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.item.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.item.categories.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {format(new Date(item.assigned_date), 'MMM d, yyyy')}
                        </div>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === 'returned'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {item.status}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleUnassignItem(item.item.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Unassign item"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {showItems.length === 0 && (
                    <div className="py-4 text-center text-gray-500">
                      No items assigned to this show
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No show selected
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a show from the list to view its details
              </p>
            </div>
          )}
        </div>
      </div>

      <AddShowModal
        isOpen={isAddShowModalOpen}
        onClose={() => setIsAddShowModalOpen(false)}
        onSuccess={fetchShows}
      />

      {selectedShow && (
        <>
          <AssignItemsModal
            isOpen={isAssignItemModalOpen}
            onClose={() => setIsAssignItemModalOpen(false)}
            onSuccess={() => {
              fetchShowItems(selectedShow.id);
              setIsAssignItemModalOpen(false);
            }}
            showId={selectedShow.id}
          />

          <UploadFilesModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onSuccess={() => {
              fetchShowFiles(selectedShow.id);
              setIsUploadModalOpen(false);
            }}
            showId={selectedShow.id}
          />
        </>
      )}
    </div>
  );
}