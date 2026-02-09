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

const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
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
      title: 'Welcome to Focus Timer Pro!',
      completed: false,
      pomodorosCompleted: 0,
      createdAt: Date.now(),
    });

    console.log('Firebase collections initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase collections:', error);
    throw error;
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
    console.error('Error getting tasks:', error);
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
    console.error('Error adding task:', error);
    throw error;
  }
};

export const updateFirebaseTask = async (id: string, updates: Partial<Task>): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const taskRef = doc(db, 'users', userId, 'tasks', id);
    await updateDoc(taskRef, updates);
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteFirebaseTask = async (id: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const taskRef = doc(db, 'users', userId, 'tasks', id);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
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
    console.error('Error getting sessions:', error);
    return [];
  }
};

export const saveFirebaseSession = async (session: Omit<Session, 'id'>): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    const sessionsRef = collection(db, 'users', userId, 'sessions');
    await addDoc(sessionsRef, session);
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
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
    console.error('Error getting settings:', error);
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
    console.error('Error saving settings:', error);
    throw error;
  }
};
