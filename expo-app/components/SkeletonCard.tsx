import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

export function SkeletonCard() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={[styles.line, { width: '60%', height: 18 }]} />
      <View style={[styles.line, { width: '100%', marginTop: 16 }]} />
      <View style={[styles.line, { width: '85%', marginTop: 8 }]} />
      <View style={[styles.line, { width: '40%', marginTop: 20, height: 12 }]} />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    line: {
      height: 14,
      borderRadius: 8,
      backgroundColor: colors.mutedBg,
    },
  });
}
