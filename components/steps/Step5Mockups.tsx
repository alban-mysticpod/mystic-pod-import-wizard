'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { fetchImages, createMockupJob, pollMockupJobResult } from '@/lib/api';
import { SupabaseFile } from '@/types';
import { formatFileCount } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Eye, Image as ImageIcon, RefreshCw } from 'lucide-react';

interface Step5Props {
  folderId: string;
  importId: string;
  files: SupabaseFile[];
  blueprintId: number | null; // Blueprint ID pour tracking des changements
  onNext: (files: SupabaseFile[]) => void;
  onBack?: () => void;
}

// Global map to track loading state across component re-renders
const loadingState = new Map<string, boolean>();

export function Step5Mockups({ folderId, importId, files, blueprintId, onNext, onBack }: Step5Props) {
  const [currentFiles, setCurrentFiles] = useState<SupabaseFile[]>(files);
  const [isLoading, setIsLoading] = useState(files.length === 0);
  const [error, setError] = useState('');

  const loadFiles = useCallback(async (forceGenerate: boolean = false) => {
    // Create unique key including blueprint ID to allow reloading when blueprint changes
    const loadKey = `${folderId}-${blueprintId || 'none'}`;
    
    // Check if this is the first time loading this blueprint
    const isFirstLoad = !loadingState.has(loadKey);
    
    // Check global loading state to prevent double calls
    if (loadingState.get(loadKey) && !forceGenerate) {
      console.log('🛑 Already loading files for key:', loadKey, '- skipping duplicate call');
      return;
    }

    loadingState.set(loadKey, true);
    setIsLoading(true);
    setError('');

    try {
      // Générer les mockups si:
      // 1. C'est la première fois (isFirstLoad)
      // 2. OU si forcé manuellement (forceGenerate)
      if (isFirstLoad || forceGenerate) {
        console.log('🔄 Creating mockup job:', isFirstLoad ? '(first load - auto)' : '(manual trigger)', 'importId:', importId);
        
        // Créer le job de mockup
        const jobResult = await createMockupJob(importId);
        console.log('✅ Mockup job created:', jobResult);
        
        if (jobResult.id) {
          // Polling pour attendre les résultats (sans afficher le statut à l'utilisateur)
          await pollMockupJobResult(importId, jobResult.id);
          
          console.log('✅ Mockup generation completed');
        }
      } else {
        console.log('ℹ️ Loading cached mockups (not first load, no manual regeneration)');
      }

      console.log('🖼️ Fetching files with mockups for folder:', folderId, 'importId:', importId);
      const result = await fetchImages(folderId, importId);
      console.log('✅ Files with mockups fetched:', result);
      setCurrentFiles(result.files);
    } catch (err) {
      console.error('❌ Failed to fetch files or generate mockups:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load files';
      setError(errorMessage);
      // Reset loading state on error to allow retry
      const loadKey = `${folderId}-${blueprintId || 'none'}`;
      loadingState.set(loadKey, false);
    } finally {
      setIsLoading(false);
    }
  }, [folderId, importId, blueprintId]);

  useEffect(() => {
    // Create unique key including blueprint ID to allow reloading when blueprint changes
    const loadKey = `${folderId}-${blueprintId || 'none'}`;
    
    // Only load if we have a folderId, no files yet, and haven't already loaded this key
    if (folderId && files.length === 0 && !loadingState.get(loadKey)) {
      loadFiles();
    }
  }, [folderId, blueprintId, files.length, loadFiles]);

  const handleNext = () => {
    onNext(currentFiles);
  };

  const handleRegenerateMockups = () => {
    // Reset loading state for current blueprint to allow regeneration
    const loadKey = `${folderId}-${blueprintId || 'none'}`;
    loadingState.set(loadKey, false);
    setError('');
    // Trigger reload with force generation
    loadFiles(true);
  };

  if (isLoading) {
    return (
      <Card
        title="Loading Mockup Previews"
        description="Generating mockup previews for your designs..."
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 mb-6">Creating mockup previews...</p>
          <p className="text-sm text-gray-500 mb-6">
            Mockups are optional - you can skip this step if you prefer to proceed directly to import.
          </p>
          
          {/* Skip button during loading */}
          <div className="flex justify-center gap-3">
            {onBack && (
              <Button onClick={onBack} variant="secondary" className="inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <Button 
              onClick={() => onNext(files)} 
              variant="secondary"
              className="inline-flex items-center gap-2"
            >
              Skip Mockups
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-6">
        {/* Header with title and button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Preview Mockups</h2>
            <p className="text-gray-600">
              {currentFiles.length > 0 
                ? `See how your ${formatFileCount(currentFiles.length)} will look on the selected product.`
                : "Loading your design mockups..."
              }
            </p>
          </div>
          {currentFiles.length > 0 && (
            <Button
              onClick={handleNext}
              disabled={currentFiles.length === 0 || isLoading}
              variant="success"
              size="lg"
              className="flex-shrink-0"
            >
              Continue to Final Preview
            </Button>
          )}
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Error loading mockups</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  Don't worry - mockups are optional. You can skip this step and proceed directly to import.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleRegenerateMockups}
                    variant="secondary"
                    size="sm"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={() => onNext(files)}
                    variant="secondary"
                    size="sm"
                    className="inline-flex items-center gap-1"
                  >
                    Skip Mockups
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentFiles.length > 0 && (
          <>
            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Eye className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Mockup Preview</p>
                  <p className="text-blue-700">
                    These mockups show how your designs will appear on the selected product. 
                    Each design is automatically positioned and scaled for the best result.
                  </p>
                </div>
              </div>
            </div>

            {/* Mockups List */}
            <div className="space-y-6">
              {currentFiles.map((file, index) => {
                const mockupImages = file.mockup_images || [];
                const isImage = file.file_name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/);
                
                return (
                  <div
                    key={file.id || index}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-8">
                      {/* Original Design - Left Side */}
                      <div className="flex-shrink-0">
                        <div className="text-center">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Original Design</h4>
                          <div className="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                            {isImage && file.storage_path ? (
                              <img
                                src={file.storage_path}
                                alt={file.file_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to icon if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center ${isImage ? 'hidden' : ''}`}>
                              <ImageIcon className="w-12 h-12 text-gray-400" />
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 truncate max-w-48" title={file.file_name}>
                            {file.file_name}
                          </p>
                          {file.width && file.height && (
                            <p className="text-xs text-gray-500">{file.width} × {file.height}px</p>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex-shrink-0">
                        <ArrowRight className="w-8 h-8 text-gray-400" />
                      </div>

                      {/* Mockup Images - Right Side */}
                      <div className="flex-1">
                        <div className="text-center mb-3">
                          <h4 className="text-sm font-medium text-gray-900">Product Mockups</h4>
                          <p className="text-xs text-gray-600">How it will look on the product</p>
                        </div>
                        
                        {mockupImages.length > 0 ? (
                          <div className="grid grid-cols-2 gap-3">
                            {mockupImages.slice(0, 4).map((mockupUrl, mockupIndex) => (
                              <div
                                key={mockupIndex}
                                className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
                              >
                                <img
                                  src={mockupUrl}
                                  alt={`Mockup ${mockupIndex + 1} for ${file.file_name}`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                  onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzVMMTI1IDEwMEgxMTJWMTI1SDg4VjEwMEg3NUwxMDAgNzVaIiBmaWxsPSIjOUI5QkEwIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QkEwIiBmb250LXNpemU9IjEyIj5Nb2NrdXAgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4K';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className="aspect-square bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center"
                              >
                                <div className="text-center">
                                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-xs text-gray-500">Mockup {i}</p>
                                  <p className="text-xs text-gray-400">Generating...</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {currentFiles.length === 0 && !error && (
          <div className="text-center py-8">
            <svg className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 mt-2">No mockups found for this design</p>
            <p className="text-sm text-gray-400 mt-1">Generate mockups to preview how your designs will look on the product</p>
            <Button
              onClick={handleRegenerateMockups}
              variant="primary"
              className="mt-4 inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Generate Mockups
            </Button>
          </div>
        )}

        <div className="flex justify-between gap-4">
          <div className="flex gap-3">
            {onBack && (
              <Button onClick={onBack} variant="secondary" size="lg" className="inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            {currentFiles.length > 0 && (
              <Button
                onClick={handleRegenerateMockups}
                variant="secondary"
                size="lg"
                disabled={isLoading}
                className="inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Regenerate Mockups
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => onNext(files)}
              variant="secondary"
              size="lg"
              className="inline-flex items-center gap-2"
            >
              Skip Mockups
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentFiles.length === 0 || isLoading}
              variant="success"
              size="lg"
            >
              Continue to Final Preview
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
