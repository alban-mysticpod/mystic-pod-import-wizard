'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { fetchImages } from '@/lib/api';
import { DriveFile } from '@/types';
import { formatFileCount } from '@/lib/utils';
import { Upload, RefreshCw } from 'lucide-react';

interface Step4Props {
  folderId: string;
  files: DriveFile[];
  onNext: (files: DriveFile[]) => void;
}

export function Step4Preview({ folderId, files, onNext }: Step4Props) {
  const [currentFiles, setCurrentFiles] = useState<DriveFile[]>(files);
  const [isLoading, setIsLoading] = useState(files.length === 0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (files.length === 0 && folderId) {
      loadFiles();
    }
  }, [folderId, files.length]);

  const loadFiles = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('🖼️ Fetching files for folder:', folderId);
      const result = await fetchImages(folderId);
      console.log('✅ Files fetched:', result);
      setCurrentFiles(result.files);
    } catch (err) {
      console.error('❌ Failed to fetch files:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load files';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    onNext(currentFiles);
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
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <h3 className="font-medium text-gray-900 mb-3">Files to be processed:</h3>
              <div className="space-y-2">
                {currentFiles.map((file, index) => (
                  <div
                    key={file.id || index}
                    className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm border"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {file.mimeType?.includes('image') ? (
                          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        {file.mimeType && (
                          <p className="text-xs text-gray-500">
                            {file.mimeType}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ready
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Upload className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Ready to import:</p>
                  <p className="text-blue-700">
                    {formatFileCount(currentFiles.length)} will be uploaded to your Printify shop.
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

        <div className="flex justify-between">
          <Button
            onClick={loadFiles}
            variant="secondary"
            loading={isLoading}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Files
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentFiles.length === 0 || isLoading}
            variant="success"
            size="lg"
          >
            Import {currentFiles.length > 0 ? currentFiles.length : ''} files to Printify
          </Button>
        </div>
      </div>
    </Card>
  );
}