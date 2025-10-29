'use client';

import { useState, useCallback } from 'react';
import { Stepper } from './Stepper';
import { Step1DriveFolder } from './steps/Step1DriveFolder';
// Step2ChooseShop REMOVED - integrated into Step1
import { Step3ChooseBlueprint } from './steps/Step3ChooseBlueprint';
// Step4ChoosePrintProvider is now integrated into Step3 for MVP
import { Step5Mockups as Step4Mockups } from './steps/Step5Mockups';
import { Step6Preview as Step5Preview } from './steps/Step6Preview';
import { Step7Process as Step6Process } from './steps/Step7Process';
import { ShopSelector } from './ShopSelector';
import { WizardState, PrintifyShop, SupabaseFile, Blueprint, Preset, PrintifyProduct } from '@/types';
import { clearBlockingCaches } from '@/lib/cache-utils';

const initialState: WizardState = {
  currentStep: 1,
  folderUrl: '',
  folderId: '',
  fileCount: 0,
  sampleFiles: [],
  importId: '', // ID de l'import pour tracking
  apiToken: '',
  shops: [],
  selectedShopId: null,
  selectedBlueprint: null,
  selectedPrintProviderId: null,
  selectedPreset: null,
  selectedPrintifyProduct: null,
  files: [],
  session: '',
  importProgress: 0,
  importLogs: [],
  isComplete: false,
  error: null,
  pushToShopify: false, // Flag to push products to Shopify
};

export function Wizard() {
  const [state, setState] = useState<WizardState>(initialState);
  
  // Track selected shops from ShopSelector
  const [selectedPrintifyShopId, setSelectedPrintifyShopId] = useState<string | null>(null);
  const [selectedShopifyShopId, setSelectedShopifyShopId] = useState<string | null>(null);

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Generic back handler
  const handleBack = useCallback(() => {
    console.log('🔙 BACK BUTTON: Going back from step', state.currentStep, 'to', state.currentStep - 1);
    console.log('🔙 BACK BUTTON: Current state:', {
      importId: state.importId,
      selectedShopId: state.selectedShopId,
      selectedBlueprint: state.selectedBlueprint?.id,
      selectedPreset: state.selectedPreset?.id
    });
    
    // Clear only blocking caches to prevent stale state issues (preserves UX)
    clearBlockingCaches();
    
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep - 1,
    }));
  }, [state.currentStep, state.importId, state.selectedShopId, state.selectedBlueprint, state.selectedPreset]);

  const handleStep1Next = useCallback((data: {
    folderUrl: string;
    folderId: string;
    fileCount: number;
    sampleFiles: Array<{ id: string; name: string }>;
    importId: string;
    // New data (from old Step 2)
    apiToken: string;
    shops: any[];
    shopId: number;
  }) => {
    console.log('🎯 Step1 → Step2 (ex-Step3): Shop setup complete, moving to blueprint selection');
    updateState({
      ...data,
      selectedShopId: data.shopId,
      currentStep: 2, // Go directly to Step2 (which is the old Step3)
    });
  }, [updateState]);

  // handleStep2Next REMOVED - Step2ChooseShop no longer exists
  // Step2 is now Choose Blueprint (was Step3)

  const handleStep2Next = useCallback((blueprint: Blueprint) => {
    updateState({
      selectedBlueprint: blueprint,
      currentStep: 3, // Renumbered: was 4, now 3
    });
  }, [updateState]);

  const handleStep2PresetNext = useCallback((preset: Preset) => {
    // Quand un preset est sélectionné, on skip l'étape 3 et va directement au step 3 (mockups)
    // On configure automatiquement le blueprint et print provider depuis le preset
    updateState({
      selectedBlueprint: { 
        id: preset.blueprint_id, 
        title: `Blueprint ${preset.blueprint_id}`,
        brand: 'Preset',
        model: preset.name,
        description: `Configured from preset: ${preset.name}`,
        images: [],
        provider: preset.provider,
        created_at: preset.created_at
      } as Blueprint,
      selectedPrintProviderId: preset.print_provider_id,
      // Stocker le preset sélectionné pour l'utiliser plus tard
      selectedPreset: preset,
      currentStep: 3, // Renumbered: was 4, now 3 (Mockups)
    });
  }, [updateState]);

  const handleStep2PrintifyProductNext = useCallback((product: PrintifyProduct) => {
    // Quand un produit Printify est sélectionné, on skip l'étape 3 et va directement au step 3 (mockups)
    // On configure automatiquement le blueprint et print provider depuis le produit
    updateState({
      selectedBlueprint: { 
        id: product.blueprint_id, 
        title: product.blueprint?.title || `Blueprint ${product.blueprint_id}`,
        brand: product.blueprint?.brand || 'Printify',
        model: product.blueprint?.model || product.title,
        description: product.description,
        images: product.blueprint?.images?.map(img => img.src) || [],
        provider: 'printify',
        created_at: product.created_at
      } as Blueprint,
      selectedPrintProviderId: product.print_provider_id,
      // Stocker le produit Printify sélectionné pour l'utiliser plus tard
      selectedPrintifyProduct: product,
      currentStep: 3, // Renumbered: was 4, now 3 (Mockups)
    });
  }, [updateState]);

  // Step3 = Mockups (was Step4, was Step5)
  const handleStep3Next = useCallback((files: SupabaseFile[]) => {
    updateState({
      files,
      currentStep: 4, // Renumbered: was 5, now 4 (Preview)
    });
  }, [updateState]);

  // Step4 = Preview (was Step5, was Step6)
  const handleStep4Next = useCallback((files: SupabaseFile[], pushToShopify: boolean) => {
    console.log('🎯 Step4 → Step5: Files selected, pushToShopify:', pushToShopify);
    updateState({
      files,
      pushToShopify, // Store the Shopify push flag
      currentStep: 5, // Renumbered: was 6, now 5 (Process/Final)
    });
  }, [updateState]);

  const handleRestart = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <div>
      {/* Header with Shop Selectors */}
      <div className="mb-8">
        {/* Shop Selectors - Top Left */}
        <div className="flex items-center gap-4 mb-6">
          <ShopSelector 
            provider="printify" 
            disabled={state.currentStep > 1}
            onShopChange={(shopId) => {
              console.log('🏪 Printify shop selected:', shopId);
              setSelectedPrintifyShopId(shopId);
            }}
          />
          <ShopSelector 
            provider="shopify" 
            disabled={state.currentStep > 1}
            onShopChange={(shopId) => {
              console.log('🏪 Shopify shop selected:', shopId);
              setSelectedShopifyShopId(shopId);
            }}
          />
        </div>

        {/* Title - Centered */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            WeScale Import Wizard
          </h1>
          <p className="text-xl text-gray-600">
            Import your designs from Google Drive to Printify
          </p>
        </div>
      </div>

      <Stepper currentStep={state.currentStep} skipStep3={false} />

        <div className="max-w-4xl mx-auto">
          {state.currentStep === 1 && (
            <Step1DriveFolder
              folderUrl={state.folderUrl}
              fileCount={state.fileCount}
              sampleFiles={state.sampleFiles}
              selectedPrintifyShopId={selectedPrintifyShopId}
              selectedShopifyShopId={selectedShopifyShopId}
              onNext={handleStep1Next}
            />
          )}

          {/* Step2ChooseShop REMOVED - integrated into Step1 */}

          {state.currentStep === 2 && (
            <Step3ChooseBlueprint
              selectedBlueprint={state.selectedBlueprint}
              importId={state.importId}
              onNext={handleStep2Next}
              onPresetNext={handleStep2PresetNext}
              onPrintifyProductNext={handleStep2PrintifyProductNext}
              onBack={handleBack}
            />
          )}

          {state.currentStep === 3 && (
            <Step4Mockups
              folderId={state.folderId}
              importId={state.importId}
              files={state.files}
              blueprintId={state.selectedBlueprint?.id || null}
              onNext={handleStep3Next}
              onBack={handleBack}
            />
          )}

          {state.currentStep === 4 && (
            <Step5Preview
              folderId={state.folderId}
              importId={state.importId}
              files={state.files}
              selectedShopifyShopId={selectedShopifyShopId}
              onNext={handleStep4Next}
              onBack={handleBack}
            />
          )}

          {state.currentStep === 5 && state.selectedShopId && (
            <Step6Process
              folderId={state.folderId}
              shopId={state.selectedShopId}
              importId={state.importId}
              fileCount={state.files.length}
              pushToShopify={state.pushToShopify}
              onRestart={handleRestart}
              onBack={handleBack}
            />
          )}
      </div>
    </div>
  );
}
