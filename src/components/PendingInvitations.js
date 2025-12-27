import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

function InvitationCard({ invitation, onAccept, onDecline, theme, t, index }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stagger animation for multiple invitations
    const delay = index * 100;

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles(theme).invitationCard,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim }
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles(theme).invitationHeader}>
        <View style={styles(theme).iconContainer}>
          <Ionicons name="mail" size={20} color={theme.primary} />
        </View>
        <View style={styles(theme).invitationInfo}>
          <Text style={styles(theme).invitationTitle}>
            {t('invitations.workspaceInvite')}
          </Text>
          <Text style={styles(theme).invitationText}>
            <Text style={styles(theme).inviterName}>{invitation.inviterName}</Text>
            {' '}
            {t('invitations.invitedYouTo')}
            {' '}
            <Text style={styles(theme).workspaceName}>{invitation.workspaceName}</Text>
          </Text>
        </View>
      </View>

      <View style={styles(theme).actionButtons}>
        <TouchableOpacity
          style={styles(theme).declineButton}
          onPress={() => onDecline(invitation)}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color={theme.error} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles(theme).acceptButton}
          onPress={() => onAccept(invitation)}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function PendingInvitations({ invitations, onAccept, onDecline }) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  if (!invitations || invitations.length === 0) {
    return null;
  }

  return (
    <View style={styles(theme).container}>
      {invitations.map((invitation, index) => (
        <InvitationCard
          key={invitation.id}
          invitation={invitation}
          onAccept={onAccept}
          onDecline={onDecline}
          theme={theme}
          t={t}
          index={index}
        />
      ))}
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  invitationCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 12,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationTitle: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  invitationText: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 20,
  },
  inviterName: {
    fontWeight: '700',
    color: theme.text,
  },
  workspaceName: {
    fontWeight: '700',
    color: theme.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  declineButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.error,
  },
});
