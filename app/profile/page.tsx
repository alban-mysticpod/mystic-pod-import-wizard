'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { User, Mail, Key, Save, Upload, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
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
