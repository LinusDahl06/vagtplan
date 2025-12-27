import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../context/ThemeContext';

// Blurhash placeholder for smooth loading (neutral gray)
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0teleV';

/**
 * OptimizedImage Component
 * Uses expo-image for proper caching, smooth transitions, and better performance
 */
export default function OptimizedImage({
  uri,
  style,
  placeholder,
  defaultSource,
  resizeMode = 'cover',
  ...props
}) {
  const { theme } = useTheme();

  // If no URI, show the default/placeholder
  if (!uri) {
    return placeholder || (
      <View style={[style, styles.placeholder, { backgroundColor: theme.surface }]}>
        {defaultSource}
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={resizeMode}
      placeholder={PLACEHOLDER_BLURHASH}
      placeholderContentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      recyclingKey={uri}
      onError={() => {
        // If error, the component will show the placeholder blurhash
        // which is better than a broken image
      }}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
