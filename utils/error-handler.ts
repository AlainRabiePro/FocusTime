/**
 * Traduit les codes d'erreur Firebase en messages utilisateur français
 * et masque les détails techniques pour une meilleure UX
 */

export const getErrorMessage = (error: any): string => {
  if (!error) {
    return 'Une erreur inconnue s\'est produite. Veuillez réessayer.';
  }

  // Si c'est un string d'erreur
  if (typeof error === 'string') {
    return error;
  }

  // Récupérer le code d'erreur Firebase
  const errorCode = error.code || error.message || '';

  // Erreurs d'authentification Firebase
  const authErrorMap: { [key: string]: string } = {
    // Erreurs de connexion
    'auth/user-not-found': 'Cet e-mail n\'existe pas. Veuillez créer un compte.',
    'auth/wrong-password': 'Le mot de passe est incorrect. Veuillez réessayer.',
    'auth/invalid-email': 'L\'adresse e-mail n\'est pas valide.',
    'auth/user-disabled': 'Ce compte a été désactivé. Contactez le support.',
    
    // Erreurs d'inscription
    'auth/email-already-in-use': 'Cet e-mail est déjà associé à un compte.',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
    'auth/invalid-password': 'Le mot de passe n\'est pas valide.',
    
    // Erreurs de réseau
    'auth/network-request-failed': 'Problème de connexion. Vérifiez votre réseau.',
    'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.',
    'auth/operation-not-allowed': 'Cette opération n\'est pas disponible.',
    
    // Erreurs Firestore
    'permission-denied': 'Vous n\'avez pas l\'accès à cette ressource.',
    'not-found': 'La ressource n\'a pas pu être trouvée.',
    'already-exists': 'Cette ressource existe déjà.',
    'failed-precondition': 'Certaines conditions ne sont pas respectées.',
    'aborted': 'L\'opération a été interrompue. Veuillez réessayer.',
    'unavailable': 'Le service n\'est pas disponible actuellement.',
    'internal': 'Une erreur interne s\'est produite.',
    'data-loss': 'Une perte de données a été détectée.',
    
    // Erreurs réseau générales
    'network-request-failed': 'Problème de connexion. Vérifiez votre réseau.',
  };

  // Vérifier le code d'erreur dans la map
  if (authErrorMap[errorCode]) {
    return authErrorMap[errorCode];
  }

  // Si le code contient une clé partielle
  for (const [code, message] of Object.entries(authErrorMap)) {
    if (errorCode.includes(code)) {
      return message;
    }
  }

  // Message par défaut pour les erreurs non gérées
  if (errorCode.includes('network') || errorCode.includes('Network')) {
    return 'Problème de connexion. Vérifiez votre réseau.';
  }

  if (errorCode.includes('auth') || errorCode.includes('Auth')) {
    return 'Une erreur d\'authentification s\'est produite. Veuillez réessayer.';
  }

  // Message générique
  return 'Une erreur s\'est produite. Veuillez réessayer.';
};

/**
 * Gère les erreurs d'authentification Firebase
 */
export const handleAuthError = (error: any): string => {
  console.error('Auth Error:', error);
  return getErrorMessage(error);
};

/**
 * Gère les erreurs Firestore
 */
export const handleFirestoreError = (error: any): string => {
  console.error('Firestore Error:', error);
  return getErrorMessage(error);
};

/**
 * Gère les erreurs générales
 */
export const handleError = (error: any, context: string = ''): string => {
  console.error(`Error in ${context}:`, error);
  return getErrorMessage(error);
};
