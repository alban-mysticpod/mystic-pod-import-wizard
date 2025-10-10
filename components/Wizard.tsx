'use client';

import { useState, useCallback } from 'react';
import { Stepper } from './Stepper';
import { Step1DriveFolder } from './steps/Step1DriveFolder';
import { Step2PrintifyToken } from './steps/Step2PrintifyToken';
import { Step3ChooseShop } from './steps/Step3ChooseShop';
import { Step4ChooseBlueprint } from './steps/Step4ChooseBlueprint';
import { Step5ChoosePrintProvider } from './steps/Step5ChoosePrintProvider';
import { Step6Preview } from './steps/Step6Preview';
import { Step7Process } from './steps/Step7Process';
import { WizardState, PrintifyShop, DriveFile, Blueprint } from '@/types';

const initialState: WizardState = {
  currentStep: 1,
  folderUrl: '',
  folderId: '',
  fileCount: 0,
  sampleFiles: [],
  apiToken: '',
  tokenRef: '',
  shops: [],
  selectedShopId: null,
  selectedBlueprint: null,
  selectedPrintProviderId: null,
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

  const handleStep1Next = useCallback((data: {
    folderUrl: string;
    folderId: string;
    fileCount: number;
    sampleFiles: Array<{ id: string; name: string }>;
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
  }) => {
    const nextStep = data.shops.length > 1 ? 3 : 4;
    const selectedShopId = data.shops.length === 1 ? data.shops[0].id : null;
    
    updateState({
      ...data,
      selectedShopId,
      currentStep: nextStep,
    });
  }, [updateState]);

  const handleStep3Next = useCallback((shopId: number) => {
    updateState({
      selectedShopId: shopId,
      currentStep: 4,
    });
  }, [updateState]);

  const handleStep4Next = useCallback((blueprint: Blueprint) => {
    updateState({
      selectedBlueprint: blueprint,
      currentStep: 5,
    });
  }, [updateState]);

  const handleStep5Next = useCallback((printProviderId: number) => {
    updateState({
      selectedPrintProviderId: printProviderId,
      currentStep: 6,
    });
  }, [updateState]);

  const handleStep6Next = useCallback((files: DriveFile[]) => {
    updateState({
      files,
      currentStep: 7,
    });
  }, [updateState]);

  const handleRestart = useCallback(() => {
    setState(initialState);
  }, []);

  const shouldSkipStep3 = state.shops.length <= 1;

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

        <Stepper currentStep={state.currentStep} skipStep3={shouldSkipStep3} />

        <div className="max-w-4xl mx-auto">
          {state.currentStep === 1 && (
            <Step1DriveFolder
              folderUrl={state.folderUrl}
              onNext={handleStep1Next}
            />
          )}

          {state.currentStep === 2 && (
            <Step2PrintifyToken
              apiToken={state.apiToken}
              onNext={handleStep2Next}
            />
          )}

          {state.currentStep === 3 && (
            <Step3ChooseShop
              shops={state.shops}
              selectedShopId={state.selectedShopId}
              tokenRef={state.tokenRef}
              onNext={handleStep3Next}
            />
          )}

          {state.currentStep === 4 && (
            <Step4ChooseBlueprint
              selectedBlueprint={state.selectedBlueprint}
              onNext={handleStep4Next}
            />
          )}

          {state.currentStep === 5 && state.selectedBlueprint && (
            <Step5ChoosePrintProvider
              blueprint={state.selectedBlueprint}
              selectedPrintProviderId={state.selectedPrintProviderId}
              onNext={handleStep5Next}
            />
          )}

          {state.currentStep === 6 && (
            <Step6Preview
              folderId={state.folderId}
              files={state.files}
              onNext={handleStep6Next}
            />
          )}

          {state.currentStep === 7 && state.selectedShopId && (
            <Step7Process
              folderId={state.folderId}
              tokenRef={state.tokenRef}
              shopId={state.selectedShopId}
              fileCount={state.fileCount}
              onRestart={handleRestart}
            />
          )}
        </div>
      </div>
    </div>
  );
}
