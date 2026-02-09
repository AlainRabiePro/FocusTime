import { getAppSettings, ThemeMode } from '@/utils/app-settings';
import { useEffect, useState } from 'react';
import { ColorSchemeName, useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme(): ColorSchemeName {
  const systemColorScheme = useRNColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(systemColorScheme);
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');

  useEffect(() => {
    // Charger le thème sauvegardé
    loadTheme();
  }, []);

  useEffect(() => {
    // Appliquer le thème approprié
    if (themeMode === 'auto') {
      setColorScheme(systemColorScheme);
    } else {
      setColorScheme(themeMode);
    }
  }, [themeMode, systemColorScheme]);

  const loadTheme = async () => {
    const appSettings = await getAppSettings();
    setThemeMode(appSettings.theme);
  };

  return colorScheme;
}
