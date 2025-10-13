'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Blueprint, Preset, PrintifyProduct } from '@/types';
import { createPreset, listPrintifyProducts } from '@/lib/api';
import { Package, Check, ArrowLeft, Heart, Zap, Download, ExternalLink } from 'lucide-react';

interface Step3Props {
  selectedBlueprint: Blueprint | null;
  importId: string; // Ajouter importId pour le webhook
  tokenRef: string; // Ajouter tokenRef pour lister les produits Printify
  onNext: (blueprint: Blueprint) => void;
  onPresetNext?: (preset: Preset) => void; // Handler pour les presets
  onPrintifyProductNext?: (product: PrintifyProduct) => void; // Nouveau handler pour les produits Printify
  onBack?: () => void;
}

// Global state to prevent double loading
const loadingState = new Map<string, boolean>();

export function Step3ChooseBlueprint({ selectedBlueprint, importId, tokenRef, onNext, onPresetNext, onPrintifyProductNext, onBack }: Step3Props) {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [printifyProducts, setPrintifyProducts] = useState<PrintifyProduct[]>([]);
  const [selected, setSelected] = useState<Blueprint | null>(selectedBlueprint);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [selectedPrintifyProduct, setSelectedPrintifyProduct] = useState<PrintifyProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [isLoadingPrintifyProducts, setIsLoadingPrintifyProducts] = useState(true);
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

  const loadPrintifyProducts = useCallback(async () => {
    if (!tokenRef) {
      setIsLoadingPrintifyProducts(false);
      return;
    }

    setIsLoadingPrintifyProducts(true);

    try {
      console.log('🔄 Loading Printify products...');
      const data = await listPrintifyProducts(tokenRef, importId);
      console.log('✅ Printify products loaded:', data);
      setPrintifyProducts(data.products || []);
    } catch (err) {
      console.error('❌ Failed to load Printify products:', err);
      // Ne pas afficher d'erreur pour les produits Printify, juste ne pas les afficher
      setPrintifyProducts([]);
    } finally {
      setIsLoadingPrintifyProducts(false);
    }
  }, [tokenRef, importId]);

  useEffect(() => {
    loadBlueprints();
    loadPresets();
    loadPrintifyProducts();
  }, [loadBlueprints, loadPresets, loadPrintifyProducts]);

  const handleSelect = (blueprint: Blueprint) => {
    setSelected(blueprint);
    setSelectedPreset(null); // Désélectionner le preset si on sélectionne un blueprint
    setSelectedPrintifyProduct(null); // Désélectionner le produit Printify si on sélectionne un blueprint
  };

  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset);
    setSelected(null); // Désélectionner le blueprint si on sélectionne un preset
    setSelectedPrintifyProduct(null); // Désélectionner le produit Printify si on sélectionne un preset
  };

  const handlePrintifyProductSelect = (product: PrintifyProduct) => {
    setSelectedPrintifyProduct(product);
    setSelected(null); // Désélectionner le blueprint si on sélectionne un produit Printify
    setSelectedPreset(null); // Désélectionner le preset si on sélectionne un produit Printify
  };

  const handleNext = async () => {
    if (selectedPreset && onPresetNext) {
      onPresetNext(selectedPreset);
      return;
    }

    if (selectedPrintifyProduct && onPrintifyProductNext) {
      onPrintifyProductNext(selectedPrintifyProduct);
      return;
    }

    if (!selected) {
      setError('Please select a blueprint, preset, or Printify product');
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
  const hasPrintifyProducts = !isLoadingPrintifyProducts && printifyProducts.length > 0;
  const showDividers = (hasPresets && hasPrintifyProducts) || (hasPresets || hasPrintifyProducts);

  return (
    <Card>
      <div className="p-8">
        {/* Dynamic Title and Description */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {hasPresets || hasPrintifyProducts ? 'Select Configuration' : 'Choose a Blueprint'}
        </h2>
        <p className="text-gray-600 mb-6">
          {hasPresets || hasPrintifyProducts 
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
            {(hasPrintifyProducts || blueprints.length > 0) && (
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

        {/* Import from Printify Section - Only show if user has Printify products */}
        {hasPrintifyProducts && (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Download className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Import from Printify</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Select an existing product from your Printify account to import its configuration
              </p>
              
              {/* Printify Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {printifyProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handlePrintifyProductSelect(product)}
                    className={`relative p-4 border-2 rounded-lg transition-all hover:shadow-md text-left ${
                      selectedPrintifyProduct?.id === product.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Selected Checkmark */}
                    {selectedPrintifyProduct?.id === product.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ExternalLink className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{product.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {product.description || `Blueprint ${product.blueprint_id} • Provider ${product.print_provider_id}`}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {product.visible ? 'Published' : 'Draft'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {product.variants?.length || 0} variants
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
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

        {selectedPrintifyProduct && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold text-gray-900">Selected Printify Product: {selectedPrintifyProduct.title}</h3>
            </div>
            <p className="text-sm text-gray-600">
              This product configuration will be imported and converted into a preset.
              You'll skip directly to the preview step with the imported settings.
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
            disabled={!selected && !selectedPreset && !selectedPrintifyProduct}
            className="flex-1"
          >
            {selectedPreset 
              ? `Continue with Preset: ${selectedPreset.name}` 
              : selectedPrintifyProduct
                ? `Import Product: ${selectedPrintifyProduct.title}`
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

