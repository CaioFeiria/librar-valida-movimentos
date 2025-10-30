import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function AlphabetScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const GAP = 14;
  const PADDING_H = 24;
  const numCols = width >= 900 ? 4 : width >= 600 ? 3 : 2;

  const tileSize = useMemo(() => {
    const totalGaps = GAP * (numCols - 1);
    return Math.floor((width - PADDING_H * 2 - totalGaps) / numCols);
  }, [width, numCols]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Selecione uma Letra</Text>

        <View
          style={[
            styles.grid,
            {
              rowGap: GAP,
              columnGap: GAP,
              paddingHorizontal: PADDING_H,
              paddingBottom: 24,
            },
          ]}
        >
          {ALPHABET.map((letter) => (
            <Pressable
              key={letter}
              onPress={() => router.push(`/letter/${letter}`)}
              style={({ pressed }) => [styles.tile, { width: tileSize, height: tileSize, opacity: pressed ? 0.9 : 1 }]}
              android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Letra ${letter}`}
            >
              <Text style={styles.tileText}>{letter}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: {
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  title: {
    color: '#111',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 14, // iOS/Android antigos ignoram; já temos `gap` acima como fallback
  },
  tile: {
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  tileText: {
    color: '#111',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
