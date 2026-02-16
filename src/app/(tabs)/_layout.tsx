import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONT_WEIGHT } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#faf5f0' },
        tabBarStyle: {
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: 24,
          height: 68,
          borderRadius: 999,
          paddingBottom: 10,
          paddingTop: 8,
        
          marginHorizontal: 8,
          backgroundColor: '#FFFFFFEE',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        },
        tabBarActiveTintColor: '#2E7CFF',
        tabBarInactiveTintColor: '#5E636E',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: FONT_WEIGHT.medium,
        },
        tabBarItemStyle: {
          borderRadius: 999,
          marginHorizontal: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          href: null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
