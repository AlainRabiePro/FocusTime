import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBPPkp5mJfN11gRf8sAz1oJ-r7ZnVUJPl8",
  authDomain: "focustime-52a8a.firebaseapp.com",
  projectId: "focustime-52a8a",
  storageBucket: "focustime-52a8a.firebasestorage.app",
  messagingSenderId: "614465434507",
  appId: "1:614465434507:web:668038ed0fc779344d358e"
};

// Initialiser Firebase (éviter double initialisation)
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialiser Auth avec persistance AsyncStorage pour React Native
const createAuth = (): Auth => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    // Si déjà initialisé, utiliser l'instance existante
    return getAuth(app);
  }
};

export const auth: Auth = createAuth();

// Initialiser Firestore
export const db: Firestore = getFirestore(app);

export default app;
