import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Save, Users, Share2, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Document = {
  id: string;
  title: string;
  content: string;
  type: string;
  created_by: string;
  updated_at: string;
};

type Collaborator = {
  id: string;
  email: string;
  role: string;
};

export function DocumentEditor() {
  const { documentId } = useParams();
  const [document, setDocument] = useState<Document | null>(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (documentId) {
      fetchDocument();
      fetchCollaborators();
    }
  }, [documentId]);

  async function fetchDocument() {
    try {
      const { data, error } = await supabase
        .from('show_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      setDocument(data);
      setContent(data.content || '');
    } catch (error) {
      console.error('Error fetching document:', error);
    }
  }

  async function fetchCollaborators() {
    try {
      const { data, error } = await supabase
        .from('document_collaborators')
        .select(`
          id,
          user_id,
          role,
          auth.users!inner (
            email
          )
        `)
        .eq('document_id', documentId);

      if (error) throw error;

      setCollaborators(
        data.map(c => ({
          id: c.id,
          email: c.users.email,
          role: c.role
        }))
      );
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    }
  }

  const handleSave = async () => {
    if (!document) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('show_documents')
        .update({
          content: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setSaving(false);
    }
  };

  const canEdit = collaborators.some(c => 
    c.email === user?.email && (c.role === 'editor' || document?.created_by === user?.id)
  );

  if (!document) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {document.title}
              </h1>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                document.type === 'tech_notes'
                  ? 'bg-blue-100 text-blue-800'
                  : document.type === 'rehearsal_notes'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {document.type.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCollaborators(!showCollaborators)}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Users className="h-4 w-4 mr-2" />
                Collaborators
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>

              <button
                onClick={handleSave}
                disabled={!canEdit || saving}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  canEdit
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Collaborators Panel */}
        {showCollaborators && (
          <div className="absolute right-4 top-16 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Collaborators
            </h3>
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
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    collaborator.role === 'editor'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {collaborator.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="bg-white shadow-sm rounded-lg">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!canEdit}
            className="w-full h-[calc(100vh-12rem)] p-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            placeholder={
              canEdit
                ? "Start typing..."
                : "You don't have permission to edit this document"
            }
          />
        </div>
      </div>
    </div>
  );
}