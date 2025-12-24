import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function LegalScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { documentType } = route.params || { documentType: 'privacy' };
  const [activeTab, setActiveTab] = useState(documentType);

  const privacyPolicyUrl = 'https://your-website.com/privacy'; // TODO: Replace with your actual URL
  const termsOfServiceUrl = 'https://your-website.com/terms'; // TODO: Replace with your actual URL

  const handleOpenExternal = (url) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  const renderPrivacyPolicy = () => (
    <ScrollView style={styles(theme).content} showsVerticalScrollIndicator={false}>
      <Text style={styles(theme).heading}>Privacy Policy</Text>
      <Text style={styles(theme).lastUpdated}>Last Updated: December 21, 2024</Text>

      <Text style={styles(theme).sectionTitle}>Introduction</Text>
      <Text style={styles(theme).paragraph}>
        Lincware operates the ScheduHub mobile application. This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service.
      </Text>

      <Text style={styles(theme).sectionTitle}>Information We Collect</Text>
      <Text style={styles(theme).paragraph}>
        We collect the following information:
      </Text>
      <Text style={styles(theme).bulletPoint}>• Name and username</Text>
      <Text style={styles(theme).bulletPoint}>• Email address</Text>
      <Text style={styles(theme).bulletPoint}>• Profile picture (optional)</Text>
      <Text style={styles(theme).bulletPoint}>• Workspace and schedule data</Text>

      <Text style={styles(theme).sectionTitle}>How We Use Your Information</Text>
      <Text style={styles(theme).paragraph}>
        We use your data to provide and improve the Service, ensure security, and communicate important updates.
      </Text>

      <Text style={styles(theme).sectionTitle}>Data Storage</Text>
      <Text style={styles(theme).paragraph}>
        Your data is stored securely using Google Firebase services with encryption in transit and at rest.
      </Text>

      <Text style={styles(theme).sectionTitle}>We Do Not Sell Your Data</Text>
      <Text style={styles(theme).paragraph}>
        We do not sell, trade, or rent your personal information to third parties.
      </Text>

      <Text style={styles(theme).sectionTitle}>Your Rights</Text>
      <Text style={styles(theme).paragraph}>
        You have the right to:
      </Text>
      <Text style={styles(theme).bulletPoint}>• Access your personal data</Text>
      <Text style={styles(theme).bulletPoint}>• Correct inaccurate data</Text>
      <Text style={styles(theme).bulletPoint}>• Delete your account and data</Text>
      <Text style={styles(theme).bulletPoint}>• Object to certain processing</Text>

      <Text style={styles(theme).sectionTitle}>Contact Us</Text>
      <Text style={styles(theme).paragraph}>
        For questions about this Privacy Policy, contact us at: support@lincware.com
      </Text>

      <TouchableOpacity
        style={styles(theme).linkButton}
        onPress={() => handleOpenExternal(privacyPolicyUrl)}
      >
        <Ionicons name="open-outline" size={20} color={theme.primary} />
        <Text style={styles(theme).linkText}>View Full Privacy Policy</Text>
      </TouchableOpacity>

      <View style={styles(theme).spacer} />
    </ScrollView>
  );

  const renderTermsOfService = () => (
    <ScrollView style={styles(theme).content} showsVerticalScrollIndicator={false}>
      <Text style={styles(theme).heading}>Terms of Service</Text>
      <Text style={styles(theme).lastUpdated}>Last Updated: December 21, 2024</Text>

      <Text style={styles(theme).sectionTitle}>Agreement to Terms</Text>
      <Text style={styles(theme).paragraph}>
        By using ScheduHub, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not use the Service.
      </Text>

      <Text style={styles(theme).sectionTitle}>Description of Service</Text>
      <Text style={styles(theme).paragraph}>
        ScheduHub is a shift scheduling and workforce management application that allows you to create workspaces, schedule shifts, and manage teams.
      </Text>

      <Text style={styles(theme).sectionTitle}>User Accounts</Text>
      <Text style={styles(theme).paragraph}>
        You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
      </Text>

      <Text style={styles(theme).sectionTitle}>Acceptable Use</Text>
      <Text style={styles(theme).paragraph}>
        You agree to use the Service only for lawful purposes and not to:
      </Text>
      <Text style={styles(theme).bulletPoint}>• Violate any laws or regulations</Text>
      <Text style={styles(theme).bulletPoint}>• Infringe on intellectual property rights</Text>
      <Text style={styles(theme).bulletPoint}>• Upload malicious code or harmful content</Text>
      <Text style={styles(theme).bulletPoint}>• Harass or harm other users</Text>

      <Text style={styles(theme).sectionTitle}>User Content</Text>
      <Text style={styles(theme).paragraph}>
        You retain ownership of content you submit. By submitting content, you grant us a license to store and display it as necessary to provide the Service.
      </Text>

      <Text style={styles(theme).sectionTitle}>Disclaimer</Text>
      <Text style={styles(theme).paragraph}>
        THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee uninterrupted or error-free operation.
      </Text>

      <Text style={styles(theme).sectionTitle}>Termination</Text>
      <Text style={styles(theme).paragraph}>
        You may terminate your account at any time. We may terminate accounts that violate these Terms.
      </Text>

      <Text style={styles(theme).sectionTitle}>Contact Us</Text>
      <Text style={styles(theme).paragraph}>
        For questions about these Terms, contact us at: support@lincware.com
      </Text>

      <TouchableOpacity
        style={styles(theme).linkButton}
        onPress={() => handleOpenExternal(termsOfServiceUrl)}
      >
        <Ionicons name="open-outline" size={20} color={theme.primary} />
        <Text style={styles(theme).linkText}>View Full Terms of Service</Text>
      </TouchableOpacity>

      <View style={styles(theme).spacer} />
    </ScrollView>
  );

  return (
    <View style={styles(theme).container}>
      {/* Header */}
      <View style={styles(theme).header}>
        <View style={styles(theme).safeAreaSpacer} />
        <View style={styles(theme).headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles(theme).backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles(theme).headerTitle}>Legal</Text>
          <View style={styles(theme).placeholder} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles(theme).tabs}>
        <TouchableOpacity
          style={[styles(theme).tab, activeTab === 'privacy' && styles(theme).tabActive]}
          onPress={() => setActiveTab('privacy')}
        >
          <Ionicons
            name="shield-checkmark"
            size={20}
            color={activeTab === 'privacy' ? theme.primary : theme.textSecondary}
          />
          <Text style={[
            styles(theme).tabText,
            activeTab === 'privacy' && styles(theme).tabTextActive
          ]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles(theme).tab, activeTab === 'terms' && styles(theme).tabActive]}
          onPress={() => setActiveTab('terms')}
        >
          <Ionicons
            name="document-text"
            size={20}
            color={activeTab === 'terms' ? theme.primary : theme.textSecondary}
          />
          <Text style={[
            styles(theme).tabText,
            activeTab === 'terms' && styles(theme).tabTextActive
          ]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'privacy' ? renderPrivacyPolicy() : renderTermsOfService()}
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    backgroundColor: theme.surface,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  safeAreaSpacer: {
    height: 50,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  tabTextActive: {
    color: theme.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 22,
    marginLeft: 8,
    marginBottom: 4,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 24,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
  },
  spacer: {
    height: 40,
  },
});
