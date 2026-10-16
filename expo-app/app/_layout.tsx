import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { useState, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { Lora_400Regular, Lora_600SemiBold } from '@expo-google-fonts/lora';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  NotoSansEthiopic_400Regular,
  NotoSansEthiopic_600SemiBold,
  NotoSansEthiopic_700Bold,
} from '@expo-google-fonts/noto-sans-ethiopic';
import { PinLockProvider, usePinLock } from '@/context/PinLockContext';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { PinLockScreen } from '@/components/PinLockScreen';
import { SplashOverlay } from '@/components/SplashOverlay';
import { queryClient } from '@/lib/queryClient';
import { darkColors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNav() {
  const { pin, isLocked, ready } = usePinLock();
  const { isDark, colors } = useAppTheme();
  const [splashDone, setSplashDone] = useState(false);

  const onSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: darkColors.background }]}>
        <ActivityIndicator color={darkColors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      {!pin || !isLocked ? (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="editor/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
          <Stack.Screen name="collection/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
          <Stack.Screen name="ocr" options={{ presentation: 'card', animation: 'slide_from_right', gestureEnabled: true }} />
        </Stack>
      ) : null}

      {pin && isLocked ? (
        <View style={styles.lockOverlay}>
          <PinLockScreen />
        </View>
      ) : null}

      {!splashDone ? (
        <SplashOverlay visible onFinish={onSplashFinish} backgroundColor={darkColors.background} />
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Lora_400Regular,
    Lora_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSansEthiopic_400Regular,
    NotoSansEthiopic_600SemiBold,
    NotoSansEthiopic_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.center, { backgroundColor: darkColors.background }]}>
        <ActivityIndicator color={darkColors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <PinLockProvider>
            <RootNav />
          </PinLockProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9000,
    backgroundColor: darkColors.background,
  },
});
