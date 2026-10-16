import { Image, type ImageStyle, type StyleProp } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
  /** Splash / full-bleed logo without rounding */
  bare?: boolean;
};

export function AppLogo({ size = 40, style, bare = false }: Props) {
  const { isDark } = useAppTheme();
  const source = isDark
    ? require('@/assets/logo-dark.png')
    : require('@/assets/logo-light.png');

  return (
    <Image
      source={source}
      style={[
        {
          width: size,
          height: size,
          borderRadius: bare ? 0 : size * 0.18,
        },
        style,
      ]}
      resizeMode="contain"
    />
  );
}
