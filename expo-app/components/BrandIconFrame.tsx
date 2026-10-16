import { View, type ViewStyle, StyleSheet } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  size: number;
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Matching rounded-square frame for logo and scan in the header. */
export function BrandIconFrame({ size, children, style }: Props) {
  const { colors } = useAppTheme();
  const radius = size * 0.22;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.mutedBg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
