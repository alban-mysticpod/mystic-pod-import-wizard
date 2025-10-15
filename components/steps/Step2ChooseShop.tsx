'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { verifyPrintifyToken, logPrintifyApiToken, listPrintifyShops, chooseShop } from '@/lib/api';
import { PrintifyShop, ApiToken } from '@/types';
import { Store, CheckCircle, ExternalLink, ArrowLeft, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { getUserId } from '@/lib/user';
import { cn } from '@/lib/utils';

interface Step2Props {
  selectedShopId: number | null;
  importId: string;
  onNext: (data: { apiToken: string; tokenRef: string; shops: PrintifyShop[]; shopId: number }) => void;
  onBack?: () => void;
}

export function Step2ChooseShop({ selectedShopId, importId, onNext, onBack }: Step2Props) {
  const [savedTokens, setSavedTokens] = useState<ApiToken[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [hasConnectedAccount, setHasConnectedAccount] = useState(false);
  
  // Token state
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [newToken, setNewToken] = useState('');
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [tokenError, setTokenError] = useState('');
  
  // Shops state
  const [shops, setShops] = useState<PrintifyShop[]>([]);
  const [tokenRef, setTokenRef] = useState('');
  const [selectedShop, setSelectedShop] = useState<number | null>(selectedShopId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Charger les tokens sauvegardés au montage
  useEffect(() => {
    loadSavedTokens();
  }, []);

  const loadSavedTokens = async () => {
    setIsLoadingTokens(true);
    try {
      const userId = getUserId();
      const response = await fetch(`/api/user/tokens?userId=${userId}&provider=printify`);
      if (!response.ok) {
        throw new Error('Failed to fetch saved tokens');
      }
      const tokens: ApiToken[] = await response.json();
      setSavedTokens(tokens);
      console.log(`✅ Loaded ${tokens.length} saved Printify tokens`);
      
      // Si l'utilisateur a au moins un token, on le considère comme connecté
      if (tokens.length > 0) {
        setHasConnectedAccount(true);
        // Utiliser automatiquement le premier token (le plus récent)
        await validateTokenAndLoadShops(tokens[0].token_ref);
      } else {
        // Pas de tokens, afficher l'interface de connexion
        setHasConnectedAccount(false);
      }
    } catch (err) {
      console.error('❌ Failed to load saved tokens:', err);
      setHasConnectedAccount(false);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const validateTokenAndLoadShops = async (token: string) => {
    setIsValidatingToken(true);
    setTokenError('');
    
    try {
      console.log('🚀 Step 1: Verifying Printify token... importId:', importId);
      
      // Étape 1: Vérifier le token et récupérer le record apiToken
      const tokenRecord = await verifyPrintifyToken(token, importId);
      
      if (!tokenRecord || !tokenRecord.id || !tokenRecord.token_ref) {
        throw new Error('Invalid token verification response');
      }
      
      console.log('✅ Step 1 completed: Token verified, apiToken ID:', tokenRecord.id);
      
      // Étape 2: Logger le token sélectionné
      console.log('🚀 Step 2: Logging selected API token...');
      await logPrintifyApiToken(tokenRecord.id, importId);
      console.log('✅ Step 2 completed: API token logged');
      
      // Étape 3: Lister les shops
      console.log('🚀 Step 3: Loading Printify shops...');
      const shopsResult = await listPrintifyShops(importId);
      
      if (!shopsResult || !Array.isArray(shopsResult.shops)) {
        throw new Error('Invalid shops response');
      }
      
      console.log(`✅ Step 3 completed: Found ${shopsResult.shops.length} shops`);
      
      // Mettre à jour l'état
      setTokenRef(tokenRecord.token_ref);
      setShops(shopsResult.shops);
      setHasConnectedAccount(true);
      setSelectedToken(token);
      setNewToken(''); // Clear the input after successful validation
      
      // Ne plus sélectionner automatiquement même s'il n'y a qu'un seul shop
      // L'utilisateur doit toujours faire le choix explicitement
    } catch (err) {
      console.error('❌ Failed to validate token and load shops:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate token';
      setTokenError(errorMessage);
      setHasConnectedAccount(false);
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleConnectPrintify = async () => {
    if (!newToken.trim()) {
      setTokenError('Please enter your Printify API token');
      return;
    }
    
    if (newToken.length < 10) {
      setTokenError('API token seems too short');
      return;
    }
    
    await validateTokenAndLoadShops(newToken);
  };

  const handleSelectToken = async (token: string) => {
    await validateTokenAndLoadShops(token);
  };

  const handleChangeAccount = () => {
    setShops([]);
    setSelectedShop(null);
    setTokenRef('');
    setSelectedToken(null);
    setHasConnectedAccount(false);
    setNewToken('');
    setTokenError('');
  };


  const handleSelectShop = (shopId: number) => {
    setSelectedShop(shopId);
    setError('');
  };

  const handleNext = async () => {
    if (!selectedShop) {
      setError('Please select a shop');
      return;
    }
    
    if (!tokenRef) {
      setError('No valid token found');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Logger la sélection du shop
      await chooseShop(tokenRef, selectedShop, importId);
      
      // Passer au step suivant
      onNext({
        apiToken: selectedToken || '',
        tokenRef,
        shops,
        shopId: selectedShop,
      });
    } catch (err) {
      console.error('❌ Failed to log shop selection:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to select shop';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingTokens) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your Printify accounts...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
            <Store className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Shop</h2>
            <p className="text-gray-600">Select where to upload your designs</p>
          </div>
        </div>

        {/* Section: Connect Printify (si pas de compte connecté) */}
        {!hasConnectedAccount && (
          <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect Your Printify Account</h3>
            
            {/* Saved Tokens Option */}
            {savedTokens.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">Select a saved account:</p>
                <div className="space-y-2">
                  {savedTokens.map((token) => (
                    <button
                      key={token.id}
                      onClick={() => handleSelectToken(token.token_ref)}
                      disabled={isValidatingToken}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left disabled:opacity-50"
                    >
                      <p className="font-mono text-sm text-gray-800">
                        {token.token_ref.substring(0, 10)}...{token.token_ref.substring(token.token_ref.length - 10)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Added: {new Date(token.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-50 text-gray-500">or</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* New Token Input */}
            <div className="space-y-3">
              <Input
                label="Printify API Token"
                id="apiToken"
                type="password"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                placeholder="Enter your Printify API token"
                error={tokenError}
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
              
              <Button
                onClick={handleConnectPrintify}
                loading={isValidatingToken}
                disabled={!newToken.trim() || isValidatingToken}
                className="w-full"
              >
                Connect Printify Account
              </Button>
            </div>
          </div>
        )}

        {/* Section: Shops List (si compte connecté) */}
        {hasConnectedAccount && shops.length > 0 && (
          <div className="mb-6">
            {/* Option pour changer de compte */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                {shops.length} shop{shops.length !== 1 ? 's' : ''} available
              </p>
              <button
                onClick={handleChangeAccount}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Change Account
              </button>
            </div>

            {/* Grid des shops */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shops.map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => handleSelectShop(shop.id)}
                  className={cn(
                    'p-4 border-2 rounded-lg transition-all hover:shadow-md text-left',
                    selectedShop === shop.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        selectedShop === shop.id ? 'bg-blue-500' : 'bg-gray-100'
                      )}>
                        <Store className={cn(
                          'w-5 h-5',
                          selectedShop === shop.id ? 'text-white' : 'text-gray-500'
                        )} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{shop.title}</h3>
                        <p className="text-sm text-gray-600 capitalize">{shop.sales_channel}</p>
                      </div>
                    </div>
                    {selectedShop === shop.id && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state pendant validation */}
        {isValidatingToken && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-blue-700">Connecting to Printify...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          {onBack && (
            <Button onClick={onBack} variant="secondary" className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          {hasConnectedAccount && shops.length > 0 && (
            <Button
              onClick={handleNext}
              loading={isSubmitting}
              disabled={!selectedShop || isSubmitting}
              variant="success"
              className="ml-auto"
            >
              Continue with {shops.find(s => s.id === selectedShop)?.title || 'Selected Shop'}
            </Button>
          )}
        </div>

      </div>
    </Card>
  );
}

