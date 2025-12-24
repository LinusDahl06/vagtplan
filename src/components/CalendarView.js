import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getEmployeeColor, getColorWithAlpha, getVibrantColor } from '../utils/employeeColors';
import { calculateHours, formatTimeRange, generateTimeOptions } from '../utils/timeUtils';

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

    // Always use custom times for editing (shift presets are only for adding new shifts)
    setSelectedShiftPreset(null);
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

  const renderWeekView = () => (
    <ScrollView style={styles(theme).scrollableContent} showsVerticalScrollIndicator={false}>
      {currentWeek.map((date, index) => {
        const schedules = getScheduleForDate(date);
        const today = isToday(date);

        return (
          <View key={index} style={[styles(theme).dayCard, today && styles(theme).todayCard]}>
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

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles(theme).scheduleItem,
                        {
                          backgroundColor: getColorWithAlpha(employeeColor, 0.15, isCurrentUser),
                          borderLeftWidth: 4,
                          borderLeftColor: displayColor
                        }
                      ]}
                      onPress={() => canManageSchedule && handleOpenEditShift(schedule)}
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
                      <View style={styles(theme).hoursContainer}>
                        <Text style={styles(theme).shiftHours}>{schedule.hours}h</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              <TouchableOpacity
                style={styles(theme).addShiftButton}
                onPress={() => handleOpenAddShift(date)}
              >
                <Text style={styles(theme).addShiftText}>{t('calendar.addShift')}</Text>
              </TouchableOpacity>
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
                  } else {
                    // Open add shift modal
                    handleOpenAddShift(dayInfo.date);
                  }
                }}
                activeOpacity={0.7}
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
      <Modal visible={showAddShiftModal} transparent animationType="slide" onRequestClose={() => setShowAddShiftModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles(theme).modalOverlay}
        >
          <View style={styles(theme).modalContent}>
            <Text style={styles(theme).modalTitle}>{t('calendar.addShiftModal.title')}</Text>
            <Text style={styles(theme).modalSubtitle}>
              {selectedDate && formatFullDate(selectedDate)}
            </Text>

            {/* Employee Selection */}
            <Text style={styles(theme).sectionLabel}>{t('calendar.addShiftModal.selectEmployee')}</Text>
            <ScrollView style={styles(theme).employeeList}>
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
                    onPress={() => setSelectedEmployee(employee)}
                  >
                    {employee.photoURL ? (
                      <Image source={{ uri: employee.photoURL }} style={styles(theme).avatarSmallImage} />
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

            {/* Shift Selection */}
            <Text style={styles(theme).sectionLabel}>{t('calendar.addShiftModal.selectShiftDuration')}</Text>
            <ScrollView style={styles(theme).shiftPresetList}>
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
                      setCustomStartTime('09:00');
                      setCustomEndTime('17:00');
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
                          {timeRange} • {shift.hours}
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

            <Text style={styles(theme).orText}>{t('calendar.addShiftModal.or')}</Text>

            <View style={styles(theme).timePickersRow}>
              <View style={styles(theme).timePickerContainer}>
                <Text style={styles(theme).timeLabel}>Start Time</Text>
                <View style={styles(theme).pickerWrapper}>
                  <Picker
                    selectedValue={customStartTime}
                    onValueChange={(value) => {
                      setCustomStartTime(value);
                      setSelectedShiftPreset(null);
                    }}
                    style={styles(theme).picker}
                    dropdownIconColor={theme.text}
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
                    selectedValue={customEndTime}
                    onValueChange={(value) => {
                      setCustomEndTime(value);
                      setSelectedShiftPreset(null);
                    }}
                    style={styles(theme).picker}
                    dropdownIconColor={theme.text}
                  >
                    {timeOptions.map((time) => (
                      <Picker.Item key={time} label={time} value={time} color={theme.text} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {!selectedShiftPreset && (
              <View style={styles(theme).hoursPreview}>
                <Ionicons name="time" size={16} color={theme.primary} />
                <Text style={styles(theme).hoursPreviewText}>
                  Total: {calculateHours(customStartTime, customEndTime)} hours
                </Text>
              </View>
            )}

            <View style={styles(theme).modalButtons}>
              <TouchableOpacity
                style={styles(theme).cancelButton}
                onPress={() => setShowAddShiftModal(false)}
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
      <Modal visible={showEditShiftModal} transparent animationType="slide" onRequestClose={() => setShowEditShiftModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles(theme).modalOverlay}
        >
          <View style={styles(theme).modalContent}>
            <Text style={styles(theme).modalTitle}>{t('calendar.editShiftModal.title')}</Text>
            <Text style={styles(theme).modalSubtitle}>
              {editingScheduleItem && new Date(editingScheduleItem.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </Text>

            {/* Employee Display (not editable) */}
            <Text style={styles(theme).sectionLabel}>{t('calendar.editShiftModal.employee')}</Text>
            <View style={styles(theme).employeeDisplay}>
              {selectedEmployee?.photoURL ? (
                <Image source={{ uri: selectedEmployee.photoURL }} style={styles(theme).avatarSmallImage} />
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

            {/* Total Hours Preview */}
            <View style={styles(theme).hoursPreviewTop}>
              <Ionicons name="time" size={16} color={theme.primary} />
              <Text style={styles(theme).hoursPreviewTopText}>
                {calculateHours(customStartTime, customEndTime)} {i18n.language === 'da' ? 'timer' : 'hours'}
              </Text>
            </View>

            {/* Time Pickers */}
            <View style={styles(theme).customShiftSection}>
              <View style={styles(theme).timePickersRow}>
                <View style={styles(theme).timePickerContainer}>
                  <Text style={styles(theme).timeLabel}>Start Time</Text>
                  <View style={styles(theme).pickerWrapper}>
                    <Picker
                      selectedValue={customStartTime}
                      onValueChange={(value) => setCustomStartTime(value)}
                      style={styles(theme).picker}
                      dropdownIconColor={theme.text}
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
                      selectedValue={customEndTime}
                      onValueChange={(value) => setCustomEndTime(value)}
                      style={styles(theme).picker}
                      dropdownIconColor={theme.text}
                    >
                      {timeOptions.map((time) => (
                        <Picker.Item key={time} label={time} value={time} color={theme.text} />
                      ))}
                    </Picker>
                  </View>
                </View>
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

            <TouchableOpacity
              style={styles(theme).cancelButtonSingle}
              onPress={() => setShowEditShiftModal(false)}
            >
              <Text style={styles(theme).cancelButtonText}>{t('common.cancel')}</Text>
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
                      setShowDayShiftsModal(false);
                      handleOpenEditShift(schedule);
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

            <TouchableOpacity
              style={styles(theme).dayShiftsCloseButton}
              onPress={() => setShowDayShiftsModal(false)}
            >
              <Text style={styles(theme).cancelButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
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
  modalTitle: {
    color: theme.text,
    fontSize: 22,
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
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  employeeList: {
    maxHeight: 180,
    marginBottom: 12,
  },
  employeeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  employeeOptionSelected: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryDark,
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
    padding: 12,
    backgroundColor: theme.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  shiftOptionSelected: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryDark,
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
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 8,
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
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: theme.primary,
    marginTop: 8,
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
    borderRadius: 8,
    backgroundColor: theme.primaryDark === '#1a2e1a' ? '#2e1a1a' : '#ffe0e0',
    borderWidth: 1,
    borderColor: theme.error,
    marginTop: 12,
    marginBottom: 12,
  },
  deleteButtonText: {
    color: theme.error,
    fontSize: 16,
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
    padding: 16,
    backgroundColor: theme.background,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  employeeDisplayText: {
    color: theme.primary,
    fontSize: 16,
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
  customShiftSection: {
    marginBottom: 16,
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
});
