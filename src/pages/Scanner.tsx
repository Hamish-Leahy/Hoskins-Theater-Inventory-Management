import React, { useState, useCallback } from 'react';
import QrReader from 'react-qr-scanner';
import { supabase } from '../lib/supabase';
import { Package, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ScannedItem = {
  id: string;
  name: string;
  description: string;
  location: string;
  condition: string;
  categories: {
    name: string;
  };
};

export function Scanner() {
  const [result, setResult] = useState<ScannedItem | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const navigate = useNavigate();

  const handleScan = useCallback(async (data: { text: string } | null) => {
    if (data?.text) {
      setLoading(true);
      setError('');
      try {
        const { data: item, error: fetchError } = await supabase
          .from('items')
          .select(`
            *,
            categories (
              name
            )
          `)
          .eq('qr_code', data.text)
          .single();

        if (fetchError) throw fetchError;
        if (!item) {
          setError('Item not found');
          setResult(null);
        } else {
          setResult(item);
          setError('');
        }
      } catch (err) {
        console.error('Error fetching item:', err);
        setError('Failed to fetch item details');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const handleError = useCallback((err: Error) => {
    console.error('Camera error:', err);
    setCameraError('Unable to access camera. Please check permissions and try again.');
  }, []);

  const handleCheckout = async () => {
    if (!result) return;

    try {
      const { error } = await supabase
        .from('checkouts')
        .insert([{
          item_id: result.id,
          checkout_date: new Date().toISOString(),
          status: 'checked_out'
        }]);

      if (error) throw error;
      navigate('/inventory', { 
        state: { message: `Successfully checked out ${result.name}` }
      });
    } catch (err) {
      console.error('Error checking out item:', err);
      setError('Failed to check out item');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">QR Scanner</h2>
          <div className="text-sm text-gray-500">
            Point camera at an item's QR code
          </div>
        </div>
        
        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
          {!cameraError ? (
            <QrReader
              delay={300}
              onError={handleError}
              onScan={handleScan}
              style={{ width: '100%', height: '100%' }}
              constraints={{
                video: { facingMode: 'environment' }
              }}
              key="qr-scanner" // Add key to force remount and avoid defaultProps warning
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center p-6">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-900 font-medium">{cameraError}</p>
                <button
                  onClick={() => setCameraError('')}
                  className="mt-4 text-blue-600 hover:text-blue-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {result && (
          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <div className="flex items-start">
              <Package className="h-6 w-6 text-gray-400 mt-1" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{result.name}</h3>
                <p className="text-sm text-gray-500">{result.description}</p>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900">{result.categories.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">{result.location}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Condition</dt>
                <dd className="mt-1 text-sm text-gray-900">{result.condition}</dd>
              </div>
            </dl>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleCheckout}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Check Out
              </button>
              <button
                onClick={() => navigate(`/inventory?item=${result.id}`)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                View Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}