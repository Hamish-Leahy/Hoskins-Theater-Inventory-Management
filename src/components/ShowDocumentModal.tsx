import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Users, ChevronDown, Maximize2, Minimize2, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Heading from '@tiptap/extension-heading';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import { DocumentToolbar } from './DocumentToolbar';

type DocumentForm = {
  title: string;
  type: string;
};

type ShowDocumentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showId: string;
  document?: {
    id: string;
    title: string;
    type: string;
    content?: string;
    created_by?: string;
  };
  mode: 'create' | 'edit';
};

type Collaborator = {
  id: string;
  email: string;
  role: string;
};

type PlatformUser = {
  id: string;
  email: string;
};

export function ShowDocumentModal({
  isOpen,
  onClose,
  onSuccess,
  showId,
  document,
  mode
}: ShowDocumentModalProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<DocumentForm>({
    defaultValues: {
      title: document?.title || '',
      type: document?.type || 'rehearsal_notes'
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('viewer');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { user } = useAuth();

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing...'
      }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link,
      BulletList,
      OrderedList,
      ListItem,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Bold,
      Italic,
      Strike,
    ],
    content: document?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      handleAutosave(content);
    },
  }, [isOpen]); // Reinitialize editor when modal opens/closes

  // Autosave functionality with 30-second interval
  const [autosaveTimeout, setAutosaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleAutosave = (content: string) => {
    if (!document?.id) return;

    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('show_documents')
          .update({
            content: content,
            autosave_content: content,
            last_autosave_at: new Date().toISOString()
          })
          .eq('id', document.id);

        if (error) throw error;
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error autosaving:', error);
      }
    }, 30000);

    setAutosaveTimeout(timeout);
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `documents/${document?.id || showId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('show-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('show-files')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlatformUsers();
      if (document?.id) {
        fetchCollaborators(document.id);
      }
    }

    return () => {
      if (autosaveTimeout) {
        clearTimeout(autosaveTimeout);
      }
      if (editor) {
        editor.destroy();
      }
    };
  }, [isOpen, document]);

  useEffect(() => {
    if (editor && document?.content) {
      editor.commands.setContent(document.content);
    }
  }, [editor, document]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen && typeof window !== 'undefined') {
      window.document.documentElement.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    } else if (typeof window !== 'undefined') {
      window.document.documentElement.style.overflow = '';
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.document.documentElement.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      }
    };
  }, [isFullscreen, isOpen]);

  async function fetchPlatformUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .order('email');

      if (error) throw error;
      setPlatformUsers(data || []);
    } catch (error) {
      console.error('Error fetching platform users:', error);
      setError('Failed to load users');
    }
  }

  async function fetchCollaborators(documentId: string) {
    try {
      const { data: collabData, error: collabError } = await supabase
        .from('document_collaborators')
        .select(`
          id,
          role,
          users!document_collaborators_user_id_fkey (
            email
          )
        `)
        .eq('document_id', documentId);

      if (collabError) throw collabError;

      const collaborators = (collabData || []).map(collab => ({
        id: collab.id,
        email: collab.users.email,
        role: collab.role
      }));

      setCollaborators(collaborators);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      setError('Failed to load collaborators');
    }
  }

  const handleAddCollaborator = async () => {
    if (!selectedUser || !document?.id) return;

    try {
      const { error } = await supabase
        .from('document_collaborators')
        .insert([{
          document_id: document.id,
          user_id: selectedUser,
          role: selectedRole,
          added_by: user?.id
        }]);

      if (error) throw error;

      fetchCollaborators(document.id);
      setSelectedUser('');
      setSelectedRole('viewer');
    } catch (error) {
      console.error('Error adding collaborator:', error);
      setError('Failed to add collaborator');
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!document?.id) return;

    try {
      const { error } = await supabase
        .from('document_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;

      fetchCollaborators(document.id);
    } catch (error) {
      console.error('Error removing collaborator:', error);
      setError('Failed to remove collaborator');
    }
  };

  const handleUpdateCollaboratorRole = async (collaboratorId: string, newRole: string) => {
    if (!document?.id) return;

    try {
      const { error } = await supabase
        .from('document_collaborators')
        .update({ role: newRole })
        .eq('id', collaboratorId);

      if (error) throw error;

      fetchCollaborators(document.id);
    } catch (error) {
      console.error('Error updating collaborator role:', error);
      setError('Failed to update collaborator role');
    }
  };

  const onSubmit = async (data: DocumentForm) => {
    if (!editor) return;

    try {
      setSaving(true);
      setError(null);

      const content = editor.getHTML();

      if (mode === 'create') {
        const { data: newDocument, error: createError } = await supabase
          .from('show_documents')
          .insert([{
            show_id: showId,
            title: data.title,
            type: data.type,
            content: content,
            created_by: user?.id
          }])
          .select()
          .single();

        if (createError) throw createError;
      } else if (document?.id) {
        const { error: updateError } = await supabase
          .from('show_documents')
          .update({
            title: data.title,
            type: data.type,
            content: content,
            updated_at: new Date().toISOString()
          })
          .eq('id', document.id);

        if (updateError) throw updateError;
      }

      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving document:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const canEdit = mode === 'create' || collaborators.some(c => 
    c.email === user?.email && (c.role === 'editor' || document?.created_by === user?.id)
  );

  const isOwner = document?.created_by === user?.id;

  if (!isOpen) return null;

  const modalClass = isFullscreen 
    ? 'fixed inset-0 bg-white z-50'
    : 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';

  const contentClass = isFullscreen
    ? 'w-full h-full flex flex-col'
    : 'relative top-20 mx-auto p-8 border w-full max-w-4xl shadow-xl rounded-xl bg-white';

  const availableUsers = platformUsers.filter(u => 
    !collaborators.some(c => c.email === u.email)
  );

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'rehearsal_notes':
        return 'bg-purple-100 text-purple-800';
      case 'tech_notes':
        return 'bg-blue-100 text-blue-800';
      case 'production_notes':
        return 'bg-green-100 text-green-800';
      case 'design_notes':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={modalClass}>
      <div className={contentClass}>
        <div className={`flex justify-between items-center ${isFullscreen ? 'px-6 py-4 border-b border-gray-200 bg-white' : 'pb-6 border-b border-gray-200'}`}>
          <div className="flex-1">
            {mode === 'create' || canEdit ? (
              <input
                {...register('title', { required: 'Title is required' })}
                className="text-2xl font-bold text-gray-900 w-full bg-transparent border-0 focus:ring-0 p-0"
                placeholder="Document Title"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900">
                {document?.title}
              </h2>
            )}
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {lastSaved && (
              <span className="text-sm text-gray-500">
                Last saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => setShowCollaborators(!showCollaborators)}
              className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Users className="h-4 w-4 mr-2" />
              Collaborators
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-md">
            <div className="flex">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className={`flex-1 flex flex-col ${isFullscreen ? 'h-[calc(100vh-80px)]' : ''}`}>
          <div className={`flex items-center space-x-4 ${isFullscreen ? 'px-6 py-2 border-b border-gray-200 bg-white' : 'mb-6'}`}>
            <select
              {...register('type')}
              disabled={!canEdit}
              className={`rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${getDocumentTypeColor(document?.type || 'rehearsal_notes')}`}
            >
              <option value="rehearsal_notes">Rehearsal Notes</option>
              <option value="tech_notes">Technical Notes</option>
              <option value="production_notes">Production Notes</option>
              <option value="design_notes">Design Notes</option>
              <option value="other">Other</option>
            </select>
          </div>

          {editor && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className={`border-b border-gray-200 bg-white sticky top-0 z-10 ${isFullscreen ? 'px-6' : ''}`}>
                <DocumentToolbar 
                  editor={editor} 
                  isFullscreen={isFullscreen}
                  onImageUpload={handleImageUpload}
                />
              </div>
              <div className={`flex-1 overflow-auto ${isFullscreen ? 'px-6 py-4' : ''}`}>
                <EditorContent
                  editor={editor}
                  className={`prose max-w-none w-full rounded-lg border border-gray-300 ${
                    isFullscreen ? 'min-h-full' : 'h-[500px]'
                  } overflow-y-auto p-6 bg-white`}
                />
              </div>
            </div>
          )}

          <div className={`flex justify-end space-x-3 pt-4 ${isFullscreen ? 'px-6 py-4 bg-white border-t border-gray-200' : 'mt-6'}`}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create Document' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Collaborators Panel */}
        {showCollaborators && (
          <div className={`${
            isFullscreen 
              ? 'fixed right-6 top-20'
              : 'absolute right-4 top-20'
          } w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-900">
                Collaborators
              </h3>
              {isOwner && (
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="text-sm rounded-md border-gray-300"
                  >
                    <option value="">Select user</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.email}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="text-sm rounded-md border-gray-300"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    onClick={handleAddCollaborator}
                    disabled={!selectedUser}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-50"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {collaborator.email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isOwner && collaborator.email !== user?.email && (
                      <>
                        <select
                          value={collaborator.role}
                          onChange={(e) => handleUpdateCollaboratorRole(collaborator.id, e.target.value)}
                          className="text-xs rounded-md border-gray-300"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                        <button
                          onClick={() => handleRemoveCollaborator(collaborator.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {!isOwner && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        collaborator.role === 'editor'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {collaborator.role}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}