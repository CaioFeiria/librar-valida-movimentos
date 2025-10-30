import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tile = {
  key: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
};

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const numColumns = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  const gap = 14;
  const totalGaps = gap * (numColumns - 1);
  const tileSize = Math.floor((width - 32 * 2 - totalGaps) / numColumns);

  const tiles: Tile[] = [
    {
      key: 'alphabet',
      title: 'Alfabeto em Libras',
      subtitle: 'Aprenda as letras',
      onPress: () => router.push('/letter'),
    },
    { key: 'palavras', title: 'Treinar Palavras', subtitle: 'em breve', onPress: () => {} },
    { key: 'desafios', title: 'Desafios', subtitle: 'em breve', onPress: () => {} },
    { key: 'sobre', title: 'Sobre', subtitle: 'O que é o Librar', onPress: () => {} },
    { key: 'config', title: 'Configurações', subtitle: 'Câmera & idioma', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Bem-vindo ao Librar</Text>
        <Text style={styles.subtitle}>Selecione um modo para começar a praticar</Text>

        <View style={[styles.grid, { gap, paddingHorizontal: 32, paddingBottom: 24 }]}>
          {tiles.map((t) => (
            <Pressable
              key={t.key}
              onPress={t.onPress}
              style={({ pressed }) => [styles.tile, { width: tileSize, height: tileSize, opacity: pressed ? 0.9 : 1 }]}
              android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
            >
              <Text style={styles.tileTitle}>{t.title}</Text>
              {!!t.subtitle && <Text style={styles.tileSub}>{t.subtitle}</Text>}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingTop: 16, paddingBottom: 16, backgroundColor: '#fff' },
  title: { color: '#111', fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subtitle: { color: '#444', fontSize: 14, textAlign: 'center', marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  tile: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  tileTitle: { color: '#111', fontSize: 16, fontWeight: '700' },
  tileSub: { color: '#666', fontSize: 12 },
});
