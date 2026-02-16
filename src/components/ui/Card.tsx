import React from 'react';
import { View, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, className, style }) => {
  return (
    <View 
      className={`bg-white border border-border rounded p-6 ${className || ''}`} 
      style={style}
    >
      {children}
    </View>
  );
};
