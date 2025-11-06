import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text } from 'react-native';

function GoHomeButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/')}
      style={{ paddingHorizontal: 12, paddingVertical: 6 }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Voltar para Home"
    >
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#111' }}>‹ Início</Text>
    </Pressable>
  );
}

export default function LetterLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        headerTintColor: '#111',
        headerStyle: { backgroundColor: '#fff' },
        headerShadowVisible: true,
        contentStyle: { backgroundColor: '#fff' },
        headerBackVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Alfabeto em Libras', headerLeft: () => <GoHomeButton /> }} />
      <Stack.Screen
        name="[letter]"
        options={{
          title: 'Letra',
        }}
      />
    </Stack>
  );
}
