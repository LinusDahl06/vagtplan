import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TouchableWithoutFeedback, Modal, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getEmployeeColor, getColorWithAlpha, getVibrantColor } from '../utils/employeeColors';
import { calculateHours, formatTimeRange, generateTimeOptions } from '../utils/timeUtils';
import { createShiftSwapRequest } from '../utils/shiftSwapService';
import OptimizedImage from './OptimizedImage';
import ShiftNotesModal from './ShiftNotesModal';

export default function CalendarView({ workspace, onWorkspaceUpdate }) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeek());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [showEditShiftModal, setShowEditShiftModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedShiftPreset, setSelectedShiftPreset] = useState(null);
  const [customStartTime, setCustomStartTime] = useState('09:00');
  const [customEndTime, setCustomEndTime] = useState('17:00');
  const [editingScheduleItem, setEditingScheduleItem] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showManagePresetsModal, setShowManagePresetsModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [showDayShiftsModal, setShowDayShiftsModal] = useState(false);
  const [selectedDayShifts, setSelectedDayShifts] = useState([]);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [isShiftDropdownOpen, setIsShiftDropdownOpen] = useState(false);
  const [isEditShiftDropdownOpen, setIsEditShiftDropdownOpen] = useState(false);
  const [editSelectedShiftPreset, setEditSelectedShiftPreset] = useState(null);
  const [isStartTimeDropdownOpen, setIsStartTimeDropdownOpen] = useState(false);
  const [isEndTimeDropdownOpen, setIsEndTimeDropdownOpen] = useState(false);
  const [isAddStartTimeDropdownOpen, setIsAddStartTimeDropdownOpen] = useState(false);
  const [isAddEndTimeDropdownOpen, setIsAddEndTimeDropdownOpen] = useState(false);
  const [showShiftSwapModal, setShowShiftSwapModal] = useState(false);
  const [selectedShiftForSwap, setSelectedShiftForSwap] = useState(null);
  const [swapMessage, setSwapMessage] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedShiftForNotes, setSelectedShiftForNotes] = useState(null);

  const scrollViewRef = React.useRef(null);
  const todayCardRef = React.useRef(null);

  const timeOptions = generateTimeOptions();

  // Check permissions
  const isOwner = workspace.ownerId === auth.currentUser.uid;
  const currentUserEmployee = workspace.employees.find(emp => emp.userId === auth.currentUser.uid);
  const currentUserRole = workspace.roles.find(r => r.id === currentUserEmployee?.roleId);
  const canManageSchedule = isOwner || currentUserRole?.permissions.includes('manage_schedule');

  // Fetch owner information
  useEffect(() => {
    const fetchOwnerInfo = async () => {
      try {
        const ownerDoc = await getDoc(doc(db, 'users', workspace.ownerId));
        if (ownerDoc.exists()) {
          setOwnerInfo(ownerDoc.data());
        }
      } catch (error) {
        console.error('Error fetching owner info:', error);
      }
    };

    fetchOwnerInfo();
  }, [workspace.ownerId]);

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

  // Auto-scroll to today's date on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (todayCardRef.current && scrollViewRef.current) {
        todayCardRef.current.measureLayout(
          scrollViewRef.current,
          (_x, y) => {
            scrollViewRef.current.scrollTo({ y: y - 20, animated: true });
          },
          () => {}
        );
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentWeek, viewMode]);

  function getCurrentWeek() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));

    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      week.push(date);
    }
    return week;
  }

  function getMonthDays(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days = [];

    // Add previous month's trailing days
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, currentMonth: false });
    }

    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, currentMonth: true });
    }

    // Add next month's leading days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, currentMonth: false });
    }

    return days;
  }

  const goToPreviousWeek = () => {
    const newWeek = currentWeek.map(date => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() - 7);
      return newDate;
    });
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = currentWeek.map(date => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + 7);
      return newDate;
    });
    setCurrentWeek(newWeek);
  };

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const goToToday = () => {
    if (viewMode === 'week') {
      setCurrentWeek(getCurrentWeek());
    } else {
      setCurrentMonth(new Date());
    }
  };

  const formatFullDate = (date) => {
    const locale = i18n.language === 'da' ? 'da-DK' : 'en-US';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatMonthYear = (date) => {
    const locale = i18n.language === 'da' ? 'da-DK' : 'en-US';
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  // Helper function to handle shift names that might be translation keys
  const getTranslatedShiftName = (shiftName) => {
    // If the shift name looks like a translation key (contains dots), try to translate it
    if (shiftName && shiftName.includes('.')) {
      const translated = t(shiftName);
      // If translation returns the same key, it means translation doesn't exist, return original
      return translated !== shiftName ? translated : shiftName;
    }
    // Otherwise, return the shift name as is (it's already a display name)
    return shiftName;
  };

  // Helper function to convert Date to YYYY-MM-DD string in local timezone
  const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getScheduleForDate = (date) => {
    const dateString = formatDateToString(date);
    return workspace.schedule?.filter(s => s.date === dateString) || [];
  };

  const getAvailableEmployees = (date) => {
    if (!date) return [];

    const dateString = formatDateToString(date);
    const scheduledEmployeeIds = workspace.schedule
      ?.filter(s => s.date === dateString)
      .map(s => s.employeeId) || [];

    const allEmployees = [...workspace.employees];
    const ownerInEmployees = workspace.employees.some(emp => emp.userId === workspace.ownerId);

    if (!ownerInEmployees && ownerInfo) {
      allEmployees.unshift({
        userId: workspace.ownerId,
        name: ownerInfo.name,
        username: ownerInfo.username,
        email: ownerInfo.email,
        photoURL: ownerInfo.photoURL || null,
        roleId: '1'
      });
    }

    return allEmployees.filter(emp => !scheduledEmployeeIds.includes(emp.userId));
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

    // Ensure all employees have colors
    return allEmployees.map(emp => ({
      ...emp,
      color: emp.color || getEmployeeColor(emp.userId)
    }));
  };

  const getShiftEmployeeColor = (shift) => {
    const allEmployees = getAllEmployeesIncludingOwner();
    const employee = allEmployees.find(e => e.userId === shift.employeeId);
    return employee?.color || getEmployeeColor(shift.employeeId);
  };

  const handleOpenAddShift = (date) => {
    setSelectedDate(date);
    setSelectedEmployee(null);
    setSelectedShiftPreset(null);
    setCustomStartTime('09:00');
    setCustomEndTime('17:00');
    setIsEmployeeDropdownOpen(false);
    setIsShiftDropdownOpen(false);
    setShowAddShiftModal(true);
  };

  const handleAddShift = async () => {
    if (!selectedEmployee) {
      Alert.alert(t('common.error'), t('calendar.errors.selectEmployee'));
      return;
    }

    let hours, startTime, endTime, shiftId, shiftName;

    if (selectedShiftPreset) {
      hours = selectedShiftPreset.hours;
      startTime = selectedShiftPreset.startTime;
      endTime = selectedShiftPreset.endTime;
      shiftId = selectedShiftPreset.id;
      shiftName = selectedShiftPreset.name;
    } else {
      hours = calculateHours(customStartTime, customEndTime);
      if (hours <= 0) {
        Alert.alert(t('common.error'), 'End time must be after start time');
        return;
      }
      startTime = customStartTime;
      endTime = customEndTime;
      shiftId = null;
      shiftName = t('calendar.customShift');
    }

    try {
      const dateString = formatDateToString(selectedDate);

      // Check if employee is already scheduled on this date
      const existingShift = workspace.schedule?.find(
        s => s.date === dateString && s.employeeId === selectedEmployee.userId
      );

      if (existingShift) {
        Alert.alert(
          t('calendar.duplicateShift.title'),
          t('calendar.duplicateShift.message', { name: selectedEmployee.name }),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('calendar.duplicateShift.replace'),
              onPress: async () => {
                // Remove existing shift and add new one
                const filteredSchedule = workspace.schedule.filter(s => s.id !== existingShift.id);
                const newScheduleItem = {
                  id: Date.now().toString(),
                  date: dateString,
                  employeeId: selectedEmployee.userId,
                  employeeName: selectedEmployee.name,
                  shiftId: shiftId,
                  shiftName: shiftName,
                  startTime: startTime,
                  endTime: endTime,
                  hours: hours
                };

                const updatedSchedule = [...filteredSchedule, newScheduleItem];

                await updateDoc(doc(db, 'workspaces', workspace.id), {
                  schedule: updatedSchedule
                });

                if (onWorkspaceUpdate) {
                  onWorkspaceUpdate({ ...workspace, schedule: updatedSchedule });
                }

                setShowAddShiftModal(false);
              }
            }
          ]
        );
        return;
      }

      const newScheduleItem = {
        id: Date.now().toString(),
        date: dateString,
        employeeId: selectedEmployee.userId,
        employeeName: selectedEmployee.name,
        shiftId: shiftId,
        shiftName: shiftName,
        startTime: startTime,
        endTime: endTime,
        hours: hours
      };

      const updatedSchedule = [...(workspace.schedule || []), newScheduleItem];

      await updateDoc(doc(db, 'workspaces', workspace.id), {
        schedule: updatedSchedule
      });

      if (onWorkspaceUpdate) {
        onWorkspaceUpdate({ ...workspace, schedule: updatedSchedule });
      }

      setShowAddShiftModal(false);

    } catch (error) {
      console.error('Error adding shift:', error);
      Alert.alert(t('common.error'), t('calendar.errors.addShift'));
    }
  };

  const handleOpenEditShift = (scheduleItem) => {
    setEditingScheduleItem(scheduleItem);
    const allEmployees = getAllEmployeesIncludingOwner();
    const employee = allEmployees.find(e => e.userId === scheduleItem.employeeId);
    setSelectedEmployee(employee);

    // Try to match current shift to a preset, otherwise use custom times
    const matchingPreset = workspace.shifts.find(
      s => s.startTime === scheduleItem.startTime && s.endTime === scheduleItem.endTime
    );
    setEditSelectedShiftPreset(matchingPreset || null);
    setIsEditShiftDropdownOpen(false);
    setIsStartTimeDropdownOpen(false);
    setIsEndTimeDropdownOpen(false);
    setCustomStartTime(scheduleItem.startTime || '09:00');
    setCustomEndTime(scheduleItem.endTime || '17:00');

    setShowEditShiftModal(true);
  };

  const handleUpdateShift = async () => {
    if (!selectedEmployee) {
      Alert.alert(t('common.error'), t('calendar.errors.selectEmployee'));
      return;
    }

    let hours, startTime, endTime, shiftId, shiftName;

    if (editSelectedShiftPreset) {
      hours = editSelectedShiftPreset.hours;
      startTime = editSelectedShiftPreset.startTime;
      endTime = editSelectedShiftPreset.endTime;
      shiftId = editSelectedShiftPreset.id;
      shiftName = editSelectedShiftPreset.name;
    } else {
      hours = calculateHours(customStartTime, customEndTime);
      if (hours <= 0) {
        Alert.alert(t('common.error'), 'End time must be after start time');
        return;
      }
      startTime = customStartTime;
      endTime = customEndTime;
      shiftId = null;
      shiftName = t('calendar.customShift');
    }

    try {
      const updatedSchedule = workspace.schedule.map(item =>
        item.id === editingScheduleItem.id
          ? {
              ...item,
              employeeId: selectedEmployee.userId,
              employeeName: selectedEmployee.name,
              shiftId: shiftId,
              shiftName: shiftName,
              startTime: startTime,
              endTime: endTime,
              hours: hours
            }
          : item
      );

      await updateDoc(doc(db, 'workspaces', workspace.id), {
        schedule: updatedSchedule
      });

      if (onWorkspaceUpdate) {
        onWorkspaceUpdate({ ...workspace, schedule: updatedSchedule });
      }

      setShowEditShiftModal(false);
      setEditSelectedShiftPreset(null);
      setIsEditShiftDropdownOpen(false);
      setIsStartTimeDropdownOpen(false);
      setIsEndTimeDropdownOpen(false);
    } catch (error) {
      console.error('Error updating shift:', error);
      Alert.alert(t('common.error'), t('calendar.errors.updateShift'));
    }
  };

  const handleDeleteShift = (scheduleItem) => {
    Alert.alert(
      t('calendar.removeShift.title'),
      t('calendar.removeShift.message', { name: scheduleItem.employeeName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('calendar.removeShift.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedSchedule = workspace.schedule.filter(item => item.id !== scheduleItem.id);

              await updateDoc(doc(db, 'workspaces', workspace.id), {
                schedule: updatedSchedule
              });

              if (onWorkspaceUpdate) {
                onWorkspaceUpdate({ ...workspace, schedule: updatedSchedule });
              }

              setShowEditShiftModal(false);
            } catch (error) {
              console.error('Error deleting shift:', error);
              Alert.alert(t('common.error'), t('calendar.errors.removeShift'));
            }
          }
        }
      ]
    );
  };

  // Notes handlers
  const handleOpenNotes = (shift) => {
    setSelectedShiftForNotes(shift);
    setShowNotesModal(true);
  };

  const handleSaveNotes = async (shift, updatedNotes) => {
    try {
      const updatedSchedule = workspace.schedule.map(item =>
        item.id === shift.id ? { ...item, notes: updatedNotes } : item
      );

      await updateDoc(doc(db, 'workspaces', workspace.id), {
        schedule: updatedSchedule
      });

      if (onWorkspaceUpdate) {
        onWorkspaceUpdate({ ...workspace, schedule: updatedSchedule });
      }

      // Update the selected shift for notes to reflect changes
      setSelectedShiftForNotes({ ...shift, notes: updatedNotes });
    } catch (error) {
      console.error('Error saving notes:', error);
      throw error;
    }
  };

  // Schedule Preset Functions
  const getMonthSchedule = (month, year) => {
    // Get all shifts for the specified month
    return workspace.schedule?.filter(s => {
      const shiftDate = new Date(s.date);
      return shiftDate.getMonth() === month && shiftDate.getFullYear() === year;
    }) || [];
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      Alert.alert(t('common.error'), t('calendar.presets.errors.enterName'));
      return;
    }

    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    const monthSchedule = getMonthSchedule(month, year);

    if (monthSchedule.length === 0) {
      Alert.alert(t('common.error'), t('calendar.presets.errors.noShifts'));
      return;
    }

    // Convert schedule to pattern-based format (day of week + shift info)
    const patternMap = new Map();

    monthSchedule.forEach(shift => {
      const shiftDate = new Date(shift.date);
      const dayOfWeek = shiftDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Create a unique key: dayOfWeek + employeeId + shiftId + hours
      // This ensures we only store one pattern per employee per day of week
      const key = `${dayOfWeek}-${shift.employeeId}-${shift.shiftId || 'custom'}-${shift.hours}`;

      if (!patternMap.has(key)) {
        patternMap.set(key, {
          dayOfWeek: dayOfWeek,
          employeeId: shift.employeeId,
          employeeName: shift.employeeName,
          shiftId: shift.shiftId,
          shiftName: shift.shiftName,
          hours: shift.hours
        });
      }
    });

    // Convert map to array
    const pattern = Array.from(patternMap.values());

    const newPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      pattern: pattern,
      createdAt: new Date().toISOString(),
      createdBy: auth.currentUser.uid
    };

    try {
      const updatedPresets = [...(workspace.schedulePresets || []), newPreset];

      await updateDoc(doc(db, 'workspaces', workspace.id), {
        schedulePresets: updatedPresets
      });

      if (onWorkspaceUpdate) {
        onWorkspaceUpdate({ ...workspace, schedulePresets: updatedPresets });
      }

      Alert.alert(t('common.success'), t('calendar.presets.success.saved', { name: presetName }));
      setPresetName('');
      setShowPresetModal(false);
    } catch (error) {
      console.error('Error saving preset:', error);
      Alert.alert(t('common.error'), t('calendar.presets.errors.save'));
    }
  };

  const handleApplyPreset = async (preset) => {
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();

    // Get all days in the target month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const newShiftsMap = new Map(); // Use Map to prevent duplicates

    // Iterate through each day of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay();
      const dateString = formatDateToString(currentDate);

      // Find all shifts in the preset for this day of week
      const shiftsForDay = preset.pattern.filter(p => p.dayOfWeek === dayOfWeek);

      shiftsForDay.forEach(patternShift => {
        // Create unique key: date + employeeId to prevent same employee being scheduled twice on same day
        const uniqueKey = `${dateString}-${patternShift.employeeId}`;

        if (!newShiftsMap.has(uniqueKey)) {
          newShiftsMap.set(uniqueKey, {
            id: `${Date.now()}-${day}-${patternShift.employeeId}-${Math.random()}`,
            date: dateString,
            employeeId: patternShift.employeeId,
            employeeName: patternShift.employeeName,
            shiftId: patternShift.shiftId,
            shiftName: patternShift.shiftName,
            hours: patternShift.hours
          });
        }
      });
    }

    const newShifts = Array.from(newShiftsMap.values());

    if (newShifts.length === 0) {
      Alert.alert(t('common.error'), t('calendar.presets.errors.noShiftsToApply'));
      return;
    }

    Alert.alert(
      t('calendar.presets.applyConfirm.title'),
      t('calendar.presets.applyConfirm.message', { count: newShifts.length, month: formatMonthYear(currentMonth) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('calendar.presets.applyConfirm.apply'),
          onPress: async () => {
            try {
              // Remove existing shifts for the target month before applying preset
              const existingSchedule = workspace.schedule?.filter(s => {
                const shiftDate = new Date(s.date);
                return !(shiftDate.getMonth() === month && shiftDate.getFullYear() === year);
              }) || [];

              const updatedSchedule = [...existingSchedule, ...newShifts];

              await updateDoc(doc(db, 'workspaces', workspace.id), {
                schedule: updatedSchedule
              });

              if (onWorkspaceUpdate) {
                onWorkspaceUpdate({ ...workspace, schedule: updatedSchedule });
              }

              Alert.alert(t('common.success'), t('calendar.presets.success.applied', { month: formatMonthYear(currentMonth) }));
              setShowManagePresetsModal(false);
            } catch (error) {
              console.error('Error applying preset:', error);
              Alert.alert(t('common.error'), t('calendar.presets.errors.apply'));
            }
          }
        }
      ]
    );
  };

  const handleDeletePreset = (preset) => {
    Alert.alert(
      t('calendar.presets.deleteConfirm.title'),
      t('calendar.presets.deleteConfirm.message', { name: preset.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedPresets = workspace.schedulePresets.filter(p => p.id !== preset.id);

              await updateDoc(doc(db, 'workspaces', workspace.id), {
                schedulePresets: updatedPresets
              });

              if (onWorkspaceUpdate) {
                onWorkspaceUpdate({ ...workspace, schedulePresets: updatedPresets });
              }

              Alert.alert(t('common.success'), t('calendar.presets.success.deleted'));
            } catch (error) {
              console.error('Error deleting preset:', error);
              Alert.alert(t('common.error'), t('calendar.presets.errors.delete'));
            }
          }
        }
      ]
    );
  };

  const handleShiftLongPress = (schedule) => {
    // Only allow swapping your own shifts
    if (schedule.employeeId !== auth.currentUser.uid) {
      Alert.alert(t('shiftSwap.error'), t('shiftSwap.canOnlySwapOwnShifts'));
      return;
    }

    setSelectedShiftForSwap(schedule);
    setSwapMessage('');
    setShowShiftSwapModal(true);
  };

  const handleCreateShiftSwap = async () => {
    if (!selectedShiftForSwap) return;

    try {
      const result = await createShiftSwapRequest({
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        myShift: selectedShiftForSwap,
        targetEmployeeId: null,
        targetEmployeeName: '',
        message: swapMessage
      });

      if (result.success) {
        Alert.alert(t('common.success'), t('shiftSwap.requestCreated'));
        setShowShiftSwapModal(false);
        setSelectedShiftForSwap(null);
        setSwapMessage('');
      } else {
        Alert.alert(t('common.error'), result.error || t('shiftSwap.errorCreatingRequest'));
      }
    } catch (error) {
      console.error('Error creating shift swap:', error);
      Alert.alert(t('common.error'), t('shiftSwap.errorCreatingRequest'));
    }
  };

  const renderWeekView = () => (
    <ScrollView ref={scrollViewRef} style={styles(theme).scrollableContent} showsVerticalScrollIndicator={false}>
      {currentWeek.map((date, index) => {
        const schedules = getScheduleForDate(date);
        const today = isToday(date);

        return (
          <View key={index} ref={today ? todayCardRef : null} style={[styles(theme).dayCard, today && styles(theme).todayCard]}>
            <View style={styles(theme).dayHeaderContainer}>
              <Text style={[styles(theme).dayDate, today && styles(theme).todayText]}>
                {formatFullDate(date)}
              </Text>
              {today && <View style={styles(theme).todayBadge}><Text style={styles(theme).todayBadgeText}>{t('calendar.today')}</Text></View>}
            </View>

            <View style={styles(theme).scheduleList}>
              {schedules.length === 0 ? (
                <View style={styles(theme).emptySchedule}>
                  <Text style={styles(theme).emptyScheduleText}>{t('calendar.noShiftsScheduled')}</Text>
                </View>
              ) : (
                schedules.map((schedule, idx) => {
                  const employeeColor = getShiftEmployeeColor(schedule);
                  const isCurrentUser = schedule.employeeId === auth.currentUser.uid;
                  const displayColor = isCurrentUser ? getVibrantColor(employeeColor) : employeeColor;
                  const timeRange = schedule.startTime && schedule.endTime
                    ? formatTimeRange(schedule.startTime, schedule.endTime)
                    : null;

                  const notesCount = schedule.notes?.length || 0;

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles(theme).scheduleItem,
                        {
                          backgroundColor: getColorWithAlpha(employeeColor, 0.15, isCurrentUser),
                          borderLeftWidth: 6,
                          borderLeftColor: displayColor
                        }
                      ]}
                      onPress={() => canManageSchedule && handleOpenEditShift(schedule)}
                      onLongPress={() => handleShiftLongPress(schedule)}
                    >
                      <View style={styles(theme).scheduleInfo}>
                        <Text style={[styles(theme).employeeName, { color: theme.text }]}>
                          {schedule.employeeName}
                        </Text>
                        {timeRange && (
                          <Text style={styles(theme).timeRangeText}>{timeRange}</Text>
                        )}
                        <Text style={styles(theme).shiftName}>{getTranslatedShiftName(schedule.shiftName)}</Text>
                      </View>
                      <View style={styles(theme).shiftRightSection}>
                        <TouchableOpacity
                          style={styles(theme).notesButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleOpenNotes(schedule);
                          }}
                        >
                          <Ionicons
                            name={notesCount > 0 ? "create" : "create-outline"}
                            size={18}
                            color={notesCount > 0 ? theme.primary : theme.textSecondary}
                          />
                          {notesCount > 0 && (
                            <View style={styles(theme).notesBadge}>
                              <Text style={styles(theme).notesBadgeText}>{notesCount}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                        <View style={styles(theme).hoursContainer}>
                          <Text style={styles(theme).shiftHours}>{schedule.hours}h</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              {canManageSchedule && (
                <TouchableOpacity
                  style={styles(theme).addShiftButton}
                  onPress={() => handleOpenAddShift(date)}
                >
                  <Text style={styles(theme).addShiftText}>{t('calendar.addShift')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderMonthView = () => {
    const monthDays = getMonthDays(currentMonth);
    const weekDays = [
      t('calendar.days.monday'),
      t('calendar.days.tuesday'),
      t('calendar.days.wednesday'),
      t('calendar.days.thursday'),
      t('calendar.days.friday'),
      t('calendar.days.saturday'),
      t('calendar.days.sunday')
    ];

    return (
      <ScrollView style={styles(theme).scrollableContent} contentContainerStyle={styles(theme).monthContainer} showsVerticalScrollIndicator={false}>
        {/* Weekday headers */}
        <View style={styles(theme).weekdayHeader}>
          {weekDays.map((day, i) => (
            <View key={i} style={styles(theme).weekdayCell}>
              <Text style={styles(theme).weekdayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles(theme).monthGrid}>
          {monthDays.map((dayInfo, index) => {
            const schedules = getScheduleForDate(dayInfo.date);
            const today = isToday(dayInfo.date);
            const hasShifts = schedules.length > 0;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles(theme).monthDayCell,
                  !dayInfo.currentMonth && styles(theme).monthDayCellOtherMonth,
                  today && styles(theme).monthDayCellToday
                ]}
                onPress={() => {
                  if (hasShifts) {
                    // Show shifts for this day
                    setSelectedDayShifts(schedules);
                    setShowDayShiftsModal(true);
                  } else if (canManageSchedule) {
                    // Open add shift modal only if user has permission
                    handleOpenAddShift(dayInfo.date);
                  }
                }}
                activeOpacity={0.7}
                disabled={!hasShifts && !canManageSchedule}
              >
                <Text style={[
                  styles(theme).monthDayNumber,
                  !dayInfo.currentMonth && styles(theme).monthDayNumberOtherMonth,
                  today && styles(theme).monthDayNumberToday
                ]}>
                  {dayInfo.date.getDate()}
                </Text>
                {hasShifts && (
                  <View style={styles(theme).shiftDots}>
                    {schedules.slice(0, 3).map((schedule, i) => {
                      const employee = getAllEmployeesIncludingOwner().find(emp => emp.userId === schedule.employeeId);
                      const dotColor = employee?.color || theme.primary;
                      return (
                        <View key={i} style={[styles(theme).shiftDot, { backgroundColor: dotColor }]} />
                      );
                    })}
                    {schedules.length > 3 && (
                      <Text style={styles(theme).shiftDotText}>+{schedules.length - 3}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles(theme).container}>
      {/* Sticky Header Section */}
      <View>
        {/* Header */}
        <View style={styles(theme).header}>
          <TouchableOpacity
            onPress={viewMode === 'week' ? goToPreviousWeek : goToPreviousMonth}
            style={styles(theme).navButton}
          >
            <Ionicons name="chevron-back" size={24} color={theme.primary} />
          </TouchableOpacity>

          <View style={styles(theme).monthYearContainer}>
            <Text style={styles(theme).monthYearText}>
              {formatMonthYear(viewMode === 'week' ? currentWeek[0] : currentMonth)}
            </Text>
            {viewMode === 'week' && (
              <Text style={styles(theme).weekNumberText}>{t('calendar.week')} {getWeekNumber(currentWeek[0])}</Text>
            )}
            <TouchableOpacity onPress={goToToday} style={styles(theme).todayButton}>
              <Text style={styles(theme).todayButtonText}>{t('calendar.todayButton')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={viewMode === 'week' ? goToNextWeek : goToNextMonth}
            style={styles(theme).navButton}
          >
            <Ionicons name="chevron-forward" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* View Mode Switcher */}
        <View style={styles(theme).viewSwitcher}>
          <TouchableOpacity
            style={[styles(theme).viewButton, viewMode === 'week' && styles(theme).viewButtonActive]}
            onPress={() => setViewMode('week')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="list-outline"
              size={18}
              color={viewMode === 'week' ? '#000' : theme.textSecondary}
            />
            <Text style={[styles(theme).viewButtonText, viewMode === 'week' && styles(theme).viewButtonTextActive]}>
              {t('calendar.viewMode.week')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles(theme).viewButton, viewMode === 'month' && styles(theme).viewButtonActive]}
            onPress={() => setViewMode('month')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={viewMode === 'month' ? '#000' : theme.textSecondary}
            />
            <Text style={[styles(theme).viewButtonText, viewMode === 'month' && styles(theme).viewButtonTextActive]}>
              {t('calendar.viewMode.month')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preset Management Buttons (only in month view and if user has permission) */}
        {viewMode === 'month' && canManageSchedule && (
          <View style={styles(theme).presetActions}>
            <TouchableOpacity
              style={styles(theme).presetActionButton}
              onPress={() => setShowPresetModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="save-outline" size={18} color={theme.primary} />
              <Text style={styles(theme).presetActionText}>{t('calendar.presets.saveAsPreset')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles(theme).presetActionButton}
              onPress={() => setShowManagePresetsModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="albums-outline" size={18} color={theme.primary} />
              <Text style={styles(theme).presetActionText}>{t('calendar.presets.loadPreset')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Scrollable Content */}
      {viewMode === 'week' ? renderWeekView() : renderMonthView()}

      {/* Add Shift Modal */}
      <Modal visible={showAddShiftModal} transparent animationType="slide" onRequestClose={() => {
        setShowAddShiftModal(false);
        setIsAddStartTimeDropdownOpen(false);
        setIsAddEndTimeDropdownOpen(false);
      }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles(theme).modalOverlay}
        >
          <View style={styles(theme).modalContent}>
            <Text style={styles(theme).modalTitle}>{t('calendar.addShiftModal.title')}</Text>
            <Text style={styles(theme).modalSubtitle}>
              {selectedDate && formatFullDate(selectedDate)}
            </Text>

            {/* Employee Selection Dropdown */}
            <Text style={styles(theme).sectionLabel}>{t('calendar.addShiftModal.selectEmployee')}</Text>
            <View style={{ zIndex: isEmployeeDropdownOpen ? 1000 : 1 }}>
              <TouchableOpacity
                style={styles(theme).dropdownButton}
                onPress={() => {
                  setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen);
                  setIsShiftDropdownOpen(false);
                }}
              >
                <View style={styles(theme).dropdownButtonContent}>
                  {selectedEmployee ? (
                    <>
                      {selectedEmployee.photoURL ? (
                        <OptimizedImage uri={selectedEmployee.photoURL} style={styles(theme).avatarSmallImage} />
                      ) : (
                        <View style={styles(theme).avatarSmall}>
                          <Text style={styles(theme).avatarSmallText}>{selectedEmployee.name.charAt(0)}</Text>
                        </View>
                      )}
                      <Text style={styles(theme).dropdownButtonText}>{selectedEmployee.name}</Text>
                    </>
                  ) : (
                    <Text style={styles(theme).dropdownButtonPlaceholder}>{t('calendar.addShiftModal.selectEmployee')}</Text>
                  )}
                </View>
                <Ionicons
                  name={isEmployeeDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>

              {isEmployeeDropdownOpen && (
                <View style={styles(theme).dropdownListContainer}>
                  <ScrollView style={styles(theme).dropdownList} nestedScrollEnabled={true}>
                    {selectedDate && getAvailableEmployees(selectedDate).length === 0 ? (
                      <Text style={styles(theme).noEmployeesText}>{t('calendar.addShiftModal.allEmployeesScheduled')}</Text>
                    ) : (
                      selectedDate && getAvailableEmployees(selectedDate).map((employee) => (
                        <TouchableOpacity
                          key={employee.userId}
                          style={[
                            styles(theme).employeeOption,
                            selectedEmployee?.userId === employee.userId && styles(theme).employeeOptionSelected
                          ]}
                          onPress={() => {
                            setSelectedEmployee(employee);
                            setIsEmployeeDropdownOpen(false);
                          }}
                        >
                          {employee.photoURL ? (
                            <OptimizedImage uri={employee.photoURL} style={styles(theme).avatarSmallImage} />
                          ) : (
                            <View style={styles(theme).avatarSmall}>
                              <Text style={styles(theme).avatarSmallText}>{employee.name.charAt(0)}</Text>
                            </View>
                          )}
                          <Text style={[
                            styles(theme).employeeOptionText,
                            selectedEmployee?.userId === employee.userId && styles(theme).employeeOptionTextSelected
                          ]}>
                            {employee.name}
                          </Text>
                          {selectedEmployee?.userId === employee.userId && (
                            <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Shift Selection Dropdown */}
            <Text style={styles(theme).sectionLabel}>{t('calendar.addShiftModal.selectShiftDuration')}</Text>
            <View style={{ zIndex: isShiftDropdownOpen ? 1000 : 1 }}>
              <TouchableOpacity
                style={styles(theme).dropdownButton}
                onPress={() => {
                  setIsShiftDropdownOpen(!isShiftDropdownOpen);
                  setIsEmployeeDropdownOpen(false);
                  setIsAddStartTimeDropdownOpen(false);
                  setIsAddEndTimeDropdownOpen(false);
                }}
              >
                <View style={styles(theme).dropdownButtonContent}>
                  {selectedShiftPreset ? (
                    <View style={{ flex: 1 }}>
                      <Text style={styles(theme).dropdownButtonText}>{selectedShiftPreset.name}</Text>
                      {selectedShiftPreset.startTime && selectedShiftPreset.endTime && (
                        <Text style={styles(theme).dropdownButtonSubtext}>
                          {formatTimeRange(selectedShiftPreset.startTime, selectedShiftPreset.endTime)} • {selectedShiftPreset.hours}h
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles(theme).dropdownButtonPlaceholder}>{t('calendar.addShiftModal.selectShiftDuration')}</Text>
                  )}
                </View>
                <Ionicons
                  name={isShiftDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>

              {isShiftDropdownOpen && (
                <View style={styles(theme).dropdownListContainer}>
                  <ScrollView style={styles(theme).dropdownList} nestedScrollEnabled={true}>
                    {workspace.shifts.map((shift) => {
                      const timeRange = shift.startTime && shift.endTime
                        ? formatTimeRange(shift.startTime, shift.endTime)
                        : null;

                      return (
                        <TouchableOpacity
                          key={shift.id}
                          style={[
                            styles(theme).shiftOption,
                            selectedShiftPreset?.id === shift.id && styles(theme).shiftOptionSelected
                          ]}
                          onPress={() => {
                            setSelectedShiftPreset(shift);
                            // Update custom times to match the preset
                            if (shift.startTime) setCustomStartTime(shift.startTime);
                            if (shift.endTime) setCustomEndTime(shift.endTime);
                            setIsShiftDropdownOpen(false);
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[
                              styles(theme).shiftOptionText,
                              selectedShiftPreset?.id === shift.id && styles(theme).shiftOptionTextSelected
                            ]}>
                              {shift.name}
                            </Text>
                            {timeRange && (
                              <Text style={[
                                styles(theme).shiftOptionSubtext,
                                selectedShiftPreset?.id === shift.id && styles(theme).shiftOptionSubtextSelected
                              ]}>
                                {timeRange} • {shift.hours}h
                              </Text>
                            )}
                          </View>
                          {selectedShiftPreset?.id === shift.id && (
                            <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            <Text style={styles(theme).orText}>{t('calendar.addShiftModal.or')}</Text>

            {/* Time Dropdowns */}
            <View style={styles(theme).timeDropdownsRow}>
              {/* Start Time Dropdown */}
              <View style={[styles(theme).timeDropdownContainer, { zIndex: isAddStartTimeDropdownOpen ? 1000 : 1 }]}>
                <Text style={styles(theme).timeLabel}>Start</Text>
                <TouchableOpacity
                  style={styles(theme).timeDropdownButton}
                  onPress={() => {
                    setIsAddStartTimeDropdownOpen(!isAddStartTimeDropdownOpen);
                    setIsAddEndTimeDropdownOpen(false);
                    setIsShiftDropdownOpen(false);
                    setIsEmployeeDropdownOpen(false);
                  }}
                >
                  <Text style={styles(theme).timeDropdownText}>{customStartTime}</Text>
                  <Ionicons
                    name={isAddStartTimeDropdownOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
                {isAddStartTimeDropdownOpen && (
                  <View style={styles(theme).timeDropdownList}>
                    <ScrollView style={styles(theme).timeDropdownScroll} nestedScrollEnabled={true}>
                      {timeOptions.map((time) => (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles(theme).timeDropdownItem,
                            customStartTime === time && styles(theme).timeDropdownItemSelected
                          ]}
                          onPress={() => {
                            setCustomStartTime(time);
                            setSelectedShiftPreset(null);
                            setIsAddStartTimeDropdownOpen(false);
                          }}
                        >
                          <Text style={[
                            styles(theme).timeDropdownItemText,
                            customStartTime === time && styles(theme).timeDropdownItemTextSelected
                          ]}>
                            {time}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Hours Preview in middle */}
              <View style={styles(theme).hoursPreviewCompact}>
                <Ionicons name="time-outline" size={14} color={theme.primary} />
                <Text style={styles(theme).hoursPreviewCompactText}>
                  {calculateHours(customStartTime, customEndTime)}h
                </Text>
              </View>

              {/* End Time Dropdown */}
              <View style={[styles(theme).timeDropdownContainer, { zIndex: isAddEndTimeDropdownOpen ? 1000 : 1 }]}>
                <Text style={styles(theme).timeLabel}>End</Text>
                <TouchableOpacity
                  style={styles(theme).timeDropdownButton}
                  onPress={() => {
                    setIsAddEndTimeDropdownOpen(!isAddEndTimeDropdownOpen);
                    setIsAddStartTimeDropdownOpen(false);
                    setIsShiftDropdownOpen(false);
                    setIsEmployeeDropdownOpen(false);
                  }}
                >
                  <Text style={styles(theme).timeDropdownText}>{customEndTime}</Text>
                  <Ionicons
                    name={isAddEndTimeDropdownOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
                {isAddEndTimeDropdownOpen && (
                  <View style={styles(theme).timeDropdownList}>
                    <ScrollView style={styles(theme).timeDropdownScroll} nestedScrollEnabled={true}>
                      {timeOptions.map((time) => (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles(theme).timeDropdownItem,
                            customEndTime === time && styles(theme).timeDropdownItemSelected
                          ]}
                          onPress={() => {
                            setCustomEndTime(time);
                            setSelectedShiftPreset(null);
                            setIsAddEndTimeDropdownOpen(false);
                          }}
                        >
                          <Text style={[
                            styles(theme).timeDropdownItemText,
                            customEndTime === time && styles(theme).timeDropdownItemTextSelected
                          ]}>
                            {time}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            <View style={styles(theme).modalButtons}>
              <TouchableOpacity
                style={styles(theme).cancelButton}
                onPress={() => {
                  setShowAddShiftModal(false);
                  setIsAddStartTimeDropdownOpen(false);
                  setIsAddEndTimeDropdownOpen(false);
                }}
              >
                <Text style={styles(theme).cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles(theme).confirmButton}
                onPress={handleAddShift}
              >
                <Text style={styles(theme).confirmButtonText}>{t('calendar.addShiftModal.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Shift Modal */}
      <Modal visible={showEditShiftModal} transparent animationType="slide" onRequestClose={() => {
        setShowEditShiftModal(false);
        setEditSelectedShiftPreset(null);
        setIsEditShiftDropdownOpen(false);
        setIsStartTimeDropdownOpen(false);
        setIsEndTimeDropdownOpen(false);
      }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles(theme).modalOverlay}
        >
          <View style={styles(theme).modalContent}>
            {/* Header with close button */}
            <View style={styles(theme).modalHeader}>
              <View>
                <Text style={styles(theme).modalTitle}>{t('calendar.editShiftModal.title')}</Text>
                <Text style={styles(theme).modalSubtitle}>
                  {editingScheduleItem && new Date(editingScheduleItem.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
              <TouchableOpacity
                style={styles(theme).modalCloseButton}
                onPress={() => {
                  setShowEditShiftModal(false);
                  setEditSelectedShiftPreset(null);
                  setIsEditShiftDropdownOpen(false);
                  setIsStartTimeDropdownOpen(false);
                  setIsEndTimeDropdownOpen(false);
                }}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Employee Display (not editable) */}
            <Text style={styles(theme).sectionLabel}>{t('calendar.editShiftModal.employee')}</Text>
            <View style={styles(theme).employeeDisplay}>
              {selectedEmployee?.photoURL ? (
                <OptimizedImage uri={selectedEmployee.photoURL} style={styles(theme).avatarSmallImage} />
              ) : (
                <View style={styles(theme).avatarSmall}>
                  <Text style={styles(theme).avatarSmallText}>
                    {selectedEmployee?.name.charAt(0)}
                  </Text>
                </View>
              )}
              <Text style={styles(theme).employeeDisplayText}>
                {selectedEmployee?.name}
              </Text>
            </View>

            {/* Shift Preset Dropdown */}
            <Text style={styles(theme).sectionLabel}>{t('calendar.addShiftModal.selectShiftDuration')}</Text>
            <View style={{ zIndex: isEditShiftDropdownOpen ? 1000 : 1 }}>
              <TouchableOpacity
                style={styles(theme).dropdownButton}
                onPress={() => {
                  setIsEditShiftDropdownOpen(!isEditShiftDropdownOpen);
                  setIsStartTimeDropdownOpen(false);
                  setIsEndTimeDropdownOpen(false);
                }}
              >
                <View style={styles(theme).dropdownButtonContent}>
                  {editSelectedShiftPreset ? (
                    <View style={{ flex: 1 }}>
                      <Text style={styles(theme).dropdownButtonText}>{editSelectedShiftPreset.name}</Text>
                      {editSelectedShiftPreset.startTime && editSelectedShiftPreset.endTime && (
                        <Text style={styles(theme).dropdownButtonSubtext}>
                          {formatTimeRange(editSelectedShiftPreset.startTime, editSelectedShiftPreset.endTime)} • {editSelectedShiftPreset.hours}h
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles(theme).dropdownButtonPlaceholder}>{t('calendar.addShiftModal.selectShiftDuration')}</Text>
                  )}
                </View>
                <Ionicons
                  name={isEditShiftDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>

              {isEditShiftDropdownOpen && (
                <View style={styles(theme).dropdownListContainer}>
                  <ScrollView style={styles(theme).dropdownList} nestedScrollEnabled={true}>
                    {workspace.shifts.map((shift) => {
                      const timeRange = shift.startTime && shift.endTime
                        ? formatTimeRange(shift.startTime, shift.endTime)
                        : null;

                      return (
                        <TouchableOpacity
                          key={shift.id}
                          style={[
                            styles(theme).shiftOption,
                            editSelectedShiftPreset?.id === shift.id && styles(theme).shiftOptionSelected
                          ]}
                          onPress={() => {
                            setEditSelectedShiftPreset(shift);
                            if (shift.startTime) setCustomStartTime(shift.startTime);
                            if (shift.endTime) setCustomEndTime(shift.endTime);
                            setIsEditShiftDropdownOpen(false);
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[
                              styles(theme).shiftOptionText,
                              editSelectedShiftPreset?.id === shift.id && styles(theme).shiftOptionTextSelected
                            ]}>
                              {shift.name}
                            </Text>
                            {timeRange && (
                              <Text style={[
                                styles(theme).shiftOptionSubtext,
                                editSelectedShiftPreset?.id === shift.id && styles(theme).shiftOptionSubtextSelected
                              ]}>
                                {timeRange} • {shift.hours}h
                              </Text>
                            )}
                          </View>
                          {editSelectedShiftPreset?.id === shift.id && (
                            <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            <Text style={styles(theme).orText}>{t('calendar.addShiftModal.or')}</Text>

            {/* Time Dropdowns */}
            <View style={styles(theme).timeDropdownsRow}>
              {/* Start Time Dropdown */}
              <View style={[styles(theme).timeDropdownContainer, { zIndex: isStartTimeDropdownOpen ? 1000 : 1 }]}>
                <Text style={styles(theme).timeLabel}>Start</Text>
                <TouchableOpacity
                  style={styles(theme).timeDropdownButton}
                  onPress={() => {
                    setIsStartTimeDropdownOpen(!isStartTimeDropdownOpen);
                    setIsEndTimeDropdownOpen(false);
                    setIsEditShiftDropdownOpen(false);
                  }}
                >
                  <Text style={styles(theme).timeDropdownText}>{customStartTime}</Text>
                  <Ionicons
                    name={isStartTimeDropdownOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
                {isStartTimeDropdownOpen && (
                  <View style={styles(theme).timeDropdownList}>
                    <ScrollView style={styles(theme).timeDropdownScroll} nestedScrollEnabled={true}>
                      {timeOptions.map((time) => (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles(theme).timeDropdownItem,
                            customStartTime === time && styles(theme).timeDropdownItemSelected
                          ]}
                          onPress={() => {
                            setCustomStartTime(time);
                            setEditSelectedShiftPreset(null);
                            setIsStartTimeDropdownOpen(false);
                          }}
                        >
                          <Text style={[
                            styles(theme).timeDropdownItemText,
                            customStartTime === time && styles(theme).timeDropdownItemTextSelected
                          ]}>
                            {time}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Hours Preview in middle */}
              <View style={styles(theme).hoursPreviewCompact}>
                <Ionicons name="time-outline" size={14} color={theme.primary} />
                <Text style={styles(theme).hoursPreviewCompactText}>
                  {calculateHours(customStartTime, customEndTime)}h
                </Text>
              </View>

              {/* End Time Dropdown */}
              <View style={[styles(theme).timeDropdownContainer, { zIndex: isEndTimeDropdownOpen ? 1000 : 1 }]}>
                <Text style={styles(theme).timeLabel}>End</Text>
                <TouchableOpacity
                  style={styles(theme).timeDropdownButton}
                  onPress={() => {
                    setIsEndTimeDropdownOpen(!isEndTimeDropdownOpen);
                    setIsStartTimeDropdownOpen(false);
                    setIsEditShiftDropdownOpen(false);
                  }}
                >
                  <Text style={styles(theme).timeDropdownText}>{customEndTime}</Text>
                  <Ionicons
                    name={isEndTimeDropdownOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
                {isEndTimeDropdownOpen && (
                  <View style={styles(theme).timeDropdownList}>
                    <ScrollView style={styles(theme).timeDropdownScroll} nestedScrollEnabled={true}>
                      {timeOptions.map((time) => (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles(theme).timeDropdownItem,
                            customEndTime === time && styles(theme).timeDropdownItemSelected
                          ]}
                          onPress={() => {
                            setCustomEndTime(time);
                            setEditSelectedShiftPreset(null);
                            setIsEndTimeDropdownOpen(false);
                          }}
                        >
                          <Text style={[
                            styles(theme).timeDropdownItemText,
                            customEndTime === time && styles(theme).timeDropdownItemTextSelected
                          ]}>
                            {time}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles(theme).saveButton}
              onPress={handleUpdateShift}
            >
              <Text style={styles(theme).saveButtonText}>{t('calendar.editShiftModal.saveChanges')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles(theme).deleteButton}
              onPress={() => handleDeleteShift(editingScheduleItem)}
            >
              <Ionicons name="trash-outline" size={18} color={theme.error} />
              <Text style={styles(theme).deleteButtonText}>{t('calendar.editShiftModal.removeShift')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Save Preset Modal */}
      <Modal visible={showPresetModal} transparent animationType="slide" onRequestClose={() => setShowPresetModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles(theme).modalOverlay}
        >
          <View style={styles(theme).modalContent}>
            <Text style={styles(theme).modalTitle}>{t('calendar.presets.saveModal.title')}</Text>
            <Text style={styles(theme).modalSubtitle}>
              {t('calendar.presets.saveModal.subtitle', { month: formatMonthYear(currentMonth) })}
            </Text>

            <Text style={styles(theme).sectionLabel}>{t('calendar.presets.saveModal.presetName')}</Text>
            <TextInput
              style={styles(theme).input}
              placeholder={t('calendar.presets.saveModal.placeholder')}
              placeholderTextColor={theme.textSecondary}
              value={presetName}
              onChangeText={setPresetName}
            />

            <View style={styles(theme).presetInfo}>
              <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
              <Text style={styles(theme).presetInfoText}>
                {t('calendar.presets.saveModal.info', { month: formatMonthYear(currentMonth) })}
              </Text>
            </View>

            <View style={styles(theme).modalButtons}>
              <TouchableOpacity
                style={styles(theme).cancelButton}
                onPress={() => {
                  setPresetName('');
                  setShowPresetModal(false);
                }}
              >
                <Text style={styles(theme).cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles(theme).confirmButton}
                onPress={handleSavePreset}
              >
                <Text style={styles(theme).confirmButtonText}>{t('calendar.presets.saveModal.saveButton')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Manage Presets Modal */}
      <Modal visible={showManagePresetsModal} transparent animationType="slide" onRequestClose={() => setShowManagePresetsModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles(theme).modalOverlay}
        >
          <View style={styles(theme).modalContent}>
            <Text style={styles(theme).modalTitle}>{t('calendar.presets.loadModal.title')}</Text>
            <Text style={styles(theme).modalSubtitle}>
              {t('calendar.presets.loadModal.subtitle', { month: formatMonthYear(currentMonth) })}
            </Text>

            <Text style={styles(theme).sectionLabel}>{t('calendar.presets.loadModal.availablePresets')}</Text>
            <ScrollView style={styles(theme).presetList}>
              {(!workspace.schedulePresets || workspace.schedulePresets.length === 0) ? (
                <View style={styles(theme).emptyPresets}>
                  <Ionicons name="albums-outline" size={48} color={theme.textSecondary} />
                  <Text style={styles(theme).emptyPresetsText}>{t('calendar.presets.loadModal.noPresets')}</Text>
                  <Text style={styles(theme).emptyPresetsSubtext}>
                    {t('calendar.presets.loadModal.noPresetsSubtext')}
                  </Text>
                </View>
              ) : (
                workspace.schedulePresets.map((preset) => {
                  const shiftsCount = preset.pattern.length;
                  const uniqueDays = [...new Set(preset.pattern.map(p => p.dayOfWeek))];
                  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const daysText = uniqueDays.map(d => dayNames[d]).join(', ');

                  return (
                    <View key={preset.id} style={styles(theme).presetItem}>
                      <TouchableOpacity
                        style={styles(theme).presetItemMain}
                        onPress={() => handleApplyPreset(preset)}
                        activeOpacity={0.7}
                      >
                        <View style={styles(theme).presetItemIcon}>
                          <Ionicons name="calendar" size={24} color={theme.primary} />
                        </View>
                        <View style={styles(theme).presetItemInfo}>
                          <Text style={styles(theme).presetItemName}>{preset.name}</Text>
                          <Text style={styles(theme).presetItemDetails}>
                            {shiftsCount} shifts • {daysText}
                          </Text>
                          <Text style={styles(theme).presetItemDate}>
                            Created {new Date(preset.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles(theme).presetDeleteButton}
                        onPress={() => handleDeletePreset(preset)}
                      >
                        <Ionicons name="trash-outline" size={18} color={theme.error} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles(theme).cancelButtonSingle}
              onPress={() => setShowManagePresetsModal(false)}
            >
              <Text style={styles(theme).cancelButtonText}>{t('calendar.presets.loadModal.close')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Day Shifts Modal - Shows all shifts for a selected day */}
      <Modal visible={showDayShiftsModal} transparent animationType="slide" onRequestClose={() => setShowDayShiftsModal(false)}>
        <View style={styles(theme).modalOverlay}>
          <View style={styles(theme).dayShiftsModalContent}>
            <View style={styles(theme).dayShiftsHeader}>
              <Text style={styles(theme).dayShiftsTitle}>
                {selectedDayShifts.length > 0 && selectedDayShifts[0].date
                  ? new Date(selectedDayShifts[0].date).toLocaleDateString(i18n.language === 'da' ? 'da-DK' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : t('calendar.shiftsOnDay')}
              </Text>
              <TouchableOpacity onPress={() => setShowDayShiftsModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles(theme).dayShiftsList} showsVerticalScrollIndicator={false}>
              {selectedDayShifts.map((schedule) => {
                const employee = getAllEmployeesIncludingOwner().find(emp => emp.userId === schedule.employeeId);
                if (!employee) return null;

                const timeRange = schedule.startTime && schedule.endTime
                  ? formatTimeRange(schedule.startTime, schedule.endTime)
                  : '';

                return (
                  <TouchableOpacity
                    key={schedule.id}
                    style={[
                      styles(theme).dayShiftItem,
                      { borderLeftColor: employee.color, borderLeftWidth: 4 }
                    ]}
                    onPress={() => {
                      if (canManageSchedule) {
                        setShowDayShiftsModal(false);
                        handleOpenEditShift(schedule);
                      }
                    }}
                    onLongPress={() => {
                      setShowDayShiftsModal(false);
                      handleShiftLongPress(schedule);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles(theme).dayShiftEmployee}>
                      <View style={[styles(theme).employeeColorDot, { backgroundColor: employee.color }]} />
                      <Text style={styles(theme).dayShiftEmployeeName}>{employee.name}</Text>
                    </View>
                    <View style={styles(theme).dayShiftDetails}>
                      {timeRange && (
                        <Text style={styles(theme).dayShiftTime}>{timeRange}</Text>
                      )}
                      <Text style={styles(theme).dayShiftName}>{getTranslatedShiftName(schedule.shiftName)}</Text>
                    </View>
                    <View style={styles(theme).dayShiftHours}>
                      <Text style={styles(theme).dayShiftHoursText}>{schedule.hours}{i18n.language === 'da' ? 't' : 'h'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {canManageSchedule && (
              <TouchableOpacity
                style={styles(theme).addShiftFromDayButton}
                onPress={() => {
                  if (selectedDayShifts.length > 0 && selectedDayShifts[0].date) {
                    const date = new Date(selectedDayShifts[0].date);
                    setShowDayShiftsModal(false);
                    handleOpenAddShift(date);
                  }
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles(theme).addShiftFromDayButtonText}>{t('calendar.addShift')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles(theme).dayShiftsCloseButton}
              onPress={() => setShowDayShiftsModal(false)}
            >
              <Text style={styles(theme).cancelButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Shift Swap Modal */}
      <Modal visible={showShiftSwapModal} transparent animationType="slide" onRequestClose={() => setShowShiftSwapModal(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles(theme).shiftSwapModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles(theme).shiftSwapModalContent}>
                {/* Header */}
                <View style={styles(theme).shiftSwapModalHeader}>
                  <Text style={styles(theme).shiftSwapModalTitle}>{t('shiftSwap.createRequest')}</Text>
                </View>

                {/* Content */}
                <View style={styles(theme).shiftSwapModalBody}>
                  {selectedShiftForSwap && (
                    <View style={styles(theme).shiftSwapShiftInfo}>
                      <Text style={styles(theme).shiftSwapLabel}>{t('shiftSwap.yourShift')}</Text>
                      <View style={styles(theme).shiftSwapShiftCard}>
                        <Text style={styles(theme).shiftSwapShiftDate}>
                          {new Date(selectedShiftForSwap.date).toLocaleDateString(i18n.language === 'da' ? 'da-DK' : 'en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Text>
                        <Text style={styles(theme).shiftSwapShiftName}>{getTranslatedShiftName(selectedShiftForSwap.shiftName)}</Text>
                        {selectedShiftForSwap.startTime && selectedShiftForSwap.endTime && (
                          <Text style={styles(theme).shiftSwapShiftTime}>
                            {formatTimeRange(selectedShiftForSwap.startTime, selectedShiftForSwap.endTime)} ({selectedShiftForSwap.hours}{i18n.language === 'da' ? 't' : 'h'})
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Optional Message */}
                  <View style={styles(theme).messageContainer}>
                    <Text style={styles(theme).shiftSwapLabel}>{t('shiftSwap.messageOptional')}</Text>
                    <TextInput
                      style={styles(theme).messageInput}
                      value={swapMessage}
                      onChangeText={setSwapMessage}
                      placeholder={t('shiftSwap.messagePlaceholder')}
                      placeholderTextColor={theme.textSecondary}
                      multiline
                      numberOfLines={3}
                      returnKeyType="done"
                      submitBehavior="submit"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>
                </View>

                {/* Footer Buttons */}
                <View style={styles(theme).shiftSwapModalFooter}>
                  <TouchableOpacity
                    style={styles(theme).shiftSwapCancelButton}
                    onPress={() => setShowShiftSwapModal(false)}
                  >
                    <Text style={styles(theme).shiftSwapCancelButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles(theme).shiftSwapSendButton}
                    onPress={handleCreateShiftSwap}
                  >
                    <Text style={styles(theme).shiftSwapSendButtonText}>{t('shiftSwap.sendRequest')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Shift Notes Modal */}
      <ShiftNotesModal
        visible={showNotesModal}
        onClose={() => {
          setShowNotesModal(false);
          setSelectedShiftForNotes(null);
        }}
        shift={selectedShiftForNotes}
        onSaveNote={handleSaveNotes}
        allEmployees={getAllEmployeesIncludingOwner()}
      />
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  navButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  monthYearContainer: {
    alignItems: 'center',
  },
  monthYearText: {
    color: theme.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  weekNumberText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: theme.surface2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  todayButtonText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  viewButtonActive: {
    backgroundColor: theme.primary,
  },
  viewButtonText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  viewButtonTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  scrollableContent: {
    flex: 1,
  },
  daysContainer: {
    flex: 1,
  },
  dayCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  todayCard: {
    borderColor: theme.primary,
    borderWidth: 2,
  },
  dayHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  dayDate: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  todayText: {
    color: theme.primary,
  },
  todayBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  todayBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scheduleList: {
    gap: 8,
  },
  emptySchedule: {
    padding: 20,
    alignItems: 'center',
  },
  emptyScheduleText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  scheduleItem: {
    backgroundColor: theme.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
  },
  scheduleInfo: {
    flex: 1,
  },
  employeeName: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeRangeText: {
    color: theme.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  shiftName: {
    color: theme.textSecondary,
    fontSize: 13,
  },
  shiftRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notesButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: theme.background,
    position: 'relative',
  },
  notesBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.primary,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notesBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  hoursContainer: {
    backgroundColor: theme.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  shiftHours: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  addShiftButton: {
    padding: 14,
    borderWidth: 1,
    borderColor: theme.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addShiftText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Month view styles
  monthContainer: {
    paddingHorizontal: 16,
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  weekdayText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  monthDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
    backgroundColor: theme.surface,
    borderWidth: 0.5,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  monthDayCellOtherMonth: {
    backgroundColor: theme.background,
  },
  monthDayCellToday: {
    backgroundColor: theme.primaryDark,
    borderWidth: 2,
    borderColor: theme.primary,
  },
  monthDayNumber: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  monthDayNumberOtherMonth: {
    color: theme.inactive,
  },
  monthDayNumberToday: {
    color: theme.primary,
    fontWeight: 'bold',
  },
  shiftDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  shiftDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    // backgroundColor is set dynamically based on employee color
  },
  shiftDotText: {
    color: theme.primary,
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 2,
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
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  modalCloseButton: {
    padding: 4,
    marginLeft: 12,
  },
  modalTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: theme.textSecondary,
    fontSize: 14,
    marginBottom: 20,
  },
  sectionLabel: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 6,
  },
  employeeList: {
    maxHeight: 180,
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: theme.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 8,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  dropdownButtonText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownButtonSubtext: {
    color: theme.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  dropdownButtonPlaceholder: {
    color: theme.textSecondary,
    fontSize: 15,
  },
  dropdownListContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 4,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    overflow: 'hidden',
  },
  dropdownList: {
    maxHeight: 300,
    borderRadius: 12,
  },
  dropdownScrollView: {
    maxHeight: 300,
  },
  dropdownItem: {
    padding: 14,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    borderLeftWidth: 2,
    borderLeftColor: theme.border,
  },
  dropdownItemText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownEmployeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownEmployeePhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownEmployeeInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  employeeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  employeeOptionSelected: {
    backgroundColor: theme.primaryDark,
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarSmallImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: theme.surface,
  },
  avatarSmallText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  employeeOptionText: {
    color: theme.text,
    fontSize: 15,
    flex: 1,
  },
  employeeOptionTextSelected: {
    color: theme.primary,
    fontWeight: '600',
  },
  shiftPresetList: {
    maxHeight: 160,
    marginBottom: 12,
  },
  shiftOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  shiftOptionSelected: {
    backgroundColor: theme.primaryDark,
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
  },
  shiftOptionText: {
    color: theme.text,
    fontSize: 15,
    marginBottom: 2,
  },
  shiftOptionSubtext: {
    color: theme.textSecondary,
    fontSize: 12,
  },
  shiftOptionTextSelected: {
    color: theme.primary,
    fontWeight: '600',
  },
  shiftOptionSubtextSelected: {
    color: theme.primary,
  },
  orText: {
    color: theme.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    alignSelf: 'center',
    marginVertical: 6,
  },
  input: {
    backgroundColor: theme.background,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    color: theme.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  noEmployeesText: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: theme.primary,
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: theme.primary,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.primaryDark === '#1a2e1a' ? '#2e1a1a' : '#ffe0e0',
    borderWidth: 1,
    borderColor: theme.error,
    marginTop: 8,
  },
  deleteButtonText: {
    color: theme.error,
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButtonSingle: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  employeeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: theme.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  employeeDisplayText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Preset styles
  presetActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: theme.background,
  },
  presetActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.primary,
    gap: 8,
  },
  presetActionText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  presetInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: theme.surface2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.primary,
    marginBottom: 16,
  },
  presetInfoText: {
    flex: 1,
    color: theme.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  presetList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  emptyPresets: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyPresetsText: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyPresetsSubtext: {
    color: theme.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  presetItem: {
    flexDirection: 'row',
    backgroundColor: theme.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  presetItemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  presetItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.primary,
  },
  presetItemInfo: {
    flex: 1,
    gap: 4,
  },
  presetItemName: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  presetItemDetails: {
    color: theme.primary,
    fontSize: 13,
  },
  presetItemDate: {
    color: theme.textSecondary,
    fontSize: 12,
  },
  presetDeleteButton: {
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.primaryDark === '#1a2e1a' ? '#2e1a1a' : '#ffe0e0',
    borderLeftWidth: 1,
    borderLeftColor: theme.border,
  },
  timePickersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  timePickerContainer: {
    flex: 1,
  },
  timeLabel: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  pickerWrapper: {
    backgroundColor: theme.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
    height: 44,
    justifyContent: 'center',
  },
  // Time dropdown styles for edit modal
  timeDropdownsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  timeDropdownContainer: {
    flex: 1,
  },
  timeDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  timeDropdownText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '500',
  },
  timeDropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: theme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  timeDropdownScroll: {
    maxHeight: 150,
  },
  timeDropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  timeDropdownItemSelected: {
    backgroundColor: theme.primaryDark,
  },
  timeDropdownItemText: {
    color: theme.text,
    fontSize: 14,
    textAlign: 'center',
  },
  timeDropdownItemTextSelected: {
    color: theme.primary,
    fontWeight: '600',
  },
  hoursPreviewCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: theme.primaryDark,
    borderRadius: 8,
  },
  hoursPreviewCompactText: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: '600',
    justifyContent: 'center',
  },
  picker: {
    color: theme.text,
    backgroundColor: theme.background,
    height: 44,
    marginTop: Platform.OS === 'android' ? -8 : 0,
  },
  hoursPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: theme.primaryDark,
    borderRadius: 8,
    marginBottom: 12,
  },
  hoursPreviewText: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  customShiftSection: {
    marginBottom: 8,
  },
  hoursPreviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: theme.primaryDark,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  hoursPreviewTopText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  dayShiftsModalContent: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    height: '80%',
    width: '100%',
    marginTop: 'auto',
  },
  dayShiftsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  dayShiftsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  dayShiftsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  dayShiftItem: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayShiftEmployee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  employeeColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dayShiftEmployeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  dayShiftDetails: {
    flex: 1,
    gap: 4,
  },
  dayShiftTime: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },
  dayShiftName: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  dayShiftHours: {
    backgroundColor: theme.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dayShiftHoursText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
  addShiftFromDayButton: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  addShiftFromDayButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dayShiftsCloseButton: {
    backgroundColor: theme.border,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  // Shift Swap Modal Styles
  shiftSwapModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  shiftSwapModalContent: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
  },
  shiftSwapModalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    alignItems: 'center',
  },
  shiftSwapModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  shiftSwapModalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  shiftSwapShiftInfo: {
    marginBottom: 16,
  },
  shiftSwapLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  shiftSwapShiftCard: {
    backgroundColor: theme.background,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  shiftSwapShiftDate: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 3,
  },
  shiftSwapShiftName: {
    fontSize: 15,
    color: theme.text,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  shiftSwapShiftTime: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  swapTypeContainer: {
    marginBottom: 16,
  },
  swapTypeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  swapTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapTypeButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  swapTypeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  swapTypeButtonTextActive: {
    color: '#000',
  },
  employeePickerContainer: {
    marginBottom: 16,
  },
  swapEmployeePickerContainer: {
    marginBottom: 16,
  },
  swapEmployeeDropdownList: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
  },
  employeePicker: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    color: theme.text,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageInput: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: theme.text,
    minHeight: 70,
    maxHeight: 70,
    textAlignVertical: 'top',
  },
  shiftSwapModalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.surface,
  },
  shiftSwapCancelButton: {
    flex: 1,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftSwapCancelButtonText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '600',
  },
  shiftSwapSendButton: {
    flex: 1,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftSwapSendButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
  shiftSwapSendButtonDisabled: {
    opacity: 0.5,
  },
});
