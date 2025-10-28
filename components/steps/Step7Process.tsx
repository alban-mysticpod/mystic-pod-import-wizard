'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { importToPrintify, pollImportStatus } from '@/lib/api';
import { CheckCircle, XCircle, ExternalLink, RotateCcw, Package, ArrowLeft } from 'lucide-react';

interface Step7Props {
  folderId: string;
  shopId: number;
  importId: string;
  fileCount: number;
  onRestart: () => void;
  onBack?: () => void;
}

type ImportState = 'importing' | 'success' | 'error';

// Global map to track import state across component re-renders
const importState = new Map<string, boolean>();

export function Step7Process({ folderId, shopId, importId, fileCount, onRestart, onBack }: Step7Props) {
  const [currentState, setCurrentState] = useState<ImportState>('importing');
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState<any>(null);
  const [importProgress, setImportProgress] = useState({ processed: 0, total: 0, successful: 0, failed: 0 });

  const startImport = useCallback(async () => {
    // Create a unique key for this import session
    const importKey = `${folderId}-${shopId}-${importId}`;
    
    // Check global import state to prevent double calls
    if (importState.get(importKey)) {
      console.log('🛑 Already importing for key:', importKey, '- skipping duplicate call');
      return;
    }

    importState.set(importKey, true);
    setCurrentState('importing');
    setError('');
    setImportProgress({ processed: 0, total: 0, successful: 0, failed: 0 });

    try {
      console.log('🚀 Starting import to Printify... importId:', importId);
      
      // Étape 1: Déclencher l'import (retourne juste un record import avec ID)
      const importRecord = await importToPrintify(folderId, shopId, importId);
      console.log('✅ Import job started:', importRecord);
      
      // Étape 2: Polling du statut avec progress updates
      const finalResult = await pollImportStatus(importId, (progress) => {
        console.log('📊 Import progress:', progress);
        setImportProgress(progress);
      });
      
      console.log('✅ Import completed:', finalResult);
      setImportResult(finalResult);
      setCurrentState('success');
    } catch (err) {
      console.error('❌ Import failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      setError(errorMessage);
      setCurrentState('error');
      // Reset import state on error to allow retry
      importState.set(importKey, false);
    }
  }, [folderId, shopId, importId]);

  useEffect(() => {
    // Start import immediately when component mounts
    const importKey = `${folderId}-${shopId}-${importId}`;
    if (!importState.get(importKey)) {
      startImport();
    }
  }, [folderId, shopId, importId, startImport]);

  if (currentState === 'importing') {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <Package className="h-8 w-8 text-blue-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Importing Your Designs</h2>
          <p className="text-gray-600 mb-6">
            We're uploading {fileCount} files to your Printify shop. This may take a few minutes...
          </p>
          
          {/* Progress information */}
          {importProgress.total > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <div className="text-sm text-blue-800 space-y-2">
                <div className="flex justify-between">
                  <span>Progress:</span>
                  <span className="font-medium">{importProgress.processed} / {importProgress.total}</span>
                </div>
                {importProgress.successful > 0 && (
                  <div className="flex justify-between">
                    <span>Successful:</span>
                    <span className="font-medium text-green-600">{importProgress.successful}</span>
                  </div>
                )}
                {importProgress.failed > 0 && (
                  <div className="flex justify-between">
                    <span>Failed:</span>
                    <span className="font-medium text-red-600">{importProgress.failed}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Loading animation */}
          <div className="flex justify-center mb-6">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            Please don't close this window while the import is in progress.
          </p>
        </div>
      </Card>
    );
  }

  if (currentState === 'success') {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎉 Import Successful!</h2>
          
          <p className="text-gray-600 mb-6">
            Your designs have been successfully imported to your Printify shop.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-green-800 space-y-2">
              <div className="flex justify-between">
                <span>Successfully imported:</span>
                <span className="font-bold text-lg text-green-600">{importResult?.successful || 0}</span>
              </div>
              {importResult?.failed > 0 && (
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className="font-medium text-red-600">{importResult.failed}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Total processed:</span>
                <span className="font-medium">{importResult?.processed || 0}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              as="a"
              href="https://printify.com/app/store/products"
              target="_blank"
              rel="noopener noreferrer"
              variant="success"
              size="lg"
              className="inline-flex items-center"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              View Your Products on Printify
            </Button>
            
            <div className="text-center">
              <Button
                onClick={onRestart}
                variant="secondary"
                className="inline-flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Import More Designs
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              🎨 Your designs are now ready to be used on products in your Printify shop!
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (currentState === 'error') {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Import Failed</h2>
          
          <p className="text-gray-600 mb-6">
            We encountered an error while importing your designs to Printify.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 font-medium mb-2">Error Details:</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center gap-3">
              {onBack && (
                <Button onClick={onBack} variant="secondary" size="lg" className="inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              <Button
                onClick={() => {
                  // Réinitialiser le state global pour permettre un nouveau retry
                  const importKey = `${folderId}-${tokenRef}-${shopId}`;
                  importState.set(importKey, false);
                  startImport();
                }}
                variant="primary"
                size="lg"
                className="inline-flex items-center"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Try Again
              </Button>
            </div>
            
            <div className="text-center">
              <Button
                onClick={onRestart}
                variant="secondary"
                className="inline-flex items-center"
              >
                Start Over
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              If the problem persists, please check your Printify API token and shop settings.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}