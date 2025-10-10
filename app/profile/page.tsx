'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { ArrowLeft, Settings, Mail, Calendar, Package, Key, Trash2, Plus, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [deletingTokenId, setDeletingTokenId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user profile
        const profileResponse = await fetch('/api/user/profile?userId=user_test');
        const profileData = await profileResponse.json();
        setUserData(profileData);

        // Fetch API tokens
        const tokensResponse = await fetch('/api/user/tokens?userId=user_test&provider=printify');
        const tokensData = await tokensResponse.json();
        setTokens(tokensData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingTokens(false);
      }
    }
    fetchData();
  }, []);

  const handleDeleteToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to delete this token?')) {
      return;
    }

    setDeletingTokenId(tokenId);
    try {
      const response = await fetch('/api/user/tokens', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete token');
      }

      // Remove token from state
      setTokens(tokens.filter(t => t.id !== tokenId));
    } catch (error) {
      console.error('Error deleting token:', error);
      alert('Failed to delete token. Please try again.');
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

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-16 py-12 px-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  const displayName = userData?.display_name || 'User';
  const email = userData?.email || 'user@example.com';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const memberSince = userData?.created_at 
    ? new Date(userData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-16 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Wizard</span>
            </Link>
          </div>

          {/* Profile Header */}
          <Card className="mb-6">
            <div className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                {userData?.avatar_url ? (
                  <img
                    src={userData.avatar_url}
                    alt={displayName}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl border-4 border-white shadow-xl">
                    {initials}
                  </div>
                )}

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
                  <p className="text-gray-600 mb-4 flex items-center justify-center md:justify-start gap-2">
                    <Mail className="w-4 h-4" />
                    {email}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center justify-center md:justify-start gap-2">
                    <Calendar className="w-4 h-4" />
                    Member since {memberSince}
                  </p>
                </div>

                {/* Settings Button */}
                <Link href="/profile/settings">
                  <Button variant="secondary" className="inline-flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* API Tokens Section */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Printify API Tokens
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage your saved Printify API tokens
                  </p>
                </div>
                <Link href="/">
                  <Button variant="primary" size="sm" className="inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Token
                  </Button>
                </Link>
              </div>

              {isLoadingTokens ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading tokens...</p>
                </div>
              ) : tokens.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No Printify tokens saved yet</p>
                  <Link href="/">
                    <Button variant="primary" size="sm">
                      Add Your First Token
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {tokens.map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="font-medium text-gray-900">
                            Printify Token
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 font-mono">
                          {maskToken(token.token_ref)}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Added: {formatDate(token.created_at)}</span>
                          {token.last_used_at && (
                            <span>Last used: {formatDate(token.last_used_at)}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteToken(token.id)}
                        loading={deletingTokenId === token.id}
                        className="text-red-600 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <div className="p-6 text-center">
                <Package className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <p className="text-3xl font-bold text-gray-900 mb-1">0</p>
                <p className="text-sm text-gray-600">Total Imports</p>
              </div>
            </Card>

            <Card>
              <div className="p-6 text-center">
                <Package className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <p className="text-3xl font-bold text-gray-900 mb-1">0</p>
                <p className="text-sm text-gray-600">Successful</p>
              </div>
            </Card>

            <Card>
              <div className="p-6 text-center">
                <Package className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <p className="text-3xl font-bold text-gray-900 mb-1">0</p>
                <p className="text-sm text-gray-600">Designs Uploaded</p>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No activity yet</p>
                <Link href="/">
                  <Button variant="primary">Start Your First Import</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
