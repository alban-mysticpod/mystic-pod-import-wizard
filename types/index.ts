export interface DriveValidateResponse {
  folderId: string;
  fileCount: number;
  sample: Array<{ id: string; name: string }>;
}

export interface PrintifyShop {
  id: number;
  title: string;
  sales_channel: string;
}

export interface PrintifyTestResponse {
  shops: PrintifyShop[];
  tokenRef: string;
}

export interface DriveFile {
  id: string;
  name: string;
  thumbnailUrl?: string;
  mimeType?: string;
  webViewLink?: string;
}

export interface DriveListResponse {
  files: DriveFile[];
}

export interface FetchImagesResponse {
  files: DriveFile[];
  totalCount: number;
}

export interface ImportStartResponse {
  session: string;
}

export interface ImportToPrintifyResponse {
  success: boolean;
  message?: string;
  importedCount?: number;
  errors?: string[];
}

export interface ImportStatusEvent {
  type: 'progress' | 'done' | 'error';
  message: string;
  index?: number;
  total?: number;
}

export interface WizardState {
  currentStep: number;
  folderUrl: string;
  folderId: string;
  fileCount: number;
  sampleFiles: Array<{ id: string; name: string }>;
  apiToken: string;
  tokenRef: string;
  shops: PrintifyShop[];
  selectedShopId: number | null;
  files: DriveFile[];
  session: string;
  importProgress: number;
  importLogs: string[];
  isComplete: boolean;
  error: string | null;
}

export const STEPS = [
  { id: 1, title: 'Google Drive Folder', description: 'Share your design folder' },
  { id: 2, title: 'Printify API Token', description: 'Connect your Printify account' },
  { id: 3, title: 'Choose Shop', description: 'Select your Printify shop' },
  { id: 4, title: 'Preview Designs', description: 'Review your designs' },
  { id: 5, title: 'Import & Process', description: 'Import to Printify' },
] as const;
