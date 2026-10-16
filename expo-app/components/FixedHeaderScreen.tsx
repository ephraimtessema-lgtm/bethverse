import { View, type ViewStyle } from 'react-native';
import { Screen } from '@/components/Screen';
import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  header: React.ReactNode;
  children: React.ReactNode;
  headerStyle?: ViewStyle;
};

/** Screen with a fixed top bar that does not scroll with content. */
export function FixedHeaderScreen({ header, children, headerStyle }: Props) {
  const { colors } = useAppTheme();
  return (
    <Screen padded={false}>
      <View
        style={[
          {
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
          headerStyle,
        ]}
      >
        {header}
      </View>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>{children}</View>
    </Screen>
  );
}
