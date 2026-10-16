import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, FolderOpen, Heart, BarChart3, Settings } from 'lucide-react-native';
import { useAppTheme } from '@/context/ThemeContext';

/** Matches web BottomNav.jsx — lucide icons + 10px labels */
const TAB_CONFIG: Record<
  string,
  { Icon: typeof Home; labelKey: 'home' | 'collections' | 'favorites' | 'insights' | 'settings' }
> = {
  index: { Icon: Home, labelKey: 'home' },
  collections: { Icon: FolderOpen, labelKey: 'collections' },
  favorites: { Icon: Heart, labelKey: 'favorites' },
  insights: { Icon: BarChart3, labelKey: 'insights' },
  settings: { Icon: Settings, labelKey: 'settings' },
};

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, fonts, t } = useAppTheme();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const color = focused ? colors.primary : colors.muted;
        const config = TAB_CONFIG[route.name];
        const Icon = config?.Icon ?? Home;
        const label = config ? t[config.labelKey] : route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={[
              styles.tab,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
          >
            <Icon
              size={22}
              color={color}
              fill={focused ? colors.primary : 'none'}
              strokeWidth={focused ? 2.5 : 2}
            />
            <Text
              style={[
                styles.label,
                { color, fontFamily: fonts.body },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    minHeight: 64,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: 56,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 13,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
