import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { collection, getDocs, doc, query, where, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getEmployeeColor, getColorWithAlpha } from '../utils/employeeColors';
import OptimizedImage from './OptimizedImage';
import { canWorkspaceAddEmployee, getDefaultSubscriptionTier } from '../utils/subscriptions';

export default function EmployeesView({ workspace, onWorkspaceUpdate, ownerInfo }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [ownerSubscriptionTier, setOwnerSubscriptionTier] = useState(getDefaultSubscriptionTier());

  const isOwner = workspace.ownerId === auth.currentUser.uid;

  useEffect(() => {
    loadOwnerSubscription();
  }, [workspace.ownerId]);

  const loadOwnerSubscription = async () => {
    try {
      const ownerDoc = await getDoc(doc(db, 'users', workspace.ownerId));
      if (ownerDoc.exists()) {
        const ownerData = ownerDoc.data();
        setOwnerSubscriptionTier(ownerData.subscriptionTier || getDefaultSubscriptionTier());
      }
    } catch (error) {
      console.error('Error loading owner subscription:', error);
    }
  };

  const getAllEmployeesIncludingOwner = () => {
    const allEmployees = [...workspace.employees];
    const ownerInEmployees = workspace.employees.some(emp => emp.userId === workspace.ownerId);

    if (!ownerInEmployees && ownerInfo) {
      allEmployees.unshift({
        userId: workspace.ownerId,
        name: ownerInfo.name,
        username: ownerInfo.username,
        email: ownerInfo.email,
        photoURL: ownerInfo.photoURL || null,
        roleId: '1',
        color: getEmployeeColor(workspace.ownerId)
      });
    }

    // Ensure all employees have a color (fallback for existing data)
    const employeesWithColors = allEmployees.map(emp => ({
      ...emp,
      color: emp.color || getEmployeeColor(emp.userId)
    }));

    // Sort employees by role hierarchy and then alphabetically
    return employeesWithColors.sort((a, b) => {
      // Get role indices (position in the roles array determines hierarchy)
      const roleIndexA = workspace.roles.findIndex(r => r.id === a.roleId);
      const roleIndexB = workspace.roles.findIndex(r => r.id === b.roleId);

      // If roles are different, sort by role hierarchy (lower index = higher role)
      if (roleIndexA !== roleIndexB) {
        return roleIndexA - roleIndexB;
      }

      // If same role, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  };

  const handleAddEmployee = async () => {
    if (!searchUsername.trim()) {
      Alert.alert(t('common.error'), t('employees.errors.enterUsername'));
      return;
    }

    // Check subscription limits before searching for user
    const canAdd = canWorkspaceAddEmployee(ownerSubscriptionTier, workspace);
    if (!canAdd.allowed) {
      Alert.alert(
        t('subscriptions.limitReached.title'),
        t('subscriptions.limitReached.employeeMessage', {
          limit: canAdd.limit,
          current: canAdd.currentCount
        }),
        [
          { text: t('common.ok'), style: 'cancel' },
          ...(isOwner ? [{
            text: t('subscriptions.upgrade'),
            onPress: () => {
              setShowAddModal(false);
              Alert.alert(t('subscriptions.comingSoon'), t('subscriptions.upgradeComingSoon'));
            }
          }] : [])
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', searchUsername.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert(t('common.error'), t('employees.errors.userNotFound'));
        setLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const userId = userDoc.id;

      if (workspace.employees.some(emp => emp.userId === userId)) {
        Alert.alert(t('common.error'), t('employees.errors.alreadyAdded'));
        setLoading(false);
        return;
      }

      const defaultRole = workspace.roles.find(r => r.name === 'Employee') || workspace.roles[workspace.roles.length - 1];

      const newEmployee = {
        userId: userId,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        photoURL: userData.photoURL || null,
        roleId: defaultRole.id,
        color: getEmployeeColor(userId),
        addedAt: new Date().toISOString()
      };

      const updatedEmployees = [...workspace.employees, newEmployee];

      await updateDoc(doc(db, 'workspaces', workspace.id), {
        employees: updatedEmployees
      });

      if (onWorkspaceUpdate) {
        onWorkspaceUpdate({ ...workspace, employees: updatedEmployees });
      }

      setSearchUsername('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding employee:', error);
      Alert.alert(t('common.error'), t('employees.errors.addFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEmployee = (employee) => {
    Alert.alert(
      t('employees.removeConfirm.title'),
      t('employees.removeConfirm.message', { name: employee.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('employees.removeEmployee'),
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedEmployees = workspace.employees.filter(emp => emp.userId !== employee.userId);

              await updateDoc(doc(db, 'workspaces', workspace.id), {
                employees: updatedEmployees
              });

              if (onWorkspaceUpdate) {
                onWorkspaceUpdate({ ...workspace, employees: updatedEmployees });
              }

              setShowOptionsModal(false);
            } catch (error) {
              console.error('Error removing employee:', error);
              Alert.alert(t('common.error'), t('employees.errors.removeFailed'));
            }
          }
        }
      ]
    );
  };

  const handleChangeRole = async (employee, newRoleId) => {
    try {
      const updatedEmployees = workspace.employees.map(emp => 
        emp.userId === employee.userId ? { ...emp, roleId: newRoleId } : emp
      );

      await updateDoc(doc(db, 'workspaces', workspace.id), {
        employees: updatedEmployees
      });

      if (onWorkspaceUpdate) {
        onWorkspaceUpdate({ ...workspace, employees: updatedEmployees });
      }

      setShowOptionsModal(false);
    } catch (error) {
      console.error('Error updating role:', error);
      Alert.alert(t('common.error'), t('employees.errors.updateRoleFailed'));
    }
  };

  const getRoleName = (roleId) => {
    const role = workspace.roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown';
  };

  const allEmployees = getAllEmployeesIncludingOwner();

  return (
    <View style={styles(theme).container}>
      {/* Sticky Header */}
      <View style={styles(theme).header}>
        <View style={styles(theme).headerContent}>
          <View style={styles(theme).headerTextContainer}>
            <Text style={styles(theme).headerTitle}>{t('employees.title')}</Text>
            <Text style={styles(theme).headerSubtitle}>{allEmployees.length} {allEmployees.length === 1 ? t('common.member') : t('common.members')}</Text>
          </View>
          <View style={styles(theme).headerStats}>
            <Ionicons name="people" size={32} color={theme.primary} />
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles(theme).scrollContent} showsVerticalScrollIndicator={false}>
        {allEmployees.length === 0 ? (
          <View style={styles(theme).emptyState}>
            <View style={styles(theme).emptyIconContainer}>
              <Ionicons name="people-outline" size={80} color={theme.border} />
            </View>
            <Text style={styles(theme).emptyTitle}>{t('employees.noEmployees')}</Text>
            <Text style={styles(theme).emptySubtitle}>{t('employees.addFirstEmployee')}</Text>
            {isOwner && (
              <TouchableOpacity
                style={styles(theme).emptyActionButton}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color={theme.text} />
                <Text style={styles(theme).emptyActionText}>{t('employees.addEmployee')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles(theme).employeeList}>
            {allEmployees.map((employee, index) => {
              const isOwnerEmployee = employee.userId === workspace.ownerId;
              return (
                <View key={employee.userId} style={styles(theme).employeeCard}>
                  <View style={styles(theme).employeeInfo}>
                    {employee.photoURL ? (
                      <OptimizedImage
                        uri={employee.photoURL}
                        style={styles(theme).avatarImage}
                        defaultSource={
                          <View style={[
                            styles(theme).avatarCircle,
                            isOwnerEmployee && styles(theme).avatarCircleOwner
                          ]}>
                            <Text style={styles(theme).avatarText}>
                              {employee.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        }
                      />
                    ) : (
                      <View style={[
                        styles(theme).avatarCircle,
                        isOwnerEmployee && styles(theme).avatarCircleOwner
                      ]}>
                        <Text style={styles(theme).avatarText}>
                          {employee.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles(theme).employeeDetails}>
                      <View style={styles(theme).employeeNameRow}>
                        <Text style={styles(theme).employeeName}>{employee.name}</Text>
                        {isOwnerEmployee && (
                          <View style={styles(theme).ownerBadge}>
                            <Ionicons name="star" size={10} color={theme.gold} />
                            <Text style={styles(theme).ownerBadgeText}>{t('common.owner')}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles(theme).employeeUsername}>@{employee.username}</Text>
                      <View style={styles(theme).badgesRow}>
                        <View style={styles(theme).roleBadgeContainer}>
                          <Ionicons name="briefcase-outline" size={12} color={theme.primary} />
                          <Text style={styles(theme).roleBadgeText}>{getRoleName(employee.roleId)}</Text>
                        </View>
                        <View
                          style={[
                            styles(theme).colorBadge,
                            {
                              backgroundColor: getColorWithAlpha(employee.color, 0.2),
                              borderColor: employee.color
                            }
                          ]}
                        >
                          <View
                            style={[
                              styles(theme).colorDot,
                              { backgroundColor: employee.color }
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  </View>

                  {isOwner && !isOwnerEmployee && (
                    <TouchableOpacity
                      style={styles(theme).optionsButton}
                      onPress={() => {
                        setSelectedEmployee(employee);
                        setShowOptionsModal(true);
                      }}
                    >
                      <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {isOwner && allEmployees.length > 0 && (
          <TouchableOpacity
            style={styles(theme).addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
            <Text style={styles(theme).addButtonText}>{t('employees.addEmployee')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Add Employee Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles(theme).modalOverlay}>
          <View style={styles(theme).modalContent}>
            <View style={styles(theme).modalHeader}>
              <View style={styles(theme).modalIconContainer}>
                <Ionicons name="person-add" size={24} color={theme.primary} />
              </View>
              <Text style={styles(theme).modalTitle}>{t('employees.addEmployee')}</Text>
              <Text style={styles(theme).modalSubtitle}>{t('employees.searchPlaceholder')}</Text>
            </View>

            <View style={styles(theme).inputContainer}>
              <Ionicons name="at" size={20} color={theme.textSecondary} style={styles(theme).inputIcon} />
              <TextInput
                style={styles(theme).input}
                placeholder={t('auth.username')}
                placeholderTextColor={theme.textSecondary}
                value={searchUsername}
                onChangeText={setSearchUsername}
                autoCapitalize="none"
                editable={!loading}
                autoFocus
              />
            </View>

            <View style={styles(theme).modalButtons}>
              <TouchableOpacity
                style={styles(theme).cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setSearchUsername('');
                }}
                disabled={loading}
              >
                <Text style={styles(theme).cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles(theme).confirmButton, loading && styles(theme).confirmButtonLoading]}
                onPress={handleAddEmployee}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Ionicons name="checkmark-circle" size={20} color="#000" />
                )}
                <Text style={styles(theme).confirmButtonText}>
                  {loading ? t('common.loading') : t('employees.addEmployee')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Employee Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity
          style={styles(theme).modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles(theme).optionsModalContent}>
            <Text style={styles(theme).optionsTitle}>
              {selectedEmployee?.name}
            </Text>

            <View style={styles(theme).optionsSection}>
              <Text style={styles(theme).optionsSectionTitle}>{t('employees.changeRole')}</Text>
              {workspace.roles.map(role => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles(theme).roleOption,
                    selectedEmployee?.roleId === role.id && styles(theme).roleOptionActive
                  ]}
                  onPress={() => handleChangeRole(selectedEmployee, role.id)}
                >
                  <Text style={[
                    styles(theme).roleOptionText,
                    selectedEmployee?.roleId === role.id && styles(theme).roleOptionTextActive
                  ]}>
                    {role.name}
                  </Text>
                  {selectedEmployee?.roleId === role.id && (
                    <Text style={styles(theme).checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles(theme).removeButton}
              onPress={() => handleRemoveEmployee(selectedEmployee)}
            >
              <Ionicons name="trash-outline" size={18} color={theme.error} />
              <Text style={styles(theme).removeButtonText}>{t('employees.removeEmployee')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles(theme).closeButton}
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={styles(theme).closeButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    padding: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  headerStats: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: theme.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
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
  employeeList: {
    padding: 16,
    gap: 12,
  },
  employeeCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
    backgroundColor: theme.surface,
  },
  avatarCircleOwner: {
    backgroundColor: theme.gold,
  },
  avatarText: {
    color: '#000',
    fontSize: 22,
    fontWeight: 'bold',
  },
  employeeDetails: {
    flex: 1,
  },
  employeeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  employeeName: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '600',
  },
  ownerBadge: {
    flexDirection: 'row',
    backgroundColor: theme.primaryDark === '#1a2e1a' ? '#2a2610' : '#fffacd',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: theme.gold,
  },
  ownerBadgeText: {
    color: theme.gold,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  employeeUsername: {
    color: theme.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#2a4a2a',
  },
  roleBadgeText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  colorBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  optionsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.surfaceVariant,
  },
  addButton: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.primary,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
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
    color: theme.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 24,
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
  confirmButtonLoading: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionsModalContent: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: theme.border,
  },
  optionsTitle: {
    color: theme.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsSection: {
    marginBottom: 24,
  },
  optionsSectionTitle: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  roleOption: {
    backgroundColor: theme.background,
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.border,
  },
  roleOptionActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryDark,
  },
  roleOptionText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '500',
  },
  roleOptionTextActive: {
    color: theme.primary,
    fontWeight: '700',
  },
  checkmark: {
    color: theme.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: '#2e1a1a',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: theme.error,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  removeButtonText: {
    color: theme.error,
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: theme.surfaceVariant,
    borderRadius: 10,
  },
  closeButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
});