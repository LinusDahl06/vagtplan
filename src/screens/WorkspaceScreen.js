import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import CalendarView from '../components/CalendarView';
import EmployeesView from '../components/EmployeesView';
import RolesView from '../components/RolesView';
import ShiftsView from '../components/ShiftsView';
import AnalyticsView from '../components/AnalyticsView';
import ScheduleManagementView from '../components/ScheduleManagementView';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function WorkspaceScreen({ workspace, onBack, onWorkspaceUpdate }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('calendar');
  const [currentWorkspace, setCurrentWorkspace] = useState(workspace);
  const [ownerInfo, setOwnerInfo] = useState(null);

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
    { id: 'analytics', label: t('workspace.tabs.analytics'), icon: 'stats-chart', show: canViewAnalytics },
    { id: 'settings', label: t('workspace.tabs.settings'), icon: 'settings', show: canViewSettings },
  ].filter(tab => tab.show);

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
            <View style={styles(theme).workspaceIconContainer}>
              <Ionicons name="briefcase" size={20} color={theme.primary} />
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
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <View style={[styles(theme).tabIconContainer, isActive && styles(theme).tabIconContainerActive]}>
                  <Ionicons
                    name={tab.icon}
                    size={20}
                    color={isActive ? theme.primary : theme.textSecondary}
                  />
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
      {activeTab === 'analytics' && canViewAnalytics && (
        <AnalyticsView workspace={currentWorkspace} ownerInfo={ownerInfo} />
      )}
      {activeTab === 'settings' && canViewSettings && (
        <ScrollView
          style={styles(theme).content}
          showsVerticalScrollIndicator={false}
        >
          {canManageRoles && (
            <RolesView
              workspace={currentWorkspace}
              onWorkspaceUpdate={handleWorkspaceUpdate}
            />
          )}
          {canManageShifts && (
            <ShiftsView
              workspace={currentWorkspace}
              onWorkspaceUpdate={handleWorkspaceUpdate}
            />
          )}
          {canManageSchedule && (
            <ScheduleManagementView
              workspace={currentWorkspace}
              onWorkspaceUpdate={handleWorkspaceUpdate}
            />
          )}
        </ScrollView>
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
  content: {
    flex: 1,
  },
});
