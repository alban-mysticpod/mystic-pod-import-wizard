'use client';

import { useState, useEffect } from 'react';
import { Store as StoreIcon, ChevronDown, Check } from 'lucide-react';
import { Store } from '@/types';

interface ShopSelectorProps {
  provider: 'printify' | 'shopify';
  disabled?: boolean;
  onShopChange?: (shopId: string) => void;
}

export function ShopSelector({ provider, disabled = false, onShopChange }: ShopSelectorProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStores();
  }, [provider]);

  const loadStores = async () => {
    setIsLoading(true);
    try {
      const { getUserId } = await import('@/lib/user');
      const userId = getUserId();
      const response = await fetch(`/api/user/stores?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const providerStores = data.filter((s: Store) => s.provider === provider);
        setStores(providerStores);
        
        // Set the default store as selected
        const defaultStore = providerStores.find((s: Store) => s.is_default);
        if (defaultStore) {
          setSelectedStore(defaultStore);
        } else if (providerStores.length > 0) {
          setSelectedStore(providerStores[0]);
        }
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStore = (store: Store) => {
    setSelectedStore(store);
    setIsOpen(false);
    if (onShopChange) {
      onShopChange(store.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
        <StoreIcon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <StoreIcon className="w-4 h-4 text-yellow-600" />
        <span className="text-sm text-yellow-700">No {provider} shop connected</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
          disabled
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
            : 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
        }`}
      >
        <StoreIcon className={`w-4 h-4 ${disabled ? 'text-gray-400' : 'text-blue-600'}`} />
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500 capitalize">{provider}</span>
          <span className={`text-sm font-medium ${disabled ? 'text-gray-500' : 'text-gray-900'}`}>
            {selectedStore ? selectedStore.name : 'Select shop'}
          </span>
        </div>
        {!disabled && stores.length > 1 && (
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => handleSelectStore(store)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors ${
                  selectedStore?.id === store.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900">{store.name}</span>
                  <span className="text-xs text-gray-500">Shop ID: {store.shop_id}</span>
                </div>
                {selectedStore?.id === store.id && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

