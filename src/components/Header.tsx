import React, { useState } from 'react';
import { Bell, Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
    <header className="bg-gray-800 shadow-md">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center">
          <img
            src="https://as.edu.au/wp-content/webp-express/webp-images/uploads/2025/01/TAS_Logo_Horiz_Straw_PMS-713x375.png.webp"
            alt="Hoskins Theatre Logo"
            className="h-12 w-auto brightness-150"
          />
          <div className="ml-6 border-l border-gray-600 pl-6">
            <h1 className="text-2xl font-bold text-white">
              Inventory Management System
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <button className="p-2 rounded-full hover:bg-gray-700 relative">
            <Bell className="h-6 w-6 text-gray-200" />
            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 transform translate-x-1/2 -translate-y-1/2"></span>
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 focus:outline-none"
            >
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-200 mr-2">{user?.email}</span>
                {isAdmin && (
                  <span className="bg-blue-900 text-blue-100 text-xs font-medium px-2.5 py-1 rounded">
                    Admin
                  </span>
                )}
                <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center ml-3">
                  <User className="h-6 w-6 text-gray-300" />
                </div>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-48 bg-gray-700 rounded-lg shadow-lg py-1 z-10 border border-gray-600">
                <a
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                >
                  Your Profile
                </a>
                <a
                  href="/settings"
                  className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                >
                  Settings
                </a>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}