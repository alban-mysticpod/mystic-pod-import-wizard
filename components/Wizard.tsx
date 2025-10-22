'use client';

import { useState, useCallback } from 'react';
import { Stepper } from './Stepper';
import { Step1DriveFolder } from './steps/Step1DriveFolder';
import { Step2ChooseShop } from './steps/Step2ChooseShop';
import { Step3ChooseBlueprint } from './steps/Step3ChooseBlueprint';
// Step4ChoosePrintProvider is now integrated into Step3 for MVP
import { Step5Mockups as Step4Mockups } from './steps/Step5Mockups';
import { Step6Preview as Step5Preview } from './steps/Step6Preview';
import { Step7Process as Step6Process } from './steps/Step7Process';
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
  tokenRef: '',
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
  shouldGenerateMockups: false, // Nouveau flag pour savoir si on doit générer les mockups
};

export function Wizard() {
  const [state, setState] = useState<WizardState>(initialState);

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Generic back handler
  const handleBack = useCallback(() => {
    console.log('🔙 BACK BUTTON: Going back from step', state.currentStep, 'to', state.currentStep - 1);
    console.log('🔙 BACK BUTTON: Current state:', {
      importId: state.importId,
      tokenRef: state.tokenRef,
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
  }, [state.currentStep, state.importId, state.tokenRef, state.selectedShopId, state.selectedBlueprint, state.selectedPreset]);

  const handleStep1Next = useCallback((data: {
    folderUrl: string;
    folderId: string;
    fileCount: number;
    sampleFiles: Array<{ id: string; name: string }>;
    importId: string;
  }) => {
    updateState({
      ...data,
      currentStep: 2,
    });
  }, [updateState]);

  const handleStep2Next = useCallback((data: {
    apiToken: string;
    tokenRef: string;
    shops: PrintifyShop[];
    shopId: number;
  }) => {
    updateState({
      ...data,
      selectedShopId: data.shopId,
      currentStep: 3,
    });
  }, [updateState]);

  const handleStep3Next = useCallback((blueprint: Blueprint) => {
    updateState({
      selectedBlueprint: blueprint,
      currentStep: 4,
    });
  }, [updateState]);

  const handleStep3PresetNext = useCallback((preset: Preset) => {
    // Quand un preset est sélectionné, on skip l'étape 4 et va directement au step 5 (mockups)
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
      shouldGenerateMockups: true, // Marquer qu'on doit générer les mockups
      currentStep: 4, // Aller aux mockups (renumbered from 5 to 4)
    });
  }, [updateState]);

  const handleStep3PrintifyProductNext = useCallback((product: PrintifyProduct) => {
    // Quand un produit Printify est sélectionné, on skip l'étape 4 et va directement au step 5 (mockups)
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
      shouldGenerateMockups: true, // Marquer qu'on doit générer les mockups
      currentStep: 4, // Aller aux mockups (renumbered from 5 to 4)
    });
  }, [updateState]);

  // handleStep4Next removed - Step 4 is now integrated into Step 3

  // Renamed from handleStep5Next to handleStep4Next (Mockups)
  const handleStep4Next = useCallback((files: SupabaseFile[]) => {
    updateState({
      files,
      shouldGenerateMockups: false, // Remettre à false après utilisation
      currentStep: 5, // Aller au preview final (renumbered from 6 to 5)
    });
  }, [updateState]);

  // Renamed from handleStep6Next to handleStep5Next (Preview)
  const handleStep5Next = useCallback((files: SupabaseFile[]) => {
    updateState({
      files,
      currentStep: 6, // Aller au process final (renumbered from 7 to 6)
    });
  }, [updateState]);

  const handleRestart = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            WeScale Import Wizard
          </h1>
          <p className="text-xl text-gray-600">
            Import your designs from Google Drive to Printify
          </p>
        </div>

        <Stepper currentStep={state.currentStep} skipStep3={false} />

        <div className="max-w-4xl mx-auto">
          {state.currentStep === 1 && (
            <Step1DriveFolder
              folderUrl={state.folderUrl}
              fileCount={state.fileCount}
              sampleFiles={state.sampleFiles}
              onNext={handleStep1Next}
            />
          )}

          {state.currentStep === 2 && (
            <Step2ChooseShop
              selectedShopId={state.selectedShopId}
              importId={state.importId}
              onNext={handleStep2Next}
              onBack={handleBack}
            />
          )}

          {state.currentStep === 3 && (
            <Step3ChooseBlueprint
              selectedBlueprint={state.selectedBlueprint}
              importId={state.importId}
              tokenRef={state.tokenRef}
              onNext={handleStep3Next}
              onPresetNext={handleStep3PresetNext}
              onPrintifyProductNext={handleStep3PrintifyProductNext}
              onBack={handleBack}
            />
          )}

          {/* Step 4 (Choose Print Provider) is now integrated into Step 3 for MVP */}

          {state.currentStep === 4 && (
            <Step4Mockups
              folderId={state.folderId}
              importId={state.importId}
              files={state.files}
              shouldGenerateMockups={state.shouldGenerateMockups}
              onNext={handleStep4Next}
              onBack={handleBack}
            />
          )}

          {state.currentStep === 5 && (
            <Step5Preview
              folderId={state.folderId}
              importId={state.importId}
              files={state.files}
              onNext={handleStep5Next}
              onBack={handleBack}
            />
          )}

          {state.currentStep === 6 && state.selectedShopId && (
            <Step6Process
              folderId={state.folderId}
              tokenRef={state.tokenRef}
              shopId={state.selectedShopId}
              importId={state.importId}
              fileCount={state.files.length}
              onRestart={handleRestart}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}
