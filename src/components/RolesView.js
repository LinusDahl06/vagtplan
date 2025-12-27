import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getEmployeeCountForRole } from '../utils/workspaceHelpers';

export default function RolesView({ workspace, onWorkspaceUpdate }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  const isOwner = workspace.ownerId === auth.currentUser.uid;
  const currentUserEmployee = workspace.employees.find(emp => emp.userId === auth.currentUser.uid);
  const currentUserRole = workspace.roles.find(r => r.id === currentUserEmployee?.roleId);

  const canManageRoles = isOwner || currentUserRole?.permissions.includes('manage_roles');

  const availablePermissions = [
    { id: 'manage_employees', name: t('roles.permissions.manage_employees'), description: t('roles.permissions.manage_employees_desc'), icon: 'people' },
    { id: 'manage_roles', name: t('roles.permissions.manage_roles'), description: t('roles.permissions.manage_roles_desc'), icon: 'shield-checkmark' },
    { id: 'manage_shifts', name: t('roles.permissions.manage_shifts'), description: t('roles.permissions.manage_shifts_desc'), icon: 'time' },
    { id: 'manage_schedule', name: t('roles.permissions.manage_schedule'), description: t('roles.permissions.manage_schedule_desc'), icon: 'calendar' },
    { id: 'analytics', name: t('roles.permissions.analytics'), description: t('roles.permissions.analytics_desc'), icon: 'stats-chart' }
  ];

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

  // Ensure Owner role always has all permissions
  useEffect(() => {
    const ownerRole = workspace.roles.find(r => r.id === '1');
    const allPermissions = availablePermissions.map(p => p.id);

    if (ownerRole && JSON.stringify(ownerRole.permissions.sort()) !== JSON.stringify(allPermissions.sort())) {
      const updatedRoles = workspace.roles.map(r =>
        r.id === '1' ? { ...r, permissions: allPermissions } : r
      );

      updateDoc(doc(db, 'workspaces', workspace.id), {
        roles: updatedRoles
      }).then(() => {
        if (onWorkspaceUpdate) {
          onWorkspaceUpdate({ ...workspace, roles: updatedRoles });
        }
      }).catch(error => {
        console.error('Error updating owner permissions:', error);
      });
    }
  }, [workspace.id]);

  const getRoleIndex = (roleId) => {
    return workspace.roles.findIndex(r => r.id === roleId);
  };

  const canEditRole = (roleId) => {
    if (isOwner) return true;
    if (!canManageRoles) return false;

    const currentRoleIndex = getRoleIndex(currentUserRole.id);
    const targetRoleIndex = getRoleIndex(roleId);
    return targetRoleIndex > currentRoleIndex;
  };

  const handleMoveRoleUp = async (roleId) => {
    const currentIndex = getRoleIndex(roleId);
    if (currentIndex <= 1) return;

    const updatedRoles = [...workspace.roles];
    [updatedRoles[currentIndex - 1], updatedRoles[currentIndex]] =
    [updatedRoles[currentIndex], updatedRoles[currentIndex - 1]];

    try {
      await updateDoc(doc(db, 'workspaces', workspace.id), {
        roles: updatedRoles
      });

      if (onWorkspaceUpdate) {
        onWorkspaceUpdate({ ...workspace, roles: updatedRoles });
      }
    } catch (error) {
      console.error('Error moving role:', error);
      Alert.alert(t('common.error'), t('roles.errors.moveRole'));
    }
  };

  const handleMoveRoleDown = async (roleId) => {
    const currentIndex = getRoleIndex(roleId);
    if (currentIndex >= workspace.roles.length - 1 || currentIndex === 0) return;

    const updatedRoles = [...workspace.roles];
    [updatedRoles[currentIndex], updatedRoles[currentIndex + 1]] =
    [updatedRoles[currentIndex + 1], updatedRoles[currentIndex]];

    try {
      await updateDoc(doc(db, 'workspaces', workspace.id), {
        roles: updatedRoles
      });

      if (onWorkspaceUpdate) {
        onWorkspaceUpdate({ ...workspace, roles: updatedRoles });
      }
    } catch (error) {
      console.error('Error moving role:', error);
      Alert.alert(t('common.error'), t('roles.errors.moveRole'));
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      Alert.alert(t('common.error'), t('roles.errors.enterName'));
      return;
    }

    if (newRoleName.trim().length > 50) {
      Alert.alert(t('common.error'), 'Role name must be at most 50 characters');
      return;
    }

    setLoading(true);
    try {
      const selectedPermissions = Object.keys(newRolePermissions).filter(key => newRolePermissions[key]);

      const newRole = {
        id: Date.now().toString(),
        name: newRoleName,
        permissions: selectedPermissions
      };

      const updatedRoles = [...workspace.roles, newRole];

      await updateDoc(doc(db, 'workspaces', workspace.id), {
        roles: updatedRoles
      });

      if (onWorkspaceUpdate) {
        onWorkspaceUpdate({ ...workspace, roles: updatedRoles });
      }

      setNewRoleName('');
      setNewRolePermissions({});
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding role:', error);
      Alert.alert(t('common.error'), t('roles.errors.createRole'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    const permissionsObj = {};
    availablePermissions.forEach(perm => {
      permissionsObj[perm.id] = role.permissions.includes(perm.id);
    });
    setEditingPermissions(permissionsObj);
    setShowEditModal(true);
  };

  const handleSaveRole = async () => {
    if (!selectedRole.name.trim()) {
      Alert.alert(t('common.error'), t('roles.errors.enterName'));
      return;
    }

    if (selectedRole.name.trim().length > 50) {
      Alert.alert(t('common.error'), 'Role name must be at most 50 characters');
      return;
    }

    setLoading(true);
    try {
      let updatedPermissions = Object.keys(editingPermissions).filter(key => editingPermissions[key]);

      if (selectedRole.id === '1') {
        updatedPermissions = availablePermissions.map(p => p.id);
      }

      const updatedRoles = workspace.roles.map(r =>
        r.id === selectedRole.id
          ? { ...r, name: selectedRole.name, permissions: updatedPermissions }
          : r
      );

      await updateDoc(doc(db, 'workspaces', workspace.id), {
        roles: updatedRoles
      });

      if (onWorkspaceUpdate) {
        onWorkspaceUpdate({ ...workspace, roles: updatedRoles });
      }

      Alert.alert(t('common.success'), t('roles.success.updated'));
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating role:', error);
      Alert.alert(t('common.error'), t('roles.errors.updateRole'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = (role) => {
    const employeeCount = getEmployeeCountForRole(workspace, role.id);

    if (employeeCount > 0) {
      Alert.alert(
        t('roles.errors.cannotDeleteTitle'),
        t('roles.errors.cannotDeleteMessage', { count: employeeCount })
      );
      return;
    }

    Alert.alert(
      t('roles.deleteConfirm.title'),
      t('roles.deleteConfirm.message', { name: role.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const updatedRoles = workspace.roles.filter(r => r.id !== role.id);

              await updateDoc(doc(db, 'workspaces', workspace.id), {
                roles: updatedRoles
              });

              if (onWorkspaceUpdate) {
                onWorkspaceUpdate({ ...workspace, roles: updatedRoles });
              }
              setShowEditModal(false);
            } catch (error) {
              console.error('Error deleting role:', error);
              Alert.alert(t('common.error'), t('roles.errors.deleteRole'));
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles(theme).container}>
      {/* Sticky Header */}
      <View style={styles(theme).header}>
        <View style={styles(theme).headerContent}>
          <View style={styles(theme).headerTextContainer}>
            <Text style={styles(theme).headerTitle}>{t('roles.title')}</Text>
          </View>
          <View style={styles(theme).headerIcon}>
            <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles(theme).scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles(theme).infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
          <Text style={styles(theme).infoText}>
            {t('roles.infoCard')}
          </Text>
        </View>

        {workspace.roles.length === 0 ? (
        <View style={styles(theme).emptyState}>
          <View style={styles(theme).emptyIconContainer}>
            <Ionicons name="shield-outline" size={80} color={theme.border} />
          </View>
          <Text style={styles(theme).emptyTitle}>{t('roles.emptyState.title')}</Text>
          <Text style={styles(theme).emptySubtitle}>
            {t('roles.emptyState.subtitle')}
          </Text>
        </View>
      ) : (
        <View style={styles(theme).rolesList}>
          {workspace.roles.map((role, index) => {
            const employeeCount = getEmployeeCountForRole(workspace, role.id);
            const canEdit = canEditRole(role.id);
            const canMoveUp = canManageRoles && index > 1;
            const canMoveDown = canManageRoles && index < workspace.roles.length - 1 && index !== 0;
            const isOwnerRole = role.id === '1';

            return (
              <View key={role.id} style={[styles(theme).roleCard, isOwnerRole && styles(theme).roleCardOwner]}>
                <View style={styles(theme).roleHeader}>
                  <View style={styles(theme).roleInfo}>
                    <View style={[styles(theme).roleRank, isOwnerRole && styles(theme).ownerRank]}>
                      {isOwnerRole ? (
                        <Ionicons name="star" size={18} color="#000" />
                      ) : (
                        <Text style={styles(theme).roleRankText}>#{index + 1}</Text>
                      )}
                    </View>
                    <View style={styles(theme).roleDetails}>
                      <View style={styles(theme).roleNameRow}>
                        <Text style={styles(theme).roleName}>{role.name}</Text>
                        {isOwnerRole && (
                          <View style={styles(theme).ownerBadge}>
                            <Text style={styles(theme).ownerBadgeText}>{t('roles.ownerBadge')}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles(theme).employeeCount}>
                        {t('roles.memberCount', { count: employeeCount })}
                      </Text>
                      {role.permissions.length > 0 && (
                        <View style={styles(theme).permissionBadges}>
                          {role.permissions.slice(0, 3).map(perm => {
                            const permObj = availablePermissions.find(p => p.id === perm);
                            return (
                              <View key={perm} style={styles(theme).permissionBadge}>
                                <Ionicons
                                  name={permObj?.icon || 'checkmark'}
                                  size={10}
                                  color={theme.primary}
                                />
                                <Text style={styles(theme).permissionBadgeText}>
                                  {permObj?.name}
                                </Text>
                              </View>
                            );
                          })}
                          {role.permissions.length > 3 && (
                            <Text style={styles(theme).morePermissions}>{t('roles.morePermissions', { count: role.permissions.length - 3 })}</Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles(theme).roleActions}>
                    {canMoveUp && (
                      <TouchableOpacity onPress={() => handleMoveRoleUp(role.id)} style={styles(theme).moveButton}>
                        <Ionicons name="chevron-up" size={18} color={theme.primary} />
                      </TouchableOpacity>
                    )}
                    {canMoveDown && (
                      <TouchableOpacity onPress={() => handleMoveRoleDown(role.id)} style={styles(theme).moveButton}>
                        <Ionicons name="chevron-down" size={18} color={theme.primary} />
                      </TouchableOpacity>
                    )}
                    {canEdit && (
                      <TouchableOpacity
                        onPress={() => handleEditRole(role)}
                        style={styles(theme).optionsButton}
                      >
                        <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

        {canManageRoles && (
          <TouchableOpacity
            style={styles(theme).addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
            <Text style={styles(theme).addButtonText}>{t('roles.addRole')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Add Role Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles(theme).modalOverlay}>
          <View style={styles(theme).wideModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles(theme).modalHeader}>
                <View style={styles(theme).modalIconContainer}>
                  <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
                </View>
                <Text style={styles(theme).modalTitle}>{t('roles.createModal.title')}</Text>
                <Text style={styles(theme).modalSubtitle}>
                  {t('roles.createModal.subtitle')}
                </Text>
              </View>

              <View style={styles(theme).inputContainer}>
                <Ionicons name="text-outline" size={20} color={theme.textSecondary} style={styles(theme).inputIcon} />
                <TextInput
                  style={styles(theme).input}
                  placeholder={t('roles.createModal.placeholder')}
                  placeholderTextColor={theme.textSecondary}
                  value={newRoleName}
                  onChangeText={setNewRoleName}
                  editable={!loading}
                />
              </View>

              <Text style={styles(theme).permissionsTitle}>{t('roles.editModal.permissionsTitle')}</Text>
              {availablePermissions.map(perm => (
                <View key={perm.id} style={styles(theme).permissionRow}>
                  <View style={styles(theme).permissionIconContainer}>
                    <Ionicons name={perm.icon} size={20} color={theme.primary} />
                  </View>
                  <View style={styles(theme).permissionInfo}>
                    <Text style={styles(theme).permissionName}>{perm.name}</Text>
                    <Text style={styles(theme).permissionDescription}>{perm.description}</Text>
                  </View>
                  <Switch
                    value={newRolePermissions[perm.id] || false}
                    onValueChange={(value) => setNewRolePermissions({ ...newRolePermissions, [perm.id]: value })}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={newRolePermissions[perm.id] ? theme.text : theme.textSecondary}
                    disabled={loading}
                  />
                </View>
              ))}

              <TouchableOpacity
                style={[styles(theme).confirmButton, loading && styles(theme).confirmButtonLoading]}
                onPress={handleAddRole}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Ionicons name="checkmark-circle" size={20} color="#000" />
                )}
                <Text style={styles(theme).confirmButtonText}>
                  {loading ? t('roles.creating') : t('roles.createRole')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles(theme).cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setNewRoleName('');
                  setNewRolePermissions({});
                }}
                disabled={loading}
              >
                <Text style={styles(theme).cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles(theme).modalOverlay}>
          <View style={styles(theme).wideModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles(theme).modalHeader}>
                <View style={styles(theme).modalIconContainer}>
                  <Ionicons name="create" size={24} color={theme.primary} />
                </View>
                <Text style={styles(theme).modalTitle}>{t('roles.editModal.title')}</Text>
                <Text style={styles(theme).modalSubtitle}>
                  {t('roles.editModal.subtitle')}
                </Text>
              </View>

              <View style={styles(theme).inputContainer}>
                <Ionicons name="text-outline" size={20} color={theme.textSecondary} style={styles(theme).inputIcon} />
                <TextInput
                  style={styles(theme).input}
                  placeholder={t('roles.editModal.placeholder')}
                  placeholderTextColor={theme.textSecondary}
                  value={selectedRole?.name}
                  onChangeText={(text) => setSelectedRole({ ...selectedRole, name: text })}
                  editable={!loading}
                />
              </View>

              <Text style={styles(theme).permissionsTitle}>
                {selectedRole?.id === '1' ? t('roles.editModal.permissionsTitle') : t('roles.editModal.permissionsTitle')}
              </Text>
              {availablePermissions.map(perm => (
                <View key={perm.id} style={styles(theme).permissionRow}>
                  <View style={styles(theme).permissionIconContainer}>
                    <Ionicons name={perm.icon} size={20} color={theme.primary} />
                  </View>
                  <View style={styles(theme).permissionInfo}>
                    <Text style={styles(theme).permissionName}>{perm.name}</Text>
                    <Text style={styles(theme).permissionDescription}>{perm.description}</Text>
                  </View>
                  <Switch
                    value={selectedRole?.id === '1' ? true : (editingPermissions[perm.id] || false)}
                    onValueChange={(value) => setEditingPermissions({ ...editingPermissions, [perm.id]: value })}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={(selectedRole?.id === '1' || editingPermissions[perm.id]) ? theme.text : theme.textSecondary}
                    disabled={selectedRole?.id === '1' || loading}
                  />
                </View>
              ))}

              <TouchableOpacity
                style={[styles(theme).saveButton, loading && styles(theme).saveButtonLoading]}
                onPress={handleSaveRole}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Ionicons name="checkmark-circle" size={20} color="#000" />
                )}
                <Text style={styles(theme).saveButtonText}>
                  {loading ? t('roles.saving') : t('roles.saveChanges')}
                </Text>
              </TouchableOpacity>

              {selectedRole?.id !== '1' && selectedRole?.id !== '2' && selectedRole?.id !== '3' && (
                <TouchableOpacity
                  style={styles(theme).deleteButton}
                  onPress={() => handleDeleteRole(selectedRole)}
                  disabled={loading}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.error} />
                  <Text style={styles(theme).deleteButtonText}>{t('roles.deleteRole')}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles(theme).closeButton}
                onPress={() => setShowEditModal(false)}
                disabled={loading}
              >
                <Text style={styles(theme).closeButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </ScrollView>
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
  scrollContent: {
    flex: 1,
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
    marginBottom: 8,
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a4a2a',
  },
  infoText: {
    color: theme.primary,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
    lineHeight: 20,
  },
  rolesList: {
    padding: 16,
  },
  roleCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 12,
  },
  roleCardOwner: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roleInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  roleRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ownerRank: {
    backgroundColor: '#FFD700',
  },
  roleRankText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  roleDetails: {
    flex: 1,
  },
  roleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  roleName: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '600',
  },
  ownerBadge: {
    backgroundColor: theme.primaryDark === '#1a2e1a' ? '#2a2610' : '#fffacd',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  ownerBadgeText: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '700',
  },
  employeeCount: {
    color: theme.textSecondary,
    fontSize: 13,
    marginBottom: 10,
  },
  permissionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  permissionBadge: {
    flexDirection: 'row',
    backgroundColor: theme.surface2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    gap: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a4a2a',
  },
  permissionBadgeText: {
    color: theme.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  morePermissions: {
    color: theme.textSecondary,
    fontSize: 10,
    fontStyle: 'italic',
  },
  roleActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  moveButton: {
    padding: 8,
    backgroundColor: theme.surfaceVariant,
    borderRadius: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 20,
  },
  wideModalContent: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
    width: '95%',
    maxWidth: 500,
    maxHeight: '85%',
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
    marginBottom: 20,
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
  permissionsTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  permissionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  permissionInfo: {
    flex: 1,
    marginRight: 12,
  },
  permissionName: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  permissionDescription: {
    color: theme.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: theme.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 12,
  },
  cancelButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: theme.primary,
    marginTop: 12,
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
  saveButton: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: theme.primary,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonLoading: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#2e1a1a',
    borderWidth: 2,
    borderColor: theme.error,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    color: theme.error,
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: theme.surfaceVariant,
    marginTop: 12,
  },
  closeButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
