import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View, Text } from 'react-native';
import { Palette, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function CustomInput({ label, error, style, ...props }: CustomInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isFocused, setIsFocused] = useState(false);

  const containerBg = isDark ? '#1E293B' : '#F8FAFC';
  const borderColor = error ? Palette.danger : (isFocused ? Palette.primary : (isDark ? '#334155' : Palette.border));
  const textColor = isDark ? '#F8FAFC' : Palette.text;
  const placeholderColor = isDark ? '#94A3B8' : '#94A3B8';

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: isDark ? '#E2E8F0' : Palette.text }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: containerBg,
            borderColor,
            color: textColor,
          },
          style,
        ]}
        placeholderTextColor={placeholderColor}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorText: {
    color: Palette.danger,
    fontSize: 12,
    marginTop: 4,
  },
});
