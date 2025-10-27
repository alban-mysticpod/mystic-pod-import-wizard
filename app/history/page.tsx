'use client';

import { Card } from '@/components/Card';
import { History, Package, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function HistoryPage() {
  // TODO: Fetch real import history from API
  const mockHistory = [
    {
      id: '1',
      date: '2024-01-15',
      folderName: 'Summer Collection 2024',
      status: 'completed',
      filesCount: 23,
      successCount: 23,
      failedCount: 0,
    },
    {
      id: '2',
      date: '2024-01-14',
      folderName: 'Winter Designs',
      status: 'completed',
      filesCount: 15,
      successCount: 15,
      failedCount: 0,
    },
    {
      id: '3',
      date: '2024-01-13',
      folderName: 'Holiday Special',
      status: 'failed',
      filesCount: 10,
      successCount: 7,
      failedCount: 3,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Import History</h1>
        <p className="text-gray-600">View all your past imports and their status</p>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {mockHistory.map((item) => (
          <Card key={item.id}>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`p-3 rounded-lg ${
                    item.status === 'completed' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Package className={`w-6 h-6 ${
                      item.status === 'completed' ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.folderName}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {item.date}
                      </div>
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-1" />
                        {item.filesCount} files
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-2">
                      {item.successCount > 0 && (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {item.successCount} successful
                        </div>
                      )}
                      {item.failedCount > 0 && (
                        <div className="flex items-center text-sm text-red-600">
                          <XCircle className="w-4 h-4 mr-1" />
                          {item.failedCount} failed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    item.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.status === 'completed' ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completed
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        Failed
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State (if no history) */}
      {mockHistory.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No import history yet</h3>
            <p className="text-gray-600">Your import history will appear here once you start importing designs.</p>
          </div>
        </Card>
      )}
    </div>
  );
}

