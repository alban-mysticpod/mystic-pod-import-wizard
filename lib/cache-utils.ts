// Utility functions for managing global caches across components

// Global cache references - these will be populated by components
export const globalCaches = {
  step3LoadingState: null as Map<string, boolean> | null,
  step5MockupsLoadingState: null as Map<string, boolean> | null,
  step6PreviewLoadingState: null as Map<string, boolean> | null,
  step4PrintProviderLoadingState: null as Map<string, boolean> | null,
  step2ValidationInProgress: null as Set<string> | null,
};

// Function to clear only blocking caches (preserves UX-positive data)
export function clearBlockingCaches() {
  console.log('🧹 SMART CLEANUP: Clearing only blocking caches (preserving UX data)');
  
  const clearedCaches: string[] = [];
  
  // Clear validation cache - this blocks new requests
  if (globalCaches.step2ValidationInProgress) {
    const size = globalCaches.step2ValidationInProgress.size;
    globalCaches.step2ValidationInProgress.clear();
    clearedCaches.push(`Step2Validation (${size} items)`);
    console.log('🧹 CLEARED: Validation cache that was blocking requests');
  }
  
  console.log('🧹 SMART CLEANUP: Cleared blocking caches:', clearedCaches.join(', '));
  console.log('✅ PRESERVED: User selections, connection states, and loaded data for better UX');
}

// Function to clear loading state caches (only when really needed)
export function clearLoadingCaches() {
  console.log('🧹 LOADING CLEANUP: Clearing loading state caches');
  
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
  
  console.log('🧹 LOADING CLEANUP: Cleared loading caches:', clearedCaches.join(', '));
}

// Legacy function for backward compatibility (now calls smart cleanup)
export function clearAllGlobalCaches() {
  console.log('🔄 LEGACY: clearAllGlobalCaches called, using smart cleanup instead');
  clearBlockingCaches();
}

// Function to register a cache with the global cache manager
export function registerGlobalCache(cacheName: keyof typeof globalCaches, cache: any) {
  globalCaches[cacheName] = cache;
  console.log('📝 CACHE REGISTRY: Registered cache', cacheName);
}
