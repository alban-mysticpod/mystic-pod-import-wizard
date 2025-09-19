// Gestion simple des utilisateurs pour la session
const USER_ID_KEY = 'mystic-pod-user-id';

/**
 * Génère un nouvel ID utilisateur unique
 */
function generateUserId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `user_${timestamp}_${random}`;
}

/**
 * Obtient l'ID utilisateur depuis sessionStorage ou en crée un nouveau
 */
export function getUserId(): string {
  // Côté client : utiliser sessionStorage
  if (typeof window !== 'undefined') {
    let userId = sessionStorage.getItem(USER_ID_KEY);
    if (!userId) {
      userId = generateUserId();
      sessionStorage.setItem(USER_ID_KEY, userId);
      console.log('🆔 New user ID generated and stored:', userId);
    }
    return userId;
  }
  
  // Côté serveur : générer un ID temporaire (ne devrait pas arriver)
  const tempId = generateUserId();
  console.warn('⚠️ Generating temporary user ID on server side:', tempId);
  return tempId;
}

/**
 * Réinitialise l'ID utilisateur (pour les tests ou refresh)
 */
export function resetUserId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(USER_ID_KEY);
    console.log('🔄 User ID reset from sessionStorage');
  }
}

/**
 * Obtient l'ID utilisateur actuel sans en créer un nouveau
 */
export function getCurrentUserId(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem(USER_ID_KEY);
  }
  return null;
}
