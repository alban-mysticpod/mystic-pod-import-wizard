'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { User, Mail, Key, Save, Upload, CheckCircle, Plus, Trash2 } from 'lucide-react';

interface ApiToken {
  id: string;
  provider: 'printify' | 'shopify';
  token_ref: string;
  created_at: string;
  last_used_at: string | null;
}

export default function ProfileSettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [deletingTokenId, setDeletingTokenId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Fetch user profile
    async function fetchProfile() {
      try {
        const response = await fetch('/api/user/profile?userId=user_test');
        const data = await response.json();
        
        setFormData({
          name: data.display_name || '',
          email: data.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
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

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user_test',
          display_name: formData.name,
          email: formData.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setSaveSuccess(true);
      setIsEditing(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const initials = formData.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800 font-medium">Profile updated successfully!</p>
        </div>
      )}

      {/* Profile Picture Section */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Picture</h2>
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg">
              {initials}
            </div>
            
            {/* Upload Button */}
            <div>
              <Button variant="secondary" className="inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload new picture
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            {!isEditing && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter your email"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 mt-6">
              <Button
                variant="primary"
                onClick={handleSave}
                loading={isSaving}
                className="inline-flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Password Section */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            <Key className="w-5 h-5 inline mr-2" />
            Change Password
          </h2>

          <div className="space-y-4">
            <Input
              type="password"
              label="Current Password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              placeholder="Enter current password"
            />

            <Input
              type="password"
              label="New Password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="Enter new password"
            />

            <Input
              type="password"
              label="Confirm New Password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
            />

            <Button variant="primary" className="mt-4">
              Update Password
            </Button>
          </div>
        </div>
      </Card>

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

      {/* Danger Zone */}
      <Card className="border-red-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Danger Zone</h2>
          <p className="text-gray-600 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="secondary" className="text-red-600 border-red-300 hover:bg-red-50">
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
}
