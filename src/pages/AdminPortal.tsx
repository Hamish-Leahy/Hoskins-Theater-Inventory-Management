import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Shield, Power, Clock, AlertTriangle, Users, Database, RefreshCw, Activity, HardDrive, Cpu, Package, FolderTree } from 'lucide-react';
import { supabase } from '../lib/supabase';

type SystemMetrics = {
  activeUsers: number;
  databaseSize: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  lastBackup: string;
  totalItems: number;
  totalCategories: number;
  totalCheckouts: number;
};

export function AdminPortal() {
  const { user } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [systemStatus, setSystemStatus] = useState('active');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeUsers: 0,
    databaseSize: '0 MB',
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    lastBackup: '',
    totalItems: 0,
    totalCategories: 0,
    totalCheckouts: 0
  });

  // Only allow access to hleahy@as.edu.au
  if (user?.email !== 'hleahy@as.edu.au') {
    return <Navigate to="/" />;
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchSystemMetrics();
      const interval = setInterval(fetchSystemMetrics, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Pw45Ut09') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  async function fetchSystemMetrics() {
    try {
      // Fetch active users (users with sessions in the last 15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { count: activeUsers } = await supabase
        .from('auth.users')
        .select('id', { count: 'exact' })
        .gt('last_sign_in_at', fifteenMinutesAgo);

      // Fetch total items
      const { count: totalItems } = await supabase
        .from('items')
        .select('id', { count: 'exact' });

      // Fetch total categories
      const { count: totalCategories } = await supabase
        .from('categories')
        .select('id', { count: 'exact' });

      // Fetch total checkouts
      const { count: totalCheckouts } = await supabase
        .from('checkouts')
        .select('id', { count: 'exact' });

      // Get database size and other metrics from RPC function
      const { data: systemData } = await supabase.rpc('get_system_metrics');

      setMetrics({
        activeUsers: activeUsers || 0,
        totalItems: totalItems || 0,
        totalCategories: totalCategories || 0,
        totalCheckouts: totalCheckouts || 0,
        databaseSize: systemData?.database_size || '0 MB',
        cpuUsage: systemData?.cpu_usage || 0,
        memoryUsage: systemData?.memory_usage || 0,
        diskUsage: systemData?.disk_usage || 0,
        lastBackup: systemData?.last_backup || 'Never'
      });
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    }
  }

  const handleEmergencyShutdown = async () => {
    try {
      const { error } = await supabase.rpc('emergency_shutdown');
      if (error) throw error;
      setSystemStatus('shutdown');
    } catch (error) {
      console.error('Error during emergency shutdown:', error);
    }
  };

  const handleMaintenanceMode = async () => {
    try {
      const { error } = await supabase.rpc('toggle_maintenance_mode', {
        enable: !maintenanceMode
      });
      if (error) throw error;
      setMaintenanceMode(!maintenanceMode);
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Master Admin Authentication
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-800 p-4 rounded-md text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Master Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="Enter master password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Authenticate
            </button>
          </form>
        </div>
      </div>
    );
  }

  const ActionConfirmation = ({ action, onConfirm, onCancel }: { action: string; onConfirm: () => void; onCancel: () => void }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-lg font-bold text-red-600 mb-4">Confirm Action</h3>
        <p className="text-gray-700 mb-6">Are you sure you want to {action}? This action cannot be undone.</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-500" />
            <h1 className="ml-3 text-2xl font-bold text-white">Master Admin Portal</h1>
          </div>
          <p className="mt-1 text-sm text-gray-300">
            System control and emergency management interface
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Status */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  systemStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {systemStatus === 'active' ? 'Active' : 'Shutdown'}
                </span>
              </div>
              <div className="mt-4 space-y-4">
                <button
                  onClick={() => setConfirmAction('shutdown')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  <Power className="h-5 w-5 mr-2" />
                  Emergency Shutdown
                </button>
              </div>
            </div>

            {/* Maintenance Mode */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Maintenance Mode</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  maintenanceMode ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {maintenanceMode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="mt-4 space-y-4">
                <button
                  onClick={() => setConfirmAction('maintenance')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700"
                >
                  <Clock className="h-5 w-5 mr-2" />
                  Toggle Maintenance Mode
                </button>
              </div>
            </div>

            {/* System Resources */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Resources</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <Cpu className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">CPU Usage</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{metrics.cpuUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        metrics.cpuUsage > 90 ? 'bg-red-500' : metrics.cpuUsage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${metrics.cpuUsage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Memory Usage</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{metrics.memoryUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        metrics.memoryUsage > 90 ? 'bg-red-500' : metrics.memoryUsage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${metrics.memoryUsage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <HardDrive className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Disk Usage</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{metrics.diskUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        metrics.diskUsage > 90 ? 'bg-red-500' : metrics.diskUsage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${metrics.diskUsage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Database Metrics */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Database Metrics</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Database Size</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{metrics.databaseSize}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <RefreshCw className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Last Backup</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{metrics.lastBackup}</span>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h2>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">Active Users</p>
                      <p className="text-xl font-semibold text-gray-900">{metrics.activeUsers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-green-500" />
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">Total Items</p>
                      <p className="text-xl font-semibold text-gray-900">{metrics.totalItems}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center">
                    <FolderTree className="h-8 w-8 text-purple-500" />
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">Categories</p>
                      <p className="text-xl font-semibold text-gray-900">{metrics.totalCategories}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-500" />
                    <div className="ml-3">
                      <p className="text-sm text-gray-500">Total Checkouts</p>
                      <p className="text-xl font-semibold text-gray-900">{metrics.totalCheckouts}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmAction && (
        <ActionConfirmation
          action={confirmAction === 'shutdown' ? 'initiate emergency shutdown' : 'toggle maintenance mode'}
          onConfirm={() => {
            if (confirmAction === 'shutdown') {
              handleEmergencyShutdown();
            } else {
              handleMaintenanceMode();
            }
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}