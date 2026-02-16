import { Stack } from 'expo-router';
import { ImageBackground } from 'react-native';

export default function OnboardingLayout() {
  return (
    <ImageBackground
      source={require('../../../assets/bg.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </ImageBackground>
  );
}
