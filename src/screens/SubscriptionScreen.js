import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet, Platform, StatusBar } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_LIMITS,
  getSubscriptionInfo,
  getUserWorkspaceCount,
  getDefaultSubscriptionTier
} from '../utils/subscriptions';

export default function SubscriptionScreen({ onBack, workspaces }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [currentTier, setCurrentTier] = useState(getDefaultSubscriptionTier());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentSubscription();
  }, []);

  const loadCurrentSubscription = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentTier(userData.subscriptionTier || getDefaultSubscriptionTier());
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      Alert.alert(t('common.error'), t('subscriptions.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (tier) => {
    // TODO: Implement payment integration
    Alert.alert(
      t('subscriptions.comingSoon'),
      t('subscriptions.upgradeComingSoon'),
      [{ text: t('common.ok') }]
    );
  };

  const handleDemoUpgrade = async (tier) => {
    // TEMPORARY: For testing purposes only - allows changing tier without payment
    Alert.alert(
      t('subscriptions.demo.title'),
      t('subscriptions.demo.message', { tier: SUBSCRIPTION_LIMITS[tier].name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('subscriptions.demo.confirm'),
          onPress: async () => {
            try {
              setLoading(true);
              await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                subscriptionTier: tier
              });
              setCurrentTier(tier);
              Alert.alert(t('common.success'), t('subscriptions.demo.success'));
            } catch (error) {
              console.error('Error updating subscription:', error);
              Alert.alert(t('common.error'), t('subscriptions.errors.updateFailed'));
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderTierCard = (tier) => {
    const limits = SUBSCRIPTION_LIMITS[tier];
    const info = getSubscriptionInfo(tier);
    const isCurrent = currentTier === tier;
    const ownedWorkspaceCount = getUserWorkspaceCount(workspaces, auth.currentUser.uid);

    return (
      <View
        key={tier}
        style={[
          styles(theme).tierCard,
          isCurrent && styles(theme).currentTierCard
        ]}
      >
        {isCurrent && (
          <View style={styles(theme).currentBadge}>
            <Text style={styles(theme).currentBadgeText}>{t('subscriptions.current')}</Text>
          </View>
        )}

        <View style={styles(theme).tierHeader}>
          <Ionicons
            name={
              tier === SUBSCRIPTION_TIERS.BASIC
                ? 'star-outline'
                : tier === SUBSCRIPTION_TIERS.EXTENDED
                ? 'star-half-outline'
                : 'star'
            }
            size={32}
            color={isCurrent ? theme.primary : theme.textSecondary}
          />
          <Text style={[styles(theme).tierName, isCurrent && styles(theme).currentTierName]}>
            {t(limits.nameKey)}
          </Text>
        </View>

        <View style={styles(theme).tierFeatures}>
          <View style={styles(theme).featureRow}>
            <Ionicons name="business-outline" size={20} color={theme.text} />
            <Text style={styles(theme).featureText}>
              {info.maxWorkspaces === 'Unlimited'
                ? t('subscriptions.features.unlimitedWorkspaces')
                : t('subscriptions.features.workspaces', { count: info.maxWorkspaces })}
            </Text>
          </View>

          <View style={styles(theme).featureRow}>
            <Ionicons name="people-outline" size={20} color={theme.text} />
            <Text style={styles(theme).featureText}>
              {info.maxEmployees === 'Unlimited'
                ? t('subscriptions.features.unlimitedEmployees')
                : t('subscriptions.features.employeesPerWorkspace', { count: info.maxEmployees })}
            </Text>
          </View>
        </View>

        <View style={styles(theme).usageStats}>
          <Text style={styles(theme).usageText}>
            {t('subscriptions.usage.workspaces', {
              current: ownedWorkspaceCount,
              max: info.maxWorkspaces
            })}
          </Text>
        </View>

        {!isCurrent && (
          <View style={styles(theme).tierActions}>
            <TouchableOpacity
              style={styles(theme).upgradeButton}
              onPress={() => handleUpgrade(tier)}
            >
              <Text style={styles(theme).upgradeButtonText}>
                {tier === SUBSCRIPTION_TIERS.BASIC
                  ? t('subscriptions.downgrade')
                  : t('subscriptions.upgrade')}
              </Text>
            </TouchableOpacity>

            {/* TEMPORARY: Demo button for testing */}
            <TouchableOpacity
              style={styles(theme).demoButton}
              onPress={() => handleDemoUpgrade(tier)}
            >
              <Text style={styles(theme).demoButtonText}>
                {t('subscriptions.demo.button')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles(theme).container}>
        <View style={styles(theme).header}>
          <TouchableOpacity onPress={onBack} style={styles(theme).backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles(theme).title}>{t('subscriptions.title')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles(theme).loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles(theme).container}>
      <View style={styles(theme).header}>
        <TouchableOpacity onPress={onBack} style={styles(theme).backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles(theme).title}>{t('subscriptions.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles(theme).content} showsVerticalScrollIndicator={false}>
        <View style={styles(theme).description}>
          <Text style={styles(theme).descriptionText}>
            {t('subscriptions.description')}
          </Text>
        </View>

        <View style={styles(theme).tiersContainer}>
          {renderTierCard(SUBSCRIPTION_TIERS.BASIC)}
          {renderTierCard(SUBSCRIPTION_TIERS.EXTENDED)}
          {renderTierCard(SUBSCRIPTION_TIERS.UNLIMITED)}
        </View>

        <View style={styles(theme).footer}>
          <Text style={styles(theme).footerText}>
            {t('subscriptions.footerNote')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  description: {
    padding: 20,
    backgroundColor: theme.cardBackground,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  tiersContainer: {
    padding: 20,
    gap: 16,
  },
  tierCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: theme.border,
  },
  currentTierCard: {
    borderColor: theme.primary,
    backgroundColor: theme.primary + '10',
  },
  currentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tierHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tierName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginTop: 8,
  },
  currentTierName: {
    color: theme.primary,
  },
  tierFeatures: {
    gap: 12,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: theme.text,
    flex: 1,
  },
  usageStats: {
    backgroundColor: theme.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  usageText: {
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  tierActions: {
    gap: 8,
  },
  upgradeButton: {
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: theme.border,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoButtonText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
