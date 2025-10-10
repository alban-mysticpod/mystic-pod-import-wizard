'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { testPrintifyToken } from '@/lib/api';
import { PrintifyShop } from '@/types';
import { Key, CheckCircle, ExternalLink, ArrowLeft } from 'lucide-react';

interface Step2Props {
  apiToken: string;
  onNext: (data: { apiToken: string; tokenRef: string; shops: PrintifyShop[] }) => void;
  onBack?: () => void;
}

export function Step2PrintifyToken({ apiToken, onNext, onBack }: Step2Props) {
  const [token, setToken] = useState(apiToken);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationResult, setValidationResult] = useState<{
    tokenRef: string;
    shops: PrintifyShop[];
  } | null>(null);

  const handleValidate = async () => {
    // Validation stricte : vérifier si le champ est vide
    if (!token.trim()) {
      setError('Please enter your Printify API token');
      return;
    }

    // Validation basique du format du token (optionnel)
    if (token.length < 10) {
      setError('API token seems too short. Please check your token.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🚀 Testing Printify API token...');
      const result = await testPrintifyToken(token);
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate API token. Please check your token and try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (validationResult) {
      onNext({
        apiToken: token,
        tokenRef: validationResult.tokenRef,
        shops: validationResult.shops,
      });
    }
  };

  return (
    <Card
      title="Connect Your Printify Account"
      description="Enter your Printify API token to connect your account."
    >
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <Key className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900 mb-1">Where to find your API token:</p>
              <p className="text-yellow-700 mb-2">
                Go to your Printify dashboard → Account → Connections → Generate new token
              </p>
              <a
                href="https://printify.com/app/account/api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-yellow-600 hover:text-yellow-800 font-medium"
              >
                Open Printify API Settings
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>
        </div>

        <Input
          type="password"
          label="Printify API Token"
          placeholder="Enter your API token..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
          error={error}
          helperText="Your API token will be securely stored and used only for this import"
        />

        {validationResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
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
        )}

        <div className="flex justify-between">
          {onBack && (
            <Button onClick={onBack} variant="secondary" className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <div className="flex justify-end space-x-3 ml-auto">
            <Button
              onClick={handleValidate}
              loading={isLoading}
              disabled={!token.trim()}
            >
              {validationResult ? 'Re-validate Token' : 'Validate Token'}
            </Button>
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
