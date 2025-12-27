import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { calculateHours, formatTimeRange, generateTimeOptions } from '../utils/timeUtils';

export default function ShiftsView({ workspace, onWorkspaceUpdate }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newShiftName, setNewShiftName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedShift, setSelectedShift] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const timeOptions = generateTimeOptions();

  const isOwner = workspace.ownerId === auth.currentUser.uid;
  const currentUserEmployee = workspace.employees.find(emp => emp.userId === auth.currentUser.uid);
  const currentUserRole = workspace.roles.find(r => r.id === currentUserEmployee?.roleId);

  const canManageShifts = isOwner || currentUserRole?.permissions.includes('manage_shifts');

  const handleAddShift = async () => {
    if (!newShiftName.trim()) {
      Alert.alert(t('common.error'), t('shifts.errors.enterName'));
      return;
    }

    const hours = calculateHours(startTime, endTime);
    if (hours <= 0) {
      Alert.alert(t('common.error'), 'End time must be after start time');
      return;
    }

    setLoading(true);
    try {
      const newShift = {
        id: Date.now().toString(),
        name: newShiftName.trim(),
        startTime,
        endTime,
        hours
      };

      const updatedShifts = [...workspace.shifts, newShift];

      await updateDoc(doc(db, 'workspaces', workspace.id), {
        shifts: updatedShifts
      });

      if (onWorkspaceUpdate) {
        onWorkspaceUpdate({ ...workspace, shifts: updatedShifts });
      }

      setNewShiftName('');
      setStartTime('09:00');
      setEndTime('17:00');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding shift:', error);
      Alert.alert(t('common.error'), t('shifts.errors.createShift'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditShift = (shift) => {
    setSelectedShift({ ...shift });
    setShowEditModal(true);
  };

  const handleSaveShift = async () => {
    if (!selectedShift.name.trim()) {
      Alert.alert(t('common.error'), t('shifts.errors.enterName'));
      return;
    }

    const hours = calculateHours(selectedShift.startTime, selectedShift.endTime);
    if (hours <= 0) {
      Alert.alert(t('common.error'), 'End time must be after start time');
      return;
    }

    setLoading(true);
    try {
      const updatedShifts = workspace.shifts.map(s =>
        s.id === selectedShift.id ? { ...selectedShift, hours } : s
      );

      await updateDoc(doc(db, 'workspaces', workspace.id), {
        shifts: updatedShifts
      });

      if (onWorkspaceUpdate) {
        onWorkspaceUpdate({ ...workspace, shifts: updatedShifts });
      }

      Alert.alert(t('common.success'), t('shifts.success.updated'));
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating shift:', error);
      Alert.alert(t('common.error'), t('shifts.errors.updateShift'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShift = (shift) => {
    const isUsedInSchedule = workspace.schedule.some(s => s.shiftId === shift.id);

    if (isUsedInSchedule) {
      Alert.alert(
        t('shifts.errors.cannotDeleteTitle'),
        t('shifts.errors.cannotDeleteMessage')
      );
      return;
    }

    Alert.alert(
      t('shifts.deleteConfirm.title'),
      t('shifts.deleteConfirm.message', { name: shift.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const updatedShifts = workspace.shifts.filter(s => s.id !== shift.id);

              await updateDoc(doc(db, 'workspaces', workspace.id), {
                shifts: updatedShifts
              });

              if (onWorkspaceUpdate) {
                onWorkspaceUpdate({ ...workspace, shifts: updatedShifts });
              }

              setShowEditModal(false);
            } catch (error) {
              console.error('Error deleting shift:', error);
              Alert.alert(t('common.error'), t('shifts.errors.deleteShift'));
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles(theme).section}>
      {/* Header */}
      <View style={styles(theme).header}>
        <View style={styles(theme).headerContent}>
          <View style={styles(theme).headerTextContainer}>
            <Text style={styles(theme).headerTitle}>{t('shifts.title')}</Text>
          </View>
          <View style={styles(theme).headerIcon}>
            <Ionicons name="time" size={24} color={theme.primary} />
          </View>
        </View>
      </View>

      <View style={styles(theme).infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
        <Text style={styles(theme).infoText}>
          {t('shifts.description')}
        </Text>
      </View>

      {workspace.shifts.length === 0 ? (
        <View style={styles(theme).emptyState}>
          <View style={styles(theme).emptyIconContainer}>
            <Ionicons name="time-outline" size={80} color={theme.border} />
          </View>
          <Text style={styles(theme).emptyTitle}>{t('shifts.emptyState.title')}</Text>
          <Text style={styles(theme).emptySubtitle}>
            {t('shifts.emptyState.subtitle')}
          </Text>
          {canManageShifts && (
            <TouchableOpacity
              style={styles(theme).emptyActionButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={theme.text} />
              <Text style={styles(theme).emptyActionText}>{t('shifts.emptyState.createButton')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView style={styles(theme).shiftsList} showsVerticalScrollIndicator={false}>
          {workspace.shifts.map((shift) => {
            const timeRange = shift.startTime && shift.endTime
              ? formatTimeRange(shift.startTime, shift.endTime)
              : null;

            return (
              <View key={shift.id} style={styles(theme).shiftCard}>
                <View style={styles(theme).shiftInfo}>
                  <View style={styles(theme).shiftIconContainer}>
                    <Ionicons name="time" size={28} color={theme.primary} />
                  </View>
                  <View style={styles(theme).shiftDetails}>
                    <Text style={styles(theme).shiftName}>{shift.name}</Text>
                    {timeRange && (
                      <Text style={styles(theme).timeRangeText}>{timeRange}</Text>
                    )}
                    <View style={styles(theme).hoursBadge}>
                      <Ionicons name="hourglass-outline" size={14} color={theme.primary} />
                      <Text style={styles(theme).shiftHours}>{t('shifts.hoursLabel', { hours: shift.hours })}</Text>
                    </View>
                  </View>
                </View>

                {canManageShifts && (
                  <TouchableOpacity
                    onPress={() => handleEditShift(shift)}
                    style={styles(theme).optionsButton}
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {canManageShifts && workspace.shifts.length > 0 && (
        <TouchableOpacity
          style={styles(theme).addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
          <Text style={styles(theme).addButtonText}>{t('shifts.addShiftPreset')}</Text>
        </TouchableOpacity>
      )}

      {/* Add Shift Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles(theme).modalOverlay}
        >
          <View style={styles(theme).modalContent}>
            <View style={styles(theme).modalHeader}>
              <View style={styles(theme).modalIconContainer}>
                <Ionicons name="add-circle" size={24} color={theme.primary} />
              </View>
              <Text style={styles(theme).modalTitle}>{t('shifts.createModal.title')}</Text>
              <Text style={styles(theme).modalSubtitle}>
                {t('shifts.createModal.subtitle')}
              </Text>
            </View>

            <View style={styles(theme).inputContainer}>
              <Ionicons name="text-outline" size={20} color={theme.textSecondary} style={styles(theme).inputIcon} />
              <TextInput
                style={styles(theme).input}
                placeholder={t('shifts.createModal.namePlaceholder')}
                placeholderTextColor={theme.textSecondary}
                value={newShiftName}
                onChangeText={setNewShiftName}
                editable={!loading}
              />
            </View>

            <View style={styles(theme).timePickersRow}>
              <View style={styles(theme).timePickerContainer}>
                <Text style={styles(theme).timeLabel}>Start Time</Text>
                <View style={styles(theme).pickerWrapper}>
                  <Picker
                    selectedValue={startTime}
                    onValueChange={setStartTime}
                    style={styles(theme).picker}
                    dropdownIconColor={theme.text}
                    enabled={!loading}
                  >
                    {timeOptions.map((time) => (
                      <Picker.Item key={time} label={time} value={time} color={theme.text} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles(theme).timePickerContainer}>
                <Text style={styles(theme).timeLabel}>End Time</Text>
                <View style={styles(theme).pickerWrapper}>
                  <Picker
                    selectedValue={endTime}
                    onValueChange={setEndTime}
                    style={styles(theme).picker}
                    dropdownIconColor={theme.text}
                    enabled={!loading}
                  >
                    {timeOptions.map((time) => (
                      <Picker.Item key={time} label={time} value={time} color={theme.text} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles(theme).hoursPreview}>
              <Ionicons name="time" size={16} color={theme.primary} />
              <Text style={styles(theme).hoursPreviewText}>
                Total: {calculateHours(startTime, endTime)} hours
              </Text>
            </View>

            <View style={styles(theme).modalButtons}>
              <TouchableOpacity
                style={styles(theme).cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setNewShiftName('');
                  setStartTime('09:00');
                  setEndTime('17:00');
                }}
                disabled={loading}
              >
                <Text style={styles(theme).cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles(theme).confirmButton, loading && styles(theme).confirmButtonLoading]}
                onPress={handleAddShift}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Ionicons name="checkmark-circle" size={20} color="#000" />
                )}
                <Text style={styles(theme).confirmButtonText}>
                  {loading ? t('shifts.creating') : t('shifts.createPreset')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Shift Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles(theme).modalOverlay}
        >
          <View style={styles(theme).modalContent}>
            <View style={styles(theme).modalHeader}>
              <View style={styles(theme).modalIconContainer}>
                <Ionicons name="create" size={24} color={theme.primary} />
              </View>
              <Text style={styles(theme).modalTitle}>{t('shifts.editModal.title')}</Text>
              <Text style={styles(theme).modalSubtitle}>
                {t('shifts.editModal.subtitle')}
              </Text>
            </View>

            <View style={styles(theme).inputContainer}>
              <Ionicons name="text-outline" size={20} color={theme.textSecondary} style={styles(theme).inputIcon} />
              <TextInput
                style={styles(theme).input}
                placeholder={t('shifts.editModal.namePlaceholder')}
                placeholderTextColor={theme.textSecondary}
                value={selectedShift?.name}
                onChangeText={(text) => setSelectedShift({ ...selectedShift, name: text })}
                editable={!loading}
              />
            </View>

            <View style={styles(theme).timePickersRow}>
              <View style={styles(theme).timePickerContainer}>
                <Text style={styles(theme).timeLabel}>Start Time</Text>
                <View style={styles(theme).pickerWrapper}>
                  <Picker
                    selectedValue={selectedShift?.startTime || '09:00'}
                    onValueChange={(value) => setSelectedShift({ ...selectedShift, startTime: value })}
                    style={styles(theme).picker}
                    dropdownIconColor={theme.text}
                    enabled={!loading}
                  >
                    {timeOptions.map((time) => (
                      <Picker.Item key={time} label={time} value={time} color={theme.text} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles(theme).timePickerContainer}>
                <Text style={styles(theme).timeLabel}>End Time</Text>
                <View style={styles(theme).pickerWrapper}>
                  <Picker
                    selectedValue={selectedShift?.endTime || '17:00'}
                    onValueChange={(value) => setSelectedShift({ ...selectedShift, endTime: value })}
                    style={styles(theme).picker}
                    dropdownIconColor={theme.text}
                    enabled={!loading}
                  >
                    {timeOptions.map((time) => (
                      <Picker.Item key={time} label={time} value={time} color={theme.text} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {selectedShift && (
              <View style={styles(theme).hoursPreview}>
                <Ionicons name="time" size={16} color={theme.primary} />
                <Text style={styles(theme).hoursPreviewText}>
                  Total: {calculateHours(selectedShift.startTime, selectedShift.endTime)} hours
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles(theme).saveButton, loading && styles(theme).saveButtonLoading]}
              onPress={handleSaveShift}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Ionicons name="checkmark-circle" size={20} color="#000" />
              )}
              <Text style={styles(theme).saveButtonText}>
                {loading ? t('shifts.saving') : t('shifts.saveChanges')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles(theme).deleteButton}
              onPress={() => handleDeleteShift(selectedShift)}
              disabled={loading}
            >
              <Ionicons name="trash-outline" size={18} color={theme.error} />
              <Text style={styles(theme).deleteButtonText}>{t('shifts.deletePreset')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles(theme).closeButton}
              onPress={() => setShowEditModal(false)}
              disabled={loading}
            >
              <Text style={styles(theme).closeButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  section: {
    backgroundColor: theme.background,
    marginBottom: 24,
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
  shiftsList: {
    padding: 16,
    maxHeight: 400,
  },
  shiftCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  shiftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shiftIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  shiftDetails: {
    flex: 1,
  },
  shiftName: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeRangeText: {
    color: theme.textSecondary,
    fontSize: 14,
    marginBottom: 6,
  },
  hoursBadge: {
    flexDirection: 'row',
    backgroundColor: theme.surface2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#2a4a2a',
  },
  shiftHours: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '600',
  },
  timePickersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  timePickerContainer: {
    flex: 1,
  },
  timeLabel: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: theme.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  picker: {
    color: theme.text,
    backgroundColor: theme.background,
  },
  hoursPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: theme.primaryDark,
    borderRadius: 10,
    marginBottom: 16,
  },
  hoursPreviewText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
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
    marginTop: 8,
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
  saveButton: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: theme.primary,
    marginTop: 8,
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
    backgroundColor: theme.secondary,
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
