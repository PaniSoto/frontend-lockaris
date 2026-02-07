import { useSync } from '@/hooks/useSync';
import '../global.css';
import { Stack } from 'expo-router';

export default function RootLayout() {
  // Monitoriza la conexión a internet y sincroniza cambios pendientes automáticamente
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
