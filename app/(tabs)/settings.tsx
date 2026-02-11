import { auth } from '@/config/firebase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { signOut } from '@/services/auth';
import { Settings } from '@/types/storage';
import { getAppSettings, saveSoundEnabled, saveTheme, saveVibrationEnabled, ThemeMode } from '@/utils/app-settings';
import { getErrorMessage } from '@/utils/error-handler';
import { DEFAULT_SETTINGS, getSessions, getSettings, getTasks, saveSettings } from '@/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, Appearance, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);

  useEffect(() => {
    loadAllSettings();
    loadStats();
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

  const loadStats = async () => {
    const sessions = await getSessions();
    const tasks = await getTasks();
    setTotalSessions(sessions.length);
    setTotalTasks(tasks.length);
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
    // Forcer l'application du thème immédiatement
    if (theme === 'auto') {
      Appearance.setColorScheme(null); // Revenir au thème système
    } else {
      Appearance.setColorScheme(theme);
    }
    // Déclencher un rechargement de l'app pour appliquer le thème partout
    setTimeout(() => {
      // Les composants utilisant useColorScheme vont se mettre à jour automatiquement
    }, 100);
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
      '🔄 Réinitialiser les paramètres',
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
            Alert.alert('✅ Succès', 'Les paramètres ont été réinitialisés');
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      '⚠️ Effacer toutes les données',
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
              await loadStats();
              Alert.alert('✅ Succès', 'Toutes les données ont été effacées');
            } catch (error) {
              Alert.alert('❌ Erreur', 'Échec de la suppression des données');
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
              Alert.alert('✅ Succès', 'Déconnexion réussie');
            } catch (error: any) {
              Alert.alert('⚠️ Erreur', getErrorMessage(error));
            }
          },
        },
      ]
    );
  };

  const SettingSection = ({ title, children }: any) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
        {title}
      </Text>
      <View style={[styles.sectionCard, { 
        backgroundColor: colorScheme === 'dark' ? '#1F1F1F' : '#fff',
        shadowColor: colorScheme === 'dark' ? '#000' : '#000',
      }]}>
        {children}
      </View>
    </View>
  );

  const StatCard = ({ icon, label, value, color }: any) => (
    <View style={[styles.statCard, { 
      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f8f9fa',
    }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].text }]}>{label}</Text>
    </View>
  );

  const SettingToggle = ({ label, description, value, onValueChange, icon }: any) => (
    <View style={styles.settingToggleRow}>
      <View style={styles.settingToggleInfo}>
        <View style={styles.settingToggleHeader}>
          {icon && <Text style={styles.settingIcon}>{icon}</Text>}
          <Text style={[styles.settingLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
            {label}
          </Text>
        </View>
        {description && (
          <Text style={[styles.settingDescription, { color: Colors[colorScheme ?? 'light'].text }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#767577', true: '#4ECDC4' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
        ios_backgroundColor="#767577"
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0D0D0D' : '#F5F7FA' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          ⚙️ Paramètres
        </Text>
        <Text style={[styles.subtitle, { color: colorScheme === 'dark' ? '#B9BCC5' : '#5F6470' }]}>
          Personnalisez votre expérience
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <StatCard icon="🎯" label="Sessions totales" value={totalSessions} color="#4ECDC4" />
          <StatCard icon="✅" label="Tâches créées" value={totalTasks} color="#FF6B6B" />
        </View>

        {/* Account Section */}
        {userEmail && (
          <SettingSection title="👤 Compte">
            <View style={styles.accountInfo}>
              <View style={styles.accountRow}>
                <View style={[styles.accountIcon, { backgroundColor: '#4ECDC4' }]}>
                  <Text style={styles.accountIconText}>
                    {userEmail.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.accountDetails}>
                  <Text style={[styles.accountLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Connecté en tant que
                  </Text>
                  <Text style={[styles.accountEmail, { color: Colors[colorScheme ?? 'light'].tint }]}>
                    {userEmail}
                  </Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}
              onPress={handleSignOut}>
              <Text style={styles.actionButtonIcon}>🚪</Text>
              <Text style={[styles.actionButtonText, { color: '#FF6B6B' }]}>
                Se déconnecter
              </Text>
            </TouchableOpacity>
          </SettingSection>
        )}

        {/* Appearance */}
        <SettingSection title="🎨 Apparence">
          <View style={styles.themeSelector}>
            {(['auto', 'light', 'dark'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themeButton,
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f8f9fa',
                    borderColor: themeMode === mode ? '#4ECDC4' : 'transparent',
                  },
                ]}
                onPress={() => handleThemeChange(mode)}>
                <Text style={styles.themeButtonIcon}>
                  {mode === 'auto' ? '🔄' : mode === 'light' ? '☀️' : '🌙'}
                </Text>
                <Text
                  style={[
                    styles.themeButtonText,
                    { 
                      color: themeMode === mode ? '#4ECDC4' : Colors[colorScheme ?? 'light'].text,
                    },
                  ]}>
                  {mode === 'auto' ? 'Auto' : mode === 'light' ? 'Clair' : 'Sombre'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="🔔 Notifications & Alertes">
          <SettingToggle
            icon="🔊"
            label="Sons d'alerte"
            description="Jouer un son lorsqu'un timer se termine"
            value={soundEnabled}
            onValueChange={handleSoundToggle}
          />
          <View style={styles.divider} />
          <SettingToggle
            icon="📳"
            label="Vibrations"
            description="Vibrer à la fin de chaque session"
            value={vibrationEnabled}
            onValueChange={handleVibrationToggle}
          />
        </SettingSection>

        {/* Data & Privacy */}
        <SettingSection title="💾 Données & Confidentialité">
          <TouchableOpacity
            style={[styles.actionButton, { 
              backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff',
              borderWidth: 1,
              borderColor: colorScheme === 'dark' ? '#3a3a3a' : '#e0e0e0',
            }]}
            onPress={handleResetSettings}>
            <Text style={styles.actionButtonIcon}>🔄</Text>
            <Text style={[styles.actionButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Réinitialiser les paramètres
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { 
              backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff',
              borderWidth: 2,
              borderColor: '#FF6B6B',
            }]}
            onPress={handleClearAllData}>
            <Text style={styles.actionButtonIcon}>🗑️</Text>
            <Text style={[styles.actionButtonText, { color: '#FF6B6B', fontWeight: '700' }]}>
              Effacer toutes les données
            </Text>
          </TouchableOpacity>
        </SettingSection>

        {/* About */}
        <SettingSection title="ℹ️ À propos">
          <View style={styles.aboutContent}>
            <Text style={[styles.appVersion, { color: Colors[colorScheme ?? 'light'].text }]}>
              Focus Timer Pro
            </Text>
            <Text style={[styles.appVersionNumber, { color: Colors[colorScheme ?? 'light'].tint }]}>
              Version 1.0.0
            </Text>
            
            <View style={styles.aboutLinks}>
              <TouchableOpacity 
                style={styles.aboutLink}
                onPress={() => Linking.openURL('mailto:support@focustimer.com')}>
                <Text style={styles.aboutLinkIcon}>📧</Text>
                <Text style={[styles.aboutLinkText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                  Support
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.madeWith, { color: Colors[colorScheme ?? 'light'].text }]}>
              Fait avec ❤️ pour la productivité
            </Text>
          </View>
        </SettingSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  accountInfo: {
    padding: 16,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountIconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  accountDetails: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeSelector: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    gap: 6,
  },
  themeButtonIcon: {
    fontSize: 24,
  },
  themeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  settingToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  settingToggleInfo: {
    flex: 1,
  },
  settingToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  settingIcon: {
    fontSize: 18,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginHorizontal: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 12,
    borderRadius: 12,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 13,
    opacity: 0.6,
    paddingHorizontal: 16,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  aboutContent: {
    padding: 20,
    alignItems: 'center',
  },
  appVersion: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  appVersionNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  aboutLinks: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  aboutLink: {
    alignItems: 'center',
    gap: 6,
  },
  aboutLinkIcon: {
    fontSize: 24,
  },
  aboutLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  madeWith: {
    fontSize: 13,
    opacity: 0.6,
  },
});
