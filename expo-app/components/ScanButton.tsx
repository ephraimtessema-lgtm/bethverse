import { Pressable, View, type ViewStyle } from 'react-native';
import { ScanIcon } from '@/components/ScanIcon';
import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  onPress: () => void;
  size?: number;
  style?: ViewStyle;
};

export function ScanButton({ onPress, size = 44, style }: Props) {
  const { colors } = useAppTheme();
  const radius = size / 2;

  return (
    <Pressable
      onPress={onPress}
      style={style}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel="Scan poem"
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.mutedBg,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ScanIcon size={size * 0.48} color={colors.primary} />
      </View>
    </Pressable>
  );
}
