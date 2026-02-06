export interface Task {
  id: string;
  title: string;
  completed: boolean;
  pomodorosCompleted: number;
  createdAt: number;
}

export interface Session {
  id: string;
  duration: number;
  completedAt: number;
  taskId?: string;
  type: 'focus' | 'break';
}

export interface Settings {
  focusDuration: number; // en minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}
