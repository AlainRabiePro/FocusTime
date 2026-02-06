# Focus Timer Pro 🍅

Une application de productivité basée sur la technique Pomodoro avec gestion des tâches et statistiques.

## ✨ Fonctionnalités

### ⏱️ Minuteur Pomodoro
- Minuteur de focus personnalisable (25 min par défaut)
- Pauses courtes et longues
- Notifications vibratoires à la fin de chaque session
- Animation de pulse pendant le focus
- Interface intuitive et élégante

### ✅ Gestion des Tâches
- Créer et suivre vos tâches
- Marquer les tâches comme complétées
- Compteur de pomodoros par tâche
- Interface simple et efficace

### 📊 Statistiques
- Suivi quotidien, hebdomadaire et total
- Graphiques des 7 derniers jours
- Insights personnalisés sur votre productivité
- Moyenne quotidienne

### ⚙️ Paramètres Avancés
- **Mode sombre/clair/auto** : Choix du thème d'interface
- **Durées personnalisables** : Ajustez les durées de focus et pauses
- **Sons et vibrations** : Activez/désactivez les notifications
- **Export de données** : Sauvegardez vos données
- **Réinitialisation** : Remise à zéro des paramètres ou données

### � Firebase & Cloud Sync
- **Authentification** : Créez un compte avec email/password
- **Synchronisation** : Vos données sont sauvegardées dans le cloud
- **Multi-appareils** : Accédez à vos données depuis plusieurs appareils
- **Sécurisé** : Chaque utilisateur a ses propres données protégées
- **Initialisation facile** : Bouton pour créer toutes les collections nécessaires

### �💰 Monétisation
- Bannières publicitaires AdMob sur chaque écran
- Publicités interstitielles tous les 3 sessions complétées
- Mode développement avec composants mock (voir [PUBLICITES.md](PUBLICITES.md))

## Installation

```bash
npm install
```

## Configuration Firebase

**Important** : Avant de lancer l'app, configurez Firebase :

1. Suivez les instructions dans [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
2. Remplacez les valeurs dans `config/firebase.ts` avec votre configuration Firebase
3. Configurez les règles de sécurité Firestore

## Lancement

```bash
npm start
```

Puis scannez le QR code avec Expo Go (Android) ou la caméra (iOS).

## Configuration pour Production

### 1. Remplacer les IDs AdMob de test

Dans les fichiers suivants, remplacez les IDs de test par vos IDs AdMob réels :
- `app/(tabs)/index.tsx`
- `app/(tabs)/tasks.tsx`
- `app/(tabs)/stats.tsx`
- `app.json`

### 2. Créer un compte AdMob

1. Créez un compte sur [Google AdMob](https://admob.google.com)
2. Créez une application
3. Créez des unités publicitaires (Banner et Interstitiel)
4. Copiez vos IDs d'application et d'unité publicitaire

### 3. Mettre à jour app.json

Modifiez dans `app.json` :
- `expo.android.package` : votre package unique (ex: com.votreentreprise.focustimer)
- `expo.ios.bundleIdentifier` : votre bundle ID unique
- Les IDs AdMob dans les plugins

### 4. Build pour publication

**Android:**
```bash
eas build --platform android
```

**iOS:**
```bash
eas build --platform ios
```

## Technologies

- React Native
- Expo
- TypeScript
- AsyncStorage
- AdMob (expo-ads-admob)

