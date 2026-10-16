import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

type Props = {
  visible: boolean;
  onFinish: () => void;
  backgroundColor?: string;
};

export function SplashOverlay({ visible, onFinish, backgroundColor = '#0A0E1A' }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const finished = useRef(false);

  useEffect(() => {
    if (!visible) return;

    SplashScreen.hideAsync().catch(() => {});

    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(650),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.04,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished: done }) => {
      if (done && !finished.current) {
        finished.current = true;
        onFinish();
      }
    });
  }, [visible, scale, logoOpacity, opacity, onFinish]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.overlay, { backgroundColor, opacity }]}
      pointerEvents={finished.current ? 'none' : 'auto'}
    >
      <Animated.View style={{ transform: [{ scale }], opacity: logoOpacity }}>
        <Image
          source={require('@/assets/logo-dark.png')}
          style={{ width: 132, height: 132 }}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
