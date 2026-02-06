import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@focus_timer_theme';
const SOUND_ENABLED_KEY = '@focus_timer_sound';
const VIBRATION_ENABLED_KEY = '@focus_timer_vibration';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface AppSettings {
  theme: ThemeMode;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'auto',
  soundEnabled: true,
  vibrationEnabled: true,
};

export const getAppSettings = async (): Promise<AppSettings> => {
  try {
    const [theme, sound, vibration] = await Promise.all([
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(SOUND_ENABLED_KEY),
      AsyncStorage.getItem(VIBRATION_ENABLED_KEY),
    ]);

    return {
      theme: (theme as ThemeMode) || DEFAULT_APP_SETTINGS.theme,
      soundEnabled: sound !== null ? sound === 'true' : DEFAULT_APP_SETTINGS.soundEnabled,
      vibrationEnabled: vibration !== null ? vibration === 'true' : DEFAULT_APP_SETTINGS.vibrationEnabled,
    };
  } catch (error) {
    console.error('Error getting app settings:', error);
    return DEFAULT_APP_SETTINGS;
  }
};

export const saveTheme = async (theme: ThemeMode): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.error('Error saving theme:', error);
  }
};

export const saveSoundEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(SOUND_ENABLED_KEY, enabled.toString());
  } catch (error) {
    console.error('Error saving sound setting:', error);
  }
};

export const saveVibrationEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(VIBRATION_ENABLED_KEY, enabled.toString());
  } catch (error) {
    console.error('Error saving vibration setting:', error);
  }
};
