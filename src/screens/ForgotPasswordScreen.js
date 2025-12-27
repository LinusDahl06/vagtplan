import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function ForgotPasswordScreen({ onBack }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('forgotPassword.errors.enterEmail'));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert(t('common.error'), t('forgotPassword.errors.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      Alert.alert(
        t('common.success'),
        t('forgotPassword.emailSent'),
        [
          {
            text: t('common.confirm'),
            onPress: () => onBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error sending password reset email:', error);
      let errorMessage = t('forgotPassword.errors.sendFailed');

      if (error.code === 'auth/user-not-found') {
        errorMessage = t('forgotPassword.errors.userNotFound');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('forgotPassword.errors.invalidEmail');
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = t('forgotPassword.errors.tooManyRequests');
      }

      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
            <Ionicons name="key-outline" size={48} color={theme.primary} />
          </View>
          <Text style={styles(theme).title}>{t('forgotPassword.title')}</Text>
          <Text style={styles(theme).subtitle}>{t('forgotPassword.subtitle')}</Text>
        </View>

        {/* Form Section */}
        <View style={styles(theme).formSection}>
          {!emailSent && (
            <>
              <Text style={styles(theme).instruction}>
                {t('forgotPassword.instruction')}
              </Text>

              {/* Email Input */}
              <View style={styles(theme).inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.textSecondary}
                  style={styles(theme).inputIcon}
                />
                <TextInput
                  style={styles(theme).input}
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  autoFocus={true}
                />
              </View>

              {/* Reset Button */}
              <TouchableOpacity
                style={[styles(theme).primaryButton, loading && styles(theme).buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles(theme).primaryButtonText}>
                    {t('forgotPassword.sending')}
                  </Text>
                ) : (
                  <>
                    <Ionicons name="mail-outline" size={20} color="#000" />
                    <Text style={styles(theme).primaryButtonText}>
                      {t('forgotPassword.sendResetLink')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {emailSent && (
            <View style={styles(theme).successContainer}>
              <View style={styles(theme).successIconContainer}>
                <Ionicons name="checkmark-circle" size={64} color={theme.primary} />
              </View>
              <Text style={styles(theme).successTitle}>
                {t('forgotPassword.checkYourEmail')}
              </Text>
              <Text style={styles(theme).successMessage}>
                {t('forgotPassword.resetLinkSent', { email })}
              </Text>
              <TouchableOpacity
                style={styles(theme).primaryButton}
                onPress={onBack}
              >
                <Ionicons name="arrow-back" size={20} color="#000" />
                <Text style={styles(theme).primaryButtonText}>
                  {t('forgotPassword.backToLogin')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Back to Login Link */}
          {!emailSent && (
            <View style={styles(theme).footer}>
              <Text style={styles(theme).footerText}>
                {t('forgotPassword.rememberPassword')}{' '}
              </Text>
              <TouchableOpacity onPress={onBack} disabled={loading}>
                <Text style={styles(theme).linkText}>{t('forgotPassword.signIn')}</Text>
              </TouchableOpacity>
            </View>
          )}
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
    justifyContent: 'center',
    padding: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  backButton: {
    position: 'absolute',
    top: -120,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: theme.text,
    fontSize: 16,
    paddingVertical: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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
});
