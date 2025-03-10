import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, QrCode, FolderTree, PenTool as Tool, FileBarChart, LogOut, Shield, Theater } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Inventory', icon: Package, path: '/inventory' },
  { name: 'Scanner', icon: QrCode, path: '/scanner' },
  { name: 'Categories', icon: FolderTree, path: '/categories' },
  { name: 'Maintenance', icon: Tool, path: '/maintenance' },
  { name: 'Reports', icon: FileBarChart, path: '/reports' },
  { name: 'Show Archive', icon: Theater, path: '/show-archive' },
];

export function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMasterAdmin = user?.email === 'hleahy@as.edu.au';

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex flex-col w-64 bg-gray-800">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <item.icon
                className="mr-3 h-6 w-6 flex-shrink-0"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
          {isMasterAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-red-900 text-white'
                    : 'text-red-300 hover:bg-red-900 hover:text-white'
                }`
              }
            >
              <Shield className="mr-3 h-6 w-6 flex-shrink-0" />
              Master Admin
            </NavLink>
          )}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
        >
          <LogOut className="mr-3 h-6 w-6" />
          Sign Out
        </button>
      </div>
    </div>
  );
}