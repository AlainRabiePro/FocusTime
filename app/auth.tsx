import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { signIn, signUp } from '@/services/auth';
import { getErrorMessage } from '@/utils/error-handler';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de pulse pour l'icône
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (!isLogin && password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
        Alert.alert('✅ Succès', 'Compte créé avec succès ! Bienvenue 🎉');
      }
    } catch (error: any) {
      Alert.alert('⚠️ Erreur', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { 
        backgroundColor: Colors[colorScheme ?? 'light'].background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }]}>
      {/* Gradient Background Circles */}
      <View style={styles.backgroundCircles}>
        <View style={[styles.circle, styles.circle1, { 
          backgroundColor: colorScheme === 'dark' ? 'rgba(78, 205, 196, 0.1)' : 'rgba(78, 205, 196, 0.15)',
          top: insets.top - 100,
        }]} />
        <View style={[styles.circle, styles.circle2, { 
          backgroundColor: colorScheme === 'dark' ? 'rgba(255, 107, 107, 0.08)' : 'rgba(255, 107, 107, 0.12)' 
        }]} />
        <View style={[styles.circle, styles.circle3, { 
          backgroundColor: colorScheme === 'dark' ? 'rgba(52, 152, 219, 0.08)' : 'rgba(52, 152, 219, 0.12)' 
        }]} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(20, insets.top) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}>
          {/* Logo & Title */}
          <View style={styles.headerContainer}>
            <Text style={[styles.appName, { color: Colors[colorScheme ?? 'light'].text }]}>
              Focus Timer Pro
            </Text>
            <View style={[styles.underline, { backgroundColor: '#4ECDC4' }]} />
          </View>
          
          <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            {isLogin ? '✨ Bon retour parmi nous !' : '🚀 Commencez votre voyage productif'}
          </Text>

          {/* Form Card */}
          <View style={[
            styles.formCard,
            {
              backgroundColor: colorScheme === 'dark' ? 'rgba(42, 42, 42, 0.6)' : 'rgba(255, 255, 255, 0.9)',
              shadowColor: colorScheme === 'dark' ? '#000' : '#4ECDC4',
            }
          ]}>
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { 
                  color: nameFocused ? '#4ECDC4' : Colors[colorScheme ?? 'light'].text,
                  opacity: nameFocused ? 1 : 0.6 
                }]}>
                  👤 Nom d'affichage
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f8f9fa',
                      color: Colors[colorScheme ?? 'light'].text,
                      borderColor: nameFocused ? '#4ECDC4' : 'transparent',
                      borderWidth: nameFocused ? 2 : 0,
                    }
                  ]}
                  placeholder="John Doe (optionnel)"
                  placeholderTextColor={colorScheme === 'dark' ? '#666' : '#aaa'}
                  value={displayName}
                  onChangeText={setDisplayName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  autoCapitalize="words"
                />
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { 
                color: emailFocused ? '#4ECDC4' : Colors[colorScheme ?? 'light'].text,
                opacity: emailFocused ? 1 : 0.6 
              }]}>
                ✉️ Adresse e-mail
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f8f9fa',
                    color: Colors[colorScheme ?? 'light'].text,
                    borderColor: emailFocused ? '#4ECDC4' : 'transparent',
                    borderWidth: emailFocused ? 2 : 0,
                  }
                ]}
                placeholder="votre@email.com"
                placeholderTextColor={colorScheme === 'dark' ? '#666' : '#aaa'}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { 
                color: passwordFocused ? '#4ECDC4' : Colors[colorScheme ?? 'light'].text,
                opacity: passwordFocused ? 1 : 0.6 
              }]}>
                🔒 Mot de passe
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f8f9fa',
                    color: Colors[colorScheme ?? 'light'].text,
                    borderColor: passwordFocused ? '#4ECDC4' : 'transparent',
                    borderWidth: passwordFocused ? 2 : 0,
                  }
                ]}
                placeholder="••••••••"
                placeholderTextColor={colorScheme === 'dark' ? '#666' : '#aaa'}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { 
                  color: confirmFocused ? '#4ECDC4' : Colors[colorScheme ?? 'light'].text,
                  opacity: confirmFocused ? 1 : 0.6 
                }]}>
                  🔐 Confirmer le mot de passe
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f8f9fa',
                      color: Colors[colorScheme ?? 'light'].text,
                      borderColor: confirmFocused ? '#4ECDC4' : 'transparent',
                      borderWidth: confirmFocused ? 2 : 0,
                    }
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={colorScheme === 'dark' ? '#666' : '#aaa'}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setConfirmFocused(true)}
                  onBlur={() => setConfirmFocused(false)}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}>
              <View style={styles.buttonGradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>
                      {isLogin ? 'Se connecter' : 'Créer mon compte'}
                    </Text>
                    <Text style={styles.buttonIcon}>{isLogin ? '→' : '✨'}</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            {isLogin && (
              <TouchableOpacity style={styles.forgotButton}>
                <Text style={[styles.forgotText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Toggle Mode */}
          <View style={styles.switchContainer}>
            <View style={[styles.divider, { backgroundColor: colorScheme === 'dark' ? '#333' : '#e0e0e0' }]} />
            <Text style={[styles.dividerText, { 
              color: Colors[colorScheme ?? 'light'].text,
              backgroundColor: Colors[colorScheme ?? 'light'].background 
            }]}>
              ou
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.switchButton, { 
              borderColor: colorScheme === 'dark' ? '#3a3a3a' : '#e0e0e0' 
            }]}
            onPress={toggleMode}>
            <Text style={[styles.switchText, { color: Colors[colorScheme ?? 'light'].tint }]}>
              {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.footer, { color: Colors[colorScheme ?? 'light'].text }]}>
            En continuant, vous acceptez nos conditions d'utilisation
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundCircles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
  },
  circle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 250,
    height: 250,
    bottom: -80,
    left: -80,
  },
  circle3: {
    width: 200,
    height: 200,
    top: '40%',
    left: -60,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  content: {
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  underline: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 40,
    lineHeight: 24,
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 28,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 16,
  },
  button: {
    height: 58,
    borderRadius: 16,
    marginTop: 10,
    overflow: 'hidden',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchContainer: {
    width: '100%',
    maxWidth: 400,
    marginTop: 30,
    marginBottom: 20,
    position: 'relative',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  dividerText: {
    position: 'absolute',
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.5,
  },
  switchButton: {
    width: '100%',
    maxWidth: 400,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    fontSize: 12,
    opacity: 0.5,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
});
