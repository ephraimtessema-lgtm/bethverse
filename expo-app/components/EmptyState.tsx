import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeatherIcon } from '@/components/FeatherIcon';
import { useAppTheme } from '@/context/ThemeContext';

type IconName = keyof typeof Ionicons.glyphMap;

type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Use built-in feather quill (default), a named Ionicon, or none. */
  icon?: IconName | 'feather' | false;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = 'feather',
}: Props) {
  const { colors, fonts } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, fonts), [colors, fonts]);

  return (
    <View style={styles.wrap}>
      {icon !== false ? (
        <View style={styles.iconBox}>
          {icon === 'feather' ? (
          <FeatherIcon size={40} color={colors.primary} />
          ) : (
            <Ionicons name={icon} size={36} color={colors.primary} />
          )}
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.btn} onPress={onAction}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useAppTheme>['colors'],
  fonts: ReturnType<typeof useAppTheme>['fonts'],
) {
  return StyleSheet.create({
    wrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
    iconBox: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    title: {
      fontFamily: fonts.display,
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    desc: {
      fontSize: 14,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 21,
      maxWidth: 280,
      marginBottom: 20,
    },
    btn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
    },
    btnText: {
      fontFamily: fonts.display,
      color: colors.onPrimary,
      fontWeight: '600',
      fontSize: 15,
    },
  });
}
