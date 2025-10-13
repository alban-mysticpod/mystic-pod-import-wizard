'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { fetchImages } from '@/lib/api';
import { SupabaseFile } from '@/types';
import { formatFileCount } from '@/lib/utils';
import { Upload, RefreshCw, ArrowLeft, Check, Image as ImageIcon, Settings } from 'lucide-react';

interface Step6Props {
  folderId: string;
  importId: string;
  files: SupabaseFile[];
  onNext: (files: SupabaseFile[]) => void;
  onBack?: () => void;
}

// Global map to track loading state across component re-renders
const loadingState = new Map<string, boolean>();

export function Step6Preview({ folderId, importId, files, onNext, onBack }: Step6Props) {
  const [currentFiles, setCurrentFiles] = useState<SupabaseFile[]>(files);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(files.length === 0);
  const [error, setError] = useState('');

  const loadFiles = useCallback(async () => {
    // Check global loading state to prevent double calls
    if (loadingState.get(folderId)) {
      console.log('🛑 Already loading files for folder:', folderId, '- skipping duplicate call');
      return;
    }

    loadingState.set(folderId, true);
    setIsLoading(true);
    setError('');

    try {
      console.log('🖼️ Fetching files for folder:', folderId, 'importId:', importId);
      const result = await fetchImages(folderId, importId);
      console.log('✅ Files fetched:', result);
      setCurrentFiles(result.files);
    } catch (err) {
      console.error('❌ Failed to fetch files:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load files';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      // Keep the loading state as true to prevent future calls for the same folder
      // loadingState.set(folderId, true); // Already set above
    }
  }, [folderId, importId]);

  useEffect(() => {
    // Only load if we have a folderId, no files yet, and haven't already loaded this folder
    if (folderId && files.length === 0 && !loadingState.get(folderId)) {
      loadFiles();
    }
  }, [folderId, files.length, loadFiles]);

  const handleNext = () => {
    // Only pass selected files, or all files if none selected
    const filesToProcess = selectedFiles.size > 0 
      ? currentFiles.filter(file => selectedFiles.has(file.id))
      : currentFiles;
    onNext(filesToProcess);
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const selectAllFiles = () => {
    setSelectedFiles(new Set(currentFiles.map(file => file.id)));
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  if (isLoading) {
    return (
      <Card
        title="Loading Your Designs"
        description="Fetching your design files from Google Drive..."
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your design files...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Preview Your Designs"
      description={currentFiles.length > 0 
        ? `Review the ${formatFileCount(currentFiles.length)} that will be imported to Printify.`
        : "Loading your design files..."
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading files</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <Button
                  onClick={loadFiles}
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentFiles.length > 0 && (
          <>
            {/* Selection Controls */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <h3 className="font-medium text-gray-900">
                  {selectedFiles.size > 0 
                    ? `${selectedFiles.size} of ${currentFiles.length} selected`
                    : `${currentFiles.length} designs ready`
                  }
                </h3>
                {selectedFiles.size > 0 && (
                  <Button
                    onClick={clearSelection}
                    variant="secondary"
                    size="sm"
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={selectAllFiles}
                  variant="secondary"
                  size="sm"
                >
                  Select All
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="inline-flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Bulk Actions
                </Button>
              </div>
            </div>

            {/* Design Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {currentFiles.map((file, index) => {
                const isSelected = selectedFiles.has(file.id);
                const isImage = file.file_name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/);
                
                return (
                  <div
                    key={file.id || index}
                    className={`relative bg-white rounded-lg border-2 transition-all cursor-pointer hover:shadow-lg ${
                      isSelected 
                        ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleFileSelection(file.id)}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 right-2 z-10">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-500 text-white' 
                          : 'bg-white border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Image Preview */}
                    <div className="aspect-square rounded-t-lg bg-gray-100 relative overflow-hidden">
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
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-gray-900 truncate mb-1" title={file.file_name}>
                        {file.file_name}
                      </h4>
                      <div className="text-xs text-gray-500 space-y-1">
                        {file.width && file.height && (
                          <p>{file.width} × {file.height}px</p>
                        )}
                        {file.file_bytes && (
                          <p>{Math.round(file.file_bytes / 1024)}KB</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ready
                          </span>
                          {file.source && (
                            <span className="text-gray-400 capitalize">{file.source}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Upload className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Ready to import:</p>
                  <p className="text-blue-700">
                    {selectedFiles.size > 0 
                      ? `${formatFileCount(selectedFiles.size)} selected file${selectedFiles.size !== 1 ? 's' : ''}`
                      : formatFileCount(currentFiles.length)
                    } will be uploaded to your Printify shop.
                    This process may take a few minutes depending on file sizes.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {currentFiles.length === 0 && !error && (
          <div className="text-center py-8">
            <svg className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 mt-2">No files found</p>
            <Button
              onClick={loadFiles}
              variant="secondary"
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
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
            <Button
              onClick={loadFiles}
              variant="secondary"
              loading={isLoading}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Files
            </Button>
          </div>
          <Button
            onClick={handleNext}
            disabled={currentFiles.length === 0 || isLoading}
            variant="success"
            size="lg"
          >
            Import {selectedFiles.size > 0 ? selectedFiles.size : currentFiles.length} {selectedFiles.size > 0 ? 'selected' : ''} files to Printify
          </Button>
        </div>
      </div>
    </Card>
  );
}