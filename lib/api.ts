import {
  DriveValidateResponse,
  PrintifyTestResponse,
  DriveListResponse,
  FetchImagesResponse,
  ImportStartResponse,
  ImportToPrintifyResponse,
  ImportStatusEvent,
  ListPrintifyProductsResponse,
  PrintifyShop,
} from '@/types';
import { getUserId } from '@/lib/user';

const API_BASE = {
  driveValidate: '/api/validate-folder', // API locale pour Google Drive
  printifyTest: '/api/validate-token', // API locale pour Printify Token
  sessionChooseShop: '/api/choose-shop', // API locale pour Choose Shop
  fetchImages: '/api/fetch-images', // API locale pour Fetch Images
  importToPrintify: '/api/import-to-printify', // API locale pour Import to Printify
  driveList: process.env.NEXT_PUBLIC_WEBHOOK_DRIVE_LIST!,
  printifyImportStart: process.env.NEXT_PUBLIC_WEBHOOK_PRINTIFY_IMPORT_START!,
  printifyImportStatus: process.env.NEXT_PUBLIC_WEBHOOK_PRINTIFY_IMPORT_STATUS!,
};

export async function validateDriveFolder(folderUrl: string): Promise<DriveValidateResponse> {
  const userId = getUserId(); // Récupérer ou créer l'ID utilisateur
  
  const response = await fetch(API_BASE.driveValidate, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderUrl, userId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to validate folder: ${response.statusText}`);
  }

  return response.json();
}

// Vérifier un token Printify - retourne maintenant un record apiToken
export async function verifyPrintifyToken(apiToken: string, userId: string, importId: string, name?: string): Promise<{ id: string; token_ref: string }> {
  const response = await fetch('/api/validate-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiToken, userId, importId, name }),
  });

  if (!response.ok) {
    throw new Error(`Failed to verify API token: ${response.statusText}`);
  }

  return response.json();
}

// Logger le token API sélectionné
export async function logPrintifyApiToken(apiTokenId: string, importId: string): Promise<void> {
  const userId = getUserId();
  
  const response = await fetch('/api/log-printify-api-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiTokenId, userId, importId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to log API token: ${response.statusText}`);
  }
}

// Lister les shops associés au token
export async function listPrintifyShops(importId: string): Promise<{ shops: PrintifyShop[] }> {
  const userId = getUserId();
  
  const response = await fetch('/api/list-printify-shops', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, importId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to list shops: ${response.statusText}`);
  }

  return response.json();
}

// Fonction legacy pour compatibilité (sera supprimée)
export async function testPrintifyToken(apiToken: string, importId: string): Promise<PrintifyTestResponse> {
  console.warn('⚠️ testPrintifyToken is deprecated, use verifyPrintifyToken + logPrintifyApiToken + listPrintifyShops instead');
  
  // Pour l'instant, on garde l'ancien comportement
  const userId = getUserId();
  
  const response = await fetch(API_BASE.printifyTest, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiToken, userId, importId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to test API token: ${response.statusText}`);
  }

  return response.json();
}

export async function chooseShop(
  apiTokenId: string, 
  shopId: string, 
  userId: string, 
  importId: string, 
  isDefault: boolean
): Promise<{ success: true; store: any }> {
  const response = await fetch(API_BASE.sessionChooseShop, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiTokenId, shopId, userId, importId, isDefault }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`Failed to choose shop: ${errorData.error || response.statusText}`);
  }

  return response.json();
}

export async function fetchImages(folderId: string, importId: string): Promise<FetchImagesResponse> {
  const userId = getUserId(); // Utiliser l'ID utilisateur existant
  
  const response = await fetch(API_BASE.fetchImages, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderId, userId, importId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch images: ${response.statusText}`);
  }

  return response.json();
}

export async function listDriveFiles(folderId: string): Promise<DriveListResponse> {
  const response = await fetch(API_BASE.driveList, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to list files: ${response.statusText}`);
  }

  return response.json();
}

// Déclencher l'import vers Printify - retourne maintenant un record import
export async function importToPrintify(
  folderId: string,
  tokenRef: string,
  shopId: number,
  importId: string
): Promise<{ id: string; status: string }> {
  const userId = getUserId();
  
  const response = await fetch(API_BASE.importToPrintify, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderId, tokenRef, shopId, userId, importId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start import to Printify: ${response.statusText}`);
  }

  return response.json();
}

// Récupérer le statut d'un import
export async function getImportStatus(importId: string): Promise<any> {
  const userId = getUserId();
  
  const response = await fetch('/api/get-import-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ importId, userId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get import status: ${response.statusText}`);
  }

  return response.json();
}

// Polling du statut d'import avec les mêmes délais que les mockups
export async function pollImportStatus(
  importId: string,
  onProgress?: (status: { status: string; processed: number; total: number; successful: number; failed: number }) => void
): Promise<any> {
  const delays = [7000, 10000]; // 7s pour la première fois, puis 10s
  let delayIndex = 0;
  let attempts = 0;
  const maxAttempts = 10; // Maximum 10 attempts

  const poll = async (): Promise<any> => {
    attempts++;
    
    try {
      console.log(`🔄 Polling import status (attempt ${attempts}/${maxAttempts})`);
      const result = await getImportStatus(importId);
      
      // Le résultat est un array, on prend le premier élément
      const importRecord = Array.isArray(result) ? result[0] : result;
      
      if (!importRecord) {
        throw new Error('No import record found');
      }
      
      // Check if import is completed
      if (importRecord.status === 'completed') {
        console.log('✅ Import completed successfully');
        return importRecord;
      }
      
      // Check if import failed
      if (importRecord.status === 'failed' || importRecord.status === 'error') {
        console.error('❌ Import failed:', importRecord);
        throw new Error(importRecord.error_message || 'Import failed');
      }
      
      // Import is still in progress
      if (onProgress) {
        onProgress({
          status: importRecord.status || 'processing',
          processed: importRecord.processed || 0,
          total: importRecord.total || 0,
          successful: importRecord.successful || 0,
          failed: importRecord.failed || 0
        });
      }
      
      // Check if we've reached max attempts
      if (attempts >= maxAttempts) {
        throw new Error('Import polling timeout - maximum attempts reached');
      }
      
      // Calculate delay: 7s first time, then always 10s
      const currentDelay = delayIndex === 0 ? delays[0] : delays[1];
      if (delayIndex === 0) {
        delayIndex = 1; // Après la première fois, on reste à l'index 1 (10s)
      }
      
      console.log(`⏳ Import still processing, waiting ${currentDelay}ms before next poll...`);
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      
      // Recursive call
      return poll();
      
    } catch (error) {
      console.error('❌ Error polling import status:', error);
      throw error;
    }
  };

  return poll();
}

export async function assignPreset(blueprintId: number, importId: string, presetId?: string): Promise<{ ok: true }> {
  const userId = getUserId(); // Utiliser l'ID utilisateur existant
  
  const payload: any = { blueprintId, userId, importId };
  if (presetId) {
    payload.presetId = presetId;
  }
  
  const response = await fetch('/api/assign-preset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to assign preset: ${response.statusText}`);
  }

  return response.json();
}

export async function selectPrintProvider(printProviderId: number, importId: string): Promise<{ ok: true }> {
  const userId = getUserId(); // Utiliser l'ID utilisateur existant
  
  const response = await fetch('/api/select-print-provider', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ printProviderId, userId, importId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to select print provider: ${response.statusText}`);
  }

  return response.json();
}

export async function listPrintifyProducts(tokenRef: string, importId: string, page: number = 1): Promise<ListPrintifyProductsResponse> {
  const userId = getUserId();
  const response = await fetch('/api/list-printify-products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenRef, userId, importId, page }),
  });

  if (!response.ok) {
    throw new Error(`Failed to list Printify products: ${response.statusText}`);
  }

  return response.json();
}

export async function createPresetFromPrintifyProduct(productId: string, importId: string): Promise<{ preset: any }> {
  const userId = getUserId();
  const response = await fetch('/api/create-preset-from-printify-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, userId, importId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create preset from Printify product: ${response.statusText}`);
  }

  return response.json();
}

// Create a mockup job
export async function createMockupJob(importId: string): Promise<any> {
  const response = await fetch('/api/mockup-jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      importId, 
      action: 'create' 
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create mockup job: ${response.statusText}`);
  }

  return response.json();
}

// Get mockup job result
export async function getMockupJobResult(importId: string, mockupJobId: string): Promise<any> {
  const response = await fetch('/api/mockup-jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      importId, 
      action: 'getResult',
      mockupJobId 
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get mockup job result: ${response.statusText}`);
  }

  return response.json();
}

// Polling function with exponential backoff
export async function pollMockupJobResult(
  importId: string, 
  mockupJobId: string,
  onProgress?: (status: string) => void
): Promise<any> {
  const delays = [7000, 10000]; // 7s pour la première fois, puis 10s
  let delayIndex = 0;
  let attempts = 0;
  const maxAttempts = 10; // Maximum 10 attempts (timeout after ~3-4 minutes)

  const poll = async (): Promise<any> => {
    attempts++;
    
    try {
      console.log(`🔄 Polling mockup job result (attempt ${attempts}/${maxAttempts})`);
      const result = await getMockupJobResult(importId, mockupJobId);
      
      // Check if job is completed
      if (result.status === 'completed') {
        console.log('✅ Mockup job completed successfully');
        return result;
      }
      
      // Check if job failed
      if (result.status === 'failed' || result.status === 'error') {
        console.error('❌ Mockup job failed:', result);
        throw new Error(result.error || 'Mockup job failed');
      }
      
      // Job is still in progress
      if (onProgress) {
        onProgress(result.status || 'processing');
      }
      
      // Check if we've reached max attempts
      if (attempts >= maxAttempts) {
        throw new Error('Mockup job polling timeout - maximum attempts reached');
      }
      
      // Calculate delay: 7s first time, then always 10s
      const currentDelay = delayIndex === 0 ? delays[0] : delays[1];
      if (delayIndex === 0) {
        delayIndex = 1; // Après la première fois, on reste à l'index 1 (10s)
      }
      
      console.log(`⏳ Job still processing, waiting ${currentDelay}ms before next poll...`);
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      
      // Recursive call
      return poll();
      
    } catch (error) {
      console.error('❌ Error polling mockup job:', error);
      throw error;
    }
  };

  return poll();
}

// Legacy function for backward compatibility (will be removed)
export async function generateMockupImages(importId: string): Promise<{ ok: true }> {
  console.warn('⚠️ generateMockupImages is deprecated, use createMockupJob instead');
  return createMockupJob(importId);
}

export interface UserStats {
  totalImports: number;
  successfulImports: number;
  designsUploaded: number;
  recentActivity: Array<{
    id: string;
    importId: string;
    eventType: string;
    message: string | null;
    severity: string;
    createdAt: string;
  }>;
}

export async function fetchUserStats(): Promise<UserStats> {
  const response = await fetch('/api/user/stats');

  if (!response.ok) {
    throw new Error(`Failed to fetch user stats: ${response.statusText}`);
  }

  return response.json();
}

export async function startImport(
  tokenRef: string,
  folderId: string,
  shopId: number
): Promise<ImportStartResponse> {
  const response = await fetch(API_BASE.printifyImportStart, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenRef, folderId, shopId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start import: ${response.statusText}`);
  }

  return response.json();
}

export function subscribeToImportStatus(
  session: string,
  onEvent: (event: ImportStatusEvent) => void,
  onError: (error: Error) => void
): () => void {
  const url = `${API_BASE.printifyImportStatus}?session=${session}`;
  
  // Try SSE first, fallback to polling
  if (typeof EventSource !== 'undefined') {
    const eventSource = new EventSource(url);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ImportStatusEvent;
        onEvent(data);
      } catch (err) {
        onError(new Error('Failed to parse SSE data'));
      }
    };

    eventSource.onerror = () => {
      onError(new Error('SSE connection failed'));
    };

    return () => eventSource.close();
  } else {
    // Polling fallback
    let isPolling = true;
    
    const poll = async () => {
      while (isPolling) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const event = await response.json() as ImportStatusEvent;
            onEvent(event);
            if (event.type === 'done' || event.type === 'error') {
              break;
            }
          }
        } catch (err) {
          onError(err as Error);
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };

    poll();
    return () => { isPolling = false; };
  }
}
