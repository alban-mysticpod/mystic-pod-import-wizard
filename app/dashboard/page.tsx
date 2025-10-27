'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Upload, Package, CheckCircle, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalImports: number;
  successfulImports: number;
  designsUploaded: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalImports: 0,
    successfulImports: 0,
    designsUploaded: 0,
    recentActivity: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch real stats from API
    // For now, using mock data
    setTimeout(() => {
      setStats({
        totalImports: 12,
        successfulImports: 10,
        designsUploaded: 247,
        recentActivity: [
          {
            id: '1',
            type: 'import',
            message: 'Successfully imported 23 designs to Printify',
            timestamp: '2 hours ago',
          },
          {
            id: '2',
            type: 'import',
            message: 'Started new import from Google Drive',
            timestamp: '5 hours ago',
          },
          {
            id: '3',
            type: 'success',
            message: 'Import completed: 15 designs uploaded',
            timestamp: '1 day ago',
          },
        ],
      });
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back! 👋</h1>
        <p className="text-gray-600">Here's what's happening with your imports today.</p>
      </div>

      {/* Quick Action */}
      <Card>
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready to import new designs?</h2>
            <p className="text-gray-600">Import your designs from Google Drive to Printify in just a few clicks.</p>
          </div>
          <Link href="/import">
            <Button size="lg" className="inline-flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Start New Import
            </Button>
          </Link>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Imports */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">All time</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalImports}</h3>
            <p className="text-sm text-gray-600">Total Imports</p>
          </div>
        </Card>

        {/* Successful Imports */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">
                {stats.totalImports > 0 ? Math.round((stats.successfulImports / stats.totalImports) * 100) : 0}% success
              </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.successfulImports}</h3>
            <p className="text-sm text-gray-600">Successful Imports</p>
          </div>
        </Card>

        {/* Designs Uploaded */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.designsUploaded}</h3>
            <p className="text-sm text-gray-600">Designs Uploaded</p>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/history" className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {stats.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      activity.type === 'success' ? 'bg-green-100' : 'bg-blue-100'
                    )}>
                      {activity.type === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Upload className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {activity.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400 mt-1">Start your first import to see activity here</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

