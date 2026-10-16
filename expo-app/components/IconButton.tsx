import { Pressable, type PressableProps, type ViewStyle, StyleSheet } from 'react-native';

type Props = PressableProps & {
  size?: number;
  style?: ViewStyle;
  children: React.ReactNode;
};

/** Minimum 44pt touch target aligned with visual center */
export function IconButton({ size = 44, style, children, ...props }: Props) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2, opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
