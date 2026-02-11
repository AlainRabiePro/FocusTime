# 💻 Exemples d'utilisation - Gestion des erreurs

## Import

```typescript
import { getErrorMessage, handleAuthError, handleFirestoreError } from '@/utils/error-handler';
```

## 1. Authentification

### Exemple 1 : Login
```typescript
const handleLogin = async (email: string, password: string) => {
  try {
    const user = await signIn(email, password);
    // ✅ Succès - Utilisateur connecté
  } catch (error: any) {
    // Les erreurs Firebase sont automatiquement en français par signIn()
    Alert.alert('⚠️ Erreur', error.message);
  }
};
```

### Exemple 2 : Inscription
```typescript
const handleSignup = async (email: string, password: string, name: string) => {
  try {
    const user = await signUp(email, password, name);
    Alert.alert('✅ Succès', 'Compte créé avec succès !');
  } catch (error: any) {
    // Erreurs traduites automatiquement
    Alert.alert('⚠️ Erreur', error.message);
  }
};
```

### Exemple 3 : Logout
```typescript
const handleLogout = async () => {
  try {
    await signOut();
    Alert.alert('✅ Succès', 'Déconnexion réussie');
  } catch (error: any) {
    Alert.alert('⚠️ Erreur', getErrorMessage(error));
  }
};
```

## 2. Opérations sur les tâches

### Ajouter une tâche
```typescript
const addTask = async (title: string) => {
  try {
    const newTask = await addFirebaseTask(title, 'high');
    console.log('Tâche créée:', newTask);
  } catch (error) {
    // L'erreur est automatiquement en français
    console.error('Erreur:', error.message);
    Alert.alert('⚠️ Erreur', error.message);
  }
};
```

### Supprimer une tâche
```typescript
const deleteTask = async (taskId: string) => {
  try {
    await deleteFirebaseTask(taskId);
    console.log('Tâche supprimée');
  } catch (error) {
    Alert.alert('⚠️ Erreur', error.message);
  }
};
```

### Mettre à jour une tâche
```typescript
const updateTask = async (taskId: string, completed: boolean) => {
  try {
    await updateFirebaseTask(taskId, { completed });
    console.log('Tâche mise à jour');
  } catch (error) {
    Alert.alert('⚠️ Erreur', error.message);
  }
};
```

## 3. Sessions

### Sauvegarder une session
```typescript
const saveSession = async (session: Session) => {
  try {
    await saveFirebaseSession(session);
    Alert.alert('✅ Succès', 'Session sauvegardée');
  } catch (error) {
    Alert.alert('⚠️ Erreur', error.message);
  }
};
```

## 4. Paramètres

### Charger les paramètres
```typescript
const loadSettings = async () => {
  try {
    const settings = await getFirebaseSettings();
    return settings;
  } catch (error) {
    console.error('Erreur lors du chargement:', error.message);
    // Retourner les paramètres par défaut
    return DEFAULT_SETTINGS;
  }
};
```

### Sauvegarder les paramètres
```typescript
const saveSettings = async (newSettings: Settings) => {
  try {
    await saveFirebaseSettings(newSettings);
    Alert.alert('✅ Succès', 'Paramètres sauvegardés');
  } catch (error) {
    Alert.alert('⚠️ Erreur', error.message);
  }
};
```

## 5. Gestion générique des erreurs

### Utiliser getErrorMessage() directement
```typescript
const handleError = (error: any, context: string) => {
  const userMessage = getErrorMessage(error);
  const debugMessage = `${context}: ${error.message}`;
  
  // Afficher à l'utilisateur (français)
  Alert.alert('⚠️ Erreur', userMessage);
  
  // Logger pour le debug (détails techniques)
  console.error(debugMessage);
};
```

## 6. Async/Await avec gestion d'erreur complète

```typescript
const loadUserData = async () => {
  try {
    setLoading(true);
    
    // Charger les tâches
    const tasks = await getFirebaseTasks();
    
    // Charger les sessions
    const sessions = await getFirebaseSessions();
    
    // Charger les paramètres
    const settings = await getFirebaseSettings();
    
    // Tout est chargé
    setTasks(tasks);
    setSessions(sessions);
    setSettings(settings);
    
  } catch (error: any) {
    // Afficher un message convivial en français
    const message = getErrorMessage(error);
    Alert.alert('⚠️ Erreur de chargement', message);
    
    // Log le détail pour le debug
    console.error('Full error:', error);
    
  } finally {
    setLoading(false);
  }
};
```

## 7. Gestion d'erreur avec contexte

```typescript
const performOperation = async (operation: string, fn: () => Promise<void>) => {
  try {
    await fn();
    Alert.alert('✅ Succès', `${operation} a réussi`);
  } catch (error) {
    const message = getErrorMessage(error);
    Alert.alert(`⚠️ Erreur - ${operation}`, message);
    console.error(`Erreur dans ${operation}:`, error);
  }
};

// Utilisation
await performOperation('Création de compte', () => signUp(email, password, name));
```

## 8. Validation + Gestion d'erreur

```typescript
const handleFormSubmit = async (email: string, password: string, confirmPassword: string) => {
  // Validation locale
  if (!email || !password) {
    Alert.alert('⚠️ Erreur', 'Veuillez remplir tous les champs');
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert('⚠️ Erreur', 'Les mots de passe ne correspondent pas');
    return;
  }

  if (password.length < 6) {
    Alert.alert('⚠️ Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
    return;
  }

  // Validation Firebase (retourne message en français)
  try {
    await signUp(email, password);
    Alert.alert('✅ Succès', 'Compte créé avec succès !');
  } catch (error) {
    Alert.alert('⚠️ Erreur', error.message); // Déjà en français
  }
};
```

## 9. Chaînage de promesses

```typescript
getFirebaseTasks()
  .then(tasks => {
    setTasks(tasks);
    return getFirebaseSessions();
  })
  .then(sessions => {
    setSessions(sessions);
    return getFirebaseSettings();
  })
  .then(settings => {
    setSettings(settings);
    console.log('✅ Tous les données chargées');
  })
  .catch(error => {
    // Message en français
    const message = getErrorMessage(error);
    Alert.alert('⚠️ Erreur', message);
    console.error('Full error:', error);
  });
```

## 10. Retry logic avec gestion d'erreur

```typescript
const retryOperation = async (
  operation: () => Promise<any>,
  maxRetries: number = 3
): Promise<any> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) {
        // Dernière tentative échouée
        throw new Error(getErrorMessage(error));
      }
      // Attendre avant de réessayer
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Utilisation
try {
  await retryOperation(() => signIn(email, password));
} catch (error) {
  Alert.alert('⚠️ Erreur', error.message);
}
```

## 📝 Pattern recommandé

```typescript
// Pattern général recommandé
const handleSomeAction = async () => {
  try {
    setLoading(true);
    
    // Faire quelque chose
    const result = await someAsyncOperation();
    
    // Succès
    Alert.alert('✅ Succès', 'L\'opération s\'est déroulée correctement');
    
  } catch (error: any) {
    // Gestion d'erreur - message en français
    Alert.alert('⚠️ Erreur', getErrorMessage(error));
    
    // Log pour debug (détails techniques)
    console.error('Operation failed:', error);
    
  } finally {
    setLoading(false);
  }
};
```

## 🎨 Format des messages

### ✅ Succès
```typescript
Alert.alert('✅ Succès', 'Message de succès en français');
```

### ⚠️ Erreur
```typescript
Alert.alert('⚠️ Erreur', getErrorMessage(error));
```

### ℹ️ Information
```typescript
Alert.alert('ℹ️ Information', 'Message informatif en français');
```

### 🔄 Action
```typescript
Alert.alert('🔄 Opération', 'Message d\'opération en français');
```

---

**Conseil** : Toujours utiliser `getErrorMessage(error)` pour afficher les erreurs à l'utilisateur, et garder le `error` brut dans les logs pour le debugging.
