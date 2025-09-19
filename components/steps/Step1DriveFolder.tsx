'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { validateGoogleDriveUrl, formatFileCount } from '@/lib/utils';
import { validateDriveFolder } from '@/lib/api';
import { FolderOpen, CheckCircle } from 'lucide-react';

interface Step1Props {
  folderUrl: string;
  fileCount: number;
  sampleFiles: Array<{ id: string; name: string }>;
  onNext: (data: { folderUrl: string; folderId: string; fileCount: number; sampleFiles: Array<{ id: string; name: string }> }) => void;
}

export function Step1DriveFolder({ folderUrl, fileCount, sampleFiles, onNext }: Step1Props) {
  const [url, setUrl] = useState(folderUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationResult, setValidationResult] = useState<{
    folderId: string;
    fileCount: number;
    sampleFiles: Array<{ id: string; name: string }>;
  } | null>(fileCount > 0 ? { folderId: '', fileCount, sampleFiles } : null);

  const handleValidate = async () => {
    // Validation stricte : vérifier si le champ est vide
    if (!url.trim()) {
      setError('Please enter a Google Drive folder URL');
      return;
    }

    // Validation du format URL Google Drive
    if (!validateGoogleDriveUrl(url)) {
      setError('Please enter a valid Google Drive folder URL (must contain drive.google.com/drive/folders/)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🚀 Sending request to webhook:', url);
      const result = await validateDriveFolder(url);
      console.log('📦 Raw webhook response:', result);
      console.log('📦 Response type:', typeof result);
      console.log('📦 Response keys:', Object.keys(result || {}));
      
      // Vérifier la structure de la réponse
      if (!result) {
        throw new Error('Empty response from webhook');
      }
      
      if (result.message === 'Workflow was started') {
        throw new Error('Workflow started but no validation data received. The n8n workflow might be asynchronous.');
      }
      
      // Vérifier que les champs requis sont présents
      if (!result.folderId || typeof result.fileCount !== 'number') {
        console.error('❌ Invalid response structure:', {
          hasFolderId: !!result.folderId,
          fileCountType: typeof result.fileCount,
          hasSample: !!result.sample
        });
        throw new Error(`Invalid response format. Expected {folderId, fileCount, sample} but got: ${JSON.stringify(result)}`);
      }
      
      console.log('✅ Valid response structure detected');
      setValidationResult({
        folderId: result.folderId,
        fileCount: result.fileCount,
        sampleFiles: result.sample || [],
      });
    } catch (err) {
      console.error('❌ Webhook error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate folder. Please check your URL and try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (validationResult) {
      onNext({
        folderUrl: url,
        folderId: validationResult.folderId,
        fileCount: validationResult.fileCount,
        sampleFiles: validationResult.sampleFiles,
      });
    }
  };

  return (
    <Card
      title="Connect Your Google Drive Folder"
      description="Share your design folder with alban@mysticpod.com and paste the folder URL below."
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <FolderOpen className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Important:</p>
              <p className="text-blue-700">
                Make sure your Google Drive folder is shared with{' '}
                <strong>alban@mysticpod.com</strong> with "Editor" permissions.
              </p>
            </div>
          </div>
        </div>

        <Input
          label="Google Drive Folder URL"
          placeholder="https://drive.google.com/drive/folders/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={error}
          helperText="Paste the full URL of your Google Drive folder containing your designs"
        />

        {validationResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-900 mb-2">
                  Folder validated successfully!
                </p>
                <p className="text-green-700 mb-3">
                  Found {formatFileCount(validationResult.fileCount)} in your folder.
                </p>
                {validationResult.sampleFiles.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-800 mb-1">Sample files:</p>
                    <ul className="text-sm text-green-700 space-y-1">
                      {validationResult.sampleFiles.slice(0, 3).map((file) => (
                        <li key={file.id} className="truncate">• {file.name}</li>
                      ))}
                      {validationResult.sampleFiles.length > 3 && (
                        <li className="text-green-600">
                          + {validationResult.sampleFiles.length - 3} more files
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            onClick={handleValidate}
            loading={isLoading}
            disabled={!url.trim()}
          >
            {validationResult ? 'Re-validate Folder' : 'Validate Folder'}
          </Button>
          {validationResult && (
            <Button onClick={handleNext} variant="success">
              Continue
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
