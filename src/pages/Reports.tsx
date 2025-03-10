import React from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  DollarSign,
  Activity,
  Clock
} from 'lucide-react';

export function Reports() {
  const reports = [
    {
      id: 1,
      name: 'Inventory Status',
      description: 'Current status of all items in inventory',
      icon: FileBarChart,
      type: 'CSV',
    },
    {
      id: 2,
      name: 'Monthly Usage',
      description: 'Equipment usage statistics for the past month',
      icon: Calendar,
      type: 'PDF',
    },
    {
      id: 3,
      name: 'Financial Summary',
      description: 'Cost analysis and depreciation report',
      icon: DollarSign,
      type: 'XLSX',
    },
    {
      id: 4,
      name: 'Maintenance History',
      description: 'Complete maintenance records',
      icon: Activity,
      type: 'PDF',
    },
    {
      id: 5,
      name: 'Check-out Logs',
      description: 'Equipment borrowing history',
      icon: Clock,
      type: 'CSV',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <div className="flex space-x-3">
          <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            Schedule Report
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-lg p-3">
                  <report.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {report.name}
                  </h3>
                  <p className="text-sm text-gray-500">{report.description}</p>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Download className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">Format: {report.type}</span>
              <span className="text-sm text-gray-500">Last generated: 2 days ago</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}