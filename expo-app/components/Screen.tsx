import { View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  padded?: boolean;
};

export function Screen({ children, edges = ['top'], style, padded = true }: Props) {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
    >
      <View
        pointerEvents="box-none"
        style={{ flex: 1, paddingHorizontal: padded ? 20 : 0 }}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}
