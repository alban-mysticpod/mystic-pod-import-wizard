'use client';

import { UserProfile } from './UserProfile';

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
}

export function Header({ userName, userEmail, avatarUrl }: HeaderProps) {
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
          <UserProfile 
            userName={userName}
            userEmail={userEmail}
            avatarUrl={avatarUrl}
          />
        </div>
      </div>
    </header>
  );
}

