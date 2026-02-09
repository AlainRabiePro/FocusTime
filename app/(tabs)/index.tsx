import SuccessModal from '@/components/success-modal';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Settings } from '@/types/storage';
import { getAppSettings } from '@/utils/app-settings';
import { getSettings, saveSession } from '@/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Linking, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

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
  const [selectedDigit, setSelectedDigit] = useState<'minuteTens' | 'minuteUnits' | 'secondTens' | 'secondUnits'>('minuteTens');
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);
  const [autoActivateFocus, setAutoActivateFocus] = useState(true);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [timeManuallyAdjusted, setTimeManuallyAdjusted] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const completeButtonAnim = useRef(new Animated.Value(0)).current;

  // Détecter l'orientation
  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setIsLandscape(width > height);
    };
    
    updateOrientation();
    const subscription = Dimensions.addEventListener('change', updateOrientation);
    
    return () => subscription?.remove();
  }, []);

  // Charger l'état du timer au montage
  useEffect(() => {
    loadTimerState();
    loadSettings();
  }, []);

  // Sauvegarder l'état du timer à chaque changement
  useEffect(() => {
    saveTimerState();
  }, [timeLeft, isRunning, mode, sessionsCompleted]);

  const loadTimerState = async () => {
    try {
      const savedState = await AsyncStorage.multiGet([
        '@timer_time_left',
        '@timer_is_running',
        '@timer_mode',
        '@timer_sessions',
        '@timer_start_time',
      ]);
      
      const timeLeftSaved = savedState[0][1];
      const isRunningSaved = savedState[1][1] === 'true';
      const modeSaved = savedState[2][1] as TimerMode | null;
      const sessionsSaved = savedState[3][1];
      const startTimeSaved = savedState[4][1];
      
      // Si le timer était en cours, calculer le temps écoulé
      if (isRunningSaved && timeLeftSaved && startTimeSaved) {
        const elapsed = Math.floor((Date.now() - parseInt(startTimeSaved)) / 1000);
        const newTimeLeft = Math.max(0, parseInt(timeLeftSaved) - elapsed);
        
        if (newTimeLeft > 0) {
          setTimeLeft(newTimeLeft);
          setIsRunning(true);
          if (modeSaved) setMode(modeSaved);
          if (sessionsSaved) setSessionsCompleted(parseInt(sessionsSaved));
        } else {
          // Le timer s'est terminé pendant qu'on était sur un autre écran
          await AsyncStorage.removeItem('@timer_start_time');
        }
      } else if (timeLeftSaved) {
        // Timer arrêté, restaurer juste le temps
        setTimeLeft(parseInt(timeLeftSaved));
        if (modeSaved) setMode(modeSaved);
        if (sessionsSaved) setSessionsCompleted(parseInt(sessionsSaved));
      }
    } catch (error) {
      console.error('Error loading timer state:', error);
    }
  };

  const saveTimerState = async () => {
    try {
      const stateToSave = [
        ['@timer_time_left', timeLeft.toString()],
        ['@timer_is_running', isRunning.toString()],
        ['@timer_mode', mode],
        ['@timer_sessions', sessionsCompleted.toString()],
      ];
      
      if (isRunning) {
        stateToSave.push(['@timer_start_time', Date.now().toString()]);
      } else {
        await AsyncStorage.removeItem('@timer_start_time');
      }
      
      await AsyncStorage.multiSet(stateToSave);
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

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
    
    // Charger les paramètres du mode Focus
    try {
      const focusSettings = await AsyncStorage.multiGet([
        '@focus_mode_enabled',
        '@focus_auto_activate',
      ]);
      setFocusModeEnabled(focusSettings[0][1] === 'true');
      setAutoActivateFocus(focusSettings[1][1] !== 'false');
    } catch (error) {
      console.error('Error loading focus settings:', error);
    }
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
    setFocusModeActive(false); // Désactiver le mode Focus
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
    setIsRunning(false);
    setFocusModeActive(false);
    setTimeManuallyAdjusted(false); // Réinitialiser le flag
    if (settings) {
      const duration = newMode === 'focus' ? settings.focusDuration :
                      newMode === 'shortBreak' ? settings.shortBreakDuration :
                      settings.longBreakDuration;
      setTimeLeft(duration * 60);
    }
  };

  const adjustTime = (increment: number) => {
    if (isRunning) return;
    let newTime = timeLeft;
    
    switch (selectedDigit) {
      case 'minuteTens':
        newTime += increment * 10 * 60; // Dizaine de minutes
        break;
      case 'minuteUnits':
        newTime += increment * 60; // Unité de minutes
        break;
      case 'secondTens':
        newTime += increment * 10; // Dizaine de secondes
        break;
      case 'secondUnits':
        newTime += increment; // Unité de secondes
        break;
    }
    
    if (newTime > 0 && newTime <= 180 * 60) {
      setTimeLeft(newTime);
      setTimeManuallyAdjusted(true);
    }
  };

  const toggleTimer = async () => {
    const newRunningState = !isRunning;
    setIsRunning(newRunningState);
    
    // Réinitialiser le flag quand on démarre le timer
    if (newRunningState) {
      setTimeManuallyAdjusted(false);
    }
    
    // Activer/désactiver le mode Focus si c'est une session de concentration
    if (mode === 'focus' && focusModeEnabled && autoActivateFocus) {
      setFocusModeActive(newRunningState);
      if (newRunningState) {
        if (vibrationEnabled) {
          Vibration.vibrate(100);
        }
      }
    }
  };

  const handleCompleteNow = async () => {
    if (!settings) return;
    
    setIsRunning(false);
    setFocusModeActive(false); // Désactiver le mode Focus
    
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
      case 'focus': return '#2D6A4F'; // Vert foncé plante
      case 'shortBreak': return '#52B788'; // Vert moyen
      case 'longBreak': return '#74C69D'; // Vert clair
    }
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'focus': return 'Focus Time';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getProgress = () => {
    if (!settings) return 0;
    const totalDuration = (mode === 'focus' ? settings.focusDuration :
                          mode === 'shortBreak' ? settings.shortBreakDuration :
                          settings.longBreakDuration) * 60;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  const getPlantStage = () => {
    const progress = getProgress();
    if (progress < 25) return '🌱'; // Graine
    if (progress < 50) return '🌿'; // Pousse
    if (progress < 75) return '🪴'; // Petite plante
    return '🌳'; // Arbre
  };

  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  const openPlaylist = async (url: string, name: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Application non installée',
          `Installez ${name} pour écouter cette playlist.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la playlist.');
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
      {/* Mode immersif quand le timer est actif */}
      {isRunning ? (
        <View style={[styles.immersiveContainer, { backgroundColor: 'rgba(0, 0, 0, 0.95)' }]}>
          <View style={styles.immersiveTimerWrapper}>
            <View style={styles.immersiveTimeDisplay}>
              <View style={styles.immersiveTimeBox}>
                <Text style={[styles.immersiveCurrentTime, { color: '#fff' }]}>
                  {currentTime.split(':')[0]}
                </Text>
              </View>
              <Text style={[styles.immersiveTimeSeparator, { color: '#fff' }]}>:</Text>
              <View style={styles.immersiveTimeBox}>
                <Text style={[styles.immersiveCurrentTime, { color: '#fff' }]}>
                  {currentTime.split(':')[1]}
                </Text>
              </View>
            </View>
            <View style={styles.immersiveTimerDisplay}>
              <View style={styles.immersiveTimerBox}>
                <Text style={[styles.immersiveTime, { color: '#fff' }]}>
                  {formatTime(timeLeft).split(':')[0]}
                </Text>
              </View>
              <Text style={[styles.immersiveTimerSeparator, { color: '#fff' }]}>:</Text>
              <View style={styles.immersiveTimerBox}>
                <Text style={[styles.immersiveTime, { color: '#fff' }]}>
                  {formatTime(timeLeft).split(':')[1]}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.immersivePauseButton}
              onPress={toggleTimer}
              activeOpacity={0.8}>
              <Text style={styles.immersivePauseButtonText}>⏸</Text>
              <Text style={styles.immersivePauseButtonLabel}>PAUSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, isLandscape && styles.landscapeContent]}>
          {/* Indicateur Mode Focus actif */}
          {focusModeActive && (
          <View style={styles.focusBanner}>
            <Text style={styles.focusBannerIcon}>🎯</Text>
            <View style={styles.focusBannerContent}>
              <Text style={styles.focusBannerTitle}>Mode Concentration Actif</Text>
              <Text style={styles.focusBannerSubtitle}>Se désactive automatiquement à la fin</Text>
            </View>
          </View>
        )}
        
        {isLandscape ? (
          // Layout horizontal (paysage)
          <View style={styles.landscapeContainer}>
            {/* Section gauche - Timer */}
            <View style={styles.landscapeTimerSection}>
              {/* Heure actuelle */}
              {!isRunning && (
                <Text style={[styles.currentTimeLandscape, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {currentTime}
                </Text>
              )}
              
              {/* Animation de plante qui pousse */}
              {isRunning && (
                <View style={styles.plantContainer}>
                  <Text style={[styles.plantEmoji, isLandscape && { fontSize: 40 }]}>{getPlantStage()}</Text>
                </View>
              )}
              
              <View style={styles.timerWithControls}>
                {/* Bouton flèche haut */}
                {!isRunning && (
                  <TouchableOpacity 
                    style={[styles.arrowButton, styles.arrowButtonCompact, { borderColor: colorScheme === 'dark' ? '#3A3A3A' : '#e0e0e0' }]}
                    onPress={() => adjustTime(1)}
                    activeOpacity={0.6}>
                    <Text style={[styles.arrowButtonText, { fontSize: 20 }, { color: getModeColor() }]}>▲</Text>
                  </TouchableOpacity>
                )}
                
                <Animated.View 
                  style={[styles.modernTimer, { transform: [{ scale: pulseAnim }] }]}
                  {...(!isRunning && PanResponder.create({
                    onStartShouldSetPanResponder: () => true,
                    onMoveShouldSetPanResponder: () => true,
                    onPanResponderRelease: (evt, gestureState) => {
                      if (Math.abs(gestureState.dx) > 50) {
                        const order = ['minuteTens', 'minuteUnits', 'secondTens', 'secondUnits'] as const;
                        const currentIndex = order.indexOf(selectedDigit);
                        
                        if (gestureState.dx > 0) {
                          const nextIndex = (currentIndex + 1) % order.length;
                          setSelectedDigit(order[nextIndex]);
                        } else {
                          const prevIndex = (currentIndex - 1 + order.length) % order.length;
                          setSelectedDigit(order[prevIndex]);
                        }
                      }
                    }
                  }).panHandlers)}>
                  <Text style={[styles.modeLabel, styles.modeLabelCompact, { color: getModeColor() }]}>
                    {getModeTitle().toUpperCase()}
                  </Text>
                  
                  {!isRunning && (
                    <Text style={[styles.digitIndicator, styles.digitIndicatorCompact, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {selectedDigit === 'minuteTens' && 'Dizaine Minutes'}
                      {selectedDigit === 'minuteUnits' && 'Unité Minutes'}
                      {selectedDigit === 'secondTens' && 'Dizaine Secondes'}
                      {selectedDigit === 'secondUnits' && 'Unité Secondes'}
                    </Text>
                  )}
                  
                  <View style={styles.timerWithSideArrows}>
                    {!isRunning && (
                      <TouchableOpacity 
                        style={styles.sideArrowButton}
                        onPress={() => {
                          const order = ['minuteTens', 'minuteUnits', 'secondTens', 'secondUnits'] as const;
                          const currentIndex = order.indexOf(selectedDigit);
                          const prevIndex = (currentIndex - 1 + order.length) % order.length;
                          setSelectedDigit(order[prevIndex]);
                        }}
                        activeOpacity={0.6}>
                        <Text style={[styles.sideArrowText, styles.sideArrowTextCompact, { color: getModeColor() }]}>◀</Text>
                      </TouchableOpacity>
                    )}
                    
                    <View style={styles.timerDisplay}>
                      <Text style={[
                        styles.minutesText,
                        isLandscape && styles.timerTextCompact,
                        isRunning 
                          ? { color: Colors[colorScheme ?? 'light'].text, opacity: 1 }
                          : selectedDigit === 'minuteTens' 
                            ? { color: Colors[colorScheme ?? 'light'].text, opacity: 1 }
                            : { color: '#999', opacity: 0.5 }
                      ]}>
                        {Math.floor(timeLeft / 600).toString()}
                      </Text>
                      <Text style={[
                        styles.minutesText,
                        isLandscape && styles.timerTextCompact,
                        isRunning 
                          ? { color: Colors[colorScheme ?? 'light'].text, opacity: 1 }
                          : selectedDigit === 'minuteUnits' 
                            ? { color: Colors[colorScheme ?? 'light'].text, opacity: 1 }
                            : { color: '#999', opacity: 0.5 }
                      ]}>
                      {Math.floor((timeLeft % 600) / 60).toString()}
                    </Text>
                    <Text style={[styles.colonText, isLandscape && styles.colonTextCompact, { color: Colors[colorScheme ?? 'light'].text }]}>
                      :
                    </Text>
                    <Text style={[
                      styles.secondsText,
                      isLandscape && styles.timerTextCompact,
                      isRunning 
                        ? { color: Colors[colorScheme ?? 'light'].text, opacity: 1 }
                        : selectedDigit === 'secondTens' 
                          ? { color: Colors[colorScheme ?? 'light'].text, opacity: 1 }
                          : { color: '#999', opacity: 0.5 }
                    ]}>
                      {Math.floor((timeLeft % 60) / 10).toString()}
                    </Text>
                    <Text style={[
                      styles.secondsText,
                      isLandscape && styles.timerTextCompact,
                      isRunning 
                        ? { color: Colors[colorScheme ?? 'light'].text, opacity: 1 }
                        : selectedDigit === 'secondUnits' 
                          ? { color: Colors[colorScheme ?? 'light'].text, opacity: 1 }
                          : { color: '#999', opacity: 0.5 }
                    ]}>
                      {(timeLeft % 10).toString()}
                    </Text>
                  </View>
                  
                  {!isRunning && (
                    <TouchableOpacity 
                      style={styles.sideArrowButton}
                      onPress={() => {
                        const order = ['minuteTens', 'minuteUnits', 'secondTens', 'secondUnits'] as const;
                        const currentIndex = order.indexOf(selectedDigit);
                        const nextIndex = (currentIndex + 1) % order.length;
                        setSelectedDigit(order[nextIndex]);
                      }}
                      activeOpacity={0.6}>
                      <Text style={[styles.sideArrowText, styles.sideArrowTextCompact, { color: getModeColor() }]}>▶</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={[styles.progressBar, styles.progressBarCompact, { backgroundColor: getModeColor() + '15' }]}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        { backgroundColor: getModeColor(), width: `${getProgress()}%` }
                      ]} 
                    />
                  </View>
                </Animated.View>
                
                {!isRunning && (
                  <TouchableOpacity 
                    style={[styles.arrowButton, styles.arrowButtonCompact, { borderColor: colorScheme === 'dark' ? '#3A3A3A' : '#e0e0e0' }]}
                    onPress={() => adjustTime(-1)}
                    activeOpacity={0.6}>
                    <Text style={[styles.arrowButtonText, { fontSize: 20 }, { color: getModeColor() }]}>▼</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <Text style={[styles.sessionsStat, styles.sessionsStatCompact, { color: Colors[colorScheme ?? 'light'].text }]}>
                {sessionsCompleted} session{sessionsCompleted > 1 ? 's' : ''}
              </Text>
            </View>
            
            {/* Section droite - Contrôles */}
            <View style={styles.landscapeControlsSection}>
              {/* Boutons de mode */}
              {!isRunning && (
                <View style={styles.modeButtonsContainer}>
                  <View style={[styles.modeButtons, styles.modeButtonsLandscape, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5' }]}>
                    <TouchableOpacity
                      style={[styles.modeButton, styles.modeButtonCompact, mode === 'focus' && [styles.activeModeButton, { backgroundColor: getModeColor() }]]}
                      onPress={() => switchMode('focus')}
                      activeOpacity={0.8}>
                      <Text style={[styles.modeButtonText, styles.modeButtonTextCompact, mode === 'focus' && styles.activeModeButtonText]}>
                        Focus
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modeButton, styles.modeButtonCompact, mode === 'shortBreak' && [styles.activeModeButton, { backgroundColor: getModeColor() }]]}
                      onPress={() => switchMode('shortBreak')}
                      activeOpacity={0.8}>
                      <Text style={[styles.modeButtonText, styles.modeButtonTextCompact, mode === 'shortBreak' && styles.activeModeButtonText]}>
                        Pause
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modeButton, styles.modeButtonCompact, mode === 'longBreak' && [styles.activeModeButton, { backgroundColor: getModeColor() }]]}
                      onPress={() => switchMode('longBreak')}
                      activeOpacity={0.8}>
                      <Text style={[styles.modeButtonText, styles.modeButtonTextCompact, mode === 'longBreak' && styles.activeModeButtonText]}>
                        Longue
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {/* Bouton principal */}
              <View style={styles.controls}>
                <TouchableOpacity
                  style={[styles.mainControlButton, styles.mainControlButtonCompact, { backgroundColor: getModeColor() }]}
                  onPress={toggleTimer}
                  activeOpacity={0.8}>
                  <Text style={[styles.mainControlButtonText, styles.mainControlButtonTextCompact]}>
                    {isRunning ? 'PAUSE' : 'START'}
                  </Text>
                </TouchableOpacity>

                {showCompleteButton && isRunning && (
                  <Animated.View 
                    style={[
                      styles.completeButtonContainer,
                      { opacity: completeButtonAnim, transform: [{ scale: completeButtonAnim }] }
                    ]}>
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={handleCompleteNow}
                      activeOpacity={0.8}>
                      <Text style={styles.completeButtonText}>Terminer maintenant</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </View>
            </View>
          </View>
        ) : (
          // Layout vertical (portrait) - ancien code
          <>
            {/* Heure actuelle en haut */}
            <View style={styles.topBar}>
              <Text style={[styles.currentTime, { color: Colors[colorScheme ?? 'light'].text }]}>
                {currentTime}
              </Text>
            </View>

            {/* Timer moderne au centre */}
            <View style={styles.modernTimerContainer}>
          {/* Animation de plante qui pousse */}
          {isRunning && (
            <View style={styles.plantContainer}>
              <Text style={styles.plantEmoji}>{getPlantStage()}</Text>
            </View>
          )}
          
          <View style={styles.timerWithControls}>
            {/* Bouton flèche haut */}
            {!isRunning && (
              <TouchableOpacity 
                style={[styles.arrowButton, { borderColor: colorScheme === 'dark' ? '#3A3A3A' : '#e0e0e0' }]}
                onPress={() => adjustTime(1)}
                activeOpacity={0.6}>
                <Text style={[styles.arrowButtonText, { color: getModeColor() }]}>▲</Text>
              </TouchableOpacity>
            )}
            
            <Animated.View 
              style={[styles.modernTimer, { transform: [{ scale: pulseAnim }] }]}
              {...(!isRunning && PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderRelease: (evt, gestureState) => {
                  if (Math.abs(gestureState.dx) > 50) {
                    const order = ['minuteTens', 'minuteUnits', 'secondTens', 'secondUnits'] as const;
                    const currentIndex = order.indexOf(selectedDigit);
                    
                    if (gestureState.dx > 0) {
                      // Swipe vers la droite - Chiffre suivant
                      const nextIndex = (currentIndex + 1) % order.length;
                      setSelectedDigit(order[nextIndex]);
                    } else {
                      // Swipe vers la gauche - Chiffre précédent
                      const prevIndex = (currentIndex - 1 + order.length) % order.length;
                      setSelectedDigit(order[prevIndex]);
                    }
                  }
                },
              }).panHandlers)}>
              <Text style={[styles.modeLabel, { color: getModeColor() }]}>
                {getModeTitle().toUpperCase()}
              </Text>
              
              {/* Indicateur du chiffre sélectionné */}
              {!isRunning && (
                <Text style={[styles.digitIndicator, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {selectedDigit === 'minuteTens' && 'Dizaine Minutes'}
                  {selectedDigit === 'minuteUnits' && 'Unité Minutes'}
                  {selectedDigit === 'secondTens' && 'Dizaine Secondes'}
                  {selectedDigit === 'secondUnits' && 'Unité Secondes'}
                </Text>
              )}
              
              {/* Timer avec flèches latérales */}
              <View style={styles.timerWithSideArrows}>
                {!isRunning && (
                  <TouchableOpacity 
                    style={styles.sideArrowButton}
                    onPress={() => {
                      const order = ['minuteTens', 'minuteUnits', 'secondTens', 'secondUnits'] as const;
                      const currentIndex = order.indexOf(selectedDigit);
                      const prevIndex = (currentIndex - 1 + order.length) % order.length;
                      setSelectedDigit(order[prevIndex]);
                    }}
                    activeOpacity={0.6}>
                    <Text style={[styles.sideArrowText, { color: getModeColor() }]}>◀</Text>
                  </TouchableOpacity>
                )}
                
                <View style={styles.timerDisplay}>
                  <Text style={[
                    styles.minutesText,
                    isRunning 
                      ? { color: Colors[colorScheme ?? 'light'].text, opacity: 1 }
                      : selectedDigit === 'minuteTens' 
                        ? { color: Colors[colorScheme ?? 'light'].text, opacity: 1 }
                        : { color: '#999', opacity: 0.5 }
                  ]}>
                    {Math.floor(timeLeft / 600).toString()}
                  </Text>
                  <Text style={[
                    styles.minutesText,
                    isRunning 
                      ? { color: Colors[colorScheme ?? 'light'].text, opacity: 1 }
                      : selectedDigit === 'minuteUnits' 
                        ? { color: Colors[colorScheme ?? 'light'].text, opacity: 1 }
                        : { color: '#999', opacity: 0.5 }
                  ]}>
                  {Math.floor((timeLeft % 600) / 60).toString()}
                </Text>
                <Text style={[styles.colonText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  :
                </Text>
                <Text style={[
                  styles.secondsText,
                  isRunning 
                    ? { color: Colors[colorScheme ?? 'light'].text, opacity: 1 }
                    : selectedDigit === 'secondTens' 
                      ? { color: Colors[colorScheme ?? 'light'].text, opacity: 1 }
                      : { color: '#999', opacity: 0.5 }
                ]}>
                  {Math.floor((timeLeft % 60) / 10).toString()}
                </Text>
                <Text style={[
                  styles.secondsText,
                  isRunning 
                    ? { color: Colors[colorScheme ?? 'light'].text, opacity: 1 }
                    : selectedDigit === 'secondUnits' 
                      ? { color: Colors[colorScheme ?? 'light'].text, opacity: 1 }
                      : { color: '#999', opacity: 0.5 }
                ]}>
                  {(timeLeft % 10).toString()}
                </Text>
              </View>
              
              {!isRunning && (
                <TouchableOpacity 
                  style={styles.sideArrowButton}
                  onPress={() => {
                    const order = ['minuteTens', 'minuteUnits', 'secondTens', 'secondUnits'] as const;
                    const currentIndex = order.indexOf(selectedDigit);
                    const nextIndex = (currentIndex + 1) % order.length;
                    setSelectedDigit(order[nextIndex]);
                  }}
                  activeOpacity={0.6}>
                  <Text style={[styles.sideArrowText, { color: getModeColor() }]}>▶</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={[styles.progressBar, { backgroundColor: getModeColor() + '15' }]}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { backgroundColor: getModeColor(), width: `${getProgress()}%` }
                  ]} 
                />
              </View>
            </Animated.View>
            
            {/* Bouton flèche bas */}
            {!isRunning && (
              <TouchableOpacity 
                style={[styles.arrowButton, { borderColor: colorScheme === 'dark' ? '#3A3A3A' : '#e0e0e0' }]}
                onPress={() => adjustTime(-1)}
                activeOpacity={0.6}>
                <Text style={[styles.arrowButtonText, { color: getModeColor() }]}>▼</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Statistiques session */}
          <Text style={[styles.sessionsStat, { color: Colors[colorScheme ?? 'light'].text }]}>
            {sessionsCompleted} session{sessionsCompleted > 1 ? 's' : ''} aujourd'hui
          </Text>
        </View>

        {/* Boutons de mode simplifiés */}
        {!isRunning && (
          <View style={styles.modeButtonsContainer}>
            <View style={[styles.modeButtons, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5' }]}>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'focus' && [styles.activeModeButton, { backgroundColor: getModeColor() }]]}
                onPress={() => switchMode('focus')}
                activeOpacity={0.8}>
                <Text style={[styles.modeButtonText, mode === 'focus' && styles.activeModeButtonText]}>
                  Focus
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'shortBreak' && [styles.activeModeButton, { backgroundColor: getModeColor() }]]}
                onPress={() => switchMode('shortBreak')}
                activeOpacity={0.8}>
                <Text style={[styles.modeButtonText, mode === 'shortBreak' && styles.activeModeButtonText]}>
                  Pause
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'longBreak' && [styles.activeModeButton, { backgroundColor: getModeColor() }]]}
                onPress={() => switchMode('longBreak')}
                activeOpacity={0.8}>
                <Text style={[styles.modeButtonText, mode === 'longBreak' && styles.activeModeButtonText]}>
                  Longue
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Boutons de contrôle */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.mainControlButton, { backgroundColor: getModeColor() }]}
            onPress={toggleTimer}
            activeOpacity={0.8}>
            <Text style={styles.mainControlButtonText}>
              {isRunning ? 'PAUSE' : 'START'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {showCompleteButton && (
          <Animated.View
            style={[
              styles.completeButtonContainer,
              {
                opacity: completeButtonAnim,
                transform: [
                  {
                    translateY: completeButtonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                  { scale: completeButtonAnim },
                ],
              },
            ]}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteNow}
              activeOpacity={0.8}>
              <Text style={styles.completeButtonText}>
                Terminer maintenant
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

      {/* Section Playlists de Concentration */}
      {!isLandscape && mode === 'focus' && focusModeEnabled && (
        <View style={[styles.playlistSection, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#fff' }]}>
          <View style={styles.playlistHeader}>
            <Text style={styles.playlistIcon}>🎵</Text>
            <Text style={[styles.playlistTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Musique de Concentration
            </Text>
          </View>
          <Text style={[styles.playlistSubtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Lancez une playlist pour rester concentré
          </Text>
          
          <View style={styles.playlistButtons}>
            <TouchableOpacity
              style={[styles.playlistButton, { backgroundColor: '#1DB954' }]}
              onPress={() => openPlaylist('https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ', 'Spotify')}>
              <Text style={styles.playlistButtonIcon}>🎧</Text>
              <Text style={styles.playlistButtonText}>Spotify</Text>
              <Text style={styles.playlistButtonSubtext}>Deep Focus</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.playlistButton, { backgroundColor: '#FF0000' }]}
              onPress={() => openPlaylist('https://music.youtube.com/playlist?list=PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj', 'YouTube Music')}>
              <Text style={styles.playlistButtonIcon}>▶️</Text>
              <Text style={styles.playlistButtonText}>YouTube</Text>
              <Text style={styles.playlistButtonSubtext}>Focus Music</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.playlistButton, { backgroundColor: '#FA243C' }]}
              onPress={() => openPlaylist('https://music.apple.com/fr/playlist/concentration-intense/pl.6bf4415b83dc4a5390a186019f61ed10', 'Apple Music')}>
              <Text style={styles.playlistButtonIcon}>🍎</Text>
              <Text style={styles.playlistButtonText}>Apple Music</Text>
              <Text style={styles.playlistButtonSubtext}>Study Beats</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
          </>
        )}
        </ScrollView>
      )}
      
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
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  focusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D6A4F',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  focusBannerIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  focusBannerContent: {
    flex: 1,
  },
  focusBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  focusBannerSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  currentTime: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 2,
  },
  sessionsCount: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.6,
  },
  modernTimerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  timerWithControls: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  arrowButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  arrowButtonTop: {
    marginBottom: 20,
  },
  arrowButtonBottom: {
    marginTop: 20,
  },
  arrowButtonText: {
    fontSize: 24,
    fontWeight: '700',
  },
  plantContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  plantEmoji: {
    fontSize: 60,
  },
  modernTimer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 15,
    opacity: 0.8,
    letterSpacing: 2,
  },
  digitIndicator: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
    opacity: 0.7,
    textAlign: 'center',
  },
  timerWithSideArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  sideArrowButton: {
    padding: 8,
  },
  sideArrowText: {
    fontSize: 32,
    fontWeight: '700',
  },
  digitNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 15,
  },
  digitArrowButton: {
    padding: 8,
  },
  digitArrowText: {
    fontSize: 24,
    fontWeight: '700',
  },
  adjustModeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 15,
  },
  adjustArrow: {
    padding: 8,
  },
  adjustArrowText: {
    fontSize: 20,
    fontWeight: '700',
  },
  adjustModeText: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'center',
  },
  multiplierIndicator: {
    alignItems: 'center',
    marginVertical: 8,
  },
  multiplierText: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.7,
    marginBottom: 3,
  },
  swipeHint: {
    fontSize: 9,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  minutesText: {
    fontSize: 72,
    fontWeight: '300',
    lineHeight: 72,
    fontVariant: ['tabular-nums'],
  },
  colonText: {
    fontSize: 72,
    fontWeight: '100',
    opacity: 0.3,
    marginHorizontal: 4,
    lineHeight: 72,
  },
  secondsText: {
    fontSize: 72,
    fontWeight: '300',
    lineHeight: 72,
    opacity: 0.5,
    fontVariant: ['tabular-nums'],
  },
  progressBar: {
    width: 200,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  sessionsStat: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.5,
    marginTop: 20,
  },
  modeButtonsContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  modeButtons: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  modeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  activeModeButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  activeModeButtonText: {
    color: '#fff',
  },
  controls: {
    alignItems: 'center',
    marginBottom: 15,
  },
  mainControlButton: {
    paddingVertical: 20,
    paddingHorizontal: 80,
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  mainControlButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  completeButtonContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  completeButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    backgroundColor: '#52B788',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  playlistSection: {
    marginHorizontal: -10,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playlistIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  playlistTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  playlistSubtitle: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 16,
  },
  playlistButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  playlistButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  playlistButtonIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  playlistButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  playlistButtonSubtext: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.9,
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
  // Styles pour le mode paysage
  landscapeContent: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  landscapeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 40,
    paddingHorizontal: 20,
  },
  landscapeTimerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeControlsSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentTimeLandscape: {
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 1.5,
    marginBottom: 10,
    opacity: 0.6,
  },
  arrowButtonCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginVertical: 8,
  },
  modeLabelCompact: {
    fontSize: 10,
    marginBottom: 8,
  },
  digitIndicatorCompact: {
    fontSize: 9,
    marginBottom: 6,
  },
  sideArrowTextCompact: {
    fontSize: 24,
  },
  timerTextCompact: {
    fontSize: 48,
    lineHeight: 48,
  },
  colonTextCompact: {
    fontSize: 48,
    lineHeight: 48,
  },
  progressBarCompact: {
    width: 150,
    height: 3,
  },
  sessionsStatCompact: {
    fontSize: 11,
    marginTop: 12,
  },
  modeButtonsLandscape: {
    flexDirection: 'column',
    gap: 8,
  },
  modeButtonCompact: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modeButtonTextCompact: {
    fontSize: 12,
  },
  mainControlButtonCompact: {
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
  },
  mainControlButtonTextCompact: {
    fontSize: 16,
  },
  // Mode immersif (écran assombri avec timer)
  immersiveContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  immersiveTimerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  immersiveTimeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
  },
  immersiveTimeBox: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 80,
    alignItems: 'center',
  },
  immersiveTimeSeparator: {
    fontSize: 40,
    fontWeight: '100',
    marginHorizontal: 8,
    opacity: 0.5,
  },
  immersiveCurrentTime: {
    fontSize: 40,
    fontWeight: '100',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  immersiveTimerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  immersiveTimerBox: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: 120,
    alignItems: 'center',
  },
  immersiveTimerSeparator: {
    fontSize: 72,
    fontWeight: '100',
    marginHorizontal: 12,
    opacity: 0.4,
  },
  immersiveTime: {
    fontSize: 72,
    fontWeight: '200',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  immersivePauseButton: {
    marginTop: 60,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  immersivePauseButtonText: {
    fontSize: 32,
    marginBottom: 4,
  },
  immersivePauseButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 2,
    opacity: 0.9,
  },
});
