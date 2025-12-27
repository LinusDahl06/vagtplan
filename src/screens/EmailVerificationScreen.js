import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { sendEmailVerification, applyActionCode } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import PhoneVerificationScreen from './PhoneVerificationScreen';

export default function EmailVerificationScreen({ user, onVerified, onBack }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);

  useEffect(() => {
    // Send initial verification email
    sendVerificationEmail();
  }, []);

  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const sendVerificationEmail = async () => {
    try {
      await sendEmailVerification(user);
      setResendCooldown(60); // 60 second cooldown
      Alert.alert(
        t('emailVerification.emailSent'),
        t('emailVerification.checkInbox')
      );
    } catch (error) {
      console.error('Error sending verification email:', error);
      if (error.code === 'auth/too-many-requests') {
        Alert.alert(t('common.error'), t('emailVerification.tooManyRequests'));
      } else {
        Alert.alert(t('common.error'), t('emailVerification.sendFailed'));
      }
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    try {
      // Reload user to get latest verification status
      await user.reload();

      if (user.emailVerified) {
        Alert.alert(
          t('common.success'),
          t('emailVerification.verified'),
          [{ text: t('common.confirm'), onPress: onVerified }]
        );
      } else {
        Alert.alert(
          t('emailVerification.notVerifiedYet'),
          t('emailVerification.notVerified')
        );
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      Alert.alert(t('common.error'), t('emailVerification.verificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    await sendVerificationEmail();
  };

  // Show phone verification if requested
  if (showPhoneVerification) {
    return (
      <PhoneVerificationScreen
        user={user}
        onVerified={onVerified}
        onBack={() => setShowPhoneVerification(false)}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles(theme).container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles(theme).scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles(theme).headerSection}>
          <TouchableOpacity
            style={styles(theme).backButton}
            onPress={onBack}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>

          <View style={styles(theme).logoContainer}>
            <Ionicons name="mail-outline" size={48} color={theme.primary} />
          </View>
          <Text style={styles(theme).title}>{t('emailVerification.title')}</Text>
          <Text style={styles(theme).subtitle}>
            {t('emailVerification.subtitle', { email: user.email })}
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles(theme).formSection}>
          <Text style={styles(theme).instruction}>{t('emailVerification.instruction')}</Text>

          {/* Check Verification Button */}
          <TouchableOpacity
            style={[styles(theme).primaryButton, loading && styles(theme).buttonDisabled]}
            onPress={handleCheckVerification}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles(theme).primaryButtonText}>{t('emailVerification.verifying')}</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#000" />
                <Text style={styles(theme).primaryButtonText}>{t('emailVerification.verify')}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Resend Link */}
          <View style={styles(theme).footer}>
            <Text style={styles(theme).footerText}>{t('emailVerification.didntReceive')} </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={loading || resendCooldown > 0}
            >
              <Text style={[
                styles(theme).linkText,
                (loading || resendCooldown > 0) && styles(theme).linkTextDisabled
              ]}>
                {resendCooldown > 0
                  ? t('emailVerification.resendIn', { seconds: resendCooldown })
                  : t('emailVerification.resend')
                }
              </Text>
            </TouchableOpacity>
          </View>

          {/* Phone Verification Alternative */}
          <View style={styles(theme).alternativeSection}>
            <View style={styles(theme).divider}>
              <View style={styles(theme).dividerLine} />
              <Text style={styles(theme).dividerText}>{t('emailVerification.orDivider')}</Text>
              <View style={styles(theme).dividerLine} />
            </View>

            <TouchableOpacity
              style={styles(theme).alternativeButton}
              onPress={() => setShowPhoneVerification(true)}
              disabled={loading}
            >
              <Ionicons name="phone-portrait-outline" size={20} color={theme.primary} />
              <Text style={styles(theme).alternativeButtonText}>
                {t('emailVerification.usePhone')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  backButton: {
    position: 'absolute',
    top: -36,
    left: 0,
    padding: 8,
    zIndex: 10,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  instruction: {
    fontSize: 16,
    color: theme.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  footerText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  linkText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  linkTextDisabled: {
    opacity: 0.5,
  },
  alternativeSection: {
    marginTop: 32,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    color: theme.textSecondary,
    fontSize: 12,
    marginHorizontal: 12,
    textTransform: 'uppercase',
  },
  alternativeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  alternativeButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
