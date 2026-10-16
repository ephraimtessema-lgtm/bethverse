import { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { usePinLock } from '@/context/PinLockContext';
import { useAppTheme } from '@/context/ThemeContext';
import { AppLogo } from '@/components/AppLogo';

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
] as const;

const KEY_W = 76;
const KEY_H = 56;

export function PinLockScreen() {
  const { pin, biometricEnabled, unlock } = usePinLock();
  const { colors, fonts, t } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);
  const [entered, setEntered] = useState('');
  const [error, setError] = useState(false);

  const pinLen = pin?.length || 4;

  const handleDigit = (d: string) => {
    if (d === '⌫') {
      setEntered((p) => p.slice(0, -1));
      setError(false);
      return;
    }
    if (!d) return;
    const next = entered + d;
    setEntered(next);
    if (next.length === pinLen) {
      if (next === pin) {
        unlock();
      } else {
        setError(true);
        setTimeout(() => {
          setEntered('');
          setError(false);
        }, 500);
      }
    }
  };

  const tryBiometric = async () => {
    const ok = await LocalAuthentication.authenticateAsync({
      promptMessage: t.unlockApp,
      biometricsSecurityLevel: 'weak',
    });
    if (ok.success) unlock();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <AppLogo size={72} />
        <Text style={styles.title}>{t.appName}</Text>
        <Text style={styles.sub}>{t.enterPin}</Text>
      </View>

      <View style={styles.dots}>
        {Array.from({ length: pinLen }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < entered.length && (error ? styles.dotError : styles.dotFilled),
            ]}
          />
        ))}
      </View>

      <View style={styles.pad}>
        {KEYPAD_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((d, colIndex) => {
              const isEmpty = d === '';
              return (
                <Pressable
                  key={`${rowIndex}-${colIndex}`}
                  onPress={() => handleDigit(d)}
                  disabled={isEmpty}
                  style={[
                    styles.key,
                    isEmpty && styles.keyEmpty,
                    d === '⌫' && styles.keyMuted,
                  ]}
                >
                  {d === '⌫' ? (
                    <Ionicons name="backspace-outline" size={22} color={colors.text} />
                  ) : (
                    <Text style={styles.keyText}>{d}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {biometricEnabled ? (
        <Pressable onPress={tryBiometric} style={styles.bio}>
          <View style={styles.bioIcon}>
            <Ionicons name="finger-print" size={28} color={colors.onPrimary} />
          </View>
          <Text style={styles.bioText}>{t.useBiometric}</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  fonts: ReturnType<typeof useAppTheme>['fonts'],
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    hero: { alignItems: 'center', marginBottom: 28, gap: 10 },
    title: { fontFamily: fonts.display, fontSize: 26, fontWeight: '700', color: colors.text },
    sub: { fontSize: 14, color: colors.muted },
    dots: { flexDirection: 'row', gap: 16, marginBottom: 32 },
    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: colors.muted,
    },
    dotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
    dotError: { backgroundColor: colors.destructive, borderColor: colors.destructive },
    pad: { gap: 10, alignItems: 'center' },
    row: { flexDirection: 'row', gap: 10 },
    key: {
      width: KEY_W,
      height: KEY_H,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyEmpty: { opacity: 0, borderWidth: 0 },
    keyMuted: { backgroundColor: colors.mutedBg, borderWidth: 0 },
    keyText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      includeFontPadding: false,
    },
    bio: { marginTop: 28, alignItems: 'center' },
    bioIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bioText: { fontSize: 12, color: colors.muted, marginTop: 8 },
  });
}
