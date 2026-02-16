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

export default function WelcomeScreen() {
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    contentOpacity.value = withDelay(80, withTiming(1, { duration: 550 }));
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <View className="flex-1 bg-transparent">
      <StatusBar style="dark" />
   

      <Animated.View className="flex-1 px-6 pb-8 pt-14 justify-end" style={contentStyle}>
  
        <Text variant="h1" className="text-black text-[48px] leading-[54px] tracking-[-1px]">
          Own Your Money,{'\n'}Shape <Text variant="h1" className="text-[#2E7CFF] text-[48px] leading-[54px]">Your Life.</Text>
        </Text>

        <Text variant="body" className="mt-5 text-black/75 text-[17px] leading-6">
          From saving smart to spending wise, your financial goals begin to rise.
        </Text>

        <View className="mt-6 mb-8 flex-row items-center gap-2">
          <View className="h-1.5 w-9 rounded-full bg-[#2E7CFF]" />
          <View className="h-1.5 w-1.5 rounded-full bg-black/50" />
          <View className="h-1.5 w-1.5 rounded-full bg-black/30" />
          <View className="h-1.5 w-1.5 rounded-full bg-black/25" />
        </View>

        <TouchableOpacity
          className="h-14 w-full items-center justify-center rounded-2xl bg-[#2E7CFF]"
          activeOpacity={0.88}
          onPress={() => router.push('/(onboarding)/username-email')}
        >
          <Text variant="body" className="text-white font-semibold text-[18px]">
            Next
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-4 h-10 items-center justify-center"
          activeOpacity={0.8}
          onPress={() => router.replace('/(onboarding)/signin')}
        >
          <Text variant="body" className="text-black/85 font-medium text-[17px]">
            Skip
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
