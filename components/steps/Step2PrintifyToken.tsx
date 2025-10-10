'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { testPrintifyToken } from '@/lib/api';
import { PrintifyShop, ApiToken } from '@/types';
import { Key, CheckCircle, ExternalLink, ArrowLeft, Check } from 'lucide-react';
import { getUserId } from '@/lib/user';
import { cn } from '@/lib/utils';

interface Step2Props {
  apiToken: string;
  onNext: (data: { apiToken: string; tokenRef: string; shops: PrintifyShop[] }) => void;
  onBack?: () => void;
}

export function Step2PrintifyToken({ apiToken, onNext, onBack }: Step2Props) {
  const [token, setToken] = useState(apiToken);
  const [savedTokens, setSavedTokens] = useState<ApiToken[]>([]);
  const [selectedSavedToken, setSelectedSavedToken] = useState<string | null>(null);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationResult, setValidationResult] = useState<{
    tokenRef: string;
    shops: PrintifyShop[];
  } | null>(null);
  const [useNewToken, setUseNewToken] = useState(false);

  // Charger les tokens sauvegardés
  useEffect(() => {
    async function loadSavedTokens() {
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
      } catch (err) {
        console.error('❌ Failed to load saved tokens:', err);
        // Ne pas bloquer l'utilisateur s'il ne peut pas charger les tokens
      } finally {
        setIsLoadingTokens(false);
      }
    }
    loadSavedTokens();
  }, []);

  const handleValidate = async (tokenToValidate?: string) => {
    const finalToken = tokenToValidate || token;
    
    // Validation stricte : vérifier si le champ est vide
    if (!finalToken.trim()) {
      setError('Please enter your Printify API token');
      return;
    }

    // Validation basique du format du token (optionnel)
    if (finalToken.length < 10) {
      setError('API token seems too short. Please check your token.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🚀 Testing Printify API token...');
      const result = await testPrintifyToken(finalToken);
      console.log('📦 Raw Printify webhook response:', result);
      console.log('📦 Response type:', typeof result);
      console.log('📦 Response keys:', Object.keys(result || {}));
      
      // Vérifier la structure de la réponse
      if (!result) {
        throw new Error('Empty response from Printify webhook');
      }
      
      if (result.message === 'Workflow was started') {
        throw new Error('Workflow started but no token validation data received. The n8n workflow might be asynchronous.');
      }
      
      // Vérifier que les champs requis sont présents
      if (!result.tokenRef || !Array.isArray(result.shops)) {
        console.error('❌ Invalid Printify response structure:', {
          hasTokenRef: !!result.tokenRef,
          shopsIsArray: Array.isArray(result.shops),
          shopsCount: result.shops?.length || 0
        });
        throw new Error(`Invalid response format. Expected {tokenRef, shops} but got: ${JSON.stringify(result)}`);
      }
      
      console.log('✅ Valid Printify response structure detected');
      console.log(`📦 Found ${result.shops.length} shop(s)`);
      
      setValidationResult({
        tokenRef: result.tokenRef,
        shops: result.shops,
      });
    } catch (err) {
      console.error('❌ Printify webhook error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate token';
      setError(errorMessage);
      setValidationResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSavedToken = (tokenRef: string) => {
    setSelectedSavedToken(tokenRef);
    setUseNewToken(false);
    setError('');
    setValidationResult(null);
  };

  const handleUseNewToken = () => {
    setUseNewToken(true);
    setSelectedSavedToken(null);
    setError('');
    setValidationResult(null);
  };

  const handleValidateSavedToken = async () => {
    if (!selectedSavedToken) {
      setError('Please select a saved token');
      return;
    }
    // Valider le token sélectionné (le backend va l'ajouter au record import)
    await handleValidate(selectedSavedToken);
  };

  const handleNext = () => {
    if (!validationResult) {
      setError('Please validate a token first');
      return;
    }
    onNext({
      apiToken: selectedSavedToken || token,
      tokenRef: validationResult.tokenRef,
      shops: validationResult.shops,
    });
  };

  return (
    <Card>
      <div className="p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
            <Key className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Printify API Token</h2>
            <p className="text-gray-600">Connect your Printify account</p>
          </div>
        </div>

        {/* Saved Tokens Section */}
        {!useNewToken && savedTokens.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Your Saved Tokens</h3>
              <button
                onClick={handleUseNewToken}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Use New Token
              </button>
            </div>
            
            {isLoadingTokens ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="ml-3 text-gray-600">Loading saved tokens...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedTokens.map((savedToken) => (
                  <button
                    key={savedToken.id}
                    onClick={() => handleSelectSavedToken(savedToken.token_ref)}
                    className={cn(
                      'w-full p-4 border-2 rounded-lg transition-all hover:shadow-md text-left',
                      selectedSavedToken === savedToken.token_ref
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-mono text-sm text-gray-800 break-all">
                          {savedToken.token_ref.substring(0, 10)}...{savedToken.token_ref.substring(savedToken.token_ref.length - 10)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Added: {new Date(savedToken.created_at).toLocaleDateString()}
                          {savedToken.last_used_at && ` • Last used: ${new Date(savedToken.last_used_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      {selectedSavedToken === savedToken.token_ref && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ml-3">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedSavedToken && !validationResult && (
              <div className="mt-4">
                <Button
                  onClick={handleValidateSavedToken}
                  loading={isLoading}
                  disabled={isLoading}
                  variant="primary"
                  className="w-full"
                >
                  Use Selected Token
                </Button>
              </div>
            )}
          </div>
        )}

        {/* New Token Input Section */}
        {(useNewToken || savedTokens.length === 0) && (
          <div className="mb-6">
            {savedTokens.length > 0 && (
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Enter New Token</h3>
                <button
                  onClick={() => setUseNewToken(false)}
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  ← Back to Saved Tokens
                </button>
              </div>
            )}
            
            <Input
              label="Printify API Token"
              id="apiToken"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your Printify API token"
              error={error && !validationResult ? error : ''}
            />

            <div className="mt-2 text-sm text-gray-500">
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
          </div>
        )}

        {/* Error Message */}
        {error && validationResult === null && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {validationResult && (
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900 mb-2">
                    API token validated successfully!
                  </p>
                  <p className="text-green-700 mb-3">
                    Found {validationResult.shops.length} shop{validationResult.shops.length !== 1 ? 's' : ''} in your account.
                  </p>
                  {validationResult.shops.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-800 mb-1">Your shops:</p>
                      <ul className="text-sm text-green-700 space-y-1">
                        {validationResult.shops.map((shop) => (
                          <li key={shop.id}>
                            • {shop.title} ({shop.sales_channel})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          {onBack && (
            <Button onClick={onBack} variant="secondary" className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <div className="flex justify-end space-x-3 ml-auto">
            {!validationResult && (useNewToken || savedTokens.length === 0) && (
              <Button
                onClick={() => handleValidate()}
                loading={isLoading}
                disabled={!token.trim() || isLoading}
              >
                Validate Token
              </Button>
            )}
            {validationResult && (
              <Button onClick={handleNext} variant="success">
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
