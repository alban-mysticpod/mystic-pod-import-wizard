'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { importToPrintify } from '@/lib/api';
import { CheckCircle, XCircle, ExternalLink, RotateCcw, Package } from 'lucide-react';

interface Step5Props {
  folderId: string;
  tokenRef: string;
  shopId: number;
  fileCount: number;
  onRestart: () => void;
}

type ImportState = 'importing' | 'success' | 'error';

export function Step5Process({ folderId, tokenRef, shopId, fileCount, onRestart }: Step5Props) {
  const [importState, setImportState] = useState<ImportState>('importing');
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState<any>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const startImport = useCallback(async () => {
    setImportState('importing');
    setError('');

    try {
      console.log('🚀 Starting import to Printify...');
      const result = await importToPrintify(folderId, tokenRef, shopId);
      console.log('✅ Import completed:', result);
      
      setImportResult(result);
      setImportState('success');
    } catch (err) {
      console.error('❌ Import failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      setError(errorMessage);
      setImportState('error');
    }
  }, [folderId, tokenRef, shopId]); // Supprimé importState de la dépendance

  useEffect(() => {
    // Éviter les appels multiples (React Strict Mode peut causer des doubles appels)
    if (!hasStarted) {
      setHasStarted(true);
      startImport();
    }
  }, [hasStarted, startImport]);

  if (importState === 'importing') {
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

  if (importState === 'success') {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎉 Import Successful!</h2>
          
          <p className="text-gray-600 mb-6">
            Your {fileCount} design files have been successfully imported to your Printify shop.
          </p>

          {importResult?.importedCount && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>{importResult.importedCount}</strong> files imported successfully
              </p>
              {importResult.message && (
                <p className="text-xs text-green-700 mt-1">{importResult.message}</p>
              )}
            </div>
          )}

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

  if (importState === 'error') {
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
            <Button
              onClick={() => {
                setHasStarted(false); // Réinitialiser le flag pour permettre un nouveau retry
                startImport();
              }}
              variant="primary"
              size="lg"
              className="inline-flex items-center"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Try Again
            </Button>
            
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