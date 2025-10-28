'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { X } from 'lucide-react';
import { Store } from '@/types';

interface EditShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Store;
  onShopUpdated: () => void;
  isOnlyShopOfType: boolean;
}

export function EditShopModal({
  isOpen,
  onClose,
  shop,
  onShopUpdated,
  isOnlyShopOfType,
}: EditShopModalProps) {
  const [name, setName] = useState(shop.name);
  const [isDefault, setIsDefault] = useState(isOnlyShopOfType ? true : shop.is_default);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset state when shop or modal state changes
  useEffect(() => {
    setName(shop.name);
    setIsDefault(isOnlyShopOfType ? true : shop.is_default);
    setError('');
  }, [shop, isOnlyShopOfType, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Shop name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const { getUserId } = await import('@/lib/user');
      const userId = getUserId();

      const response = await fetch('/api/user/stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: shop.id,
          userId,
          provider: shop.provider,
          name: name.trim(),
          is_default: isDefault,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update shop');
        return;
      }

      onShopUpdated();
      handleClose();
    } catch (err) {
      console.error('Error updating shop:', err);
      setError('Failed to update shop');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError('');
    setName(shop.name);
    setIsDefault(isOnlyShopOfType ? true : shop.is_default);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Shop</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 capitalize">
              {shop.provider}
            </div>
            <p className="text-xs text-gray-500 mt-1">Provider cannot be changed</p>
          </div>

          <Input
            label="Shop Name"
            id="shopName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter shop name"
            required
          />

          {/* Set as Default Checkbox */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                disabled={isOnlyShopOfType}
                className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5 ${
                  isOnlyShopOfType ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
              <div className="ml-2">
                <label
                  htmlFor="isDefault"
                  className={`text-sm font-medium text-gray-900 ${
                    isOnlyShopOfType ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                  }`}
                >
                  Set as default shop
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {isOnlyShopOfType ? (
                    <>
                      This shop is automatically set as default because it's the only{' '}
                      {shop.provider} shop.
                    </>
                  ) : (
                    <>
                      Only one shop can be default per provider. Setting this will unset other
                      defaults.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

