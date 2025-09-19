import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function extractFolderIdFromUrl(url: string): string | null {
  // Extract folder ID from various Google Drive URL formats
  const patterns = [
    /\/folders\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export function validateGoogleDriveUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  
  // Vérifier que c'est bien une URL Google Drive
  if (!url.includes('drive.google.com')) return false;
  
  // Vérifier que c'est bien un dossier (pas un fichier)
  if (!url.includes('/folders/') && !url.includes('folder')) return false;
  
  // Vérifier qu'on peut extraire un ID
  return extractFolderIdFromUrl(url) !== null;
}

export function formatFileCount(count: number): string {
  if (count === 1) return '1 file';
  return `${count} files`;
}

export function truncateFilename(filename: string, maxLength: number = 30): string {
  if (filename.length <= maxLength) return filename;
  const extension = filename.split('.').pop();
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  const truncated = nameWithoutExt.substring(0, maxLength - extension!.length - 4);
  return `${truncated}...${extension}`;
}
