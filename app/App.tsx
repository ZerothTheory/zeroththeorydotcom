import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Experience from './src/Experience';
import CinematicOverlay from './src/components/CinematicOverlay';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />
      <Experience />
      <CinematicOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
