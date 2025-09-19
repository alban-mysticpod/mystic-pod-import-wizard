'use client';

import { useState, useCallback } from 'react';
import { Stepper } from './Stepper';
import { Step1DriveFolder } from './steps/Step1DriveFolder';
import { Step2PrintifyToken } from './steps/Step2PrintifyToken';
import { Step3ChooseShop } from './steps/Step3ChooseShop';
import { Step4Preview } from './steps/Step4Preview';
import { Step5Process } from './steps/Step5Process';
import { WizardState, PrintifyShop, DriveFile } from '@/types';

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

  const handleStep4Next = useCallback((files: DriveFile[]) => {
    updateState({
      files,
      currentStep: 5,
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
              fileCount={state.fileCount}
              sampleFiles={state.sampleFiles}
              onNext={handleStep1Next}
            />
          )}

          {state.currentStep === 2 && (
            <Step2PrintifyToken
              apiToken={state.apiToken}
              tokenRef={state.tokenRef}
              shops={state.shops}
              onNext={handleStep2Next}
            />
          )}

          {state.currentStep === 3 && !shouldSkipStep3 && (
            <Step3ChooseShop
              tokenRef={state.tokenRef}
              shops={state.shops}
              selectedShopId={state.selectedShopId}
              onNext={handleStep3Next}
            />
          )}

          {state.currentStep === 4 && (
            <Step4Preview
              folderId={state.folderId}
              files={state.files}
              onNext={handleStep4Next}
            />
          )}

          {state.currentStep === 5 && (
            <Step5Process
              folderId={state.folderId}
              tokenRef={state.tokenRef}
              shopId={state.selectedShopId!}
              fileCount={state.files.length}
              onRestart={handleRestart}
            />
          )}
        </div>
      </div>
    </div>
  );
}
