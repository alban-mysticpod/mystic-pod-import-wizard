'use client';

import { useState, useCallback } from 'react';
import { Stepper } from './Stepper';
import { Step1DriveFolder } from './steps/Step1DriveFolder';
import { Step2ChooseShop } from './steps/Step2ChooseShop';
import { Step3ChooseBlueprint } from './steps/Step3ChooseBlueprint';
import { Step4ChoosePrintProvider } from './steps/Step4ChoosePrintProvider';
import { Step5Mockups } from './steps/Step5Mockups';
import { Step6Preview } from './steps/Step6Preview';
import { Step7Process } from './steps/Step7Process';
import { WizardState, PrintifyShop, SupabaseFile, Blueprint, Preset } from '@/types';

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
  files: [],
  session: '',
  importProgress: 0,
  importLogs: [],
  isComplete: false,
  error: null,
};

export function Wizard() {
  const [state, setState] = useState<WizardState>(initialState);

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Generic back handler
  const handleBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep - 1,
    }));
  }, []);

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
      currentStep: 5, // Skip step 4 (print provider selection) et aller aux mockups
    });
  }, [updateState]);

  const handleStep4Next = useCallback((printProviderId: number) => {
    updateState({
      selectedPrintProviderId: printProviderId,
      currentStep: 5, // Aller aux mockups
    });
  }, [updateState]);

  const handleStep5Next = useCallback((files: SupabaseFile[]) => {
    updateState({
      files,
      currentStep: 6, // Aller au preview final
    });
  }, [updateState]);

  const handleStep6Next = useCallback((files: SupabaseFile[]) => {
    updateState({
      files,
      currentStep: 7, // Aller au process final
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
            Mystic POD Import Wizard
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
              onNext={handleStep3Next}
              onPresetNext={handleStep3PresetNext}
              onBack={handleBack}
            />
          )}

          {state.currentStep === 4 && state.selectedBlueprint && (
            <Step4ChoosePrintProvider
              blueprint={state.selectedBlueprint}
              selectedPrintProviderId={state.selectedPrintProviderId}
              importId={state.importId}
              onNext={handleStep4Next}
              onBack={handleBack}
            />
          )}

          {state.currentStep === 5 && (
            <Step5Mockups
              folderId={state.folderId}
              importId={state.importId}
              files={state.files}
              onNext={handleStep5Next}
              onBack={handleBack}
            />
          )}

          {state.currentStep === 6 && (
            <Step6Preview
              folderId={state.folderId}
              importId={state.importId}
              files={state.files}
              onNext={handleStep6Next}
              onBack={handleBack}
            />
          )}

          {state.currentStep === 7 && state.selectedShopId && (
            <Step7Process
              folderId={state.folderId}
              tokenRef={state.tokenRef}
              shopId={state.selectedShopId}
              importId={state.importId}
              fileCount={state.fileCount}
              onRestart={handleRestart}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}
