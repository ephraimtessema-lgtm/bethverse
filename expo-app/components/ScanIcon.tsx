import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  size?: number;
  color?: string;
};

/** Document scan icon — corner brackets + text lines (image 3 style). */
export function ScanIcon({ size = 24, color }: Props) {
  const { colors } = useAppTheme();
  const stroke = color ?? colors.primary;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3H4a1 1 0 0 0-1 1v2" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
      <Path d="M18 3h2a1 1 0 0 1 1 1v2" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
      <Path d="M6 21H4a1 1 0 0 1-1-1v-2" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
      <Path d="M18 21h2a1 1 0 0 0 1-1v-2" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
      <Path d="M8 8h8" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
      <Path d="M8 12h10" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
      <Path d="M8 16h6" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
