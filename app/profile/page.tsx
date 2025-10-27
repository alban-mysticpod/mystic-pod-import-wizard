'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { Settings, CheckCircle, Layers, Activity, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { fetchUserStats, UserStats } from '@/lib/api';

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // TODO: Replace with actual API call
        setUserData({
          display_name: 'John Doe',
          email: 'john@example.com',
          created_at: new Date().toISOString(),
        });
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);


  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchUserStats();
        setStats(data);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    }

    loadStats();
  }, []);


  if (isLoading || isLoadingStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Activity className="w-6 h-6 text-gray-700" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {stats?.total_imports || 0}
            </h3>
            <p className="text-sm text-gray-600">Total Imports</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-gray-700" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {stats?.successful_imports || 0}
            </h3>
            <p className="text-sm text-gray-600">Successful Imports</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-gray-700" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {stats?.designs_uploaded || 0}
            </h3>
            <p className="text-sm text-gray-600">Designs Uploaded</p>
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/profile/presets" className="h-full">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="p-6 h-full flex items-center">
              <div className="flex items-center gap-4 w-full">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-6 h-6 text-gray-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">My Presets</h3>
                  <p className="text-sm text-gray-600">Manage design placement configurations</p>
                </div>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/profile/settings" className="h-full">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <div className="p-6 h-full flex items-center">
              <div className="flex items-center gap-4 w-full">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Settings className="w-6 h-6 text-gray-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                  <p className="text-sm text-gray-600">Update your profile information</p>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </div>

    </div>
  );
}
