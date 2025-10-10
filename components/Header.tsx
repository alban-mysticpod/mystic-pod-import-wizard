'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from './UserProfile';

export function Header() {
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch user profile from Supabase
    async function fetchUserProfile() {
      try {
        const response = await fetch('/api/user/profile?userId=user_test');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        
        setUserName(data.display_name || 'User');
        setUserEmail(data.email || 'user@example.com');
        setAvatarUrl(data.avatar_url || undefined);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Keep default values on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserProfile();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Mystic POD
            </h1>
          </div>

          {/* User Profile */}
          {!isLoading && (
            <UserProfile 
              userName={userName}
              userEmail={userEmail}
              avatarUrl={avatarUrl}
            />
          )}
        </div>
      </div>
    </header>
  );
}
