import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PenTool as Tool, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

export function Maintenance() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaintenanceLogs();
  }, []);

  async function fetchMaintenanceLogs() {
    try {
      const { data, error } = await supabase
        .from('maintenance_logs')
        .select(`
          *,
          items (
            name,
            categories (
              name
            )
          )
        `)
        .order('maintenance_date', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching maintenance logs:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Maintenance</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Schedule Maintenance
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-md p-3">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Scheduled</h3>
              <p className="text-2xl font-semibold text-yellow-600">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-red-100 rounded-md p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Overdue</h3>
              <p className="text-2xl font-semibold text-red-600">3</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-md p-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Completed</h3>
              <p className="text-2xl font-semibold text-green-600">45</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Maintenance Log</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No maintenance logs found
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Tool className="h-5 w-5 text-gray-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {log.items.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {log.items.categories.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(log.maintenance_date), 'MMM d, yyyy')}
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600">{log.description}</p>
                {log.next_maintenance_date && (
                  <p className="mt-2 text-sm text-gray-500">
                    Next maintenance:{' '}
                    {format(new Date(log.next_maintenance_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}