'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PresetModal } from '@/components/PresetModal';
import { TokenModal } from '@/components/TokenModal';
import { EditTokenModal } from '@/components/EditTokenModal';
import { ConnectShopModal } from '@/components/ConnectShopModal';
import { EditShopModal } from '@/components/EditShopModal';
import { ApiToken, Store } from '@/types';
import { Key, Plus, Trash2, Layers, Star, Edit2, Store as StoreIcon } from 'lucide-react';

interface Preset {
  id: string;
  name: string;
  blueprint_id: number;
  print_provider_id: number;
  favorite: boolean;
  created_at: string;
}

export default function SettingsPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [deletingTokenId, setDeletingTokenId] = useState<string | null>(null);
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);
  const [deletingStoreId, setDeletingStoreId] = useState<string | null>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isEditTokenModalOpen, setIsEditTokenModalOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<ApiToken | null>(null);
  const [isConnectShopModalOpen, setIsConnectShopModalOpen] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<'printify' | 'shopify'>('printify');
  const [isEditShopModalOpen, setIsEditShopModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Store | null>(null);

  useEffect(() => {
    async function loadTokens() {
      try {
        const { getUserId } = await import('@/lib/user');
        const userId = getUserId();
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

  useEffect(() => {
    async function loadPresets() {
      try {
        const response = await fetch('/api/presets');
        if (response.ok) {
          const data = await response.json();
          setPresets(data.presets || []);
        }
      } catch (error) {
        console.error('Error loading presets:', error);
      } finally {
        setIsLoadingPresets(false);
      }
    }

    loadPresets();
  }, []);

  useEffect(() => {
    async function loadStores() {
      try {
        const { getUserId } = await import('@/lib/user');
        const userId = getUserId();
        const response = await fetch(`/api/user/stores?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setStores(data || []);
        }
      } catch (error) {
        console.error('Error loading stores:', error);
      } finally {
        setIsLoadingStores(false);
      }
    }

    loadStores();
  }, []);

  const loadTokens = async () => {
    setIsLoadingTokens(true);
    try {
      const { getUserId } = await import('@/lib/user');
      const userId = getUserId();
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
  };

  const handleDeleteToken = async (tokenId: string) => {
    // Check if any shops are using this token
    const shopsUsingToken = stores.filter(s => s.api_token === tokenId);
    
    if (shopsUsingToken.length > 0) {
      alert(`Cannot delete this token: ${shopsUsingToken.length} shop(s) are using it. Please delete or reassign the shops first.`);
      return;
    }

    if (!confirm('Are you sure you want to delete this API token?')) {
      return;
    }

    setDeletingTokenId(tokenId);
    try {
      const { getUserId } = await import('@/lib/user');
      const userId = getUserId();

      const response = await fetch(`/api/user/tokens?userId=${userId}&tokenId=${tokenId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadTokens();
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

  const handleTokenAdded = async () => {
    // Reload tokens after adding a new one
    await loadTokens();
  };

  const handleEditToken = (token: ApiToken) => {
    setEditingToken(token);
    setIsEditTokenModalOpen(true);
  };

  const handleTokenUpdated = async () => {
    // Reload tokens after updating
    await loadTokens();
    setEditingToken(null);
  };

  const loadStores = async () => {
    setIsLoadingStores(true);
    try {
      const { getUserId } = await import('@/lib/user');
      const userId = getUserId();
      const response = await fetch(`/api/user/stores?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setStores(data || []);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setIsLoadingStores(false);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('Are you sure you want to delete this shop?')) {
      return;
    }

    setDeletingStoreId(storeId);
    try {
      const { getUserId } = await import('@/lib/user');
      const userId = getUserId();
      const response = await fetch(`/api/user/stores?userId=${userId}&storeId=${storeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload stores to get updated list (with auto-promoted default if needed)
        await loadStores();
      } else {
        alert('Failed to delete shop');
      }
    } catch (error) {
      console.error('Error deleting shop:', error);
      alert('Failed to delete shop');
    } finally {
      setDeletingStoreId(null);
    }
  };

  const handleShopConnected = async () => {
    // Reload stores and tokens after connecting a new shop
    // (tokens are reloaded because a new token may have been created)
    await Promise.all([loadStores(), loadTokens()]);
  };

  const handleEditShop = (shop: Store) => {
    setEditingShop(shop);
    setIsEditShopModalOpen(true);
  };

  const handleShopUpdated = async () => {
    // Reload stores after updating
    await loadStores();
    setEditingShop(null);
  };

  const handleDeletePreset = async (presetId: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) {
      return;
    }

    setDeletingPresetId(presetId);
    try {
      const response = await fetch(`/api/presets?id=${presetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPresets(presets.filter(p => p.id !== presetId));
      } else {
        alert('Failed to delete preset');
      }
    } catch (error) {
      console.error('Error deleting preset:', error);
      alert('Failed to delete preset');
    } finally {
      setDeletingPresetId(null);
    }
  };

  const handleCreatePreset = () => {
    setEditingPreset(null);
    setIsPresetModalOpen(true);
  };

  const handleEditPreset = (preset: Preset) => {
    setEditingPreset(preset);
    setIsPresetModalOpen(true);
  };

  const handleSavePreset = async (presetData: {
    name: string;
    blueprint_id: number;
    print_provider_id: number;
    placements: Record<string, any>;
  }) => {
    try {
      if (editingPreset) {
        // Update existing preset
        const response = await fetch('/api/presets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingPreset.id,
            ...presetData,
          }),
        });

        if (!response.ok) throw new Error('Failed to update preset');
      } else {
        // Create new preset
        const response = await fetch('/api/presets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(presetData),
        });

        if (!response.ok) throw new Error('Failed to create preset');
      }

      // Reload presets
      const response = await fetch('/api/presets');
      if (response.ok) {
        const data = await response.json();
        setPresets(data.presets || []);
      }
    } catch (error) {
      console.error('Error saving preset:', error);
      throw error;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your presets and API connections</p>
      </div>

      {/* My Presets Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5" />
                My Presets
              </h2>
              <p className="text-sm text-gray-600 mt-1">Manage your design placement configurations</p>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="inline-flex items-center gap-2"
              onClick={handleCreatePreset}
            >
              <Plus className="w-4 h-4" />
              Create Preset
            </Button>
          </div>

          {isLoadingPresets ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : presets.length > 0 ? (
            <div className="space-y-3">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{preset.name}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Blueprint: {preset.blueprint_id} • Provider: {preset.print_provider_id}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {formatDate(preset.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditPreset(preset)}
                      className="text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeletePreset(preset.id)}
                      disabled={deletingPresetId === preset.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingPresetId === preset.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Layers className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No presets configured</p>
              <p className="text-sm text-gray-400 mt-1">Create a preset to save your configuration</p>
            </div>
          )}
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
            <Button 
              variant="secondary" 
              size="sm" 
              className="inline-flex items-center gap-2"
              onClick={() => setIsTokenModalOpen(true)}
            >
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
                      <span className="font-medium text-gray-900">
                        {token.name || 'Unnamed Token'}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Active</span>
                    </div>
                    <p className="text-xs text-gray-500 capitalize mb-1">Provider: {token.provider}</p>
                    <p className="text-sm text-gray-600 font-mono">{maskToken(token.token_ref)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Used by: {stores.filter(s => s.api_token === token.id).length} shops
                      {' • '}
                      Created: {formatDate(token.created_at)}
                      {token.last_used_at && ` • Last used: ${formatDate(token.last_used_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditToken(token)}
                      className="text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
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

      {/* Printify Shops Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <StoreIcon className="w-5 h-5" />
                Printify Shops
              </h2>
              <p className="text-sm text-gray-600 mt-1">Manage your Printify stores</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setConnectingProvider('printify');
                setIsConnectShopModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Connect Shop
            </Button>
          </div>

          {isLoadingStores ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : stores.filter(s => s.provider === 'printify').length > 0 ? (
            <div className="space-y-3">
              {stores.filter(s => s.provider === 'printify').map((store) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {store.name}
                      </span>
                      {store.is_default && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" title="Default shop" />
                      )}
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Active</span>
                    </div>
                    <p className="text-sm text-gray-600">Store ID: {store.shop_id}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {formatDate(store.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditShop(store)}
                      className="text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeleteStore(store.id)}
                      disabled={deletingStoreId === store.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingStoreId === store.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <StoreIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No Printify shops connected</p>
              <p className="text-sm text-gray-400 mt-1">Click "Connect Shop" to get started</p>
            </div>
          )}
        </div>
      </Card>

      {/* Shopify Shops Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <StoreIcon className="w-5 h-5" />
                Shopify Shops
              </h2>
              <p className="text-sm text-gray-600 mt-1">Manage your Shopify stores</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setConnectingProvider('shopify');
                setIsConnectShopModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Connect Shop
            </Button>
          </div>

          {isLoadingStores ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : stores.filter(s => s.provider === 'shopify').length > 0 ? (
            <div className="space-y-3">
              {stores.filter(s => s.provider === 'shopify').map((store) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {store.name}
                      </span>
                      {store.is_default && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" title="Default shop" />
                      )}
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Active</span>
                    </div>
                    <p className="text-sm text-gray-600">Store ID: {store.shop_id}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {formatDate(store.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditShop(store)}
                      className="text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeleteStore(store.id)}
                      disabled={deletingStoreId === store.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingStoreId === store.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <StoreIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No Shopify shops connected</p>
              <p className="text-sm text-gray-400 mt-1">Click "Connect Shop" to get started</p>
            </div>
          )}
        </div>
      </Card>

      {/* Preset Modal */}
      <PresetModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        onSave={handleSavePreset}
        preset={editingPreset}
      />

      {/* Token Modal */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onTokenAdded={handleTokenAdded}
      />

      {/* Edit Token Modal */}
      {editingToken && (
        <EditTokenModal
          isOpen={isEditTokenModalOpen}
          onClose={() => {
            setIsEditTokenModalOpen(false);
            setEditingToken(null);
          }}
          token={editingToken}
          onTokenUpdated={handleTokenUpdated}
        />
      )}

      {/* Connect Shop Modal */}
      <ConnectShopModal
        isOpen={isConnectShopModalOpen}
        onClose={() => setIsConnectShopModalOpen(false)}
        provider={connectingProvider}
        onShopConnected={handleShopConnected}
        existingShopsCount={stores.filter(s => s.provider === connectingProvider).length}
      />

      {/* Edit Shop Modal */}
      {editingShop && (
        <EditShopModal
          isOpen={isEditShopModalOpen}
          onClose={() => {
            setIsEditShopModalOpen(false);
            setEditingShop(null);
          }}
          shop={editingShop}
          onShopUpdated={handleShopUpdated}
          isOnlyShopOfType={stores.filter(s => s.provider === editingShop.provider).length === 1}
        />
      )}
    </div>
  );
}
