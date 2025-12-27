import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function AnimatedInvitationPopup({ invitation, onDismiss }) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    if (invitation) {
      // Bubble pop-in animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 4 seconds with fade-out
      const timeout = setTimeout(() => {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: -20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onDismiss) onDismiss();
        });
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [invitation]);

  if (!invitation) return null;

  return (
    <Animated.View
      style={[
        styles(theme).container,
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
        },
      ]}
    >
      <View style={styles(theme).bubble}>
        {/* Icon with pulse effect */}
        <View style={styles(theme).iconContainer}>
          <Ionicons name="mail" size={24} color={theme.primary} />
        </View>

        {/* Content */}
        <View style={styles(theme).content}>
          <Text style={styles(theme).title}>
            {t('invitations.workspaceInvite')}
          </Text>
          <Text style={styles(theme).message} numberOfLines={2}>
            <Text style={styles(theme).inviterName}>{invitation.inviterName}</Text>
            {' '}{t('invitations.invitedYouTo')}{' '}
            <Text style={styles(theme).workspaceName}>{invitation.workspaceName}</Text>
          </Text>
        </View>

        {/* Notification badge */}
        <View style={styles(theme).badge}>
          <Text style={styles(theme).badgeText}>!</Text>
        </View>
      </View>

      {/* Shadow/glow effect */}
      <View style={styles(theme).shadow} />
    </Animated.View>
  );
}

const styles = (theme) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  bubble: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    maxWidth: width - 32,
  },
  shadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.primary,
    opacity: 0.1,
    borderRadius: 20,
    transform: [{ scale: 1.05 }],
    zIndex: -1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 18,
  },
  inviterName: {
    fontWeight: '700',
    color: theme.text,
  },
  workspaceName: {
    fontWeight: '700',
    color: theme.primary,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
