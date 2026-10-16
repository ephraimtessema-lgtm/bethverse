import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
] as const;

const KEY_W = 68;
const KEY_H = 52;

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  length?: number;
};

export function PinPadInput({ label, value, onChange, length = 4 }: Props) {
  const { colors, fonts } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);

  const handleDigit = (d: string) => {
    if (d === '⌫') {
      onChange(value.slice(0, -1));
      return;
    }
    if (!d || value.length >= length) return;
    onChange(value + d);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dots}>
        {Array.from({ length }).map((_, i) => (
          <View key={i} style={[styles.dot, i < value.length && styles.dotFilled]} />
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
                  style={[styles.key, isEmpty && styles.keyEmpty, d === '⌫' && styles.keyMuted]}
                >
                  {d === '⌫' ? (
                    <Ionicons name="backspace-outline" size={20} color={colors.text} />
                  ) : (
                    <Text style={styles.keyText}>{d}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  fonts: ReturnType<typeof useAppTheme>['fonts'],
) {
  return StyleSheet.create({
    wrap: { alignItems: 'center', width: '100%' },
    label: { fontSize: 14, color: colors.muted, marginBottom: 16, textAlign: 'center' },
    dots: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: colors.muted,
    },
    dotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
    pad: { gap: 8, alignItems: 'center' },
    row: { flexDirection: 'row', gap: 8 },
    key: {
      width: KEY_W,
      height: KEY_H,
      borderRadius: 14,
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
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
  });
}
