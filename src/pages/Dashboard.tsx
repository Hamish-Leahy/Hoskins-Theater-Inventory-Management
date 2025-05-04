import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    maintenanceDue: 0,
    checkedOut: 0,
    available: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('id');
      
      if (itemsError) throw itemsError;

      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance_logs')
        .select('id')
        .lt('next_maintenance_date', new Date().toISOString());

      if (maintenanceError) throw maintenanceError;

      const { data: checkouts, error: checkoutsError } = await supabase
        .from('checkouts')
        .select('id')
        .is('actual_return_date', null);

      if (checkoutsError) throw checkoutsError;

      setStats({
        totalItems: items?.length || 0,
        maintenanceDue: maintenance?.length || 0,
        checkedOut: checkouts?.length || 0,
        available: (items?.length || 0) - (checkouts?.length || 0)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Items"
          value={stats.totalItems.toString()}
          icon={Package}
          color="blue"
        />
        <DashboardCard
          title="Maintenance Due"
          value={stats.maintenanceDue.toString()}
          icon={AlertCircle}
          color="red"
        />
        <DashboardCard
          title="Checked Out"
          value={stats.checkedOut.toString()}
          icon={Clock}
          color="yellow"
        />
        <DashboardCard
          title="Available"
          value={stats.available.toString()}
          icon={CheckCircle}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentActivity />
        <MaintenanceSchedule />
      </div>
    </div>
  );
}

function DashboardCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`${colors[color]} rounded-md p-3`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentActivity() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  async function fetchRecentActivity() {
    try {
      const { data, error } = await supabase
        .from('checkouts')
        .select(`
          id,
          checkout_date,
          items (name),
          user_id,
          status
        `)
        .order('checkout_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        <div className="mt-6 flow-root">
          <ul className="-my-5 divide-y divide-gray-200">
            {activities.map((activity) => (
              <li key={activity.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.items?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.status} by {activity.user_id}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-sm text-gray-500">
                    {new Date(activity.checkout_date).toLocaleDateString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MaintenanceSchedule() {
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    fetchMaintenanceSchedule();
  }, []);

  async function fetchMaintenanceSchedule() {
    try {
      const { data, error } = await supabase
        .from('maintenance_logs')
        .select(`
          id,
          items (name),
          maintenance_date,
          description
        `)
        .gt('next_maintenance_date', new Date().toISOString())
        .order('next_maintenance_date')
        .limit(5);

      if (error) throw error;
      setSchedule(data || []);
    } catch (error) {
      console.error('Error fetching maintenance schedule:', error);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900">
          Upcoming Maintenance
        </h3>
        <div className="mt-6 flow-root">
          <ul className="-my-5 divide-y divide-gray-200">
            {schedule.map((item) => (
              <li key={item.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.items?.name}
                    </p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <div className="flex-shrink-0 text-sm text-gray-500">
                    {new Date(item.maintenance_date).toLocaleDateString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
