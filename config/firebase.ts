import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBPPkp5mJfN11gRf8sAz1oJ-r7ZnVUJPl8",
  authDomain: "focustime-52a8a.firebaseapp.com",
  projectId: "focustime-52a8a",
  storageBucket: "focustime-52a8a.firebasestorage.app",
  messagingSenderId: "614465434507",
  appId: "1:614465434507:web:668038ed0fc779344d358e"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser les services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
