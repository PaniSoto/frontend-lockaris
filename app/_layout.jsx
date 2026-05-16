import { useSync } from '@/hooks/useSync';
import '../global.css';
import { Stack } from 'expo-router';

export default function RootLayout() {
  // Monitoriza la conexión a internet y sincroniza cambios pendientes automáticamente
  useSync();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
