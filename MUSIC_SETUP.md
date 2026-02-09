# Configuration pour l'affichage de la musique

L'app affiche maintenant la musique en cours de lecture pendant les sessions de focus.

## ⚠️ Configuration requise

Cette fonctionnalité nécessite des **modules natifs** et ne fonctionne pas directement avec Expo Go.

### Options pour utiliser cette fonctionnalité :

#### Option 1 : Build de développement Expo (Recommandé)
```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter à Expo
eas login

# Créer un build de développement
eas build --profile development --platform ios
eas build --profile development --platform android
```

#### Option 2 : Prebuild Expo
```bash
# Générer les dossiers natifs
npx expo prebuild

# Lancer sur iOS
npx expo run:ios

# Lancer sur Android
npx expo run:android
```

## 📱 Permissions requises

### iOS (Info.plist)
Ajoutez dans `ios/yourapp/Info.plist` :
```xml
<key>NSAppleMusicUsageDescription</key>
<string>Pour afficher la musique que vous écoutez pendant vos sessions</string>
```

### Android (AndroidManifest.xml)
Ajoutez dans `android/app/src/main/AndroidManifest.xml` :
```xml
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
```

## 🎵 Fonctionnalités

- Affiche le titre et l'artiste de la musique en cours
- Fonctionne avec Spotify, Apple Music, YouTube Music, etc.
- S'affiche uniquement pendant les sessions actives
- Design minimaliste qui ne distrait pas

## 🔧 Pour désactiver

Si vous ne souhaitez pas utiliser cette fonctionnalité, vous pouvez :
1. Désinstaller le package : `npm uninstall react-native-music-control`
2. Supprimer les imports et le code lié dans `app/(tabs)/index.tsx`
