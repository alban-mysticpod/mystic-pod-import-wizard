// Gestion simple des utilisateurs pour la session
const USER_ID_KEY = 'mystic-pod-user-id';

// ID utilisateur fixe pour les tests (sera remplacé par l'authentification plus tard)
const FIXED_USER_ID = 'user_test';

/**
 * Génère un nouvel ID utilisateur unique
 * NOTE: Actuellement retourne un ID fixe pour les tests
 */
function generateUserId(): string {
  // Pour l'instant, on utilise un ID fixe
  return FIXED_USER_ID;
  
  // Code original pour génération aléatoire (à réactiver plus tard avec auth)
  // const timestamp = Date.now();
  // const random = Math.random().toString(36).substring(2, 8);
  // return `user_${timestamp}_${random}`;
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
      console.log('🆔 User ID stored:', userId);
    }
    return userId;
  }
  
  // Côté serveur : retourner l'ID fixe
  return FIXED_USER_ID;
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
  return FIXED_USER_ID;
}
