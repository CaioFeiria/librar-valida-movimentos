import { Stack } from 'expo-router';

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
      <Stack.Screen name="index" options={{ title: 'Alfabeto em Libras' }} />
      <Stack.Screen name="[letter]" options={{ title: 'Letra' }} />
    </Stack>
  );
}
