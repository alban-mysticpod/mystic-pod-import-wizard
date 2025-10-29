export interface DriveValidateResponse {
  folderId: string;
  fileCount: number;
  sample: Array<{ id: string; name: string }>;
  importId: string; // ID de l'import créé dans Supabase
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

// New Supabase file structure
export interface SupabaseFile {
  id: string;
  user_id: string;
  source: string; // Required: "drive"
  drive_file_id?: string | null;
  drive_folder_id?: string | null;
  storage_path: string; // Required
  file_name: string; // Required
  file_ext?: string | null;
  file_bytes?: number | null;
  width: number; // Required
  height: number; // Required
  checksum?: string | null;
  mockup_images?: string[] | null; // Array d'URLs des images de mockup (4 en général)
  created_at: string;
}

export interface DriveListResponse {
  files: DriveFile[];
}

export interface FetchImagesResponse {
  files: SupabaseFile[]; // Changed to use new Supabase structure
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

export interface ApiToken {
  id: string;
  user_id: string;
  provider: 'printify' | 'shopify';
  token_ref: string;
  name?: string | null;
  created_at: string;
  last_used_at: string | null;
}

// Store types (from stores table)
export interface Store {
  id: string;
  user_id: string;
  name: string;
  provider: 'printify' | 'shopify';
  shop_id: string; // External shop ID (Printify shop_id, etc.) - column name in Supabase
  api_token: string; // Foreign key to api_tokens table (column name in Supabase)
  is_default: boolean; // Only one default shop per provider
  created_at: string;
}

// Print Area types
export interface PrintArea {
  id: string;
  blueprint_id: number;
  print_provider_id: number;
  name: string;
  width: number;
  height: number;
  placeholders: {
    width: number;
    height: number;
    position: string;
  };
  created_at: string;
}

// Preset types
export interface PlacementConfig {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface PresetPlacements {
  [key: string]: PlacementConfig;
}

export interface Preset {
  id: string;
  user_id: string;
  name: string;
  provider: 'printify' | 'shopify';
  blueprint_id: number;
  print_provider_id: number;
  visibility: 'private' | 'public';
  favorite: boolean; // Indique si le preset est sauvegardé en favori par l'utilisateur
  created_at: string;
  updated_at: string;
  placements: PresetPlacements;
}

export interface PresetWithDetails extends Preset {
  blueprint?: Blueprint;
  print_provider?: PrintProvider;
}

export interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  blueprint_id: number;
  print_provider_id: number;
  variants: Array<{
    id: number;
    price: number;
    is_enabled: boolean;
  }>;
  print_areas: Array<{
    variant_ids: number[];
    placeholders: Array<{
      position: string;
      height: number;
      width: number;
    }>;
  }>;
  images: Array<{
    src: string;
    variant_ids: number[];
    position: string;
    is_default: boolean;
  }>;
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  blueprint?: {
    id: number;
    title: string;
    brand: string;
    model: string;
    images: Array<{
      src: string;
      variant_ids: number[];
      position: string;
    }>;
  };
}

export interface ListPrintifyProductsResponse {
  products: PrintifyProduct[];
  total_number_of_products: number;
  current_page: number;
  next_page: number | null;
  last_page: number;
}

export interface WizardState {
  currentStep: number;
  folderUrl: string;
  folderId: string;
  fileCount: number;
  sampleFiles: Array<{ id: string; name: string }>;
  importId: string; // ID de l'import pour tracking
  apiToken: string;
  shops: PrintifyShop[];
  selectedShopId: number | null;
  selectedBlueprint: Blueprint | null;
  selectedPrintProviderId: number | null;
  selectedPreset: Preset | null; // Preset sélectionné pour skip les étapes
  selectedPrintifyProduct: PrintifyProduct | null; // Produit Printify sélectionné pour import
  files: SupabaseFile[];
  session: string;
  importProgress: number;
  importLogs: string[];
  isComplete: boolean;
  error: string | null;
  pushToShopify: boolean; // Flag to push products to Shopify after Printify import
}

export const STEPS = [
  { id: 1, title: 'Google Drive Folder', description: 'Share your design folder' },
  // Step 2 (Choose Shop) REMOVED - integrated into Step 1 with ShopSelector
  { id: 2, title: 'Choose Blueprint', description: 'Select product template' },
  { id: 3, title: 'Preview Mockups', description: 'See how designs will look' },
  { id: 4, title: 'Preview Designs', description: 'Review your designs' },
  { id: 5, title: 'Import & Process', description: 'Import to Printify' },
] as const;
