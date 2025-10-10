'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

interface UserProfileProps {
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
}

export function UserProfile({ 
  userName = 'User', 
  userEmail = 'user@example.com',
  avatarUrl 
}: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200">
              {getInitials(userName)}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">{userName}</span>
          <span className="text-xs text-gray-500">{userEmail}</span>
        </div>

        {/* Chevron */}
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info in Dropdown (mobile) */}
          <div className="md:hidden px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">{userEmail}</p>
          </div>

          {/* Menu Items */}
          <Link
            href="/profile/settings"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Settings</p>
              <p className="text-xs text-gray-500">Manage your account</p>
            </div>
          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <User className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Profile</p>
              <p className="text-xs text-gray-500">View your profile</p>
            </div>
          </Link>

          <div className="border-t border-gray-100 my-2"></div>

          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left"
            onClick={() => {
              setIsOpen(false);
              // TODO: Implement logout logic
              console.log('Logout clicked');
            }}
          >
            <LogOut className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-600">Log out</p>
              <p className="text-xs text-gray-500">Sign out of your account</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

