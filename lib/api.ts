import {
  DriveValidateResponse,
  PrintifyTestResponse,
  DriveListResponse,
  FetchImagesResponse,
  ImportStartResponse,
  ImportToPrintifyResponse,
  ImportStatusEvent,
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

export async function testPrintifyToken(apiToken: string, importId: string): Promise<PrintifyTestResponse> {
  const userId = getUserId(); // Utiliser l'ID utilisateur existant
  
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

export async function chooseShop(tokenRef: string, shopId: number, importId: string): Promise<{ ok: true }> {
  const userId = getUserId(); // Utiliser l'ID utilisateur existant
  
  const response = await fetch(API_BASE.sessionChooseShop, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenRef, shopId, userId, importId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to choose shop: ${response.statusText}`);
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

export async function importToPrintify(
  folderId: string,
  tokenRef: string,
  shopId: number,
  importId: string
): Promise<ImportToPrintifyResponse> {
  const userId = getUserId(); // Utiliser l'ID utilisateur existant
  
  const response = await fetch(API_BASE.importToPrintify, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderId, tokenRef, shopId, userId, importId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to import to Printify: ${response.statusText}`);
  }

  return response.json();
}

export async function createPreset(blueprintId: number, importId: string): Promise<{ ok: true }> {
  const userId = getUserId(); // Utiliser l'ID utilisateur existant
  
  const response = await fetch('/api/create-preset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blueprintId, userId, importId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create preset: ${response.statusText}`);
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
