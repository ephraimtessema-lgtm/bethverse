import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
};

const TRACK_W = 52;
const TRACK_H = 32;
const THUMB = 26;
const PADDING = 3;

/** Smooth animated toggle — visible on dark backgrounds, iOS-like spring motion. */
export function AppSwitch({ value, onValueChange, disabled, style }: Props) {
  const { colors } = useAppTheme();
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: value ? 1 : 0,
      friction: 7,
      tension: 140,
      useNativeDriver: false,
    }).start();
  }, [value, progress]);

  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#475569', colors.primary],
  });

  const thumbX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRACK_W - THUMB - PADDING * 2],
  });

  const thumbBg = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F8FAFC', colors.onPrimary],
  });

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[styles.hit, style]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[
            styles.thumb,
            {
              left: PADDING,
              transform: [{ translateX: thumbX }],
              backgroundColor: thumbBg,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { padding: 2 },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
    elevation: 2,
  },
});
