'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Blueprint } from '@/types';
import { Package, Check } from 'lucide-react';

interface Step4Props {
  selectedBlueprint: Blueprint | null;
  onNext: (blueprint: Blueprint) => void;
}

// Global state to prevent double loading
const loadingState = new Map<string, boolean>();

export function Step4ChooseBlueprint({ selectedBlueprint, onNext }: Step4Props) {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selected, setSelected] = useState<Blueprint | null>(selectedBlueprint);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBlueprints = useCallback(async () => {
    const loadKey = 'blueprints-printify';
    
    if (loadingState.get(loadKey)) {
      console.log('🛑 Already loading blueprints - skipping duplicate call');
      return;
    }

    loadingState.set(loadKey, true);
    setIsLoading(true);
    setError('');

    try {
      console.log('📦 Fetching blueprints...');
      const response = await fetch('/api/blueprints?provider=printify');
      
      if (!response.ok) {
        throw new Error('Failed to fetch blueprints');
      }

      const data = await response.json();
      console.log(`✅ Loaded ${data.length} blueprints`);
      setBlueprints(data);
    } catch (err) {
      console.error('❌ Failed to fetch blueprints:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load blueprints';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      loadingState.set(loadKey, false);
    }
  }, []);

  useEffect(() => {
    loadBlueprints();
  }, [loadBlueprints]);

  const handleSelect = (blueprint: Blueprint) => {
    setSelected(blueprint);
  };

  const handleNext = () => {
    if (!selected) {
      setError('Please select a blueprint');
      return;
    }
    onNext(selected);
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blueprints...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadBlueprints} variant="secondary">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a Blueprint</h2>
        <p className="text-gray-600 mb-6">
          Select the product template you want to use for your designs
        </p>

        {/* Blueprints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {blueprints.map((blueprint) => (
            <button
              key={blueprint.id}
              onClick={() => handleSelect(blueprint)}
              className={`relative p-4 border-2 rounded-lg transition-all hover:shadow-lg ${
                selected?.id === blueprint.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Selected Checkmark */}
              {selected?.id === blueprint.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Blueprint Image */}
              {blueprint.images && blueprint.images.length > 0 ? (
                <img
                  src={blueprint.images[0]}
                  alt={blueprint.title}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-300" />
                </div>
              )}

              {/* Blueprint Info */}
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 mb-1">{blueprint.title}</h3>
                <p className="text-sm text-gray-600">
                  {blueprint.brand} - {blueprint.model}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Blueprint Details */}
        {selected && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Selected: {selected.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-3">
              {selected.description.replace(/<[^>]*>/g, '')}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleNext}
          variant="primary"
          size="lg"
          disabled={!selected}
          className="w-full"
        >
          Continue with {selected ? selected.title : 'Selected Blueprint'}
        </Button>
      </div>
    </Card>
  );
}

