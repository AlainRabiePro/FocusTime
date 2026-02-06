# Configuration Firebase

## Étapes pour configurer Firebase

### 1. Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Ajouter un projet"
3. Nommez votre projet (ex: "focus-timer-pro")
4. Suivez les étapes de configuration

### 2. Activer l'authentification

1. Dans votre projet Firebase, allez dans **Authentication**
2. Cliquez sur "Commencer"
3. Activez **Email/Password** dans les méthodes de connexion

### 3. Créer une base de données Firestore

1. Allez dans **Firestore Database**
2. Cliquez sur "Créer une base de données"
3. Choisissez "Démarrer en mode test" (pour le développement)
4. Sélectionnez une région proche de vous

### 4. Ajouter votre app

1. Dans les paramètres du projet, cliquez sur "Ajouter une application"
2. Sélectionnez "Web" (🌐)
3. Donnez un nom à votre app
4. **Copiez la configuration Firebase**

### 5. Configurer l'app

Remplacez les valeurs dans `config/firebase.ts` :

```typescript
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};
```

### 6. Règles de sécurité Firestore

Dans Firestore, allez dans **Règles** et ajoutez :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permettre l'accès uniquement aux données de l'utilisateur connecté
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Structure des collections Firebase

L'app créera automatiquement ces collections :

```
users/
  {userId}/
    config/
      settings/          # Paramètres Pomodoro
    tasks/              # Collection des tâches
      {taskId}
    sessions/           # Collection des sessions complétées
      {sessionId}
```

## Utilisation dans l'app

1. **Créer un compte** : Utilisez l'écran d'authentification
2. **Initialiser Firebase** : Allez dans Settings > Firebase & Account > "🚀 Initialize Firebase Collections"
3. **Commencer à utiliser** : Les données seront maintenant synchronisées avec Firebase !

## Fonctionnalités

- ✅ Authentification email/password
- ✅ Synchronisation en temps réel
- ✅ Données sécurisées par utilisateur
- ✅ Accès depuis plusieurs appareils
- ✅ Backup automatique

## Migration des données locales vers Firebase

Si vous aviez des données locales, vous pouvez les exporter depuis Settings avant de basculer vers Firebase, puis les importer manuellement si nécessaire.
