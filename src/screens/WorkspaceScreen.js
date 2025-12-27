import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import CalendarView from '../components/CalendarView';
import EmployeesView from '../components/EmployeesView';
import RolesView from '../components/RolesView';
import ShiftsView from '../components/ShiftsView';
import AnalyticsView from '../components/AnalyticsView';
import ScheduleManagementView from '../components/ScheduleManagementView';
import ShiftSwapScreen from './ShiftSwapScreen';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function WorkspaceScreen({ workspace, onBack, onWorkspaceUpdate }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('calendar');
  const [settingsSubTab, setSettingsSubTab] = useState('roles');
  const [currentWorkspace, setCurrentWorkspace] = useState(workspace);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [pendingSwapsCount, setPendingSwapsCount] = useState(0);
  const settingsSubTabAnim = useRef(new Animated.Value(0)).current;

  // Fetch owner information once
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

  // Real-time listener for workspace to detect if user was removed
  useEffect(() => {
    if (!workspace.id) return;

    const currentUserId = auth.currentUser.uid;
    const workspaceRef = doc(db, 'workspaces', workspace.id);

    const unsubscribe = onSnapshot(workspaceRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const updatedWorkspace = docSnapshot.data();

        // Check if current user is still in the workspace (either as owner or employee)
        const isOwner = updatedWorkspace.ownerId === currentUserId;
        const isEmployee = updatedWorkspace.employees?.some(emp => emp.userId === currentUserId);

        if (!isOwner && !isEmployee) {
          // User has been removed from the workspace - kick them out
          Alert.alert(
            t('workspace.removed.title'),
            t('workspace.removed.message'),
            [
              {
                text: t('common.ok'),
                onPress: () => {
                  if (onBack) {
                    onBack();
                  }
                }
              }
            ],
            { cancelable: false }
          );
        }
      }
    });

    return () => unsubscribe();
  }, [workspace.id]);

  // Real-time listener for pending shift swap requests
  useEffect(() => {
    const currentUserId = auth.currentUser.uid;
    const swapRequestsQuery = query(
      collection(db, 'shiftSwapRequests'),
      where('workspaceId', '==', workspace.id),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(swapRequestsQuery, (snapshot) => {
      let count = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Count swaps targeted at current user OR open swaps from others
        if (data.targetEmployeeId === currentUserId ||
            (data.isOpenSwap && data.requesterId !== currentUserId)) {
          count++;
        }
      });
      setPendingSwapsCount(count);
    });

    return () => unsubscribe();
  }, [workspace.id]);

  const handleWorkspaceUpdate = (updatedWorkspace) => {
    setCurrentWorkspace(updatedWorkspace);
    if (onWorkspaceUpdate) {
      onWorkspaceUpdate(updatedWorkspace);
    }
  };

  // Check permissions
  const isOwner = workspace.ownerId === auth.currentUser.uid;
  const currentUserEmployee = workspace.employees.find(emp => emp.userId === auth.currentUser.uid);
  const currentUserRole = workspace.roles.find(r => r.id === currentUserEmployee?.roleId);

  const canManageRoles = isOwner || currentUserRole?.permissions.includes('manage_roles');
  const canManageShifts = isOwner || currentUserRole?.permissions.includes('manage_shifts');
  const canManageSchedule = isOwner || currentUserRole?.permissions.includes('manage_schedule');
  const canViewAnalytics = isOwner || currentUserRole?.permissions.includes('analytics');

  const canViewSettings = canManageRoles || canManageShifts || canManageSchedule;

  // Tab configuration with icons
  const tabs = [
    { id: 'calendar', label: t('workspace.tabs.calendar'), icon: 'calendar', show: true },
    { id: 'employees', label: t('workspace.tabs.employees'), icon: 'people', show: true },
    { id: 'shiftSwap', label: t('shiftSwap.title'), icon: 'swap-horizontal', show: true, badge: pendingSwapsCount },
    { id: 'analytics', label: t('workspace.tabs.analytics'), icon: 'stats-chart', show: canViewAnalytics },
  ].filter(tab => tab.show);

  // Settings subtabs with icons
  const settingsSubTabs = [
    { id: 'roles', label: t('workspace.tabs.roles'), icon: 'shield-checkmark', show: canManageRoles },
    { id: 'shifts', label: t('workspace.tabs.shifts'), icon: 'time', show: canManageShifts },
    { id: 'schedule', label: t('workspace.tabs.schedule'), icon: 'calendar', show: canManageSchedule },
  ].filter(tab => tab.show);

  // Animate settings dropdown when tab changes
  useEffect(() => {
    if (activeTab === 'settings') {
      // Reset to 0 first, then animate to 1
      settingsSubTabAnim.setValue(0);
      Animated.timing(settingsSubTabAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [activeTab]);

  const settingsSubTabHeight = settingsSubTabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 85],
  });

  const settingsSubTabOpacity = settingsSubTabAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View style={styles(theme).container}>
      {/* Professional Header */}
      <View style={styles(theme).header}>
        {/* Safe area spacer */}
        <View style={styles(theme).safeAreaSpacer} />

        {/* Header content row */}
        <View style={styles(theme).headerRow}>
          <TouchableOpacity
            style={styles(theme).backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <View style={styles(theme).backButtonContent}>
              <Ionicons name="chevron-back" size={24} color={theme.primary} />
              <Text style={styles(theme).backButtonText}>{t('common.back')}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles(theme).workspaceInfoRight}>
            <View style={styles(theme).headerTextContainer}>
              <Text style={styles(theme).headerTitle} numberOfLines={1}>
                {currentWorkspace.name}
              </Text>
              {isOwner && (
                <View style={styles(theme).ownerIndicator}>
                  <Ionicons name="star" size={10} color={theme.gold} />
                  <Text style={styles(theme).ownerText}>{t('common.owner')}</Text>
                </View>
              )}
            </View>
            <View style={styles(theme).headerIconsContainer}>
              <View style={styles(theme).workspaceIconContainer}>
                <Ionicons name="briefcase" size={20} color={theme.primary} />
              </View>
              {canViewSettings && (
                <TouchableOpacity
                  style={[
                    styles(theme).settingsIconButton,
                    activeTab === 'settings' && styles(theme).settingsIconButtonActive
                  ]}
                  onPress={() => {
                    if (activeTab === 'settings') {
                      setActiveTab('calendar');
                    } else {
                      setActiveTab('settings');
                      if (settingsSubTabs.length > 0) {
                        setSettingsSubTab(settingsSubTabs[0].id);
                      }
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={activeTab === 'settings' ? "settings" : "settings-outline"}
                    size={22}
                    color={activeTab === 'settings' ? theme.primary : theme.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Professional Tab Bar */}
      <View style={styles(theme).tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles(theme).tabBarContent}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles(theme).tab, isActive && styles(theme).activeTab]}
                onPress={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'settings' && settingsSubTabs.length > 0) {
                    setSettingsSubTab(settingsSubTabs[0].id);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles(theme).tabIconContainer, isActive && styles(theme).tabIconContainerActive]}>
                  <Ionicons
                    name={tab.icon}
                    size={20}
                    color={isActive ? theme.primary : theme.textSecondary}
                  />
                  {tab.badge > 0 && (
                    <View style={styles(theme).badge}>
                      <Text style={styles(theme).badgeText}>{tab.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles(theme).tabText, isActive && styles(theme).activeTabText]}>
                  {tab.label}
                </Text>
                {isActive && <View style={styles(theme).tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {activeTab === 'calendar' && (
        <CalendarView
          workspace={currentWorkspace}
          onWorkspaceUpdate={handleWorkspaceUpdate}
        />
      )}
      {activeTab === 'employees' && (
        <EmployeesView
          workspace={currentWorkspace}
          onWorkspaceUpdate={handleWorkspaceUpdate}
          ownerInfo={ownerInfo}
        />
      )}
      {activeTab === 'shiftSwap' && (
        <ShiftSwapScreen
          workspace={currentWorkspace}
        />
      )}
      {activeTab === 'analytics' && canViewAnalytics && (
        <AnalyticsView workspace={currentWorkspace} ownerInfo={ownerInfo} />
      )}
      {activeTab === 'settings' && canViewSettings && (
        <>
          {/* Settings Subtab Bar with Animation */}
          <Animated.View style={[
            styles(theme).settingsSubTabBar,
            { height: settingsSubTabHeight, opacity: settingsSubTabOpacity }
          ]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles(theme).settingsSubTabContent}
            >
              {settingsSubTabs.map((subTab) => {
                const isActive = settingsSubTab === subTab.id;
                return (
                  <TouchableOpacity
                    key={subTab.id}
                    style={[styles(theme).tab, isActive && styles(theme).activeTab]}
                    onPress={() => setSettingsSubTab(subTab.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles(theme).tabIconContainer, isActive && styles(theme).tabIconContainerActive]}>
                      <Ionicons
                        name={subTab.icon}
                        size={20}
                        color={isActive ? theme.primary : theme.textSecondary}
                      />
                    </View>
                    <Text style={[styles(theme).tabText, isActive && styles(theme).activeTabText]}>
                      {subTab.label}
                    </Text>
                    {isActive && <View style={styles(theme).tabIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Settings Content */}
          {settingsSubTab === 'roles' && canManageRoles && (
            <RolesView
              workspace={currentWorkspace}
              onWorkspaceUpdate={handleWorkspaceUpdate}
            />
          )}
          {settingsSubTab === 'shifts' && canManageShifts && (
            <ShiftsView
              workspace={currentWorkspace}
              onWorkspaceUpdate={handleWorkspaceUpdate}
            />
          )}
          {settingsSubTab === 'schedule' && canManageSchedule && (
            <ScheduleManagementView
              workspace={currentWorkspace}
              onWorkspaceUpdate={handleWorkspaceUpdate}
            />
          )}
        </>
      )}
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
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  safeAreaSpacer: {
    height: 50, // Space for iPhone notch/status bar
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    // No additional styles needed
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  backButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  workspaceInfoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'flex-end',
  },
  headerTextContainer: {
    gap: 4,
    alignItems: 'flex-end',
  },
  headerTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  headerIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  workspaceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.primary,
  },
  settingsIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  settingsIconButtonActive: {
    backgroundColor: theme.primaryDark,
    borderColor: theme.primary,
  },
  ownerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  ownerText: {
    color: theme.gold,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabBar: {
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tabBarContent: {
    paddingHorizontal: 8,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 90,
    position: 'relative',
  },
  activeTab: {
    // Active state handled by child elements
  },
  tabIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  tabIconContainerActive: {
    backgroundColor: theme.primaryDark,
    borderColor: theme.primary,
  },
  tabText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTabText: {
    color: theme.primary,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: theme.primary,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  settingsSubTabBar: {
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    overflow: 'hidden',
  },
  settingsSubTabContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  content: {
    flex: 1,
  },
});
