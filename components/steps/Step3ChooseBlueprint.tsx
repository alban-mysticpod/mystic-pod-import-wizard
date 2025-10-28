'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PrintifyProductModal } from '@/components/PrintifyProductModal';
import { Blueprint, Preset, PrintifyProduct, PrintProvider } from '@/types';
import { assignPreset, selectPrintProvider } from '@/lib/api';
import { Package, Check, ArrowLeft, Heart, Zap, Download, ExternalLink, Printer, MapPin } from 'lucide-react';

interface Step3Props {
  selectedBlueprint: Blueprint | null;
  importId: string; // Ajouter importId pour le webhook
  onNext: (blueprint: Blueprint) => void;
  onPresetNext?: (preset: Preset) => void; // Handler pour les presets
  onPrintifyProductNext?: (product: PrintifyProduct) => void; // Handler pour les produits Printify
  onBack?: () => void;
}

// Global state to prevent double loading
const loadingState = new Map<string, boolean>();

// MVP Feature Flag: Disable manual configuration for MVP
const ENABLE_MANUAL_CONFIGURATION = false;

export function Step3ChooseBlueprint({ selectedBlueprint, importId, onNext, onPresetNext, onPrintifyProductNext, onBack }: Step3Props) {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selected, setSelected] = useState<Blueprint | null>(selectedBlueprint);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [error, setError] = useState('');
  const [showPrintifyModal, setShowPrintifyModal] = useState(false);
  
  // Print Provider states (integrated from Step 4)
  const [printProviders, setPrintProviders] = useState<PrintProvider[]>([]);
  const [selectedPrintProvider, setSelectedPrintProvider] = useState<number | null>(null);
  const [isLoadingPrintProviders, setIsLoadingPrintProviders] = useState(false);
  const [showPrintProviders, setShowPrintProviders] = useState(false);

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

  // Load print providers when a blueprint is selected (integrated from Step 4)
  const loadPrintProviders = useCallback(async (blueprint: Blueprint) => {
    const loadKey = `print-providers-${blueprint.id}`;
    
    if (loadingState.get(loadKey)) {
      console.log('🛑 Already loading print providers - skipping duplicate call');
      return;
    }

    loadingState.set(loadKey, true);
    setIsLoadingPrintProviders(true);
    setError('');

    try {
      console.log('🖨️ Fetching print providers for blueprint:', blueprint.id);
      const response = await fetch(`/api/print-providers?blueprintId=${blueprint.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch print providers');
      }

      const data = await response.json();
      console.log('✅ Print providers loaded:', data);
      
      if (Array.isArray(data)) {
        setPrintProviders(data);
        setShowPrintProviders(true);
      } else {
        console.error('❌ Invalid print providers data format:', data);
        setError('Invalid print providers data format');
      }
    } catch (err) {
      console.error('❌ Failed to load print providers:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load print providers';
      setError(errorMessage);
    } finally {
      setIsLoadingPrintProviders(false);
    }
  }, []);

  const handleSelect = (blueprint: Blueprint) => {
    setSelected(blueprint);
    setSelectedPreset(null); // Désélectionner le preset si on sélectionne un blueprint
    
    // Load print providers for manual configuration (if enabled)
    if (ENABLE_MANUAL_CONFIGURATION) {
      loadPrintProviders(blueprint);
    }
  };

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset);
    setSelected(null); // Désélectionner le blueprint si on sélectionne un preset
  };

        const handleNext = async () => {
          if (selectedPreset && onPresetNext) {
            try {
              // Appeler le webhook assign-preset quand un preset est sélectionné
              console.log('🎯 Assigning preset for preset ID:', selectedPreset.id, 'blueprint:', selectedPreset.blueprint_id, 'importId:', importId);
              await assignPreset(selectedPreset.blueprint_id, importId, selectedPreset.id);
              console.log('✅ Preset assigned successfully');
              
              // Navigation immédiate - la génération des mockups se fera dans Step5Mockups
              onPresetNext(selectedPreset);
            } catch (err) {
              console.error('❌ Failed to assign preset:', err);
              // Continuer même si l'assignation du preset échoue
              onPresetNext(selectedPreset);
            }
            return;
          }

    if (!selected) {
      setError('Please select a blueprint or preset');
      return;
    }

    // For manual configuration, check if print provider is selected
    if (ENABLE_MANUAL_CONFIGURATION && !selectedPrintProvider) {
      setError('Please select a print provider');
      return;
    }

    try {
      // Appeler le webhook assign-preset quand un blueprint est sélectionné
      console.log('🎯 Assigning preset for blueprint:', selected.id, 'importId:', importId);
      await assignPreset(selected.id, importId);
      console.log('✅ Preset assigned successfully');
      
      // If manual configuration is enabled, also call select print provider
      if (ENABLE_MANUAL_CONFIGURATION && selectedPrintProvider) {
        console.log('🖨️ Selecting print provider:', selectedPrintProvider, 'importId:', importId);
        await selectPrintProvider(selectedPrintProvider, importId);
        console.log('✅ Print provider selected successfully');
      }
      
      onNext(selected);
    } catch (err) {
      console.error('❌ Failed to assign preset:', err);
      // Continuer même si l'assignation du preset échoue
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
          Select Configuration
        </h2>
        <p className="text-gray-600 mb-6">
          {ENABLE_MANUAL_CONFIGURATION 
            ? (hasPresets 
                ? 'Choose from your saved presets, import from Printify, or configure manually'
                : 'Import from Printify or configure manually'
              )
            : (hasPresets 
                ? 'Choose from your saved presets or import from Printify'
                : 'Import from Printify'
              )
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

              {/* Continue button for presets - positioned right after preset selection */}
              {selectedPreset && (
                <div className="mt-4">
                  <Button
                    onClick={handleNext}
                    variant="primary"
                    size="lg"
                    className="w-full"
                  >
                    Continue with Preset: {selectedPreset.name}
                  </Button>
                </div>
              )}
            </div>

            {/* OR Divider - Always show since Printify import is always available */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
              </div>
            </div>
          </>
        )}

        {/* Import from Printify Section - Always available */}
        {(
          <>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Download className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Import from Printify</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Copy settings from an existing product to skip manual configuration
              </p>
              
              {/* Import Button */}
              <div className="text-center">
                <Button
                  onClick={() => {
                    console.log('🔍 Opening Printify modal - importId:', importId);
                    setShowPrintifyModal(true);
                  }}
                  variant="secondary"
                  className="bg-white hover:bg-green-50 text-gray-600 hover:text-green-700 border-2 border-green-300 hover:border-green-500 transition-all duration-200 px-8 py-3"
                >
                  Select a Printify product
                </Button>
              </div>
            </div>

            {/* OR Divider removed - no more sections below for MVP */}
          </>
        )}

        {/* Manual Blueprint Selection Section - Hidden for MVP */}
        {ENABLE_MANUAL_CONFIGURATION && (
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
        )}

        {/* Print Provider Selection Section - Integrated from Step 4 */}
        {ENABLE_MANUAL_CONFIGURATION && showPrintProviders && selected && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Printer className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Choose Print Provider</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Select the print provider for your {selected.title}
            </p>

            {isLoadingPrintProviders ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading print providers...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {printProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedPrintProvider(provider.id)}
                    className={`relative p-4 border-2 rounded-lg transition-all hover:shadow-lg ${
                      selectedPrintProvider === provider.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Selected Checkmark */}
                    {selectedPrintProvider === provider.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Provider Info */}
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 mb-1">{provider.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span>{provider.location}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        ID: {provider.id}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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


        {ENABLE_MANUAL_CONFIGURATION && selected && (
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

        {/* Action Buttons - Only Back button, Continue is now in preset section */}
        <div className="flex justify-start gap-4">
          {onBack && (
            <Button onClick={onBack} variant="secondary" size="lg" className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
        </div>
      </div>

      {/* Printify Product Selection Modal */}
      <PrintifyProductModal
        isOpen={showPrintifyModal}
        onClose={() => setShowPrintifyModal(false)}
        onSelectProduct={(product) => {
          console.log('🎯 Product selected:', product);
          if (onPrintifyProductNext) {
            onPrintifyProductNext(product);
          }
        }}
        importId={importId}
      />
    </Card>
  );
}

