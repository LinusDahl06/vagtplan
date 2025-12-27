import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getNotificationSettings, updateNotificationSettings, registerForPushNotificationsAsync, sendImmediateNotification } from '../utils/notificationService';

const REMINDER_OPTIONS = [
  { value: 1440, labelKey: 'notificationSettings.reminderOptions.oneDay' }, // 24 hours
  { value: 300, labelKey: 'notificationSettings.reminderOptions.fiveHours' }, // 5 hours
  { value: 30, labelKey: 'notificationSettings.reminderOptions.thirtyMin' }, // 30 minutes
];

export default function NotificationSettingsScreen({ onBack }) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invitationsEnabled, setInvitationsEnabled] = useState(true);
  const [shiftsEnabled, setShiftsEnabled] = useState(true);
  const [shiftReminderTime, setShiftReminderTime] = useState(300);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getNotificationSettings();
      setInvitationsEnabled(settings.invitationsEnabled);
      setShiftsEnabled(settings.shiftsEnabled);
      setShiftReminderTime(settings.shiftReminderTime);

      // Check notification permissions
      const token = await registerForPushNotificationsAsync();
      setHasPermission(!!token);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      Alert.alert(t('common.error'), t('notificationSettings.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const success = await updateNotificationSettings({
        invitationsEnabled,
        shiftsEnabled,
        shiftReminderTime,
      });

      if (success) {
        Alert.alert(t('common.success'), t('notificationSettings.success.saved'));
      } else {
        Alert.alert(t('common.error'), t('notificationSettings.errors.saveFailed'));
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert(t('common.error'), t('notificationSettings.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePermissions = async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      setHasPermission(true);
      Alert.alert(t('common.success'), t('notificationSettings.permissionGranted'));
    } else {
      Alert.alert(
        t('notificationSettings.permissionDenied.title'),
        t('notificationSettings.permissionDenied.message')
      );
    }
  };

  const handleTestNotification = async () => {
    if (!hasPermission) {
      Alert.alert(t('common.error'), 'Please enable notifications first');
      return;
    }

    try {
      // Send local notification to self
      await sendImmediateNotification(
        '📅 Test Notification',
        'This is a test notification from ScheduHub! If you see this, notifications are working correctly.',
        { type: 'test' }
      );

      // Get all workspaces owned by current user
      const workspacesRef = collection(db, 'workspaces');
      const q = query(workspacesRef, where('ownerId', '==', auth.currentUser.uid));
      const workspacesSnapshot = await getDocs(q);

      let totalMembers = 0;
      const pushPromises = [];

      // Get current user's name
      const currentUserDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const currentUserName = currentUserDoc.data()?.name || 'Someone';

      // For each workspace, send push notifications to all employees
      for (const workspaceDoc of workspacesSnapshot.docs) {
        const workspace = workspaceDoc.data();

        // Send to all employees in this workspace
        for (const employee of workspace.employees || []) {
          if (employee.userId !== auth.currentUser.uid) {
            // Get employee's push token
            const employeeDoc = await getDoc(doc(db, 'users', employee.userId));
            const employeeData = employeeDoc.data();
            const pushToken = employeeData?.pushToken;

            if (pushToken) {
              totalMembers++;
              // Send push notification via Expo Push API
              pushPromises.push(
                fetch('https://exp.host/--/api/v2/push/send', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    to: pushToken,
                    title: '📅 Test Notification',
                    body: `${currentUserName} sent a test notification from ${workspace.name}`,
                    data: { type: 'test', workspaceId: workspaceDoc.id },
                    sound: 'default',
                    priority: 'high',
                  }),
                })
              );
            }
          }
        }
      }

      // Wait for all push notifications to be sent
      await Promise.all(pushPromises);

      Alert.alert(
        'Test Sent',
        totalMembers > 0
          ? `Test notification sent to you and ${totalMembers} workspace member${totalMembers !== 1 ? 's' : ''}!`
          : 'Test notification sent to you! (No other workspace members found)'
      );
    } catch (error) {
      console.error('Error sending test notifications:', error);
      Alert.alert('Error', 'Failed to send test notifications. Check console for details.');
    }
  };

  if (loading) {
    return (
      <View style={[styles(theme).container, styles(theme).centerContent]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles(theme).loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles(theme).container}>
      {/* Header */}
      <View style={styles(theme).header}>
        <View style={styles(theme).safeAreaSpacer} />
        <View style={styles(theme).headerRow}>
          <TouchableOpacity style={styles(theme).backButton} onPress={onBack} activeOpacity={0.7}>
            <View style={styles(theme).backButtonContent}>
              <Ionicons name="chevron-back" size={24} color={theme.primary} />
              <Text style={styles(theme).backButtonText}>{t('common.back')}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles(theme).headerTextContainer}>
            <Text style={styles(theme).headerTitle}>{t('notificationSettings.title')}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles(theme).content} showsVerticalScrollIndicator={false}>
        {/* Permission Status */}
        {!hasPermission && (
          <View style={styles(theme).warningCard}>
            <Ionicons name="warning" size={24} color={theme.warning} />
            <View style={styles(theme).warningContent}>
              <Text style={styles(theme).warningTitle}>{t('notificationSettings.permissionRequired')}</Text>
              <Text style={styles(theme).warningText}>{t('notificationSettings.permissionDescription')}</Text>
              <TouchableOpacity style={styles(theme).enableButton} onPress={handleEnablePermissions}>
                <Text style={styles(theme).enableButtonText}>{t('notificationSettings.enableNotifications')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Invitation Notifications */}
        <View style={styles(theme).section}>
          <View style={styles(theme).sectionHeader}>
            <Ionicons name="mail" size={20} color={theme.primary} />
            <Text style={styles(theme).sectionTitle}>{t('notificationSettings.invitations.title')}</Text>
          </View>
          <Text style={styles(theme).sectionDescription}>
            {t('notificationSettings.invitations.description')}
          </Text>

          <View style={styles(theme).settingRow}>
            <View style={styles(theme).settingInfo}>
              <Text style={styles(theme).settingLabel}>{t('notificationSettings.invitations.enabled')}</Text>
              <Text style={styles(theme).settingDescription}>
                {t('notificationSettings.invitations.enabledDescription')}
              </Text>
            </View>
            <Switch
              value={invitationsEnabled}
              onValueChange={setInvitationsEnabled}
              trackColor={{ false: theme.border, true: theme.primaryDark }}
              thumbColor={invitationsEnabled ? theme.primary : theme.textSecondary}
              disabled={!hasPermission}
            />
          </View>
        </View>

        {/* Shift Reminder Notifications */}
        <View style={styles(theme).section}>
          <View style={styles(theme).sectionHeader}>
            <Ionicons name="calendar" size={20} color={theme.primary} />
            <Text style={styles(theme).sectionTitle}>{t('notificationSettings.shifts.title')}</Text>
          </View>
          <Text style={styles(theme).sectionDescription}>
            {t('notificationSettings.shifts.description')}
          </Text>

          <View style={styles(theme).settingRow}>
            <View style={styles(theme).settingInfo}>
              <Text style={styles(theme).settingLabel}>{t('notificationSettings.shifts.enabled')}</Text>
              <Text style={styles(theme).settingDescription}>
                {t('notificationSettings.shifts.enabledDescription')}
              </Text>
            </View>
            <Switch
              value={shiftsEnabled}
              onValueChange={setShiftsEnabled}
              trackColor={{ false: theme.border, true: theme.primaryDark }}
              thumbColor={shiftsEnabled ? theme.primary : theme.textSecondary}
              disabled={!hasPermission}
            />
          </View>

          {/* Reminder Time Options */}
          {shiftsEnabled && (
            <View style={styles(theme).reminderOptions}>
              <Text style={styles(theme).reminderLabel}>{t('notificationSettings.shifts.reminderTime')}</Text>
              {REMINDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles(theme).reminderOption,
                    shiftReminderTime === option.value && styles(theme).reminderOptionSelected,
                  ]}
                  onPress={() => setShiftReminderTime(option.value)}
                  disabled={!hasPermission}
                >
                  <View style={styles(theme).radioOuter}>
                    {shiftReminderTime === option.value && <View style={styles(theme).radioInner} />}
                  </View>
                  <Text
                    style={[
                      styles(theme).reminderOptionText,
                      shiftReminderTime === option.value && styles(theme).reminderOptionTextSelected,
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Test Notification Button */}
        {hasPermission && (
          <TouchableOpacity
            style={styles(theme).testButton}
            onPress={handleTestNotification}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.primary} />
            <Text style={styles(theme).testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles(theme).saveButton, (!hasPermission || saving) && styles(theme).saveButtonDisabled]}
          onPress={saveSettings}
          disabled={!hasPermission || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#000" />
              <Text style={styles(theme).saveButtonText}>{t('common.save')}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    backgroundColor: theme.surface,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  safeAreaSpacer: {
    height: 50,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  backButton: {
    padding: 8,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: theme.warning,
    marginBottom: 20,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  enableButton: {
    backgroundColor: theme.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  enableButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  reminderOptions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  reminderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  reminderOptionSelected: {
    backgroundColor: theme.primaryDark,
    borderColor: theme.primary,
    borderWidth: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.primary,
  },
  reminderOptionText: {
    fontSize: 15,
    color: theme.text,
  },
  reminderOptionTextSelected: {
    fontWeight: '600',
    color: theme.primary,
  },
  testButton: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  testButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    backgroundColor: theme.border,
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
