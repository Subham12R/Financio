import React, { useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Text } from '../../components';

export default function SuccessScreen() {
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    subtitleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    buttonOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 bg-transparent">
      <StatusBar style="dark" />

      <View className="flex-1 px-6 pb-8 pt-14 justify-end">
        <Animated.View className="mb-3" style={titleStyle}>
          <Text variant="h1" className="text-black text-[42px] leading-[48px] tracking-[-0.8px]">
            You're{' '}
            <Text variant="h1" className="text-[#2E7CFF] text-[42px] leading-[48px]">
              In.
            </Text>
          </Text>
        </Animated.View>

        <Animated.View className="mb-6" style={subtitleStyle}>
          <Text variant="body" className="text-black/75 text-[16px] leading-6">
            Welcome to Financio. Start tracking your finances today.
          </Text>
        </Animated.View>

        <View className="mb-5 flex-row items-center gap-2">
          <View className="h-1.5 w-1.5 rounded-full bg-black/35" />
          <View className="h-1.5 w-1.5 rounded-full bg-black/35" />
          <View className="h-1.5 w-1.5 rounded-full bg-black/35" />
          <View className="h-1.5 w-9 rounded-full bg-[#2E7CFF]" />
        </View>

        <Animated.View style={buttonStyle}>
          <TouchableOpacity
            className="h-14 w-full items-center justify-center rounded-2xl bg-[#2E7CFF] border border-[#76AAFF]/40"
            activeOpacity={0.88}
            onPress={handleContinue}
          >
            <Text variant="body" className="text-white font-semibold text-[18px]">
              Continue
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}
