import { AdEventType, BannerAd, BannerAdSize, InterstitialAd, TestIds } from '@/components/mock-ads';
import SuccessModal from '@/components/success-modal';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Settings } from '@/types/storage';
import { getAppSettings } from '@/utils/app-settings';
import { getSettings, saveSession } from '@/utils/storage';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
// Pour production: import { BannerAd, BannerAdSize, TestIds, InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const interstitial = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL, {
  requestNonPersonalizedAdsOnly: false,
});

export default function TimerScreen() {
  const colorScheme = useColorScheme();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '', emoji: '🎉' });
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const completeButtonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning]);

  const loadSettings = async () => {
    const loadedSettings = await getSettings();
    const appSettings = await getAppSettings();
    setSettings(loadedSettings);
    setVibrationEnabled(appSettings.vibrationEnabled);
    setTimeLeft(loadedSettings.focusDuration * 60);
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  // Animation pour le bouton "Terminer maintenant"
  useEffect(() => {
    if (!settings) return;
    
    const totalDuration = mode === 'focus' ? settings.focusDuration * 60 :
                         mode === 'shortBreak' ? settings.shortBreakDuration * 60 :
                         settings.longBreakDuration * 60;
    
    const shouldShow = timeLeft < totalDuration;
    
    if (shouldShow && !showCompleteButton) {
      setShowCompleteButton(true);
      Animated.spring(completeButtonAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else if (!shouldShow && showCompleteButton) {
      Animated.timing(completeButtonAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowCompleteButton(false));
    }
  }, [timeLeft, settings, mode]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    if (vibrationEnabled) {
      Vibration.vibrate(1000);
    }

    // Sauvegarder la session
    await saveSession({
      duration: mode === 'focus' ? settings!.focusDuration : 
                mode === 'shortBreak' ? settings!.shortBreakDuration : 
                settings!.longBreakDuration,
      completedAt: Date.now(),
      type: mode === 'focus' ? 'focus' : 'break',
    });

    // Afficher une pub interstitielle tous les 3 sessions
    if (mode === 'focus') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);

      // Message de félicitation
      setSuccessMessage({
        title: 'Session terminée !',
        message: `Excellent travail ! ${newSessionsCompleted} session${newSessionsCompleted > 1 ? 's terminées' : ' terminée'} aujourd'hui`,
        emoji: newSessionsCompleted % 5 === 0 ? '🏆' : '🎉',
      });
      setShowSuccessModal(true);

      if (newSessionsCompleted % 3 === 0) {
        try {
          interstitial.load();
          interstitial.addAdEventListener(AdEventType.LOADED, () => {
            interstitial.show();
          });
        } catch (error) {
          console.log('Erreur pub interstitielle:', error);
        }
      }

      // Passer à la pause appropriée
      if (newSessionsCompleted % settings!.sessionsBeforeLongBreak === 0) {
        switchMode('longBreak');
      } else {
        switchMode('shortBreak');
      }
    } else {
      switchMode('focus');
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    if (settings) {
      const duration = newMode === 'focus' ? settings.focusDuration :
                      newMode === 'shortBreak' ? settings.shortBreakDuration :
                      settings.longBreakDuration;
      setTimeLeft(duration * 60);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleCompleteNow = async () => {
    if (!settings) return;
    
    setIsRunning(false);
    
    // Calculer le temps écoulé en secondes
    const totalDurationSeconds = (mode === 'focus' ? settings.focusDuration :
                                  mode === 'shortBreak' ? settings.shortBreakDuration :
                                  settings.longBreakDuration) * 60;
    const elapsedSeconds = totalDurationSeconds - timeLeft;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const elapsedSecondsDisplay = elapsedSeconds % 60;
    
    if (elapsedSeconds > 0) {
      // Sauvegarder la session avec le temps réellement écoulé en minutes (arrondi)
      await saveSession({
        duration: Math.ceil(elapsedSeconds / 60), // Arrondir à la minute supérieure
        completedAt: Date.now(),
        type: mode === 'focus' ? 'focus' : 'break',
      });

      if (vibrationEnabled) {
        Vibration.vibrate(500);
      }

      if (mode === 'focus') {
        const newSessionsCompleted = sessionsCompleted + 1;
        setSessionsCompleted(newSessionsCompleted);

        // Afficher le temps exact avec secondes
        const timeDisplay = elapsedMinutes > 0 
          ? `${elapsedMinutes}m ${elapsedSecondsDisplay}s`
          : `${elapsedSecondsDisplay}s`;

        setSuccessMessage({
          title: 'Session terminée !',
          message: `${timeDisplay} enregistré${elapsedSeconds > 1 ? 's' : ''} !`,
          emoji: '✅',
        });
        setShowSuccessModal(true);
      }

      // Réinitialiser le timer au mode approprié
      switchMode(mode === 'focus' ? 'shortBreak' : 'focus');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeColor = () => {
    switch (mode) {
      case 'focus': return '#FF6B6B';
      case 'shortBreak': return '#4ECDC4';
      case 'longBreak': return '#45B7D1';
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'focus': return 'Focus Time';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
    }
  };

  if (!settings) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <View style={styles.header}>
        <Text style={[styles.modeTitle, { color: getModeColor() }]}>
          {getModeTitle()}
        </Text>
        <Text style={[styles.sessionsText, { color: Colors[colorScheme ?? 'light'].text }]}>
          Sessions: {sessionsCompleted}
        </Text>
      </View>

      <View style={styles.timerContainer}>
        <Animated.View 
          style={[
            styles.timerCircle, 
            { 
              borderColor: getModeColor(),
              transform: [{ scale: pulseAnim }]
            }
          ]}>
          <Text style={[styles.timerText, { color: getModeColor() }]}>
            {formatTime(timeLeft)}
          </Text>
        </Animated.View>
      </View>

      <View style={styles.modeButtons}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'focus' && styles.activeModeButton]}
          onPress={() => switchMode('focus')}>
          <Text style={[styles.modeButtonText, mode === 'focus' && styles.activeModeButtonText]}>
            Focus
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'shortBreak' && styles.activeModeButton]}
          onPress={() => switchMode('shortBreak')}>
          <Text style={[styles.modeButtonText, mode === 'shortBreak' && styles.activeModeButtonText]}>
            Short Break
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'longBreak' && styles.activeModeButton]}
          onPress={() => switchMode('longBreak')}>
          <Text style={[styles.modeButtonText, mode === 'longBreak' && styles.activeModeButtonText]}>
            Long Break
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: getModeColor() }]}
          onPress={toggleTimer}>
          <Text style={styles.controlButtonText}>
            {isRunning ? 'PAUSE' : 'START'}
          </Text>
        </TouchableOpacity>
        
        {showCompleteButton && (
          <Animated.View
            style={{
              opacity: completeButtonAnim,
              transform: [
                {
                  translateY: completeButtonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
                {
                  scale: completeButtonAnim,
                },
              ],
            }}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: '#4CAF50' }]}
              onPress={handleCompleteNow}>
              <Text style={styles.controlButtonText}>
                ✓ TERMINER
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      <View style={styles.adContainer}>
        <BannerAd
          unitId={TestIds.BANNER}
          size={BannerAdSize.FULL_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
        />
      </View>

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successMessage.title}
        message={successMessage.message}
        emoji={successMessage.emoji}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  modeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sessionsText: {
    fontSize: 16,
    opacity: 0.7,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  modeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    gap: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  activeModeButton: {
    backgroundColor: '#333',
  },
  modeButtonText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    fontWeight: '600',
  },
  activeModeButtonText: {
    color: '#fff',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 30,
  },
  controlButton: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    minWidth: 140,
  },
  resetButton: {
    backgroundColor: '#95a5a6',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  adContainer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
});
