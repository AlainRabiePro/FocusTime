import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import {
    addFirebaseTask,
    deleteFirebaseTask,
    getFirebaseTasks,
    saveFirebaseSession,
    updateFirebaseTask
} from '../services/firestore';
import { Session, Settings, Task } from '../types/storage';

const TASKS_KEY = '@focus_timer_tasks';
const SESSIONS_KEY = '@focus_timer_sessions';
const SETTINGS_KEY = '@focus_timer_settings';

export const DEFAULT_SETTINGS: Settings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

// Helper pour vérifier si l'utilisateur est authentifié
const isAuthenticated = () => auth.currentUser !== null;

// Tasks
export const getTasks = async (): Promise<Task[]> => {
  try {
    // Si authentifié, récupérer depuis Firebase, sinon AsyncStorage
    if (isAuthenticated()) {
      const firebaseTasks = await getFirebaseTasks();
      // Sauvegarder en local aussi pour le cache
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(firebaseTasks));
      return firebaseTasks;
    } else {
      const data = await AsyncStorage.getItem(TASKS_KEY);
      return data ? JSON.parse(data) : [];
    }
  } catch (error) {
    console.error('Error getting tasks:', error);
    // Fallback sur AsyncStorage en cas d'erreur
    const data = await AsyncStorage.getItem(TASKS_KEY);
    return data ? JSON.parse(data) : [];
  }
};

export const saveTasks = async (tasks: Task[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
};

export const addTask = async (title: string, priority: 'low' | 'medium' | 'high' = 'medium', additionalData?: Partial<Task>): Promise<Task> => {
  const newTask: Task = {
    id: Date.now().toString(),
    title,
    completed: false,
    pomodorosCompleted: 0,
    createdAt: Date.now(),
    priority,
    ...additionalData,
  };

  try {
    // Si authentifié, ajouter à Firebase
    if (isAuthenticated()) {
      const firebaseTask = await addFirebaseTask(title, priority, additionalData);
      // Sauvegarder aussi en local
      const tasks = await getTasks();
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify([firebaseTask, ...tasks]));
      return firebaseTask;
    } else {
      // Sinon, sauvegarder uniquement en local
      const tasks = await getTasks();
      await saveTasks([newTask, ...tasks]);
      return newTask;
    }
  } catch (error) {
    console.error('Error adding task:', error);
    // Fallback sur AsyncStorage
    const tasks = await getTasks();
    await saveTasks([newTask, ...tasks]);
    return newTask;
  }
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<void> => {
  try {
    // Mettre à jour Firebase si authentifié
    if (isAuthenticated()) {
      await updateFirebaseTask(id, updates);
    }
    
    // Mettre à jour aussi en local
    const tasks = await AsyncStorage.getItem(TASKS_KEY);
    if (tasks) {
      const parsedTasks = JSON.parse(tasks);
      const updatedTasks = parsedTasks.map((task: Task) => 
        task.id === id ? { ...task, ...updates } : task
      );
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updatedTasks));
    }
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    // Supprimer de Firebase si authentifié
    if (isAuthenticated()) {
      await deleteFirebaseTask(id);
    }
    
    // Supprimer aussi en local
    const tasks = await AsyncStorage.getItem(TASKS_KEY);
    if (tasks) {
      const parsedTasks = JSON.parse(tasks);
      await AsyncStorage.setItem(
        TASKS_KEY, 
        JSON.stringify(parsedTasks.filter((task: Task) => task.id !== id))
      );
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Sessions
export const getSessions = async (): Promise<Session[]> => {
  try {
    // Toujours récupérer depuis AsyncStorage car on veut l'historique local complet
    const data = await AsyncStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting sessions:', error);
    return [];
  }
};

export const saveSession = async (session: Omit<Session, 'id'>): Promise<void> => {
  try {
    const sessions = await getSessions();
    const newSession: Session = {
      ...session,
      id: Date.now().toString(),
    };
    
    // Sauvegarder en local
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify([newSession, ...sessions]));
    
    // Si authentifié, sauvegarder aussi dans Firebase
    if (isAuthenticated()) {
      await saveFirebaseSession(session);
    }
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

// Settings
export const getSettings = async (): Promise<Settings> => {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};
