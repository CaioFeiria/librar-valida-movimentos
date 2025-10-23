import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Alfabeto em Libras' }} />
      <Stack.Screen name="letter/[letter]" options={{ title: 'Letra' }} />
    </Stack>
  );
}
