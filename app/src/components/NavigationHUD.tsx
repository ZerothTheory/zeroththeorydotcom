import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { CHAPTERS } from '../data/doctrine';
import { useDoctrineStore } from '../store';

export default function NavigationHUD() {
  const activeChapter = useDoctrineStore((s) => s.activeChapter);
  const flyToChapter = useDoctrineStore((s) => s.flyToChapter);

  const activeData = activeChapter !== null ? CHAPTERS[activeChapter] : null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Title */}
      <View style={styles.titleContainer} pointerEvents="none">
        <Text style={styles.title}>THE DOCTRINE OF TENSOR ZERO</Text>
        <Text style={styles.subtitle}>A Calculus of Totality</Text>
      </View>

      {/* Controls hint */}
      <View style={styles.controlsHint} pointerEvents="none">
        <Text style={styles.hintText}>
          WASD to fly{'  '}|{'  '}Mouse drag to look{'  '}|{'  '}Click orbs or nav to visit chapters
        </Text>
      </View>

      {/* Active chapter indicator - left side */}
      {activeData && (
        <View style={styles.chapterIndicator} pointerEvents="none">
          <View style={[styles.indicatorLine, { backgroundColor: activeData.color }]} />
          <Text style={[styles.indicatorTitle, { color: activeData.color }]}>
            {activeData.title}
          </Text>
          <Text style={styles.indicatorSubtitle}>{activeData.subtitle}</Text>
        </View>
      )}

      {/* Chapter nav bar at bottom */}
      <View style={styles.navBar}>
        {CHAPTERS.map((ch) => {
          const isActive = activeChapter === ch.id;
          return (
            <Pressable
              key={ch.id}
              onPress={() => flyToChapter(ch.id)}
              style={({ hovered }: any) => [
                styles.navItem,
                isActive && { borderBottomColor: ch.color, borderBottomWidth: 2 },
                hovered && !isActive && styles.navItemHovered,
              ]}
            >
              <View
                style={[
                  styles.navDot,
                  { backgroundColor: ch.color },
                  isActive && styles.navDotActive,
                ]}
              />
              <Text
                style={[
                  styles.navText,
                  isActive && { color: '#fff', opacity: 1 },
                ]}
                numberOfLines={1}
              >
                {ch.subtitle}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
  },
  titleContainer: {
    alignItems: 'center',
    paddingTop: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 13,
    letterSpacing: 6,
    fontWeight: '300',
    opacity: 0.5,
    fontFamily: 'monospace',
  },
  subtitle: {
    color: '#888',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '300',
    marginTop: 4,
    fontFamily: 'monospace',
    opacity: 0.4,
  },
  controlsHint: {
    position: 'absolute',
    top: 65,
    alignSelf: 'center',
  },
  hintText: {
    color: '#444',
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  chapterIndicator: {
    position: 'absolute',
    left: 30,
    top: '40%' as any,
    maxWidth: 250,
  },
  indicatorLine: {
    width: 30,
    height: 2,
    marginBottom: 10,
  },
  indicatorTitle: {
    fontSize: 14,
    letterSpacing: 2,
    fontWeight: '500',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  indicatorSubtitle: {
    color: '#666',
    fontSize: 11,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    borderRadius: 4,
  },
  navItemHovered: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  navDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.4,
  },
  navDotActive: {
    opacity: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  navText: {
    color: '#777',
    fontSize: 11,
    fontFamily: 'monospace',
    letterSpacing: 1,
    opacity: 0.5,
  },
});
