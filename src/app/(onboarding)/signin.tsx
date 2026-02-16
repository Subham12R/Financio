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
import { useOnboarding } from '../../hooks/useOnboarding';

export default function SigninScreen() {
  const { signIn } = useOnboarding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    subtitleOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    cardOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    buttonOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
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

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const result = await signIn(email.trim(), password);
    if (!result.success) {
      if (result.error?.toLowerCase().includes('email')) {
        setErrors({ email: result.error });
      } else {
        setErrors({ password: result.error });
      }
      setLoading(false);
      return;
    }

    setLoading(false);
    router.replace('/(tabs)');
  };

  const handleGoToSignup = () => {
    router.replace('/(onboarding)/welcome');
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


        <Animated.View className="mb-3 mt-10" style={titleStyle}>
          <Text variant="h1" className="text-white text-[42px] leading-[48px] tracking-[-0.8px]">
            Welcome{' '}
            <Text variant="h1" className="text-[#2E7CFF] text-[42px] leading-[48px]">
              Back.
            </Text>
          </Text>
        </Animated.View>

        <Animated.View className="mb-8" style={subtitleStyle}>
          <Text variant="body" className="text-white/75 text-[16px] leading-6">
            Sign in to continue to Financio
          </Text>
        </Animated.View>

        <Animated.View className="mb-8" style={cardStyle}>
          <View className="rounded-3xl  p-1">
            <Text variant="caption" className="mb-2 text-white/75 uppercase tracking-[1px]">
              Email
            </Text>
            <TextInput
              className={`mb-3 h-14 rounded-md border px-4 text-white text-[16px] ${errors.email ? 'border-[#FF6B6B]' : 'border-white/25'} bg-[#1a1a1a]/10 placeholder:text-white/25`}
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
              Password
            </Text>
            <TextInput
              className={`h-14 rounded-md border px-4 text-white text-[16px] ${errors.password ? 'border-[#FF6B6B]' : 'border-white/25'} bg-[#1a1a1a]/10 placeholder:text-white/25`}
              placeholder="Enter your password"
              placeholderTextColor="rgba(0,0,0,0.35)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.password ? <Text variant="small" className="mt-2 text-[#FF8E8E]">{errors.password}</Text> : null}
          </View>
        </Animated.View>

        <Animated.View className="mt-auto" style={buttonStyle}>
          <TouchableOpacity
            className={`h-14 w-full items-center justify-center rounded-2xl border ${loading ? 'bg-[#2E7CFF]/70 border-[#76AAFF]/30' : 'bg-[#2E7CFF] border-[#76AAFF]/40'}`}
            activeOpacity={0.88}
            onPress={handleSignin}
            disabled={loading}
          >
            <Text variant="body" className="text-white font-semibold text-[18px]">
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View className="mt-6 items-center">
            <Text variant="caption" className="text-white/65">
              Don't have an account?{' '}
              <Text variant="caption" className="text-[#66A3FF] font-semibold" onPress={handleGoToSignup}>
                Create one
              </Text>
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
