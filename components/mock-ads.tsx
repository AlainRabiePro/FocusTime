import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Composant mock pour le développement avec Expo Go
// Pour production: remplacer par react-native-google-mobile-ads
export const BannerAd = ({ unitId, size }: any) => (
  <View style={styles.mockBanner}>
    <Text style={styles.mockText}>📱 Ad Space (Dev Mode)</Text>
  </View>
);

export const InterstitialAd = {
  createForAdRequest: () => ({
    load: () => {},
    show: () => {},
    addAdEventListener: () => {},
  }),
};

export const BannerAdSize = {
  FULL_BANNER: 'FULL_BANNER',
};

export const TestIds = {
  BANNER: 'test-banner-id',
  INTERSTITIAL: 'test-interstitial-id',
};

export const AdEventType = {
  LOADED: 'LOADED',
};

const styles = StyleSheet.create({
  mockBanner: {
    height: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  mockText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
});
