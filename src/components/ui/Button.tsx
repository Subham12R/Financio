import React from 'react';
import { 
  TouchableOpacity, 
  Text as RNText, 
  ViewStyle,
  TextStyle,
  ActivityIndicator 
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';
import { COLORS } from '../../constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const variantClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    outline: 'bg-transparent border border-border-dark',
    ghost: 'bg-transparent',
  };

  const sizeClasses = {
    sm: 'py-2 px-4',
    md: 'py-4 px-6',
    lg: 'py-4 px-8',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const textColorClasses = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-primary',
    ghost: 'text-accent',
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      className={`rounded items-center justify-center ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50' : ''} ${className || ''}`}
      style={[animatedStyle, style]}
      activeOpacity={0.9}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? COLORS.accent : COLORS.white} size="small" />
      ) : (
        <RNText 
          className={`font-semibold tracking-tight ${textSizeClasses[size]} ${textColorClasses[variant]}`}
          style={textStyle}
        >
          {title}
        </RNText>
      )}
    </AnimatedTouchable>
  );
};
