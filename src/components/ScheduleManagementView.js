import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function ScheduleManagementView({ workspace, onWorkspaceUpdate }) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showClearMonthModal, setShowClearMonthModal] = useState(false);
  const [clearAllConfirmation, setClearAllConfirmation] = useState('');
  const [clearMonthConfirmation, setClearMonthConfirmation] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const isOwner = workspace.ownerId === auth.currentUser.uid;
  const currentUserEmployee = workspace.employees.find(emp => emp.userId === auth.currentUser.uid);
  const currentUserRole = workspace.roles.find(r => r.id === currentUserEmployee?.roleId);
  const canManageSchedule = isOwner || currentUserRole?.permissions.includes('manage_schedule');

  // Real-time workspace listener
  useEffect(() => {
    if (!workspace.id) return;

    const workspaceRef = doc(db, 'workspaces', workspace.id);
    const unsubscribe = onSnapshot(workspaceRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const updatedWorkspace = { id: docSnapshot.id, ...docSnapshot.data() };
        if (onWorkspaceUpdate) {
          onWorkspaceUpdate(updatedWorkspace);
        }
      }
    }, (error) => {
      console.error('Error listening to workspace updates:', error);
    });

    return () => unsubscribe();
  }, [workspace.id]);

  const handleClearAllSchedules = async () => {
    const confirmKeyword = t('scheduleManagement.clearAll.confirmKeyword');
    if (clearAllConfirmation !== confirmKeyword) {
      Alert.alert(t('common.error'), t('scheduleManagement.clearAll.errors.confirmRequired', { keyword: confirmKeyword }));
      return;
    }

    try {
      await updateDoc(doc(db, 'workspaces', workspace.id), {
        schedule: []
      });

      if (onWorkspaceUpdate) {
        onWorkspaceUpdate({ ...workspace, schedule: [] });
      }

      Alert.alert(t('common.success'), t('scheduleManagement.clearAll.success'));
      setClearAllConfirmation('');
      setShowClearAllModal(false);
    } catch (error) {
      console.error('Error clearing all schedules:', error);
      Alert.alert(t('common.error'), t('scheduleManagement.clearAll.errors.failed'));
    }
  };

  const handleClearMonthSchedule = async () => {
    const confirmKeyword = t('scheduleManagement.clearMonth.confirmKeyword');
    if (clearMonthConfirmation !== confirmKeyword) {
      Alert.alert(t('common.error'), t('scheduleManagement.clearMonth.errors.confirmRequired', { keyword: confirmKeyword }));
      return;
    }

    const month = selectedMonth.getMonth();
    const year = selectedMonth.getFullYear();

    try {
      // Filter out shifts from the selected month
      const updatedSchedule = workspace.schedule?.filter(s => {
        const shiftDate = new Date(s.date);
        return !(shiftDate.getMonth() === month && shiftDate.getFullYear() === year);
      }) || [];

      await updateDoc(doc(db, 'workspaces', workspace.id), {
        schedule: updatedSchedule
      });

      if (onWorkspaceUpdate) {
        onWorkspaceUpdate({ ...workspace, schedule: updatedSchedule });
      }

      const locale = i18n.language === 'da' ? 'da-DK' : 'en-US';
      const monthName = selectedMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      Alert.alert(t('common.success'), t('scheduleManagement.clearMonth.success', { month: monthName }));
      setClearMonthConfirmation('');
      setShowClearMonthModal(false);
    } catch (error) {
      console.error('Error clearing month schedule:', error);
      Alert.alert(t('common.error'), t('scheduleManagement.clearMonth.errors.failed'));
    }
  };

  const goToPreviousMonth = () => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(selectedMonth.getMonth() - 1);
    setSelectedMonth(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(selectedMonth.getMonth() + 1);
    setSelectedMonth(newMonth);
  };

  const formatMonthYear = (date) => {
    const locale = i18n.language === 'da' ? 'da-DK' : 'en-US';
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  };

  return (
    <View style={styles(theme).container}>
      {/* Header */}
      <View style={styles(theme).header}>
        <View style={styles(theme).headerContent}>
          <View style={styles(theme).headerTextContainer}>
            <Text style={styles(theme).headerTitle}>{t('scheduleManagement.title')}</Text>
          </View>
          <View style={styles(theme).headerIcon}>
            <Ionicons name="calendar" size={24} color={theme.primary} />
          </View>
        </View>
      </View>

      <View style={styles(theme).infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
        <Text style={styles(theme).infoText}>
          {t('scheduleManagement.infoCard')}
        </Text>
      </View>

      {/* Clear Month Schedule - For managers */}
      {canManageSchedule && (
        <View style={styles(theme).section}>
          <Text style={styles(theme).sectionTitle}>{t('scheduleManagement.clearMonth.title')}</Text>
          <Text style={styles(theme).sectionDescription}>
            {t('scheduleManagement.clearMonth.description')}
          </Text>
          <TouchableOpacity
            style={styles(theme).dangerButton}
            onPress={() => {
              setSelectedMonth(new Date());
              setShowClearMonthModal(true);
            }}
          >
            <Ionicons name="trash-outline" size={18} color={theme.error} />
            <Text style={styles(theme).dangerButtonText}>{t('scheduleManagement.clearMonth.button')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Clear All Schedules - Owner only */}
      {isOwner && (
        <View style={styles(theme).section}>
          <Text style={styles(theme).sectionTitle}>{t('scheduleManagement.clearAll.title')}</Text>
          <Text style={styles(theme).sectionDescription}>
            {t('scheduleManagement.clearAll.description')}
          </Text>
          <View style={styles(theme).warningBox}>
            <Ionicons name="warning" size={20} color="#ff9800" />
            <Text style={styles(theme).warningText}>
              {t('scheduleManagement.clearAll.ownerWarning')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles(theme).criticalButton}
            onPress={() => setShowClearAllModal(true)}
          >
            <Ionicons name="nuclear-outline" size={18} color={theme.text} />
            <Text style={styles(theme).criticalButtonText}>{t('scheduleManagement.clearAll.button')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Clear Month Modal */}
      <Modal visible={showClearMonthModal} transparent animationType="slide" onRequestClose={() => setShowClearMonthModal(false)}>
        <View style={styles(theme).modalOverlay}>
          <View style={styles(theme).modalContent}>
            <View style={styles(theme).modalHeader}>
              <Ionicons name="warning" size={32} color={theme.error} />
              <Text style={styles(theme).modalTitle}>{t('scheduleManagement.clearMonth.modalTitle')}</Text>
            </View>

            <Text style={styles(theme).modalDescription}>
              {t('scheduleManagement.clearMonth.modalDescription')}
            </Text>

            {/* Month Selector */}
            <View style={styles(theme).monthSelector}>
              <TouchableOpacity onPress={goToPreviousMonth} style={styles(theme).monthNavButton}>
                <Ionicons name="chevron-back" size={24} color={theme.primary} />
              </TouchableOpacity>
              <Text style={styles(theme).monthText}>{formatMonthYear(selectedMonth)}</Text>
              <TouchableOpacity onPress={goToNextMonth} style={styles(theme).monthNavButton}>
                <Ionicons name="chevron-forward" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles(theme).confirmationBox}>
              <Text style={styles(theme).confirmationLabel}>
                {t('scheduleManagement.clearMonth.confirmLabel')} <Text style={styles(theme).confirmationKeyword}>{t('scheduleManagement.clearMonth.confirmKeyword')}</Text>:
              </Text>
              <TextInput
                style={styles(theme).confirmationInput}
                placeholder={t('scheduleManagement.clearMonth.confirmKeyword')}
                placeholderTextColor={theme.textSecondary}
                value={clearMonthConfirmation}
                onChangeText={setClearMonthConfirmation}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles(theme).modalButtons}>
              <TouchableOpacity
                style={styles(theme).cancelButton}
                onPress={() => {
                  setClearMonthConfirmation('');
                  setShowClearMonthModal(false);
                }}
              >
                <Text style={styles(theme).cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles(theme).confirmDeleteButton, clearMonthConfirmation !== t('scheduleManagement.clearMonth.confirmKeyword') && styles(theme).disabledButton]}
                onPress={handleClearMonthSchedule}
                disabled={clearMonthConfirmation !== t('scheduleManagement.clearMonth.confirmKeyword')}
              >
                <Text style={styles(theme).confirmDeleteButtonText}>{t('scheduleManagement.clearMonth.confirmButton')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Clear All Modal */}
      <Modal visible={showClearAllModal} transparent animationType="slide" onRequestClose={() => setShowClearAllModal(false)}>
        <View style={styles(theme).modalOverlay}>
          <View style={styles(theme).modalContent}>
            <View style={styles(theme).modalHeader}>
              <Ionicons name="nuclear-outline" size={32} color={theme.error} />
              <Text style={styles(theme).modalTitle}>{t('scheduleManagement.clearAll.modalTitle')}</Text>
            </View>

            <Text style={styles(theme).modalDescription}>
              {t('scheduleManagement.clearAll.modalDescription')}
            </Text>

            <View style={styles(theme).criticalWarningBox}>
              <Ionicons name="alert-circle" size={24} color={theme.error} />
              <Text style={styles(theme).criticalWarningText}>
                {t('scheduleManagement.clearAll.warning')}
              </Text>
            </View>

            <View style={styles(theme).confirmationBox}>
              <Text style={styles(theme).confirmationLabel}>
                {t('scheduleManagement.clearAll.confirmLabel')} <Text style={styles(theme).confirmationKeyword}>{t('scheduleManagement.clearAll.confirmKeyword')}</Text>:
              </Text>
              <TextInput
                style={styles(theme).confirmationInput}
                placeholder={t('scheduleManagement.clearAll.confirmKeyword')}
                placeholderTextColor={theme.textSecondary}
                value={clearAllConfirmation}
                onChangeText={setClearAllConfirmation}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles(theme).modalButtons}>
              <TouchableOpacity
                style={styles(theme).cancelButton}
                onPress={() => {
                  setClearAllConfirmation('');
                  setShowClearAllModal(false);
                }}
              >
                <Text style={styles(theme).cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles(theme).confirmDeleteButton, clearAllConfirmation !== t('scheduleManagement.clearAll.confirmKeyword') && styles(theme).disabledButton]}
                onPress={handleClearAllSchedules}
                disabled={clearAllConfirmation !== t('scheduleManagement.clearAll.confirmKeyword')}
              >
                <Text style={styles(theme).confirmDeleteButtonText}>{t('scheduleManagement.clearAll.confirmButton')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: theme.textSecondary,
    fontSize: 13,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.surface2,
    borderRadius: 10,
    padding: 14,
    margin: 16,
    marginBottom: 0,
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a4a2a',
  },
  infoText: {
    color: theme.primary,
    fontSize: 13,
    flex: 1,
  },
  section: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme.primaryDark === '#1a2e1a' ? '#2e2000' : '#fff4e5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff9800',
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    color: '#ff9800',
    fontSize: 13,
    fontWeight: '600',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: theme.primaryDark === '#1a2e1a' ? '#2e1a1a' : '#ffe0e0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.error,
  },
  dangerButtonText: {
    color: theme.error,
    fontSize: 15,
    fontWeight: '600',
  },
  criticalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: theme.error,
    borderRadius: 8,
  },
  criticalButtonText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    width: '95%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: theme.error,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  modalTitle: {
    color: theme.text,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalDescription: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  criticalWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.error,
    marginBottom: 16,
  },
  criticalWarningText: {
    flex: 1,
    color: theme.error,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: theme.background,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  monthNavButton: {
    padding: 8,
  },
  monthText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationBox: {
    marginBottom: 20,
  },
  confirmationLabel: {
    color: theme.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationKeyword: {
    color: theme.error,
    fontWeight: 'bold',
  },
  confirmationInput: {
    backgroundColor: theme.background,
    borderRadius: 8,
    padding: 14,
    color: theme.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.error,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: theme.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: theme.error,
  },
  confirmDeleteButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.3,
  },
});
