import { useMemo } from 'react';

import { View, Text, Pressable, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/context/ThemeContext';



export function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {

  const { colors } = useAppTheme();

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (

    <View style={styles.group}>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.card}>{children}</View>

    </View>

  );

}



export function SettingRow({

  label,

  description,

  onPress,

  action,

  destructive,

  icon,

}: {

  label: string;

  description?: string;

  onPress?: () => void;

  action?: React.ReactNode;

  destructive?: boolean;

  icon?: keyof typeof Ionicons.glyphMap;

}) {

  const { colors } = useAppTheme();

  const styles = useMemo(() => createStyles(colors), [colors]);

  const Wrapper = onPress ? Pressable : View;



  return (

    <Wrapper

      onPress={onPress}

      style={[styles.row, onPress && styles.rowPressable]}

    >

      {icon ? (

        <View style={styles.iconWrap}>

          <Ionicons name={icon} size={20} color={colors.muted} />

        </View>

      ) : null}

      <View style={styles.rowBody}>

        <Text style={[styles.label, destructive && { color: colors.destructive }]}>{label}</Text>

        {description ? <Text style={styles.desc}>{description}</Text> : null}

      </View>

      {action ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null)}

    </Wrapper>

  );

}



function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {

  return StyleSheet.create({

    group: { marginBottom: 24 },

    title: {

      fontSize: 11,

      fontWeight: '600',

      color: colors.muted,

      letterSpacing: 1,

      textTransform: 'uppercase',

      marginBottom: 8,

      paddingHorizontal: 4,

    },

    card: {

      backgroundColor: colors.card,

      borderRadius: 16,

      borderWidth: 1,

      borderColor: colors.border,

      overflow: 'hidden',

    },

    row: {

      flexDirection: 'row',

      alignItems: 'center',

      paddingHorizontal: 16,

      paddingVertical: 14,

      minHeight: 52,

      borderBottomWidth: StyleSheet.hairlineWidth,

      borderBottomColor: colors.border,

      gap: 12,

    },

    rowPressable: { opacity: 1 },

    iconWrap: { width: 24, alignItems: 'center' },

    rowBody: { flex: 1 },

    label: { fontSize: 15, fontWeight: '500', color: colors.text },

    desc: { fontSize: 12, color: colors.muted, marginTop: 2 },

  });

}


