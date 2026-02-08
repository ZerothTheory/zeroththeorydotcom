import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Experience from './src/Experience';
import NavigationHUD from './src/components/NavigationHUD';

function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const textFade = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in text
    Animated.timing(textFade, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // After delay, fade out loading screen
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => onComplete());
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
      <Animated.View style={{ opacity: textFade, alignItems: 'center' }}>
        <Text style={styles.loadingTitle}>THE DOCTRINE OF TENSOR ZERO</Text>
        <View style={styles.loadingDivider} />
        <Text style={styles.loadingSubtitle}>A Calculus of Totality</Text>
        <Text style={styles.loadingHint}>Entering the Void...</Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />
      <Experience />
      <NavigationHUD />
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingTitle: {
    color: '#ffffff',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: '200',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  loadingDivider: {
    width: 60,
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },
  loadingSubtitle: {
    color: '#666',
    fontSize: 14,
    letterSpacing: 4,
    fontWeight: '300',
    fontFamily: 'monospace',
  },
  loadingHint: {
    color: '#333',
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginTop: 40,
  },
});
