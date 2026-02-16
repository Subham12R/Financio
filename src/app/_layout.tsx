import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import '../../global.css';
import { useDatabase } from '../hooks/useDatabase';
import { useOnboarding } from '../hooks/useOnboarding';
import { COLORS } from '../constants/theme';
import { useRouter } from 'expo-router';

export default function RootLayout() {
  const { isReady, error } = useDatabase();
  const { isOnboarded, hasActiveSession, isLoading } = useOnboarding();
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isReady && !isLoading) {
      setIsInitialized(true);
    }
  }, [isReady, isLoading]);

  useEffect(() => {
    if (isInitialized && !isLoading) {
      if (hasActiveSession) {
        router.replace('/(tabs)');
      } else if (isOnboarded) {
        router.replace('/(onboarding)/signin');
      } else {
        router.replace('/(onboarding)/welcome');
      }
    }
  }, [isInitialized, isLoading, isOnboarded, hasActiveSession]);

  if (!isInitialized || error) {
    return (
      <View className="flex-1 bg-bg-light items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bgLight },
        }}
      >
        <Stack.Screen 
          name="(onboarding)/welcome" 
          options={{ 
            animation: 'fade',
          }} 
        />
        <Stack.Screen 
          name="(onboarding)/username-email" 
          options={{ 
            animation: 'slide_from_right',
          }} 
        />
        <Stack.Screen 
          name="(onboarding)/password" 
          options={{ 
            animation: 'slide_from_right',
          }} 
        />
        <Stack.Screen 
          name="(onboarding)/signin" 
          options={{ 
            animation: 'fade',
          }} 
        />
        <Stack.Screen 
          name="(onboarding)/success" 
          options={{ 
            animation: 'fade',
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            animation: 'fade',
          }} 
        />
      </Stack>
    </>
  );
}
