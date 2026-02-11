# 🧪 Guide de test - Gestion des erreurs

## Comment tester les messages d'erreur en français

### 1. **Test de l'authentification**

#### Test : Email non trouvé
1. Aller sur l'écran d'authentification
2. Cliquer sur "Se connecter"
3. Entrer un email qui n'existe pas (ex: `test123456@example.com`)
4. Entrer n'importe quel mot de passe
5. Cliquer sur "Se connecter"

**Résultat attendu** : 
```
⚠️ Erreur
Cet e-mail n'existe pas. Veuillez créer un compte.
```

❌ **AVANT** : `Firebase: Error (auth/user-not-found).`

---

#### Test : Mauvais mot de passe
1. Créer un compte avec `test@example.com` / `password123`
2. Se déconnecter
3. Essayer de se connecter avec le même email mais un mauvais mot de passe
4. Cliquer sur "Se connecter"

**Résultat attendu** :
```
⚠️ Erreur
Le mot de passe est incorrect. Veuillez réessayer.
```

❌ **AVANT** : `Firebase: Error (auth/wrong-password).`

---

#### Test : Mot de passe trop court
1. Aller sur l'écran d'inscription
2. Remplir le formulaire avec un mot de passe < 6 caractères (ex: `12345`)
3. Cliquer sur "Créer un compte"

**Résultat attendu** :
```
⚠️ Erreur
Le mot de passe doit contenir au moins 6 caractères.
```

❌ **AVANT** : `Firebase: Error (auth/weak-password).`

---

#### Test : Email déjà utilisé
1. Créer un compte avec `dupli@example.com` / `password123`
2. Se déconnecter
3. Essayer de créer un nouveau compte avec le même email
4. Cliquer sur "Créer un compte"

**Résultat attendu** :
```
⚠️ Erreur
Cet e-mail est déjà associé à un compte.
```

❌ **AVANT** : `Firebase: Error (auth/email-already-in-use).`

---

### 2. **Test de la déconnexion**

1. Se connecter avec un compte valide
2. Aller à l'onglet "Paramètres"
3. Scroller en bas
4. Cliquer sur "Se déconnecter"
5. Confirmer la déconnexion

**Résultat attendu** (Succès) :
```
✅ Succès
Déconnexion réussie
```

---

### 3. **Test des permissions (Focus)**

1. Aller à l'onglet "Focus"
2. Activer "Bloquer les appels"
3. Cliquer sur "Sélectionner les contacts autorisés"
4. Refuser l'accès aux contacts
5. Cliquer sur "Paramètres" pour autoriser

**Résultat attendu** :
```
📱 Accès aux Contacts
Pour bloquer les appels de contacts spécifiques, autorisez l'accès aux contacts.
[Paramètres] [Plus tard]
```

❌ **AVANT** : Possibilité de voir des messages techniques en anglais

---

### 4. **Test de perte de connexion (Simulé)**

Pour simuler une perte de connexion :

1. Ouvrir les développeur tools du navigateur
2. Aller à "Network"
3. Sélectionner "Offline"
4. Essayer de se connecter
5. Cliquer sur "Se connecter"

**Résultat attendu** :
```
⚠️ Erreur
Problème de connexion. Vérifiez votre réseau.
```

❌ **AVANT** : `Firebase: Error (auth/network-request-failed).`

---

## 📋 Checklist de validation

- [ ] Email non trouvé → Message français
- [ ] Mauvais mot de passe → Message français
- [ ] Mot de passe trop court → Message français
- [ ] Email déjà utilisé → Message français
- [ ] Déconnexion réussie → Message français
- [ ] Permissions refusées → Message français
- [ ] Perte de connexion → Message français
- [ ] Tous les messages ont un emoji
- [ ] Aucun message n'est en anglais
- [ ] Aucun code d'erreur Firebase n'est visible

---

## 📊 Résultats attendus

### ✅ BON (Ce que vous devriez voir)
- Tous les messages en français
- Chaque message commence par un emoji (⚠️, ✅, 📱, etc.)
- Messages clairs et compréhensibles par l'utilisateur
- Pas de codes techniques visibles

### ❌ MAUVAIS (Ne devrait PAS voir)
- Messages en anglais
- Codes d'erreur Firebase visibles (`auth/...`, `permission-denied`, etc.)
- "Firebase: Error"
- Messages techniques ou jargon développeur

---

## 🐛 Dépannage

### Si un message est encore en anglais
1. Vérifier que `error-handler.ts` a bien été créé
2. Vérifier que les imports sont corrects dans le fichier
3. Vérifier que `getErrorMessage()` est utilisé au lieu d'`error.message`

### Si une erreur n'est pas gérée
1. Ouvrir `utils/error-handler.ts`
2. Ajouter le nouveau code d'erreur dans `authErrorMap`
3. Écrire le message en français correspondant

Exemple :
```typescript
const authErrorMap: { [key: string]: string } = {
  // ... erreurs existantes ...
  'mon-code-erreur': 'Mon message en français',
};
```

---

## 📞 Codes d'erreur suivis

### Authentification Firebase
- `auth/user-not-found`
- `auth/wrong-password`
- `auth/invalid-email`
- `auth/user-disabled`
- `auth/email-already-in-use`
- `auth/weak-password`
- `auth/invalid-password`
- `auth/network-request-failed`
- `auth/too-many-requests`
- `auth/operation-not-allowed`

### Firestore
- `permission-denied`
- `not-found`
- `already-exists`
- `failed-precondition`
- `aborted`
- `unavailable`
- `internal`
- `data-loss`

---

**Note** : Tous les messages d'erreur sont maintenant en français et convivial pour l'utilisateur ! 🎉
