import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useForm } from 'react-hook-form';
import { User, Lock, Mail } from 'lucide-react';

type ProfileForm = {
  fullName: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export function Profile() {
  const { user, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ProfileForm>();
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const onSubmit = async (data: ProfileForm) => {
    try {
      setUpdateError('');
      setUpdateSuccess(false);

      if (data.newPassword) {
        const { error } = await supabase.auth.updateUser({
          password: data.newPassword
        });

        if (error) throw error;
      }

      setUpdateSuccess(true);
      setIsEditing(false);
      reset();
    } catch (error: any) {
      setUpdateError(error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Profile Settings</h2>
        </div>

        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-12 w-12 text-gray-500" />
            </div>
            <div className="ml-6">
              <h3 className="text-lg font-medium text-gray-900">{user?.email}</h3>
              {isAdmin && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Administrator
                </span>
              )}
            </div>
          </div>

          {updateSuccess && (
            <div className="mb-4 p-4 bg-green-50 rounded-md">
              <p className="text-sm text-green-800">Profile updated successfully!</p>
            </div>
          )}

          {updateError && (
            <div className="mb-4 p-4 bg-red-50 rounded-md">
              <p className="text-sm text-red-800">{updateError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="flex-1 focus:ring-blue-500 focus:border-blue-500 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm border-gray-300 bg-gray-50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Change Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  {...register('newPassword', {
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="New password"
                />
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  {...register('confirmNewPassword', {
                    validate: (val: string) => {
                      if (watch('newPassword') && val !== watch('newPassword')) {
                        return "Passwords don't match";
                      }
                    }
                  })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirm new password"
                />
                {errors.confirmNewPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmNewPassword.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}