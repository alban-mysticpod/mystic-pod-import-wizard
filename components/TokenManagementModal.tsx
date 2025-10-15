'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { ApiToken } from '@/types';
import { X, Plus, Trash2, ExternalLink, Key } from 'lucide-react';
import { getUserId } from '@/lib/user';

interface TokenManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: string) => void;
  currentTokens: ApiToken[];
  onTokensUpdated: (tokens: ApiToken[]) => void;
}

export function TokenManagementModal({ 
  isOpen, 
  onClose, 
  onSelectToken, 
  currentTokens, 
  onTokensUpdated 
}: TokenManagementModalProps) {
  const [tokens, setTokens] = useState<ApiToken[]>(currentTokens);
  const [newToken, setNewToken] = useState('');
  const [newTokenName, setNewTokenName] = useState('');
  const [isAddingToken, setIsAddingToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingTokenId, setDeletingTokenId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setTokens(currentTokens);
  }, [currentTokens]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAddToken = async () => {
    if (!newToken.trim()) {
      setError('Please enter a token');
      return;
    }

    if (newToken.length < 10) {
      setError('Token seems too short');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const userId = getUserId();
      const response = await fetch('/api/user/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          provider: 'printify',
          tokenRef: newToken,
          name: newTokenName.trim() || `Printify Token ${tokens.length + 1}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save token');
      }

      const savedToken = await response.json();
      const updatedTokens = [savedToken, ...tokens];
      setTokens(updatedTokens);
      onTokensUpdated(updatedTokens);
      setNewToken('');
      setNewTokenName('');
      setIsAddingToken(false);
    } catch (err) {
      console.error('Failed to save token:', err);
      setError(err instanceof Error ? err.message : 'Failed to save token');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    setDeletingTokenId(tokenId);
    try {
      const userId = getUserId();
      const response = await fetch(`/api/user/tokens/${tokenId}?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete token');
      }

      const updatedTokens = tokens.filter(t => t.id !== tokenId);
      setTokens(updatedTokens);
      onTokensUpdated(updatedTokens);
    } catch (err) {
      console.error('Failed to delete token:', err);
      setError('Failed to delete token');
    } finally {
      setDeletingTokenId(null);
    }
  };

  const handleSelectToken = (token: string) => {
    onSelectToken(token);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Manage Printify Tokens</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Existing Tokens */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Saved Tokens</h3>
            
            {tokens.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Key className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No saved tokens yet</p>
                <p className="text-sm">Add a token below to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Key className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {token.name || 'Printify Token'}
                          </p>
                          <p className="font-mono text-sm text-gray-500">
                            {token.token_ref.substring(0, 10)}...{token.token_ref.substring(token.token_ref.length - 10)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Added: {new Date(token.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleSelectToken(token.token_ref)}
                        variant="primary"
                        size="sm"
                      >
                        Select
                      </Button>
                      <Button
                        onClick={() => handleDeleteToken(token.id)}
                        loading={deletingTokenId === token.id}
                        disabled={deletingTokenId === token.id}
                        variant="secondary"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Add New Token */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Token</h3>
              {!isAddingToken && (
                <Button
                  onClick={() => setIsAddingToken(true)}
                  variant="secondary"
                  size="sm"
                  className="inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Token
                </Button>
              )}
            </div>

            {isAddingToken && (
              <Card className="p-4">
                <div className="space-y-4">
                  <Input
                    label="Token Name (Optional)"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="e.g., Main Account, Secondary Store..."
                  />
                  
                  <Input
                    label="Printify API Token"
                    type="password"
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    placeholder="Enter your Printify API token"
                    error={error}
                  />
                  
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
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={handleAddToken}
                      loading={isSaving}
                      disabled={!newToken.trim() || isSaving}
                      variant="primary"
                    >
                      Save Token
                    </Button>
                    <Button
                      onClick={() => {
                        setIsAddingToken(false);
                        setNewToken('');
                        setNewTokenName('');
                        setError('');
                      }}
                      variant="secondary"
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
