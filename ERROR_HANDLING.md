# Système de Gestion des Erreurs - Documentation

## 📋 Vue d'ensemble

Un système de gestion des erreurs robuste a été implémenté pour offrir une expérience utilisateur fluide en traduisant tous les messages d'erreur techniques en français et en masquant les détails techniques qui pourraient déranger l'utilisateur.

## 🎯 Objectifs

- ✅ Traduire tous les messages d'erreur Firebase en français
- ✅ Masquer les codes d'erreur techniques (`auth/network-request-failed`, etc.)
- ✅ Fournir des messages clairs et utiles à l'utilisateur
- ✅ Centraliser la gestion des erreurs dans un seul module
- ✅ Améliorer l'UX en ne montrant que des messages en français

## 📁 Structure

### `utils/error-handler.ts`
Fichier principal contenant les fonctions de gestion des erreurs :

```typescript
getErrorMessage(error: any): string
```
Traduit un code d'erreur Firebase en message français utilisateur.

```typescript
handleAuthError(error: any): string
```
Gère les erreurs d'authentification (login, signup, logout).

```typescript
handleFirestoreError(error: any): string
```
Gère les erreurs Firestore (base de données).

```typescript
handleError(error: any, context: string): string
```
Fonction générique pour gérer n'importe quel type d'erreur.

## 🔄 Flux d'erreur

### Exemple 1 : Erreur d'authentification

```
Utilisateur essaie de se connecter avec un mauvais mot de passe
         ↓
Firebase retourne: { code: 'auth/wrong-password' }
         ↓
getErrorMessage() traduit en: "Le mot de passe est incorrect. Veuillez réessayer."
         ↓
Alert.alert() affiche le message en français à l'utilisateur
```

### Exemple 2 : Erreur réseau

```
Firebase rencontre une perte de connexion
         ↓
Firebase retourne: { code: 'auth/network-request-failed' }
         ↓
getErrorMessage() traduit en: "Problème de connexion. Vérifiez votre réseau."
         ↓
Utilisateur comprend que c'est un problème de connexion
```

## 📝 Messages d'erreur traduits

### Authentification
| Code Firebase | Message Français |
|---|---|
| `auth/user-not-found` | Cet e-mail n'existe pas. Veuillez créer un compte. |
| `auth/wrong-password` | Le mot de passe est incorrect. Veuillez réessayer. |
| `auth/invalid-email` | L'adresse e-mail n'est pas valide. |
| `auth/user-disabled` | Ce compte a été désactivé. Contactez le support. |
| `auth/email-already-in-use` | Cet e-mail est déjà associé à un compte. |
| `auth/weak-password` | Le mot de passe doit contenir au moins 6 caractères. |

### Réseau
| Code Firebase | Message Français |
|---|---|
| `auth/network-request-failed` | Problème de connexion. Vérifiez votre réseau. |
| `auth/too-many-requests` | Trop de tentatives. Veuillez réessayer plus tard. |

### Base de données
| Code Firebase | Message Français |
|---|---|
| `permission-denied` | Vous n'avez pas l'accès à cette ressource. |
| `not-found` | La ressource n'a pas pu être trouvée. |
| `unavailable` | Le service n'est pas disponible actuellement. |

## 🔧 Intégration dans le code

### Avant (mauvais - messages en anglais/techniques)
```tsx
try {
  await signIn(email, password);
} catch (error: any) {
  Alert.alert('Error', error.message); // ❌ Affiche "Firebase: Error (auth/network-request-failed)..."
}
```

### Après (bon - messages en français)
```tsx
import { getErrorMessage } from '@/utils/error-handler';

try {
  await signIn(email, password);
} catch (error: any) {
  Alert.alert('⚠️ Erreur', getErrorMessage(error)); // ✅ Affiche "Problème de connexion. Vérifiez votre réseau."
}
```

## 📍 Fichiers modifiés

### Services
- ✅ `services/auth.ts` - Utilise `getErrorMessage()` dans signUp, signIn, signOut
- ✅ `services/firestore.ts` - Utilise `getErrorMessage()` dans toutes les opérations

### Écrans
- ✅ `app/auth.tsx` - Gestion des erreurs d'authentification
- ✅ `app/(tabs)/settings.tsx` - Gestion des erreurs de déconnexion
- ✅ `app/(tabs)/focus.tsx` - Messages d'erreur de chargement des contacts
- ✅ `app/(tabs)/index.tsx` - Logs d'erreur en français

## 🎨 Format des messages

Tous les messages d'erreur utilisent des emojis pour une meilleure expérience :
- ⚠️ Erreur
- ✅ Succès
- 🔄 Réinitialisation
- 📱 Permissions
- etc.

## 🚀 Ajout de nouvelles erreurs

Pour ajouter une nouvelle traduction :

```typescript
// Dans utils/error-handler.ts
const authErrorMap: { [key: string]: string } = {
  // ... erreurs existantes ...
  'mon-nouveau-code': 'Mon nouveau message en français',
};
```

## 📊 Résultat

L'utilisateur reçoit maintenant des messages clairs en français au lieu de :
```
❌ AVANT:
Firebase: Error (auth/network-request-failed).
```

Il reçoit :
```
✅ APRÈS:
Problème de connexion. Vérifiez votre réseau.
```

## 💡 Avantages

1. **Expérience utilisateur** - Les utilisateurs ne sont pas dérangés par des messages techniques
2. **Maintenabilité** - Un seul endroit pour gérer toutes les traductions
3. **Cohérence** - Tous les messages sont dans le même format et en français
4. **Extensibilité** - Facile d'ajouter de nouvelles traductions
5. **Debugging** - Les erreurs complètes sont toujours loggées dans la console

---

**Créé le** : 11 février 2026
**Version** : 1.0
