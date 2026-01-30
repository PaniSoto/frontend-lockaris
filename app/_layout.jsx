import { useSync } from '@/hooks/useSync';
import '../global.css';
import { Stack } from 'expo-router';

export default function RootLayout() {
  useSync();
  return (
    <Stack>
      {/* Pantalla principal que decide si vas a Login o Home */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Registramos el grupo de pestañas */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
