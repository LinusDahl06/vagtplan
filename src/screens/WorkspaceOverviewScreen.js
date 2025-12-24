import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, StyleSheet } from 'react-native';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getTranslatedDefaultRoles, getTranslatedDefaultShiftPresets } from '../i18n/translationHelpers';
import { getColorWithAlpha, getEmployeeColor } from '../utils/employeeColors';
import { getTotalMemberCount } from '../utils/workspaceHelpers';
import { formatTimeRange } from '../utils/timeUtils';
import { canCreateWorkspace, getUserWorkspaceCount, getDefaultSubscriptionTier } from '../utils/subscriptions';

export default function WorkspaceOverviewScreen({ workspaces, setWorkspaces, onSelectWorkspace, onNavigateToSettings }) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(true);
  const [todayShifts, setTodayShifts] = useState([]);
  const [userSubscriptionTier, setUserSubscriptionTier] = useState(getDefaultSubscriptionTier());

  useEffect(() => {
    loadWorkspaces();
    loadUserSubscription();
  }, []);

  useEffect(() => {
    if (workspaces.length > 0) {
      loadTodayShifts();
    }
  }, [workspaces]);

  const loadUserSubscription = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserSubscriptionTier(userData.subscriptionTier || getDefaultSubscriptionTier());
      }
    } catch (error) {
      console.error('Error loading user subscription:', error);
    }
  };

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadTodayShifts = () => {
    const todayString = getTodayDateString();
    const currentUserId = auth.currentUser.uid;
    const shiftsToday = [];

    workspaces.forEach(workspace => {
      const userShifts = workspace.schedule?.filter(
        shift => shift.date === todayString && shift.employeeId === currentUserId
      ) || [];

      userShifts.forEach(shift => {
        // Find the employee's color in this workspace
        // Check if user is in the employees array first
        let employee = workspace.employees?.find(emp => emp.userId === currentUserId);

        // If not found and user is the owner, get their color
        if (!employee && workspace.ownerId === currentUserId) {
          employee = { color: getEmployeeColor(currentUserId) };
        }

        // Fallback to generating color from userId if still not found
        const employeeColor = employee?.color || getEmployeeColor(currentUserId);

        shiftsToday.push({
          ...shift,
          workspaceName: workspace.name,
          workspaceId: workspace.id,
          employeeColor: employeeColor
        });
      });
    });

    setTodayShifts(shiftsToday);
  };

  const loadWorkspaces = async () => {
    try {
      const q = query(
        collection(db, 'workspaces'),
        where('ownerId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const allWorkspacesSnapshot = await getDocs(collection(db, 'workspaces'));
      
      const loadedWorkspaces = [];
      const addedIds = new Set();
      
      querySnapshot.forEach((doc) => {
        loadedWorkspaces.push({ id: doc.id, ...doc.data() });
        addedIds.add(doc.id);
      });
      
      allWorkspacesSnapshot.forEach((doc) => {
        const workspace = doc.data();
        const isEmployee = workspace.employees.some(emp => emp.userId === auth.currentUser.uid);
        if (isEmployee && !addedIds.has(doc.id)) {
          loadedWorkspaces.push({ id: doc.id, ...workspace });
        }
      });
      
      setWorkspaces(loadedWorkspaces);
    } catch (error) {
      console.error('Error loading workspaces:', error);
      Alert.alert(t('common.error'), t('workspaceOverview.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      return;
    }

    // Check subscription limits
    const ownedWorkspaceCount = getUserWorkspaceCount(workspaces, auth.currentUser.uid);
    const canCreate = canCreateWorkspace(userSubscriptionTier, ownedWorkspaceCount);

    if (!canCreate.allowed) {
      Alert.alert(
        t('subscriptions.limitReached.title'),
        t('subscriptions.limitReached.workspaceMessage', { limit: canCreate.limit }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('subscriptions.upgrade'),
            onPress: () => {
              setShowCreateModal(false);
              // TODO: Navigate to subscription screen
              Alert.alert(t('subscriptions.comingSoon'), t('subscriptions.upgradeComingSoon'));
            }
          }
        ]
      );
      return;
    }

    try {
      const newWorkspace = {
        name: newWorkspaceName,
        ownerId: auth.currentUser.uid,
        employees: [],
        roles: getTranslatedDefaultRoles(),
        shifts: getTranslatedDefaultShiftPresets(),
        schedule: [],
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'workspaces'), newWorkspace);
      setWorkspaces([...workspaces, { id: docRef.id, ...newWorkspace }]);
      setNewWorkspaceName('');
      setShowCreateModal(false);
      Alert.alert(t('common.success'), t('workspaceOverview.success.created'));
    } catch (error) {
      console.error('Error creating workspace:', error);
      Alert.alert(t('common.error'), t('workspaceOverview.errors.createFailed'));
    }
  };

  const handleOpenManage = (workspace) => {
    setSelectedWorkspace(workspace);
    setEditingName(workspace.name);
    setShowManageModal(true);
  };

  const handleUpdateName = async () => {
    if (!editingName.trim()) {
      Alert.alert(t('common.error'), t('workspaceOverview.errors.enterName'));
      return;
    }

    try {
      await updateDoc(doc(db, 'workspaces', selectedWorkspace.id), {
        name: editingName
      });

      setWorkspaces(workspaces.map(w => 
        w.id === selectedWorkspace.id ? { ...w, name: editingName } : w
      ));

      setShowManageModal(false);
    } catch (error) {
      console.error('Error updating workspace:', error);
      Alert.alert(t('common.error'), t('workspaceOverview.errors.updateFailed'));
    }
  };

  const handleDeleteWorkspace = () => {
    Alert.alert(
      t('workspaceOverview.deleteConfirm.title'),
      t('workspaceOverview.deleteConfirm.message', { name: selectedWorkspace.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'workspaces', selectedWorkspace.id));
              setWorkspaces(workspaces.filter(w => w.id !== selectedWorkspace.id));
              setShowManageModal(false);
            } catch (error) {
              console.error('Error deleting workspace:', error);
              Alert.alert(t('common.error'), t('workspaceOverview.errors.deleteFailed'));
            }
          }
        }
      ]
    );
  };

  const handleLeaveWorkspace = () => {
    Alert.alert(
      t('workspaceOverview.leaveConfirm.title'),
      t('workspaceOverview.leaveConfirm.message', { name: selectedWorkspace.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('workspaceOverview.leaveConfirm.leave'),
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedEmployees = selectedWorkspace.employees.filter(
                emp => emp.userId !== auth.currentUser.uid
              );

              await updateDoc(doc(db, 'workspaces', selectedWorkspace.id), {
                employees: updatedEmployees
              });

              setWorkspaces(workspaces.filter(w => w.id !== selectedWorkspace.id));
              setShowManageModal(false);
              Alert.alert(t('common.success'), t('workspaceOverview.success.left'));
            } catch (error) {
              console.error('Error leaving workspace:', error);
              Alert.alert(t('common.error'), t('workspaceOverview.errors.leaveFailed'));
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles(theme).container, styles(theme).centerContent]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles(theme).loadingText}>{t('workspaceOverview.loadingWorkspaces')}</Text>
      </View>
    );
  }

  return (
    <View style={styles(theme).container}>
      {/* Header */}
      <View style={styles(theme).header}>
        <View style={styles(theme).safeAreaSpacer} />
        <View style={styles(theme).headerContent}>
          <View style={styles(theme).headerLeft}>
            <Ionicons name="briefcase-outline" size={28} color={theme.primary} />
            <Text style={styles(theme).headerTitle}>{t('workspaceOverview.title')}</Text>
          </View>
          <View style={styles(theme).headerRight}>
            <TouchableOpacity onPress={onNavigateToSettings} style={styles(theme).settingsButton}>
              <Ionicons name="settings-outline" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles(theme).statsBar}>
        <View style={styles(theme).statItem}>
          <Text style={styles(theme).statNumber}>{workspaces.length}</Text>
          <Text style={styles(theme).statLabel}>{t('workspaceOverview.totalWorkspaces')}</Text>
        </View>
        <View style={styles(theme).statDivider} />
        <View style={styles(theme).statItem}>
          <Text style={styles(theme).statNumber}>
            {workspaces.filter(w => w.ownerId === auth.currentUser.uid).length}
          </Text>
          <Text style={styles(theme).statLabel}>{t('workspaceOverview.owned')}</Text>
        </View>
        <View style={styles(theme).statDivider} />
        <View style={styles(theme).statItem}>
          <Text style={styles(theme).statNumber}>
            {workspaces.filter(w => w.ownerId !== auth.currentUser.uid).length}
          </Text>
          <Text style={styles(theme).statLabel}>{t('workspaceOverview.member')}</Text>
        </View>
      </View>

      {/* Today's Shifts Box */}
      <View style={[
        styles(theme).todayShiftsBox,
        todayShifts.length > 0 && {
          backgroundColor: getColorWithAlpha(todayShifts[0].employeeColor, 0.1, true),
          borderColor: todayShifts[0].employeeColor,
          borderWidth: 2,
        }
      ]}>
        <View style={styles(theme).todayShiftsHeader}>
          <Ionicons
            name="today"
            size={18}
            color={todayShifts.length > 0 ? todayShifts[0].employeeColor : theme.primary}
          />
          <Text style={styles(theme).todayShiftsTitle}>
            {new Date().toLocaleDateString(i18n.language, {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {todayShifts.length === 0 ? (
          <Text style={styles(theme).noShiftsText}>{t('workspaceOverview.todayShifts.noShifts')}</Text>
        ) : (
          <View style={styles(theme).shiftsContainer}>
            {todayShifts.map((shift) => (
              <View
                key={shift.id}
                style={[
                  styles(theme).shiftItem,
                  {
                    backgroundColor: getColorWithAlpha(shift.employeeColor, 0.15, true),
                    borderLeftWidth: 4,
                    borderLeftColor: shift.employeeColor,
                    paddingLeft: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }
                ]}
              >
                {todayShifts.length > 1 && (
                  <Text style={[styles(theme).shiftWorkspaceName, { color: shift.employeeColor }]}>
                    {shift.workspaceName}
                  </Text>
                )}
                <View style={styles(theme).shiftDetails}>
                  <Ionicons name="time-outline" size={14} color={shift.employeeColor} />
                  <Text style={styles(theme).shiftText}>
                    {formatTimeRange(shift.startTime, shift.endTime)} ({shift.hours}{i18n.language === 'da' ? 't' : 'h'})
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Workspaces List */}
      <ScrollView style={styles(theme).content} showsVerticalScrollIndicator={false}>
        {workspaces.length === 0 ? (
          <View style={styles(theme).emptyState}>
            <View style={styles(theme).emptyIconContainer}>
              <Ionicons name="briefcase-outline" size={80} color={theme.border} />
            </View>
            <Text style={styles(theme).emptyTitle}>{t('workspaceOverview.emptyState.title')}</Text>
            <Text style={styles(theme).emptySubtitle}>{t('workspaceOverview.emptyState.subtitle')}</Text>
            <TouchableOpacity
              style={styles(theme).emptyActionButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#000" />
              <Text style={styles(theme).emptyActionText}>{t('workspaceOverview.emptyState.createButton')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles(theme).workspaceGrid}>
            {workspaces.map((workspace) => {
              const isOwner = workspace.ownerId === auth.currentUser.uid;

              return (
                <TouchableOpacity
                  key={workspace.id}
                  style={styles(theme).workspaceCard}
                  onPress={() => onSelectWorkspace(workspace)}
                  activeOpacity={0.7}
                >
                  <View style={styles(theme).workspaceHeader}>
                    <View style={styles(theme).workspaceIconContainer}>
                      <Ionicons name="business" size={24} color={theme.primary} />
                    </View>
                    <TouchableOpacity
                      style={styles(theme).manageButton}
                      onPress={() => handleOpenManage(workspace)}
                    >
                      <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles(theme).workspaceName} numberOfLines={2}>
                    {workspace.name}
                  </Text>

                  <View style={styles(theme).workspaceFooter}>
                    <View style={styles(theme).workspaceInfo}>
                      <Ionicons name="people-outline" size={14} color={theme.textSecondary} />
                      <Text style={styles(theme).workspaceInfoText}>
                        {getTotalMemberCount(workspace)} {t('common.members')}
                      </Text>
                    </View>
                    {isOwner && (
                      <View style={styles(theme).ownerBadge}>
                        <Text style={styles(theme).ownerBadgeText}>{t('common.owner')}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles(theme).fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      {/* Create Workspace Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles(theme).modalOverlay}>
          <View style={styles(theme).modalContent}>
            <View style={styles(theme).modalHeader}>
              <View style={styles(theme).modalIconContainer}>
                <Ionicons name="add-circle" size={24} color={theme.primary} />
              </View>
              <Text style={styles(theme).modalTitle}>{t('workspaceOverview.createModal.title')}</Text>
              <Text style={styles(theme).modalSubtitle}>{t('workspaceOverview.createModal.subtitle')}</Text>
            </View>

            <View style={styles(theme).inputContainer}>
              <Ionicons name="briefcase-outline" size={20} color={theme.textSecondary} style={styles(theme).inputIcon} />
              <TextInput
                style={styles(theme).input}
                placeholder={t('workspaceOverview.createModal.placeholder')}
                placeholderTextColor={theme.textSecondary}
                value={newWorkspaceName}
                onChangeText={setNewWorkspaceName}
                autoFocus
              />
            </View>

            <View style={styles(theme).modalButtons}>
              <TouchableOpacity
                style={styles(theme).cancelButton}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewWorkspaceName('');
                }}
              >
                <Text style={styles(theme).cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles(theme).confirmButton}
                onPress={handleCreateWorkspace}
              >
                <Ionicons name="checkmark-circle" size={20} color="#000" />
                <Text style={styles(theme).confirmButtonText}>{t('workspaceOverview.createModal.createButton')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Manage Workspace Modal */}
      <Modal
        visible={showManageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManageModal(false)}
      >
        <View style={styles(theme).modalOverlay}>
          <View style={styles(theme).modalContent}>
            {selectedWorkspace && selectedWorkspace.ownerId === auth.currentUser.uid ? (
              // Owner view
              <>
                <View style={styles(theme).modalHeader}>
                  <View style={styles(theme).modalIconContainer}>
                    <Ionicons name="create" size={24} color={theme.primary} />
                  </View>
                  <Text style={styles(theme).modalTitle}>{t('workspaceOverview.manageModal.title')}</Text>
                  <Text style={styles(theme).modalSubtitle}>{t('workspaceOverview.manageModal.subtitle')}</Text>
                </View>

                <View style={styles(theme).inputContainer}>
                  <Ionicons name="briefcase-outline" size={20} color={theme.textSecondary} style={styles(theme).inputIcon} />
                  <TextInput
                    style={styles(theme).input}
                    placeholder={t('workspaceOverview.manageModal.placeholder')}
                    placeholderTextColor={theme.textSecondary}
                    value={editingName}
                    onChangeText={setEditingName}
                  />
                </View>

                <TouchableOpacity
                  style={styles(theme).saveButton}
                  onPress={handleUpdateName}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#000" />
                  <Text style={styles(theme).saveButtonText}>{t('workspaceOverview.manageModal.saveButton')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles(theme).deleteButton}
                  onPress={handleDeleteWorkspace}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.error} />
                  <Text style={styles(theme).deleteButtonText}>{t('workspaceOverview.manageModal.deleteButton')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles(theme).cancelButtonFull}
                  onPress={() => setShowManageModal(false)}
                >
                  <Text style={styles(theme).cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Member view
              <>
                <View style={styles(theme).modalHeader}>
                  <View style={styles(theme).modalIconContainer}>
                    <Ionicons name="exit-outline" size={24} color={theme.error} />
                  </View>
                  <Text style={styles(theme).modalTitle}>{t('workspaceOverview.leaveModal.title')}</Text>
                  <Text style={styles(theme).modalSubtitle}>
                    {t('workspaceOverview.leaveModal.subtitle', { name: selectedWorkspace?.name })}
                  </Text>
                </View>

                <View style={styles(theme).warningBox}>
                  <Ionicons name="warning-outline" size={20} color={theme.warning} />
                  <Text style={styles(theme).warningText}>
                    {t('workspaceOverview.leaveModal.warning')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles(theme).leaveButton}
                  onPress={handleLeaveWorkspace}
                >
                  <Ionicons name="exit-outline" size={18} color={theme.error} />
                  <Text style={styles(theme).leaveButtonText}>{t('workspaceOverview.leaveModal.leaveButton')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles(theme).cancelButtonFull}
                  onPress={() => setShowManageModal(false)}
                >
                  <Text style={styles(theme).cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </>
            )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButton: {
    padding: 8,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.border,
    marginHorizontal: 8,
  },
  todayShiftsBox: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  todayShiftsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  todayShiftsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  noShiftsText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  shiftsContainer: {
    gap: 8,
  },
  shiftItem: {
    gap: 4,
  },
  shiftWorkspaceName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 2,
  },
  shiftDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shiftText: {
    fontSize: 13,
    color: theme.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: theme.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyActionButton: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    gap: 8,
  },
  emptyActionText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  workspaceGrid: {
    gap: 16,
  },
  workspaceCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 8,
  },
  workspaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  workspaceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.surfaceVariant,
  },
  workspaceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
    minHeight: 48,
  },
  workspaceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workspaceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workspaceInfoText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  ownerBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ownerBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.primary,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    color: theme.text,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: theme.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: theme.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: theme.primary,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#theme.surfaceVariant',
    borderWidth: 2,
    borderColor: theme.error,
    marginBottom: 12,
  },
  deleteButtonText: {
    color: theme.error,
    fontSize: 16,
    fontWeight: '700',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 10,
    backgroundColor: theme.primaryDark === '#1a2e1a' ? '#2e2a1a' : '#fff3cd',
    borderWidth: 1,
    borderColor: theme.warning || '#ffc107',
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    color: theme.warning || '#ffc107',
    fontSize: 14,
    lineHeight: 20,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 10,
    backgroundColor: theme.surfaceVariant,
    borderWidth: 2,
    borderColor: theme.error,
    marginBottom: 12,
  },
  leaveButtonText: {
    color: theme.error,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButtonFull: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: theme.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.border,
  },
});