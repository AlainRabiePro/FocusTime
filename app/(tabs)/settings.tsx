import { BannerAd, BannerAdSize, TestIds } from '@/components/mock-ads';
import { auth } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { signOut } from '@/services/auth';
import { initializeFirebaseCollections } from '@/services/firestore';
import { Settings } from '@/types/storage';
import { getAppSettings, saveSoundEnabled, saveTheme, saveVibrationEnabled, ThemeMode } from '@/utils/app-settings';
import { DEFAULT_SETTINGS, getSessions, getSettings, getTasks, saveSettings } from '@/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, Appearance, ScrollView, Share, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    loadAllSettings();
    // Écouter les changements d'authentification
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email);
    }
  }, []);

  const loadAllSettings = async () => {
    const pomodoroSettings = await getSettings();
    const appSettings = await getAppSettings();
    setSettings(pomodoroSettings);
    setThemeMode(appSettings.theme);
    setSoundEnabled(appSettings.soundEnabled);
    setVibrationEnabled(appSettings.vibrationEnabled);
  };

  const updateFocusDuration = async (duration: number) => {
    const newSettings = { ...settings, focusDuration: duration };
    await saveSettings(newSettings);
    setSettings(newSettings);
  };

  const updateShortBreak = async (duration: number) => {
    const newSettings = { ...settings, shortBreakDuration: duration };
    await saveSettings(newSettings);
    setSettings(newSettings);
  };

  const updateLongBreak = async (duration: number) => {
    const newSettings = { ...settings, longBreakDuration: duration };
    await saveSettings(newSettings);
    setSettings(newSettings);
  };

  const updateSessionsBeforeLongBreak = async (sessions: number) => {
    const newSettings = { ...settings, sessionsBeforeLongBreak: sessions };
    await saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleThemeChange = async (theme: ThemeMode) => {
    setThemeMode(theme);
    await saveTheme(theme);
    if (theme !== 'auto') {
      Appearance.setColorScheme(theme);
    }
  };

  const handleSoundToggle = async (enabled: boolean) => {
    setSoundEnabled(enabled);
    await saveSoundEnabled(enabled);
  };

  const handleVibrationToggle = async (enabled: boolean) => {
    setVibrationEnabled(enabled);
    await saveVibrationEnabled(enabled);
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Réinitialiser les paramètres',
      'Êtes-vous sûr de vouloir réinitialiser tous les paramètres par défaut ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            await saveSettings(DEFAULT_SETTINGS);
            setSettings(DEFAULT_SETTINGS);
            await handleThemeChange('auto');
            await handleSoundToggle(true);
            await handleVibrationToggle(true);
            Alert.alert('Succès', 'Les paramètres ont été réinitialisés par défaut');
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Effacer toutes les données',
      'Cela supprimera toutes les tâches, sessions et statistiques. Cette action est irréversible !',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                '@focus_timer_tasks',
                '@focus_timer_sessions',
              ]);
              Alert.alert('Succès', 'Toutes les données ont été effacées');
            } catch (error) {
              Alert.alert('Erreur', 'Échec de la suppression des données');
            }
          },
        },
      ]
    );
  };

  const handleInitializeFirebase = async () => {
    Alert.alert(
      'Initialiser Firebase',
      'Cela créera toutes les collections nécessaires dans votre base de données Firebase. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Initialiser',
          onPress: async () => {
            setIsInitializing(true);
            try {
              await initializeFirebaseCollections();
              Alert.alert('Succès', 'Collections Firebase créées avec succès !');
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Échec de l\'initialisation de Firebase');
            } finally {
              setIsInitializing(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Se déconnecter',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              Alert.alert('Succès', 'Déconnexion réussie');
            } catch (error: any) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const tasks = await getTasks();
      const sessions = await getSessions();
      const exportData = {
        tasks,
        sessions,
        settings,
        exportDate: new Date().toISOString(),
      };
      
      const jsonData = JSON.stringify(exportData, null, 2);
      
      await Share.share({
        message: jsonData,
        title: 'Focus Timer Pro Data Export',
      });
    } catch (error) {
      Alert.alert('Erreur', 'Échec de l\'exportation des données');
    }
  };

  const SettingSection = ({ title, children }: any) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
        {title}
      </Text>
      {children}
    </View>
  );

  const SettingRow = ({ label, value, onPress }: any) => (
    <TouchableOpacity
      style={[styles.settingRow, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}
      onPress={onPress}>
      <Text style={[styles.settingLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
        {label}
      </Text>
      <Text style={[styles.settingValue, { color: Colors[colorScheme ?? 'light'].tint }]}>
        {value}
      </Text>
    </TouchableOpacity>
  );

  const SettingToggle = ({ label, value, onValueChange }: any) => (
    <View style={[styles.settingRow, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}>
      <Text style={[styles.settingLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#767577', true: '#4ECDC4' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  const DurationPicker = ({ label, value, onChange, min = 1, max = 60 }: any) => (
    <View style={styles.durationPicker}>
      <Text style={[styles.durationLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
        {label}
      </Text>
      <View style={styles.durationControls}>
        <TouchableOpacity
          style={[styles.durationButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
          onPress={() => onChange(Math.max(min, value - 1))}>
          <Text style={styles.durationButtonText}>−</Text>
        </TouchableOpacity>
        <Text style={[styles.durationValue, { color: Colors[colorScheme ?? 'light'].text }]}>
          {value} min
        </Text>
        <TouchableOpacity
          style={[styles.durationButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
          onPress={() => onChange(Math.min(max, value + 1))}>
          <Text style={styles.durationButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Settings
        </Text>
        <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          Customize your experience
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingSection title="🎨 Appearance">
          <View style={styles.themeSelector}>
            {(['auto', 'light', 'dark'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themeButton,
                  { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' },
                  themeMode === mode && styles.themeButtonActive,
                ]}
                onPress={() => handleThemeChange(mode)}>
                <Text
                  style={[
                    styles.themeButtonText,
                    { color: Colors[colorScheme ?? 'light'].text },
                    themeMode === mode && styles.themeButtonTextActive,
                  ]}>
                  {mode === 'auto' ? '🔄 Auto' : mode === 'light' ? '☀️ Light' : '🌙 Dark'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingSection>

        <SettingSection title="⏱️ Timer Durations">
          <DurationPicker
            label="Focus Duration"
            value={settings.focusDuration}
            onChange={updateFocusDuration}
            min={5}
            max={60}
          />
          <DurationPicker
            label="Short Break"
            value={settings.shortBreakDuration}
            onChange={updateShortBreak}
            min={1}
            max={30}
          />
          <DurationPicker
            label="Long Break"
            value={settings.longBreakDuration}
            onChange={updateLongBreak}
            min={5}
            max={60}
          />
          <View style={styles.durationPicker}>
            <Text style={[styles.durationLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
              Sessions before long break
            </Text>
            <View style={styles.durationControls}>
              <TouchableOpacity
                style={[styles.durationButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
                onPress={() => updateSessionsBeforeLongBreak(Math.max(2, settings.sessionsBeforeLongBreak - 1))}>
                <Text style={styles.durationButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.durationValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                {settings.sessionsBeforeLongBreak}
              </Text>
              <TouchableOpacity
                style={[styles.durationButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
                onPress={() => updateSessionsBeforeLongBreak(Math.min(10, settings.sessionsBeforeLongBreak + 1))}>
                <Text style={styles.durationButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SettingSection>

        <SettingSection title="🔔 Notifications">
          <SettingToggle
            label="Sound Alerts"
            value={soundEnabled}
            onValueChange={handleSoundToggle}
          />
          <SettingToggle
            label="Vibration"
            value={vibrationEnabled}
            onValueChange={handleVibrationToggle}
          />
        </SettingSection>
        <SettingSection title="🔥 Firebase & Account">
          {userEmail && (
            <View style={[styles.accountInfo, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}>
              <Text style={[styles.accountLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                Signed in as:
              </Text>
              <Text style={[styles.accountEmail, { color: Colors[colorScheme ?? 'light'].tint }]}>
                {userEmail}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4ECDC4' }]}
            onPress={handleInitializeFirebase}
            disabled={isInitializing}>
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>
              {isInitializing ? '⌛ Initializing...' : '🚀 Initialize Firebase Collections'}
            </Text>
          </TouchableOpacity>
          {userEmail && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}
              onPress={handleSignOut}>
              <Text style={[styles.actionButtonText, { color: '#FF6B6B' }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          )}
        </SettingSection>
        <SettingSection title="⚙️ Advanced">
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}            onPress={handleExportData}>
            <Text style={[styles.actionButtonText, { color: Colors[colorScheme ?? 'light'].tint }]}>
              📥 Export Data
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}            onPress={handleResetSettings}>
            <Text style={[styles.actionButtonText, { color: Colors[colorScheme ?? 'light'].tint }]}>
              Reset Settings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleClearAllData}>
            <Text style={[styles.actionButtonText, { color: '#FF6B6B' }]}>
              Clear All Data
            </Text>
          </TouchableOpacity>
        </SettingSection>

        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Focus Timer Pro v1.0.0
          </Text>
          <Text style={[styles.appInfoText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Made with ❤️ for productivity
          </Text>
        </View>
      </ScrollView>

      <View style={styles.adContainer}>
        <BannerAd
          unitId={TestIds.BANNER}
          size={BannerAdSize.FULL_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  themeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeButtonActive: {
    borderColor: '#4ECDC4',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeButtonTextActive: {
    color: '#4ECDC4',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  durationPicker: {
    padding: 16,
    marginBottom: 10,
  },
  durationLabel: {
    fontSize: 16,
    marginBottom: 12,
  },
  durationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  durationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  durationValue: {
    fontSize: 20,
    fontWeight: 'bold',
    minWidth: 80,
    textAlign: 'center',
  },
  actionButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  appInfoText: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  accountInfo: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  accountLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 5,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '600',
  },
  adContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
});
