import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  ViewStyle,
  TextInputProps 
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming 
} from 'react-native-reanimated';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = useSharedValue<string>(COLORS.border);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const handleFocus = () => {
    setIsFocused(true);
    borderColor.value = withTiming(error ? COLORS.error : COLORS.primary, { duration: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderColor.value = withTiming(error ? COLORS.error : COLORS.border, { duration: 200 });
  };

  return (
    <View className="mb-4" style={containerStyle}>
      {label && <Text className="text-sm text-text-primary font-medium mb-2">{label}</Text>}
      <Animated.View 
        className={`bg-white border rounded ${error ? 'border-error' : ''}`}
        style={[animatedBorderStyle, { borderWidth: 1 }]}
      >
        <TextInput
          className="text-base text-text-primary py-4 px-4"
          placeholderTextColor={COLORS.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={style}
          {...props}
        />
      </Animated.View>
      {error && <Text className="text-xs text-error mt-1">{error}</Text>}
    </View>
  );
};
