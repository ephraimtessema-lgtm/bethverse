import Feather from '@expo/vector-icons/Feather';
import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  size?: number;
  color?: string;
};

/** Lucide feather quill — matches web empty state. */
export function FeatherIcon({ size = 36, color }: Props) {
  const { colors } = useAppTheme();
  return <Feather name="feather" size={size} color={color ?? colors.primary} />;
}
