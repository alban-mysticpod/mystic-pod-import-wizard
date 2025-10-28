'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { X } from 'lucide-react';

interface Shop {
  id: string | number;
  title: string;
}

interface ConnectShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: 'printify' | 'shopify';
  onShopConnected: () => void;
  existingShopsCount: number; // Number of existing shops for this provider
}

enum ModalStep {
  ENTER_TOKEN = 'enter_token',
  SELECT_SHOP = 'select_shop',
}

export function ConnectShopModal({ 
  isOpen, 
  onClose, 
  provider, 
  onShopConnected,
  existingShopsCount,
}: ConnectShopModalProps) {
  const [step, setStep] = useState<ModalStep>(ModalStep.ENTER_TOKEN);
  const [apiToken, setApiToken] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [apiTokenId, setApiTokenId] = useState('');
  const [availableShops, setAvailableShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const isFirstShop = existingShopsCount === 0;
  const [isDefault, setIsDefault] = useState(isFirstShop);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(ModalStep.ENTER_TOKEN);
      setApiToken('');
      setTokenName('');
      setApiTokenId('');
      setAvailableShops([]);
      setSelectedShopId(null);
      setIsDefault(isFirstShop);
      setError('');
    }
  }, [isOpen, isFirstShop]);

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleValidateToken = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { getUserId } = await import('@/lib/user');
      const userId = getUserId();

      const response = await fetch('/api/user/stores/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiToken,
          tokenName: tokenName.trim() || null,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to validate token');
        return;
      }

      const data = await response.json();
      
      if (!data.shops || data.shops.length === 0) {
        setError('No shops found for this account');
        return;
      }

      setApiTokenId(data.apiTokenId);
      setAvailableShops(data.shops);
      setStep(ModalStep.SELECT_SHOP);
    } catch (err) {
      console.error('Error validating token:', err);
      setError('Failed to validate token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveShop = async () => {
    if (!selectedShopId) {
      setError('Please select a shop');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { getUserId } = await import('@/lib/user');
      const userId = getUserId();

      const selectedShop = availableShops.find(
        (s) => String(s.id) === String(selectedShopId)
      );

      if (!selectedShop) {
        setError('Selected shop not found');
        return;
      }

      const response = await fetch('/api/user/stores/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          provider,
          name: selectedShop.title,
          store_id: String(selectedShop.id),
          api_token_id: apiTokenId,
          is_default: isDefault || isFirstShop,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to connect shop');
        return;
      }

      // Success!
      onShopConnected();
      handleClose();
    } catch (err) {
      console.error('Error saving shop:', err);
      setError('Failed to connect shop');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Connect {provider === 'printify' ? 'Printify' : 'Shopify'} Shop
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Step 1: Enter Token */}
          {step === ModalStep.ENTER_TOKEN && (
            <form onSubmit={handleValidateToken} className="space-y-4">
              <Input
                label="Token Name"
                id="tokenName"
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder={`e.g., My ${provider === 'printify' ? 'Printify' : 'Shopify'} Account`}
                helperText="Give this token a memorable name to identify it later"
                required
              />

              <Input
                label={`${provider === 'printify' ? 'Printify' : 'Shopify'} API Token`}
                id="apiToken"
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Enter your API token"
                required
              />

              <p className="text-sm text-gray-500">
                Get your API token from{' '}
                {provider === 'printify' ? (
                  <a
                    href="https://printify.com/app/account/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Printify Settings → Connections → API
                  </a>
                ) : (
                  <a
                    href="https://admin.shopify.com/settings/apps/development"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Shopify Admin → Apps → Develop apps
                  </a>
                )}
              </p>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isLoading}>
                  Continue
                </Button>
              </div>
            </form>
          )}

          {/* Step 2: Select Shop */}
          {step === ModalStep.SELECT_SHOP && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a Shop
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose which shop you want to connect
                </p>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {availableShops.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => setSelectedShopId(String(shop.id))}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      String(selectedShopId) === String(shop.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{shop.title}</p>
                        <p className="text-sm text-gray-500">Shop ID: {shop.id}</p>
                      </div>
                      {String(selectedShopId) === String(shop.id) && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Set as Default Checkbox */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    disabled={isFirstShop}
                    className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5 ${
                      isFirstShop ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                  <div className="ml-2">
                    <label
                      htmlFor="isDefault"
                      className={`text-sm font-medium text-gray-900 ${
                        isFirstShop ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                      }`}
                    >
                      Set as default shop
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      {isFirstShop ? (
                        <>
                          This will be your first {provider} shop and will be set as default
                          automatically.
                        </>
                      ) : (
                        <>This shop will be used by default for imports.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setStep(ModalStep.ENTER_TOKEN)}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSaveShop}
                  disabled={!selectedShopId || isLoading}
                  loading={isLoading}
                >
                  Connect Shop
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

