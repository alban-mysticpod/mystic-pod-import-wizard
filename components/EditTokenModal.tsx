'use client';

import { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { X, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { ApiToken } from '@/types';

interface EditTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: ApiToken;
  onTokenUpdated: () => void;
}

export function EditTokenModal({ isOpen, onClose, token, onTokenUpdated }: EditTokenModalProps) {
  const [name, setName] = useState(token.name || '');
  const [apiToken, setApiToken] = useState(token.token_ref);
  const [isDefault, setIsDefault] = useState(token.is_default || false);
  const [showToken, setShowToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Token name is required');
      return;
    }

    if (!apiToken.trim()) {
      setError('API token is required');
      return;
    }

    if (apiToken.length < 10) {
      setError('API token seems too short');
      return;
    }

    setIsSubmitting(true);

    try {
      const { getUserId } = await import('@/lib/user');
      const userId = getUserId();

      // Call API to update token
      const response = await fetch('/api/user/tokens', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: token.id,
          userId,
          name,
          token_ref: apiToken,
          is_default: isDefault,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update token');
      }

      // Success
      onTokenUpdated();
      onClose();
    } catch (err) {
      console.error('Error updating token:', err);
      setError(err instanceof Error ? err.message : 'Failed to update token');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError('');
    setName(token.name || '');
    setApiToken(token.token_ref);
    setIsDefault(token.is_default || false);
    setShowToken(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Edit API Token</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Provider (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Provider
              </label>
              <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg">
                <p className="font-medium text-gray-900 capitalize">{token.provider}</p>
              </div>
            </div>

            {/* Token Name */}
            <Input
              label="Token Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Printify Store, Production Account"
              helperText="Give this token a memorable name to identify it later"
              required
            />

            {/* Token Input */}
            <Input
              label={`${token.provider === 'printify' ? 'Printify' : 'Shopify'} API Token`}
              type={showToken ? 'text' : 'password'}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Enter your API token"
              required
            />

            {/* Show Token Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showToken"
                checked={showToken}
                onChange={(e) => setShowToken(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="showToken" className="ml-2 text-sm text-gray-700 flex items-center cursor-pointer">
                {showToken ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-1" />
                    Hide token
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    Show token
                  </>
                )}
              </label>
            </div>

            {/* Set as Default Checkbox */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5"
                />
                <div className="ml-2">
                  <label htmlFor="isDefault" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Set as default token
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Only one token can be default per provider. Setting this will unset other defaults.
                  </p>
                </div>
              </div>
            </div>

            {/* Help Text */}
            {token.provider === 'printify' && (
              <div className="text-sm text-gray-500">
                <p>
                  Get your API token from{' '}
                  <a
                    href="https://printify.com/app/account/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 inline-flex items-center"
                  >
                    Printify Settings
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                onClick={handleClose}
                variant="secondary"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!name.trim() || !apiToken.trim() || isSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

