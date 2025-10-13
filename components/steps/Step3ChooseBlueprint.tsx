'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Blueprint, Preset } from '@/types';
import { createPreset } from '@/lib/api';
import { Package, Check, ArrowLeft, Heart, Zap, Download, ExternalLink } from 'lucide-react';

interface Step3Props {
  selectedBlueprint: Blueprint | null;
  importId: string; // Ajouter importId pour le webhook
  tokenRef: string; // Ajouter tokenRef pour déterminer si on affiche la section Printify
  onNext: (blueprint: Blueprint) => void;
  onPresetNext?: (preset: Preset) => void; // Handler pour les presets
  onBack?: () => void;
}

// Global state to prevent double loading
const loadingState = new Map<string, boolean>();

export function Step3ChooseBlueprint({ selectedBlueprint, importId, tokenRef, onNext, onPresetNext, onBack }: Step3Props) {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selected, setSelected] = useState<Blueprint | null>(selectedBlueprint);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
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
      
      // Handle both direct array and { blueprints: [...] } response formats
      const blueprintsArray = Array.isArray(data) ? data : (data.blueprints || []);
      console.log(`✅ Loaded ${blueprintsArray.length} blueprints`);
      setBlueprints(blueprintsArray);
    } catch (err) {
      console.error('❌ Failed to fetch blueprints:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load blueprints';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      loadingState.set(loadKey, false);
    }
  }, []);

  const loadPresets = useCallback(async () => {
    setIsLoadingPresets(true);
    try {
      console.log('❤️ Fetching favorite presets...');
      const response = await fetch('/api/presets');
      
      if (!response.ok) {
        throw new Error('Failed to fetch presets');
      }

      const data = await response.json();
      const presetsArray = data.presets || [];
      console.log(`✅ Loaded ${presetsArray.length} favorite presets`);
      setPresets(presetsArray);
    } catch (err) {
      console.error('❌ Failed to fetch presets:', err);
      // Ne pas afficher d'erreur pour les presets, juste ne pas les afficher
      setPresets([]);
    } finally {
      setIsLoadingPresets(false);
    }
  }, []);


  useEffect(() => {
    loadBlueprints();
    loadPresets();
  }, [loadBlueprints, loadPresets]);

  const handleSelect = (blueprint: Blueprint) => {
    setSelected(blueprint);
    setSelectedPreset(null); // Désélectionner le preset si on sélectionne un blueprint
  };

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset);
    setSelected(null); // Désélectionner le blueprint si on sélectionne un preset
  };

  const handleNext = async () => {
    if (selectedPreset && onPresetNext) {
      onPresetNext(selectedPreset);
      return;
    }

    if (!selected) {
      setError('Please select a blueprint or preset');
      return;
    }

    try {
      // Appeler le webhook create-preset quand un blueprint est sélectionné
      console.log('🎯 Creating preset for blueprint:', selected.id, 'importId:', importId);
      await createPreset(selected.id, importId);
      console.log('✅ Preset created successfully');
      
      onNext(selected);
    } catch (err) {
      console.error('❌ Failed to create preset:', err);
      // Continuer même si la création du preset échoue
      onNext(selected);
    }
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

  // Déterminer quelles sections afficher
  const hasPresets = !isLoadingPresets && presets.length > 0;

  return (
    <Card>
      <div className="p-8">
        {/* Dynamic Title and Description */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {hasPresets || tokenRef ? 'Select Configuration' : 'Choose a Blueprint'}
        </h2>
        <p className="text-gray-600 mb-6">
          {hasPresets || tokenRef 
            ? 'Choose from your saved presets, import from Printify, or configure manually'
            : 'Select the product template you want to use for your designs'
          }
        </p>

        {/* Presets Section - Only show if user has favorite presets */}
        {hasPresets && (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Select Presets</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Use your saved configurations to skip the setup steps
              </p>
              
              {/* Presets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className={`relative p-4 border-2 rounded-lg transition-all hover:shadow-md text-left ${
                      selectedPreset?.id === preset.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Selected Checkmark */}
                    {selectedPreset?.id === preset.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{preset.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Blueprint {preset.blueprint_id} • Provider {preset.print_provider_id}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ready to use
                          </span>
                          <span className="text-xs text-gray-500">
                            {Object.keys(preset.placements || {}).length} placements configured
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* OR Divider - Only show if there are more sections below */}
            {(tokenRef || blueprints.length > 0) && (
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Import from Printify Section - Always show if tokenRef exists */}
        {tokenRef && (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Download className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Import from Printify</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Import settings from an existing Printify product on your account
              </p>
              
              {/* Import Button */}
              <div className="p-6 border-2 border-dashed border-green-300 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <ExternalLink className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Your Printify Products</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Select from your existing products to automatically configure blueprint, print provider, and design settings
                  </p>
                  <Button
                    onClick={() => {
                      // TODO: Navigate to Printify products selection page
                      console.log('Navigate to Printify products page');
                    }}
                    variant="secondary"
                    className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Browse Products
                  </Button>
                </div>
              </div>
            </div>

            {/* OR Divider - Only show if there are blueprints below */}
            {blueprints.length > 0 && (
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Manual Blueprint Selection Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Choose a Blueprint</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {!isLoadingPresets && presets.length > 0 
              ? 'Select a product template and configure it step by step'
              : 'Select the product template you want to use for your designs'
            }
          </p>

          {/* Blueprints Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </div>

        {/* Selected Item Details */}
        {selectedPreset && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Selected Preset: {selectedPreset.name}</h3>
            </div>
            <p className="text-sm text-gray-600">
              This preset will automatically configure your blueprint, print provider, and design placements.
              You'll skip directly to the preview step.
            </p>
          </div>
        )}


        {selected && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Selected Blueprint: {selected.title}</h3>
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
            disabled={!selected && !selectedPreset}
            className="flex-1"
          >
            {selectedPreset 
              ? `Continue with Preset: ${selectedPreset.name}` 
              : selected 
                ? `Continue with ${selected.title}`
                : 'Continue with Selection'
            }
          </Button>
        </div>
      </div>
    </Card>
  );
}

