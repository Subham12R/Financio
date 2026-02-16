import React from 'react';
import { Text as RNText, TextProps } from 'react-native';

interface CustomTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'small';
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'muted';
  className?: string;
}

export const Text: React.FC<CustomTextProps> = ({
  variant = 'body',
  color = 'primary',
  className,
  style,
  children,
  ...props
}) => {
  const variantClasses = {
    h1: 'text-3xl font-bold',
    h2: 'text-2xl font-semibold',
    h3: 'text-xl font-semibold',
    body: 'text-base font-normal',
    caption: 'text-sm font-normal',
    small: 'text-xs font-normal',
  };

  const colorClasses = {
    primary: 'text-text-primary',
    secondary: 'text-text-secondary',
    accent: 'text-accent',
    success: 'text-success',
    error: 'text-error',
    muted: 'text-text-muted',
  };

  return (
    <RNText
      className={`${variantClasses[variant]} ${colorClasses[color]} ${className || ''}`}
      style={style}
      {...props}
    >
      {children}
    </RNText>
  );
};
