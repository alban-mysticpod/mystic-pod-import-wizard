'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PrintProvider, Blueprint } from '@/types';
import { Printer, Check, MapPin, ArrowLeft } from 'lucide-react';

interface Step4Props {
  blueprint: Blueprint;
  selectedPrintProviderId: number | null;
  onNext: (printProviderId: number) => void;
  onBack?: () => void;
}

// Global state to prevent double loading
const loadingState = new Map<string, boolean>();

export function Step4ChoosePrintProvider({ blueprint, selectedPrintProviderId, onNext, onBack }: Step4Props) {
  const [printProviders, setPrintProviders] = useState<PrintProvider[]>([]);
  const [selected, setSelected] = useState<number | null>(selectedPrintProviderId);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPrintProviders = useCallback(async () => {
    const loadKey = `print-providers-${blueprint.id}`;
    
    if (loadingState.get(loadKey)) {
      console.log('🛑 Already loading print providers - skipping duplicate call');
      return;
    }

    loadingState.set(loadKey, true);
    setIsLoading(true);
    setError('');

    try {
      console.log('🖨️ Fetching print providers for blueprint:', blueprint.id);
      const response = await fetch(`/api/print-providers?blueprintId=${blueprint.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch print providers');
      }

      const data = await response.json();
      console.log(`✅ Loaded ${data.length} print providers`);
      setPrintProviders(data);
    } catch (err) {
      console.error('❌ Failed to fetch print providers:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load print providers';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      loadingState.set(loadKey, false);
    }
  }, [blueprint.id]);

  useEffect(() => {
    loadPrintProviders();
  }, [loadPrintProviders]);

  const handleSelect = (providerId: number) => {
    setSelected(providerId);
  };

  const handleNext = () => {
    if (!selected) {
      setError('Please select a print provider');
      return;
    }
    onNext(selected);
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading print providers...</p>
        </div>
      </Card>
    );
  }

  if (error && printProviders.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadPrintProviders} variant="secondary">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  const selectedProvider = printProviders.find(p => p.id === selected);

  return (
    <Card>
      <div className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a Print Provider</h2>
        <p className="text-gray-600 mb-2">
          Select the print provider for <strong>{blueprint.title}</strong>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {printProviders.length} provider{printProviders.length !== 1 ? 's' : ''} available
        </p>

        {/* Print Providers List */}
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {printProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleSelect(provider.id)}
              className={`w-full p-4 border-2 rounded-lg transition-all hover:shadow-md flex items-center justify-between ${
                selected === provider.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selected === provider.id ? 'bg-blue-500' : 'bg-gray-100'
                }`}>
                  <Printer className={`w-5 h-5 ${
                    selected === provider.id ? 'text-white' : 'text-gray-500'
                  }`} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{provider.title}</h3>
                  {provider.location && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {provider.location}
                    </p>
                  )}
                </div>
              </div>
              {selected === provider.id && (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Selected Provider Info */}
        {selectedProvider && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-1">
              Selected: {selectedProvider.title}
            </h3>
            {selectedProvider.location && (
              <p className="text-sm text-gray-600">Location: {selectedProvider.location}</p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between gap-4">
          {onBack && (
            <Button onClick={onBack} variant="secondary" size="lg" className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            variant="primary"
            size="lg"
            disabled={!selected}
            className="flex-1"
          >
            Continue with {selectedProvider ? selectedProvider.title : 'Selected Provider'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

