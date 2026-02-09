import { BannerAd, BannerAdSize, TestIds } from '@/components/mock-ads';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Contact {
  id: string;
  name: string;
  phoneNumbers?: string[];
  emails?: string[];
}

interface App {
  id: string;
  name: string;
  icon: string;
  category: string;
}

export default function FocusScreen() {
  const colorScheme = useColorScheme();
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);
  const [autoActivate, setAutoActivate] = useState(true);
  const [blockNotifications, setBlockNotifications] = useState(true);
  const [blockCalls, setBlockCalls] = useState(false);
  const [allowAlarms, setAllowAlarms] = useState(true);
  const [allowedContacts, setAllowedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    loadFocusSettings();
    requestContactsPermission();
  }, []);

  const requestContactsPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        await loadContacts();
      } else {
        setLoading(false);
        Alert.alert(
          '📱 Accès aux Contacts',
          'Pour bloquer les appels de contacts spécifiques, autorisez l\'accès aux contacts.',
          [
            { text: 'Paramètres', onPress: () => Linking.openSettings() },
            { text: 'Plus tard', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
      });

      const formattedContacts: Contact[] = data
        .filter(contact => contact.name)
        .map(contact => ({
          id: contact.id,
          name: contact.name || 'Sans nom',
          phoneNumbers: contact.phoneNumbers?.map(phone => phone.number).filter((num): num is string => num !== undefined),
          emails: contact.emails?.map(email => email.email).filter((em): em is string => em !== undefined),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setContacts(formattedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Erreur', 'Impossible de charger les contacts.');
    } finally {
      setLoading(false);
    }
  };

  const loadFocusSettings = async () => {
    try {
      const settings = await AsyncStorage.multiGet([
        '@focus_mode_enabled',
        '@focus_auto_activate',
        '@focus_block_notifications',
        '@focus_block_calls',
        '@focus_allow_alarms',
        '@focus_allowed_contacts',
      ]);
      
      setFocusModeEnabled(settings[0][1] === 'true');
      setAutoActivate(settings[1][1] !== 'false');
      setBlockNotifications(settings[2][1] !== 'false');
      setBlockCalls(settings[3][1] === 'true');
      setAllowAlarms(settings[4][1] !== 'false');
      
      const savedContacts = settings[5][1];
      if (savedContacts) {
        setAllowedContacts(JSON.parse(savedContacts));
      }
    } catch (error) {
      console.error('Error loading focus settings:', error);
    }
  };

  const saveFocusSetting = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error('Error saving focus setting:', error);
    }
  };

  const handleFocusModeToggle = async (enabled: boolean) => {
    setFocusModeEnabled(enabled);
    await saveFocusSetting('@focus_mode_enabled', enabled);
    
    if (enabled) {
      Alert.alert(
        '🎯 Mode Concentration Activé',
        'Pendant vos sessions Pomodoro, l\'application activera automatiquement le mode Ne Pas Déranger.\n\nVous devez autoriser l\'accès aux paramètres système.',
        [
          {
            text: 'Configurer',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openSettings();
              } else {
                Alert.alert(
                  'Configuration Android',
                  'Allez dans Paramètres > Apps > Focus Timer > Autorisations pour activer le mode Ne Pas Déranger.'
                );
              }
            },
          },
          { text: 'Plus tard', style: 'cancel' },
        ]
      );
    }
  };

  const handleAutoActivateToggle = async (enabled: boolean) => {
    setAutoActivate(enabled);
    await saveFocusSetting('@focus_auto_activate', enabled);
  };

  const handleBlockNotificationsToggle = async (enabled: boolean) => {
    setBlockNotifications(enabled);
    await saveFocusSetting('@focus_block_notifications', enabled);
  };

  const handleBlockCallsToggle = async (enabled: boolean) => {
    setBlockCalls(enabled);
    await saveFocusSetting('@focus_block_calls', enabled);
  };

  const handleAllowAlarmsToggle = async (enabled: boolean) => {
    setAllowAlarms(enabled);
    await saveFocusSetting('@focus_allow_alarms', enabled);
  };

  const toggleContactAllowed = async (contactId: string) => {
    const newAllowedContacts = allowedContacts.includes(contactId)
      ? allowedContacts.filter(id => id !== contactId)
      : [...allowedContacts, contactId];
    
    setAllowedContacts(newAllowedContacts);
    await AsyncStorage.setItem('@focus_allowed_contacts', JSON.stringify(newAllowedContacts));
  };

  const getFilteredContacts = () => {
    if (!searchQuery.trim()) {
      return contacts;
    }
    
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumbers?.some(phone => phone.includes(searchQuery)) ||
      contact.emails?.some(email => email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleTestFocusMode = () => {
    if (!focusModeEnabled) {
      Alert.alert('Mode désactivé', 'Activez d\'abord le mode concentration pour le tester.');
      return;
    }

    Alert.alert(
      '🎯 Test du Mode Concentration',
      'Le mode concentration sera activé pendant 10 secondes.\n\nVous ne recevrez pas de notifications pendant ce temps.',
      [
        {
          text: 'Tester',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openSettings();
            }
            Alert.alert('Test lancé', 'Le mode concentration est actif pendant 10 secondes.');
            setTimeout(() => {
              Alert.alert('Test terminé', 'Le mode concentration a été désactivé.');
            }, 10000);
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0D0D0D' : '#F8F9FA' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Mode Concentration
        </Text>
        <Text style={[styles.subtitle, { color: colorScheme === 'dark' ? '#B9BCC5' : '#5F6470' }]}>
          Éliminez les distractions
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Activation principale */}
        <View style={[styles.card, { 
          backgroundColor: colorScheme === 'dark' ? '#1F1F1F' : '#fff',
          borderColor: colorScheme === 'dark' ? '#2A2A2A' : '#E5E7EB',
        }]}>
          <View style={styles.mainToggle}>
            <View style={styles.mainToggleInfo}>
              <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                🎯 Mode Concentration
              </Text>
              <Text style={[styles.cardDescription, { color: Colors[colorScheme ?? 'light'].text }]}>
                Active le mode Ne Pas Déranger automatiquement pendant vos sessions Pomodoro
              </Text>
            </View>
            <Switch
              value={focusModeEnabled}
              onValueChange={handleFocusModeToggle}
              trackColor={{ false: '#767577', true: '#4ECDC4' }}
              thumbColor={focusModeEnabled ? '#fff' : '#f4f3f4'}
              style={styles.mainSwitch}
            />
          </View>
        </View>

        {/* Statistiques */}
        {focusModeEnabled && (
          <View style={[styles.statsCard, { backgroundColor: colorScheme === 'dark' ? '#1F1F1F' : '#fff' }]}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>📊</Text>
                <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].text }]}>24</Text>
                <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Sessions concentrées
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>🔕</Text>
                <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].text }]}>156</Text>
                <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Notifications bloquées
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Paramètres détaillés */}
        {focusModeEnabled && (
          <>
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}>
              <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                ⚙️ Paramètres
              </Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Activation automatique
                  </Text>
                  <Text style={[styles.settingDescription, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Active le mode au démarrage du timer
                  </Text>
                </View>
                <Switch
                  value={autoActivate}
                  onValueChange={handleAutoActivateToggle}
                  trackColor={{ false: '#767577', true: '#4ECDC4' }}
                  thumbColor={autoActivate ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Bloquer les notifications
                  </Text>
                  <Text style={[styles.settingDescription, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Masque toutes les notifications
                  </Text>
                </View>
                <Switch
                  value={blockNotifications}
                  onValueChange={handleBlockNotificationsToggle}
                  trackColor={{ false: '#767577', true: '#4ECDC4' }}
                  thumbColor={blockNotifications ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Bloquer les appels
                  </Text>
                  <Text style={[styles.settingDescription, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Rejette automatiquement les appels
                  </Text>
                </View>
                <Switch
                  value={blockCalls}
                  onValueChange={handleBlockCallsToggle}
                  trackColor={{ false: '#767577', true: '#4ECDC4' }}
                  thumbColor={blockCalls ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Autoriser les alarmes
                  </Text>
                  <Text style={[styles.settingDescription, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Les alarmes sonneront normalement
                  </Text>
                </View>
                <Switch
                  value={allowAlarms}
                  onValueChange={handleAllowAlarmsToggle}
                  trackColor={{ false: '#767577', true: '#4ECDC4' }}
                  thumbColor={allowAlarms ? '#fff' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Contacts autorisés */}
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}>
              <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                👥 Contacts Autorisés
              </Text>
              <Text style={[styles.sectionDescription, { color: Colors[colorScheme ?? 'light'].text }]}>
                Sélectionnez les contacts qui peuvent vous appeler ou vous envoyer des messages pendant le mode concentration
              </Text>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4ECDC4" />
                  <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Chargement de vos contacts...
                  </Text>
                </View>
              ) : !hasPermission ? (
                <View style={styles.permissionContainer}>
                  <Text style={styles.permissionIcon}>🔒</Text>
                  <Text style={[styles.permissionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Accès aux Contacts Requis
                  </Text>
                  <Text style={[styles.permissionDescription, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Pour gérer les appels et messages autorisés, nous avons besoin d'accéder à vos contacts.
                  </Text>
                  <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={requestContactsPermission}>
                    <Text style={styles.permissionButtonText}>Autoriser l'accès</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Barre de recherche */}
                  <View style={[styles.searchBar, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                      style={[styles.searchInput, { color: Colors[colorScheme ?? 'light'].text }]}
                      placeholder="Rechercher un contact..."
                      placeholderTextColor="#999"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>

                  {/* Liste des contacts */}
                  <View style={styles.contactsList}>
                    {getFilteredContacts().slice(0, 50).map(contact => {
                        const isAllowed = allowedContacts.includes(contact.id);
                        return (
                          <TouchableOpacity
                            key={contact.id}
                            style={[
                              styles.contactItem,
                              { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' },
                              isAllowed && styles.contactItemSelected
                            ]}
                            onPress={() => toggleContactAllowed(contact.id)}>
                            <View style={styles.contactInfo}>
                              <View style={[
                                styles.contactAvatar,
                                { backgroundColor: isAllowed ? '#4ECDC4' : '#999' }
                              ]}>
                                <Text style={styles.contactInitials}>
                                  {getInitials(contact.name)}
                                </Text>
                              </View>
                              <View style={styles.contactDetails}>
                                <Text style={[styles.contactName, { color: Colors[colorScheme ?? 'light'].text }]}>
                                  {contact.name}
                                </Text>
                                {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
                                  <Text style={[styles.contactPhone, { color: Colors[colorScheme ?? 'light'].text }]}>
                                    📞 {contact.phoneNumbers[0]}
                                  </Text>
                                )}
                                {contact.emails && contact.emails.length > 0 && (
                                  <Text style={[styles.contactEmail, { color: Colors[colorScheme ?? 'light'].text }]}>
                                    📧 {contact.emails[0]}
                                  </Text>
                                )}
                              </View>
                            </View>
                            <View style={[
                              styles.contactCheckbox,
                              isAllowed && styles.contactCheckboxChecked
                            ]}>
                              {isAllowed && <Text style={styles.contactCheckmark}>✓</Text>}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                  {getFilteredContacts().length === 0 && (
                    <View style={styles.noResults}>
                      <Text style={styles.noResultsIcon}>🔍</Text>
                      <Text style={[styles.noResultsText, { color: Colors[colorScheme ?? 'light'].text }]}>
                        {searchQuery ? 'Aucun contact trouvé' : 'Aucun contact disponible'}
                      </Text>
                    </View>
                  )}

                  {/* Statistiques */}
                  {contacts.length > 0 && (
                    <View style={styles.contactsStats}>
                      <Text style={[styles.contactsStatsText, { color: Colors[colorScheme ?? 'light'].text }]}>
                        {allowedContacts.length} contact{allowedContacts.length > 1 ? 's' : ''} autorisé{allowedContacts.length > 1 ? 's' : ''} sur {getFilteredContacts().length > 50 ? '50+' : getFilteredContacts().length}
                      </Text>
                      {getFilteredContacts().length > 50 && (
                        <Text style={[styles.contactsLimitText, { color: Colors[colorScheme ?? 'light'].text }]}>
                          Utilisez la recherche pour trouver plus de contacts
                        </Text>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Avantages */}
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}>
              <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                ✨ Avantages
              </Text>
              
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>🚀</Text>
                  <Text style={[styles.benefitText, { color: Colors[colorScheme ?? 'light'].text }]}>
                    <Text style={styles.benefitBold}>+47% de productivité</Text> mesurée lors des sessions concentrées
                  </Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>🧠</Text>
                  <Text style={[styles.benefitText, { color: Colors[colorScheme ?? 'light'].text }]}>
                    <Text style={styles.benefitBold}>Concentration profonde</Text> sans interruptions
                  </Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>😌</Text>
                  <Text style={[styles.benefitText, { color: Colors[colorScheme ?? 'light'].text }]}>
                    <Text style={styles.benefitBold}>Réduction du stress</Text> lié aux distractions numériques
                  </Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <Text style={styles.benefitIcon}>⚡</Text>
                  <Text style={[styles.benefitText, { color: Colors[colorScheme ?? 'light'].text }]}>
                    <Text style={styles.benefitBold}>Économie d'énergie</Text> mentale et physique
                  </Text>
                </View>
              </View>
            </View>

            {/* Bouton test */}
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: '#4ECDC4' }]}
              onPress={handleTestFocusMode}>
              <Text style={styles.testButtonText}>🧪 Tester le mode concentration</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Message d'encouragement si désactivé */}
        {!focusModeEnabled && (
          <View style={[styles.emptyState, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Activez le Mode Concentration
            </Text>
            <Text style={[styles.emptyDescription, { color: Colors[colorScheme ?? 'light'].text }]}>
              Bloquez les distractions pendant vos sessions Pomodoro et augmentez votre productivité de 47%
            </Text>
          </View>
        )}
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
    paddingBottom: 15,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 5,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.6,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  mainToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mainToggleInfo: {
    flex: 1,
    marginRight: 15,
  },
  mainSwitch: {
    transform: [{ scale: 1.1 }],
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  statsCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statRow: {
    flexDirection: 'row',
    gap: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.6,
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    letterSpacing: -0.3,
  },
  sectionDescription: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 18,
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  categoryScroll: {
    marginBottom: 15,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  appsList: {
    gap: 10,
    marginTop: 10,
  },
  appItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  appItemSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: '#4ECDC420',
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  appCategory: {
    fontSize: 12,
    opacity: 0.6,
  },
  appCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appCheckboxChecked: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  appCheckmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: 10,
    opacity: 0.3,
  },
  noResultsText: {
    fontSize: 14,
    opacity: 0.6,
  },
  appsStats: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  appsStatsText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    opacity: 0.6,
  },
  permissionContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
  },
  permissionButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  contactsList: {
    gap: 10,
    marginTop: 10,
    maxHeight: 400,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  contactItemSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: '#4ECDC420',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInitials: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  contactPhone: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 12,
    opacity: 0.6,
  },
  contactCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactCheckboxChecked: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  contactCheckmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  contactsStats: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
    alignItems: 'center',
  },
  contactsStatsText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
  },
  contactsLimitText: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 5,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    opacity: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
    opacity: 0.3,
  },
  benefitsList: {
    gap: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  benefitIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  benefitBold: {
    fontWeight: '700',
  },
  testButton: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
  },
  adContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
});
