'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { verifyPrintifyToken } from '@/lib/api';
import { getUserId } from '@/lib/user';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenAdded: () => void;
}

export function TokenModal({ isOpen, onClose, onTokenAdded }: TokenModalProps) {
  const [provider, setProvider] = useState<'printify' | 'shopify'>('printify');
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setToken('');
      setError('');
      setProvider('printify');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('API token is required');
      return;
    }

    setIsValidating(true);
    try {
      const userId = getUserId();
      
      if (provider === 'printify') {
        // Validate Printify token (without importId for settings context)
        await verifyPrintifyToken(token, userId);
      } else {
        // TODO: Add Shopify validation
        throw new Error('Shopify integration coming soon');
      }

      // Success - reload tokens and close modal
      onTokenAdded();
      onClose();
    } catch (err) {
      console.error('Error validating token:', err);
      setError(err instanceof Error ? err.message : 'Failed to validate token');
    } finally {
      setIsValidating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Add API Token
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProvider('printify')}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    provider === 'printify'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">Printify</p>
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('shopify')}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    provider === 'shopify'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled
                >
                  <p className="font-medium text-gray-400">Shopify</p>
                  <p className="text-xs text-gray-400">Coming soon</p>
                </button>
              </div>
            </div>

            {/* Token Input */}
            <Input
              label={`${provider === 'printify' ? 'Printify' : 'Shopify'} API Token`}
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your API token"
              required
            />

            {/* Helper Text */}
            <div className="text-sm text-gray-500">
              {provider === 'printify' ? (
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
              ) : (
                <p>Shopify integration coming soon</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isValidating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isValidating}
                disabled={!token.trim() || isValidating}
              >
                Add Token
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

