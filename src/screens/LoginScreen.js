import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useGoogleAuth, handleGoogleSignIn } from '../utils/googleAuth';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function LoginScreen({ onLogin, onNavigateToSignup }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { request, response, promptAsync } = useGoogleAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('login.errors.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      onLogin({
        id: user.uid,
        email: user.email,
        name: user.displayName || 'User'
      });
    } catch (error) {
      let errorMessage = t('login.errors.failedToSignIn');
      if (error.code === 'auth/invalid-credential') {
        errorMessage = t('login.errors.invalidCredentials');
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = t('login.errors.userNotFound');
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = t('login.errors.wrongPassword');
      }
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (response) {
      handleGoogleSignIn(response, onLogin);
    }
  }, [response]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await promptAsync();
    } catch (error) {
      Alert.alert(t('common.error'), t('login.errors.googleSignInFailed'));
      console.error('Google Sign-In Error:', error);
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
        {/* Logo/Header Section */}
        <View style={styles(theme).headerSection}>
          <View style={styles(theme).logoContainer}>
            <Ionicons name="calendar" size={48} color={theme.primary} />
          </View>
          <Text style={styles(theme).title}>{t('login.title')}</Text>
          <Text style={styles(theme).subtitle}>{t('login.subtitle')}</Text>
        </View>

        {/* Form Section */}
        <View style={styles(theme).formSection}>
          <Text style={styles(theme).formTitle}>{t('login.formTitle')}</Text>

          {/* Email Input */}
          <View style={styles(theme).inputContainer}>
            <Ionicons name="mail-outline" size={20} color={theme.textSecondary} style={styles(theme).inputIcon} />
            <TextInput
              style={styles(theme).input}
              placeholder={t('login.emailPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View style={styles(theme).inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} style={styles(theme).inputIcon} />
            <TextInput
              style={styles(theme).input}
              placeholder={t('login.passwordPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles(theme).eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles(theme).primaryButton, loading && styles(theme).buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles(theme).primaryButtonText}>{t('login.signingIn')}</Text>
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="#000" />
                <Text style={styles(theme).primaryButtonText}>{t('login.signInButton')}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider - TEMPORARILY HIDDEN */}
          {false && (
          <View style={styles(theme).divider}>
            <View style={styles(theme).dividerLine} />
            <Text style={styles(theme).dividerText}>OR</Text>
            <View style={styles(theme).dividerLine} />
          </View>
          )}

          {/* Google Button - TEMPORARILY HIDDEN */}
          {false && (
          <TouchableOpacity
            style={styles(theme).googleButton}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={20} color={theme.text} />
            <Text style={styles(theme).googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          )}

          {/* Sign Up Link */}
          <View style={styles(theme).footer}>
            <Text style={styles(theme).footerText}>{t('auth.dontHaveAccount')} </Text>
            <TouchableOpacity onPress={onNavigateToSignup} disabled={loading}>
              <Text style={styles(theme).linkText}>{t('auth.signUp')}</Text>
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
    justifyContent: 'center',
    padding: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 48,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 24,
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
  eyeIcon: {
    padding: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    color: theme.textSecondary,
    fontSize: 12,
    marginHorizontal: 16,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    gap: 8,
  },
  googleButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
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