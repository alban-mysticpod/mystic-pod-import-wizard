// Utility functions for managing global caches across components

// Global cache references - these will be populated by components
export const globalCaches = {
  step3LoadingState: null as Map<string, boolean> | null,
  step5MockupsLoadingState: null as Map<string, boolean> | null,
  step6PreviewLoadingState: null as Map<string, boolean> | null,
  step4PrintProviderLoadingState: null as Map<string, boolean> | null,
  step2ValidationInProgress: null as Set<string> | null,
};

// Function to clear all global caches
export function clearAllGlobalCaches() {
  console.log('🧹 CACHE CLEANUP: Clearing all global caches');
  
  const clearedCaches: string[] = [];
  
  if (globalCaches.step3LoadingState) {
    const size = globalCaches.step3LoadingState.size;
    globalCaches.step3LoadingState.clear();
    clearedCaches.push(`Step3 (${size} items)`);
  }
  
  if (globalCaches.step5MockupsLoadingState) {
    const size = globalCaches.step5MockupsLoadingState.size;
    globalCaches.step5MockupsLoadingState.clear();
    clearedCaches.push(`Step5Mockups (${size} items)`);
  }
  
  if (globalCaches.step6PreviewLoadingState) {
    const size = globalCaches.step6PreviewLoadingState.size;
    globalCaches.step6PreviewLoadingState.clear();
    clearedCaches.push(`Step6Preview (${size} items)`);
  }
  
  if (globalCaches.step4PrintProviderLoadingState) {
    const size = globalCaches.step4PrintProviderLoadingState.size;
    globalCaches.step4PrintProviderLoadingState.clear();
    clearedCaches.push(`Step4PrintProvider (${size} items)`);
  }
  
  if (globalCaches.step2ValidationInProgress) {
    const size = globalCaches.step2ValidationInProgress.size;
    globalCaches.step2ValidationInProgress.clear();
    clearedCaches.push(`Step2Validation (${size} items)`);
  }
  
  console.log('🧹 CACHE CLEANUP: Cleared caches:', clearedCaches.join(', '));
}

// Function to register a cache with the global cache manager
export function registerGlobalCache(cacheName: keyof typeof globalCaches, cache: any) {
  globalCaches[cacheName] = cache;
  console.log('📝 CACHE REGISTRY: Registered cache', cacheName);
}
