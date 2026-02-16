import React, { useState, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Text } from '../../components';

export default function UsernameEmailScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    username?: string;
  }>({});

  const titleOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    buttonOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!username) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) return;
    router.push({
      pathname: '/(onboarding)/password',
      params: { email, username },
    });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-transparent"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
  

      <ScrollView
        contentContainerClassName="flex-grow px-6 pt-14 pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
   

        <Animated.View className="mb-8 mt-10" style={titleStyle}>
          <Text variant="h1" className="text-white text-[42px] leading-[48px] tracking-[-0.8px]">
            Create{' '}
            <Text variant="h1" className="text-[#2E7CFF] text-[42px] leading-[48px]">
              Account.
            </Text>
          </Text>
          <Text variant="body" className="mt-3 text-white/75 text-[16px] leading-6">
            Enter your email and choose a username
          </Text>
        </Animated.View>

        <Animated.View className="mb-8" style={cardStyle}>
          <View className="rounded-3xl  p-1">
            <Text variant="caption" className="mb-2 text-white/75 uppercase tracking-[1px]">
              Email
            </Text>
            <TextInput
              className={`mb-3 h-14 rounded-md border px-4 text-white text-[16px] ${errors.email ? 'border-[#FF6B6B]' : 'border-white/25'} placeholder:text-white/25 bg-[#1a1a1a]/10`}
              placeholder="Enter your email"
              placeholderTextColor="rgba(0,0,0,0.35)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email ? <Text variant="small" className="mb-4 text-[#FF8E8E]">{errors.email}</Text> : null}

            <Text variant="caption" className="mb-2 text-white/75 uppercase tracking-[1px]">
              Username
            </Text>
            <TextInput
              className={`h-14 rounded-md border px-4 text-white text-[16px] ${errors.username ? 'border-[#FF6B6B]' : 'border-white/25'} bg-[#1a1a1a]/10 placeholder:text-white/25`}
              placeholder="Choose a username"
              placeholderTextColor="rgba(0,0,0,0.35)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.username ? <Text variant="small" className="mt-2 text-[#FF8E8E]">{errors.username}</Text> : null}
          </View>
        </Animated.View>

        <Animated.View className="mt-auto" style={buttonStyle}>
          <View className="mb-5 flex-row items-center gap-2">
            <View className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <View className="h-1.5 w-9 rounded-full bg-[#2E7CFF]" />
            <View className="h-1.5 w-1.5 rounded-full bg-white/35" />
            <View className="h-1.5 w-1.5 rounded-full bg-white/25" />
          </View>

          <TouchableOpacity
            className="h-14 w-full items-center justify-center rounded-2xl bg-[#2E7CFF] border border-[#76AAFF]/40"
            activeOpacity={0.88}
            onPress={handleNext}
          >
            <Text variant="body" className="text-white font-semibold text-[18px]">
              Next
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="mt-4 h-10 items-center justify-center" onPress={() => router.back()}>
            <Text variant="body" className="text-black/85 font-medium text-[17px]">
              Back
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
