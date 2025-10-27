'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Settings, Key, Trash2, Plus, CheckCircle, XCircle, Layers, Activity, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { fetchUserStats, UserStats } from '@/lib/api';

interface ApiToken {
  id: string;
  provider: 'printify' | 'shopify';
  token_ref: string;
  created_at: string;
  last_used_at: string | null;
}

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [deletingTokenId, setDeletingTokenId] = useState<string | null>(null);

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
    async function loadTokens() {
      try {
        const userId = 'user-123'; // TODO: Get from auth
        const response = await fetch(`/api/user/tokens?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setTokens(data);
        }
      } catch (error) {
        console.error('Error loading tokens:', error);
      } finally {
        setIsLoadingTokens(false);
      }
    }

    loadTokens();
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

  const handleDeleteToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to delete this API token?')) {
      return;
    }

    setDeletingTokenId(tokenId);
    try {
      const userId = 'user-123'; // TODO: Get from auth
      const response = await fetch(`/api/user/tokens?userId=${userId}&tokenId=${tokenId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTokens(tokens.filter(t => t.id !== tokenId));
      } else {
        alert('Failed to delete token');
      }
    } catch (error) {
      console.error('Error deleting token:', error);
      alert('Failed to delete token');
    } finally {
      setDeletingTokenId(null);
    }
  };

  const maskToken = (token: string) => {
    if (token.length < 20) return token;
    return `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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

      {/* API Tokens Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Tokens
              </h2>
              <p className="text-sm text-gray-600 mt-1">Manage your connected services</p>
            </div>
            <Button variant="secondary" size="sm" className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Token
            </Button>
          </div>

          {isLoadingTokens ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : tokens.length > 0 ? (
            <div className="space-y-3">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 capitalize">{token.provider}</span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Active</span>
                    </div>
                    <p className="text-sm text-gray-600 font-mono">{maskToken(token.token_ref)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {formatDate(token.created_at)}
                      {token.last_used_at && ` • Last used: ${formatDate(token.last_used_at)}`}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDeleteToken(token.id)}
                    disabled={deletingTokenId === token.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingTokenId === token.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Key className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No API tokens configured</p>
              <p className="text-sm text-gray-400 mt-1">Add a token to get started</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
