import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="index" options={{ title: 'Librar' }} />
      <Stack.Screen name="letter" options={{ headerShown: false }} />
    </Stack>
  );
}
