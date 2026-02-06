# Guide d'utilisation - Focus Timer Pro 🍅

## 🚀 Démarrage Rapide

### 1. Première connexion

Lorsque vous lancez l'app pour la première fois :

1. **Créez un compte**
   - Appuyez sur "Sign Up"
   - Entrez votre email et mot de passe (min 6 caractères)
   - Optionnel : Ajoutez un nom d'affichage

2. **Initialisez Firebase**
   - Allez dans **Settings** (⚙️)
   - Section "🔥 Firebase & Account"
   - Appuyez sur "🚀 Initialize Firebase Collections"
   - Vos collections seront créées automatiquement !

### 2. Utiliser le Timer ⏱️

**Écran Timer** (premier onglet) :

1. **Démarrer une session**
   - Appuyez sur "START" pour commencer
   - Le cercle pulse pendant le focus
   - Le timer décompte automatiquement

2. **Modes disponibles**
   - **Focus** (25 min par défaut) : Temps de concentration
   - **Short Break** (5 min) : Pause courte
   - **Long Break** (15 min) : Pause longue après 4 sessions

3. **Notifications**
   - Vibration à la fin de chaque session
   - Modal de félicitations
   - Publicité interstitielle tous les 3 sessions

### 3. Gérer vos tâches ✅

**Écran Tasks** (deuxième onglet) :

1. **Ajouter une tâche**
   - Tapez dans le champ texte
   - Appuyez sur le bouton "+"

2. **Compléter une tâche**
   - Touchez la case à cocher
   - La tâche passe dans "Completed"

3. **Supprimer une tâche**
   - Appuyez sur le "✕" rouge

### 4. Suivre vos statistiques 📊

**Écran Stats** (troisième onglet) :

- **Cartes de stats**
  - Today : Sessions du jour
  - This Week : Sessions de la semaine
  - Total : Toutes vos sessions
  - Daily Avg : Moyenne quotidienne

- **Graphique 7 jours**
  - Visualisez votre productivité
  - Nombre de sessions par jour

- **Insights**
  - Messages motivants personnalisés
  - Encouragements basés sur vos performances

### 5. Personnaliser l'app ⚙️

**Écran Settings** (quatrième onglet) :

#### 🎨 Apparence
- **Auto** : Suit le thème système
- **Light** : Mode clair
- **Dark** : Mode sombre

#### ⏱️ Durées du Timer
- **Focus Duration** : 5-60 minutes
- **Short Break** : 1-30 minutes
- **Long Break** : 5-60 minutes
- **Sessions avant pause longue** : 2-10

#### 🔔 Notifications
- **Sound Alerts** : Sons (à venir)
- **Vibration** : Vibrations de notification

#### 🔥 Firebase & Account
- **Voir votre email** connecté
- **Initialize Firebase** : Créer les collections
- **Sign Out** : Se déconnecter

#### ⚠️ Advanced
- **📥 Export Data** : Sauvegarder vos données JSON
- **Reset Settings** : Réinitialiser les paramètres
- **Clear All Data** : Supprimer toutes les données

## 💡 Astuces

### Technique Pomodoro
1. Choisissez une tâche
2. Réglez le timer sur 25 minutes (Focus)
3. Travaillez sans interruption
4. Prenez une pause courte (5 min)
5. Après 4 sessions, prenez une pause longue (15 min)

### Maximiser la productivité
- ✅ Créez vos tâches avant de commencer
- ✅ Une tâche = un pomodoro (ou plusieurs pour les grandes tâches)
- ✅ Consultez vos stats pour voir votre progression
- ✅ Ajustez les durées selon vos besoins

### Synchronisation multi-appareils
- Connectez-vous avec le même compte sur plusieurs appareils
- Vos tâches et statistiques sont automatiquement synchronisées
- Travaillez sur mobile, continuez sur tablette !

## ❓ FAQ

**Q : Mes données sont-elles sauvegardées ?**
R : Oui ! Avec Firebase, tout est synchronisé en temps réel dans le cloud.

**Q : Puis-je utiliser l'app sans connexion ?**
R : Pour l'instant, une connexion internet est nécessaire. Un mode hors-ligne arrive bientôt !

**Q : Comment changer les durées ?**
R : Allez dans Settings > Timer Durations et ajustez avec les boutons +/-

**Q : Les publicités peuvent-elles être retirées ?**
R : Pour l'instant non, mais une version premium sans pub est prévue !

**Q : Comment exporter mes données ?**
R : Settings > Advanced > 📥 Export Data

## 🐛 Problèmes courants

**L'app ne démarre pas ?**
- Vérifiez votre connexion internet
- Assurez-vous d'avoir configuré Firebase correctement

**Je ne peux pas me connecter ?**
- Vérifiez votre email et mot de passe
- Le mot de passe doit faire au moins 6 caractères

**Les stats ne s'affichent pas ?**
- Complétez au moins une session Focus
- Vérifiez que vous êtes bien connecté

**Firebase initialization échoue ?**
- Vérifiez votre configuration dans `config/firebase.ts`
- Assurez-vous que Firestore est activé dans votre projet Firebase

## 🎯 Prochaines fonctionnalités

- 🔔 Notifications push
- 🎵 Sons personnalisés
- 📱 Mode hors-ligne
- 🏆 Badges et achievements
- 👥 Statistiques partagées
- 💎 Version premium sans pub

---

**Besoin d'aide ?** Consultez [FIREBASE_SETUP.md](FIREBASE_SETUP.md) pour la configuration Firebase.
