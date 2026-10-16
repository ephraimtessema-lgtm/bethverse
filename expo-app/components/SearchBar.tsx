import { useMemo } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChange, placeholder = 'Search poems…' }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.icon} pointerEvents="none">
        <Ionicons name="search" size={16} color={colors.muted} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      {value ? (
        <Pressable onPress={() => onChange('')} style={styles.clear} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.mutedBg,
      borderRadius: 16,
      marginBottom: 4,
      minHeight: 44,
    },
    icon: {
      paddingLeft: 14,
      paddingRight: 4,
      justifyContent: 'center',
    },
    input: {
      flex: 1,
      paddingVertical: 12,
      paddingRight: 8,
      fontSize: 15,
      color: colors.text,
    },
    clear: {
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignSelf: 'stretch',
    },
  });
}
