import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    setDoc,
    Timestamp,
    updateDoc
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Session, Settings, Task } from '../types/storage';
import { getErrorMessage } from '../utils/error-handler';

const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Vous devez être connecté pour effectuer cette action.');
  return user.uid;
};

// Initialiser les collections Firebase
export const initializeFirebaseCollections = async (): Promise<void> => {
  try {
    const userId = getCurrentUserId();

    // Créer les collections de base (les collections sont créées automatiquement lors de l'ajout de documents)
    // Créer un document de configuration initial
    await setDoc(doc(db, 'users', userId, 'config', 'settings'), {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
      createdAt: Timestamp.now(),
    });

    // Créer un document d'exemple pour les tasks (sera supprimé par l'utilisateur)
    await addDoc(collection(db, 'users', userId, 'tasks'), {
      title: 'Bienvenue dans Focus Timer Pro !',
      completed: false,
      pomodorosCompleted: 0,
      createdAt: Date.now(),
    });

    console.log('Collections Firebase initialisées avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des collections:', error);
    throw new Error(getErrorMessage(error));
  }
};

// Tasks
export const getFirebaseTasks = async (): Promise<Task[]> => {
  try {
    const userId = getCurrentUserId();
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Task));
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error);
    return [];
  }
};

export const addFirebaseTask = async (title: string, priority: 'low' | 'medium' | 'high' = 'medium', additionalData?: Partial<Task>): Promise<Task> => {
  try {
    const userId = getCurrentUserId();
    const tasksRef = collection(db, 'users', userId, 'tasks');
    
    const newTask = {
      title,
      completed: false,
      pomodorosCompleted: 0,
      createdAt: Date.now(),
      priority,
      ...additionalData,
    };

    const docRef = await addDoc(tasksRef, newTask);
    
    return {
      id: docRef.id,
      ...newTask,
    } as Task;
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'une tâche:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const updateFirebaseTask = async (id: string, updates: Partial<Task>): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const taskRef = doc(db, 'users', userId, 'tasks', id);
    await updateDoc(taskRef, updates);
  } catch (error) {
    console.error('Erreur lors de la mise à jour d\'une tâche:', error);
    throw new Error(getErrorMessage(error));
  }
};

export const deleteFirebaseTask = async (id: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const taskRef = doc(db, 'users', userId, 'tasks', id);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Erreur lors de la suppression d\'une tâche:', error);
    throw new Error(getErrorMessage(error));
  }
};

// Sessions
export const getFirebaseSessions = async (): Promise<Session[]> => {
  try {
    const userId = getCurrentUserId();
    const sessionsRef = collection(db, 'users', userId, 'sessions');
    const q = query(sessionsRef, orderBy('completedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Session));
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions:', error);
    return [];
  }
};

export const saveFirebaseSession = async (session: Omit<Session, 'id'>): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const sessionsRef = collection(db, 'users', userId, 'sessions');
    await addDoc(sessionsRef, session);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la session:', error);
    throw new Error(getErrorMessage(error));
  }
};

// Settings
export const getFirebaseSettings = async (): Promise<Settings> => {
  try {
    const userId = getCurrentUserId();
    const settingsRef = doc(db, 'users', userId, 'config', 'settings');
    const docSnap = await getDocs(collection(db, 'users', userId, 'config'));
    
    if (!docSnap.empty) {
      const data = docSnap.docs[0].data();
      return data as Settings;
    }
    
    // Retourner les paramètres par défaut si aucun n'existe
    const defaultSettings: Settings = {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
    };
    
    return defaultSettings;
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    return {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
    };
  }
};

export const saveFirebaseSettings = async (settings: Settings): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const settingsRef = doc(db, 'users', userId, 'config', 'settings');
    await setDoc(settingsRef, settings, { merge: true });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error);
    throw new Error(getErrorMessage(error));
  }
};
