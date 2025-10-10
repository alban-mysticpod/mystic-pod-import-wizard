export interface DriveValidateResponse {
  folderId: string;
  fileCount: number;
  sample: Array<{ id: string; name: string }>;
  message?: string;
}

export interface PrintifyShop {
  id: number;
  title: string;
  sales_channel: string;
}

export interface PrintifyTestResponse {
  shops: PrintifyShop[];
  tokenRef: string;
  message?: string;
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

// New types for blueprints and print providers
export interface Blueprint {
  id: number;
  provider: 'printify' | 'shopify';
  title: string;
  brand: string;
  model: string;
  description: string;
  images: string[];
  created_at: string;
}

export interface PrintProvider {
  id: number;
  blueprint_id: number;
  title: string;
  location: string | null;
  provider: 'printify' | 'shopify';
  created_at: string;
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
  selectedBlueprint: Blueprint | null;
  selectedPrintProviderId: number | null;
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
  { id: 4, title: 'Choose Blueprint', description: 'Select product template' },
  { id: 5, title: 'Choose Print Provider', description: 'Select print provider' },
  { id: 6, title: 'Preview Designs', description: 'Review your designs' },
  { id: 7, title: 'Import & Process', description: 'Import to Printify' },
] as const;
