import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function VerificationChoiceScreen({ email, onChooseEmail, onChoosePhone, onBack }) {
  const { theme } = useTheme();
  const { t } = useTranslation();

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
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>

          <View style={styles(theme).logoContainer}>
            <Ionicons name="shield-checkmark-outline" size={48} color={theme.primary} />
          </View>
          <Text style={styles(theme).title}>{t('verificationChoice.title')}</Text>
          <Text style={styles(theme).subtitle}>
            {t('verificationChoice.subtitle')}
          </Text>
        </View>

        {/* Verification Options */}
        <View style={styles(theme).optionsSection}>
          {/* Email Option */}
          <TouchableOpacity
            style={styles(theme).optionCard}
            onPress={onChooseEmail}
            activeOpacity={0.7}
          >
            <View style={styles(theme).optionIconContainer}>
              <Ionicons name="mail-outline" size={32} color={theme.primary} />
            </View>
            <View style={styles(theme).optionContent}>
              <Text style={styles(theme).optionTitle}>
                {t('verificationChoice.email.title')}
              </Text>
              <Text style={styles(theme).optionDescription}>
                {t('verificationChoice.email.description')}
              </Text>
              <Text style={styles(theme).optionValue}>{email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* Phone Option */}
          <TouchableOpacity
            style={styles(theme).optionCard}
            onPress={onChoosePhone}
            activeOpacity={0.7}
          >
            <View style={styles(theme).optionIconContainer}>
              <Ionicons name="phone-portrait-outline" size={32} color={theme.primary} />
            </View>
            <View style={styles(theme).optionContent}>
              <Text style={styles(theme).optionTitle}>
                {t('verificationChoice.phone.title')}
              </Text>
              <Text style={styles(theme).optionDescription}>
                {t('verificationChoice.phone.description')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Helper Text */}
        <View style={styles(theme).helperSection}>
          <Text style={styles(theme).helperText}>
            {t('verificationChoice.helper')}
          </Text>
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
    lineHeight: 20,
  },
  optionsSection: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: theme.border,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  optionValue: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryDark,
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
  },
  helperSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  helperText: {
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});
