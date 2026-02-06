# Configuration des Publicités 💰

## Mode Développement (Actuel)

L'app utilise actuellement des **composants mock** dans `components/mock-ads.tsx` pour pouvoir fonctionner avec **Expo Go** sans build natif.

Les bannières affichent "📱 Ad Space (Dev Mode)" pour indiquer qu'il s'agit de composants de test.

## Activation des Vraies Publicités (Production)

Pour activer les vraies publicités AdMob, suivez ces étapes :

### 1. Créer un compte Google AdMob

1. Allez sur [admob.google.com](https://admob.google.com)
2. Créez un compte et une application
3. Créez des unités publicitaires :
   - **Banner** (bannière)
   - **Interstitial** (interstitielle plein écran)
4. Notez vos IDs d'unité publicitaire

### 2. Installer le package natif

```bash
npx expo install react-native-google-mobile-ads
```

### 3. Configurer app.json

Ajoutez la configuration AdMob dans `app.json` :

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY",
          "iosAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ"
        }
      ]
    ]
  }
}
```

### 4. Remplacer les imports dans le code

Dans les fichiers suivants :
- `app/(tabs)/index.tsx`
- `app/(tabs)/tasks.tsx`
- `app/(tabs)/stats.tsx`

**Remplacez :**
```typescript
import { BannerAd, BannerAdSize, TestIds } from '@/components/mock-ads';
```

**Par :**
```typescript
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
```

### 5. Remplacer les IDs de test

Dans les composants, remplacez `TestIds.BANNER` et `TestIds.INTERSTITIAL` par vos vrais IDs :

```typescript
<BannerAd
  unitId="ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY" // Votre ID de bannière
  size={BannerAdSize.FULL_BANNER}
/>
```

### 6. Build natif (obligatoire)

Les publicités natives nécessitent un build avec EAS :

```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter
eas login

# Configurer le projet
eas build:configure

# Build Android
eas build --platform android --profile preview

# Build iOS
eas build --platform ios --profile preview
```

### 7. Tester avec le build

Une fois le build terminé :
- **Android** : Téléchargez l'APK et installez-le
- **iOS** : Installez via TestFlight

## IDs de Test Google AdMob

Pour tester avec de vraies pubs sans générer de revenus (phase de test) :

- **Android Banner** : `ca-app-pub-3940256099942544/6300978111`
- **iOS Banner** : `ca-app-pub-3940256099942544/2934735716`
- **Android Interstitial** : `ca-app-pub-3940256099942544/1033173712`
- **iOS Interstitial** : `ca-app-pub-3940256099942544/4411468910`

## Notes Importantes

⚠️ **Ne jamais cliquer sur vos propres publicités** en production - cela peut entraîner un bannissement de votre compte AdMob.

✅ Utilisez toujours les **IDs de test** pendant le développement.

✅ Activez les **vraies publicités uniquement lors de la publication** sur les stores.

## Stratégie de Monétisation Actuelle

- **Bannières** : Sur chaque écran (Timer, Tasks, Stats)
- **Interstitielles** : Toutes les 3 sessions Pomodoro complétées
- **Fréquence** : Équilibrée pour ne pas gêner l'expérience utilisateur
