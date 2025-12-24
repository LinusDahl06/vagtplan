import React, { useState } from 'react';
import { Image, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * OptimizedImage Component
 * Provides image caching, loading states, and error handling for better UX
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!uri || error) {
    return placeholder || (
      <View style={[style, styles.placeholder, { backgroundColor: theme.surface }]}>
        {defaultSource}
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        source={{
          uri,
          // Enable caching
          cache: 'force-cache',
          // Set priority for better loading
          priority: 'high'
        }}
        style={[StyleSheet.absoluteFill, style]}
        resizeMode={resizeMode}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        {...props}
      />
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});
