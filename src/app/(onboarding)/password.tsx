import React, { useState, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '../../components';
import { useOnboarding } from '../../hooks/useOnboarding';

export default function PasswordScreen() {
  const { email, username } = useLocalSearchParams<{ email: string; username: string }>();
  const { signUp } = useOnboarding();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
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

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const result = await signUp(email, username, password);
    setLoading(false);

    if (result.success) {
      router.replace('/(onboarding)/success');
    } else {
      setErrors({ password: result.error });
    }
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
            Secure{' '}
            <Text variant="h1" className="text-[#2E7CFF] text-[42px] leading-[48px]">
              Access.
            </Text>
          </Text>
          <Text variant="body" className="mt-3 text-white/75 text-[16px] leading-6">
            Create a secure password for your account
          </Text>
        </Animated.View>

        <Animated.View className="mb-8" style={cardStyle}>
          <View className="rounded-3xl  p-1">
            <Text variant="caption" className="mb-2 text-white/75 uppercase tracking-[1px]">
              Password
            </Text>
            <TextInput
              className={`mb-3 h-14 rounded-md border px-4 text-white text-[16px] ${errors.password ? 'border-[#FF6B6B]' : 'border-white/25'} bg-[#1a1a1a]/10 placeholder:text-white/25`}
              placeholder="Create a password"
              placeholderTextColor="rgba(0,0,0,0.35)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.password ? <Text variant="small" className="mb-4 text-[#FF8E8E]">{errors.password}</Text> : null}

            <Text variant="caption" className="mb-2 text-white/75 uppercase tracking-[1px]">
              Confirm Password
            </Text>
            <TextInput
              className={`h-14 rounded-md border px-4 text-white text-[16px] ${errors.confirmPassword ? 'border-[#FF6B6B]' : 'border-white/25'} bg-[#1a1a1a]/10 placeholder:text-white/25`}
              placeholder="Confirm your password"
              placeholderTextColor="rgba(0,0,0,0.35)"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.confirmPassword ? <Text variant="small" className="mt-2 text-[#FF8E8E]">{errors.confirmPassword}</Text> : null}
          </View>
        </Animated.View>

        <Animated.View className="mt-auto" style={buttonStyle}>
          <View className="mb-5 flex-row items-center gap-2">
            <View className="h-1.5 w-1.5 rounded-full bg-white/35" />
            <View className="h-1.5 w-1.5 rounded-full bg-white/35" />
            <View className="h-1.5 w-9 rounded-full bg-[#2E7CFF]" />
            <View className="h-1.5 w-1.5 rounded-full bg-white/25" />
          </View>

          <TouchableOpacity
            className={`h-14 w-full items-center justify-center rounded-2xl border ${loading ? 'bg-[#2E7CFF]/70 border-[#76AAFF]/30' : 'bg-[#2E7CFF] border-[#76AAFF]/40'}`}
            activeOpacity={0.88}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text variant="body" className="text-white font-semibold text-[18px]">
              {loading ? 'Creating...' : 'Create Account'}
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
