import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  acceptShiftSwapRequest,
  declineShiftSwapRequest,
  cancelShiftSwapRequest
} from '../utils/shiftSwapService';
import { formatTimeRange } from '../utils/timeUtils';

export default function ShiftSwapScreen({ workspace }) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' or 'sent'

  // Real-time listener for swap requests
  useEffect(() => {
    if (!workspace?.id) return;

    const swapRequestsRef = collection(db, 'shiftSwapRequests');

    // Listen for pending swap requests in this workspace
    const q = query(
      swapRequestsRef,
      where('workspaceId', '==', workspace.id),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allRequests = [];
      snapshot.forEach((doc) => {
        allRequests.push({ id: doc.id, ...doc.data() });
      });

      // Filter incoming requests (where user is target or it's an open swap and user is not requester)
      const incoming = allRequests.filter(req =>
        req.targetEmployeeId === auth.currentUser.uid ||
        (req.isOpenSwap && req.requesterId !== auth.currentUser.uid)
      );

      // Filter sent requests (where user is requester)
      const sent = allRequests.filter(req => req.requesterId === auth.currentUser.uid);

      setIncomingRequests(incoming);
      setMyRequests(sent);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error('Error listening to swap requests:', error);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [workspace?.id]);

  const loadSwapRequests = () => {
    // This is now handled by the real-time listener
    // Keep the function for pull-to-refresh visual feedback
    setRefreshing(true);
    // The listener will update the state automatically
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSwapRequests();
  };

  const handleAcceptSwap = async (swapRequest) => {
    Alert.alert(
      t('shiftSwap.acceptConfirm.title'),
      t('shiftSwap.acceptConfirm.message', {
        requester: swapRequest.requesterName,
        date: swapRequest.myShift.date
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('shiftSwap.accept'),
          onPress: async () => {
            try {
              const result = await acceptShiftSwapRequest(swapRequest.id, workspace);
              if (result.success) {
                loadSwapRequests();
              } else {
                Alert.alert(t('common.error'), result.error);
              }
            } catch (error) {
              console.error('Error accepting swap:', error);
              Alert.alert(t('common.error'), t('shiftSwap.acceptError'));
            }
          }
        }
      ]
    );
  };

  const handleDeclineSwap = async (swapRequest) => {
    Alert.alert(
      t('shiftSwap.declineConfirm.title'),
      t('shiftSwap.declineConfirm.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('shiftSwap.decline'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await declineShiftSwapRequest(swapRequest.id);
              if (result.success) {
                loadSwapRequests();
              } else {
                Alert.alert(t('common.error'), result.error);
              }
            } catch (error) {
              console.error('Error declining swap:', error);
              Alert.alert(t('common.error'), t('shiftSwap.declineError'));
            }
          }
        }
      ]
    );
  };

  const handleCancelSwap = async (swapRequest) => {
    Alert.alert(
      t('shiftSwap.cancelConfirm.title'),
      t('shiftSwap.cancelConfirm.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('shiftSwap.cancelRequest'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await cancelShiftSwapRequest(swapRequest.id);
              if (result.success) {
                loadSwapRequests();
              } else {
                Alert.alert(t('common.error'), result.error);
              }
            } catch (error) {
              console.error('Error cancelling swap:', error);
              Alert.alert(t('common.error'), t('shiftSwap.cancelError'));
            }
          }
        }
      ]
    );
  };

  const renderShiftCard = (shift, label) => (
    <View style={styles(theme).shiftCard}>
      <Text style={styles(theme).shiftLabel}>{label}</Text>
      <Text style={styles(theme).shiftDate}>{shift.date}</Text>
      <Text style={styles(theme).shiftName}>{shift.shiftName}</Text>
      {shift.startTime && shift.endTime && (
        <Text style={styles(theme).shiftTime}>
          {formatTimeRange(shift.startTime, shift.endTime)} ({shift.hours}{i18n.language === 'da' ? 't' : 'h'})
        </Text>
      )}
    </View>
  );

  const renderIncomingRequest = (request) => (
    <View key={request.id} style={styles(theme).requestCard}>
      <View style={styles(theme).requestHeader}>
        <View style={styles(theme).requestHeaderLeft}>
          <Ionicons name="person-circle-outline" size={24} color={theme.primary} />
          <View>
            <Text style={styles(theme).requesterName}>{request.requesterName}</Text>
            <Text style={styles(theme).workspaceName}>{request.workspaceName}</Text>
          </View>
        </View>
        {request.isOpenSwap && (
          <View style={styles(theme).openBadge}>
            <Text style={styles(theme).openBadgeText}>{t('shiftSwap.openSwap')}</Text>
          </View>
        )}
      </View>

      {request.message && (
        <View style={styles(theme).messageBox}>
          <Ionicons name="chatbox-outline" size={16} color={theme.textSecondary} />
          <Text style={styles(theme).messageText}>{request.message}</Text>
        </View>
      )}

      <View style={styles(theme).shiftsContainer}>
        {renderShiftCard(request.myShift, t('shiftSwap.theirShift'))}
        {request.theirShift && (
          <>
            <Ionicons name="swap-horizontal" size={24} color={theme.primary} style={styles(theme).swapIcon} />
            {renderShiftCard(request.theirShift, t('shiftSwap.yourShift'))}
          </>
        )}
      </View>

      <View style={styles(theme).actionButtons}>
        <TouchableOpacity
          style={[styles(theme).actionButton, styles(theme).declineButton]}
          onPress={() => handleDeclineSwap(request)}
        >
          <Ionicons name="close-circle-outline" size={20} color="#fff" />
          <Text style={[styles(theme).actionButtonText, styles(theme).declineButtonText]}>
            {t('shiftSwap.decline')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles(theme).actionButton, styles(theme).acceptButton]}
          onPress={() => handleAcceptSwap(request)}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={[styles(theme).actionButtonText, styles(theme).acceptButtonText]}>
            {t('shiftSwap.accept')}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles(theme).timestamp}>
        {new Date(request.createdAt).toLocaleDateString(i18n.language === 'da' ? 'da-DK' : 'en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </Text>
    </View>
  );

  const renderMyRequest = (request) => (
    <View key={request.id} style={styles(theme).requestCard}>
      <View style={styles(theme).requestHeader}>
        <View style={styles(theme).requestHeaderLeft}>
          <Ionicons name="time-outline" size={24} color={theme.textSecondary} />
          <View>
            <Text style={styles(theme).statusText}>{t('shiftSwap.pending')}</Text>
            <Text style={styles(theme).workspaceName}>{request.workspaceName}</Text>
          </View>
        </View>
        {request.isOpenSwap && (
          <View style={styles(theme).openBadge}>
            <Text style={styles(theme).openBadgeText}>{t('shiftSwap.openSwap')}</Text>
          </View>
        )}
      </View>

      {!request.isOpenSwap && (
        <Text style={styles(theme).targetEmployee}>
          {t('shiftSwap.requestedTo')}: {request.targetEmployeeName}
        </Text>
      )}

      {request.message && (
        <View style={styles(theme).messageBox}>
          <Ionicons name="chatbox-outline" size={16} color={theme.textSecondary} />
          <Text style={styles(theme).messageText}>{request.message}</Text>
        </View>
      )}

      <View style={styles(theme).shiftsContainer}>
        {renderShiftCard(request.myShift, t('shiftSwap.myShift'))}
        {request.theirShift && (
          <>
            <Ionicons name="swap-horizontal" size={24} color={theme.primary} style={styles(theme).swapIcon} />
            {renderShiftCard(request.theirShift, t('shiftSwap.theirShift'))}
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles(theme).cancelButton}
        onPress={() => handleCancelSwap(request)}
      >
        <Ionicons name="close-circle-outline" size={18} color={theme.textSecondary} />
        <Text style={styles(theme).cancelButtonText}>{t('shiftSwap.cancelRequest')}</Text>
      </TouchableOpacity>

      <Text style={styles(theme).timestamp}>
        {new Date(request.createdAt).toLocaleDateString(i18n.language === 'da' ? 'da-DK' : 'en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles(theme).container}>
        <View style={styles(theme).header}>
          <View style={styles(theme).headerContent}>
            <Ionicons name="swap-horizontal" size={28} color={theme.primary} style={{ marginRight: 12 }} />
            <Text style={styles(theme).headerTitle}>{t('shiftSwap.title')}</Text>
          </View>
        </View>
        <View style={styles(theme).centerContent}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles(theme).container}>
      {/* Tabs */}
      <View style={styles(theme).tabContainer}>
        <TouchableOpacity
          style={[styles(theme).tab, activeTab === 'incoming' && styles(theme).activeTab]}
          onPress={() => setActiveTab('incoming')}
        >
          <Text style={[styles(theme).tabText, activeTab === 'incoming' && styles(theme).activeTabText]}>
            {t('shiftSwap.incoming')} ({incomingRequests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles(theme).tab, activeTab === 'sent' && styles(theme).activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles(theme).tabText, activeTab === 'sent' && styles(theme).activeTabText]}>
            {t('shiftSwap.sent')} ({myRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles(theme).content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {activeTab === 'incoming' ? (
          incomingRequests.length === 0 ? (
            <View style={styles(theme).emptyState}>
              <Ionicons name="swap-horizontal-outline" size={64} color={theme.textSecondary} />
              <Text style={styles(theme).emptyText}>{t('shiftSwap.noIncoming')}</Text>
            </View>
          ) : (
            incomingRequests.map(renderIncomingRequest)
          )
        ) : (
          myRequests.length === 0 ? (
            <View style={styles(theme).emptyState}>
              <Ionicons name="time-outline" size={64} color={theme.textSecondary} />
              <Text style={styles(theme).emptyText}>{t('shiftSwap.noSent')}</Text>
            </View>
          ) : (
            myRequests.map(renderMyRequest)
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  safeAreaSpacer: {
    height: 50,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    marginRight: 12,
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  activeTabText: {
    color: theme.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requesterName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  workspaceName: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  openBadge: {
    backgroundColor: theme.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
  },
  messageBox: {
    flexDirection: 'row',
    backgroundColor: theme.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    fontStyle: 'italic',
  },
  shiftsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  shiftCard: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  shiftLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  shiftDate: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  shiftName: {
    fontSize: 13,
    color: theme.text,
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  swapIcon: {
    marginHorizontal: -6,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  acceptButton: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  declineButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  acceptButtonText: {
    color: '#fff',
  },
  declineButtonText: {
    color: '#fff',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  targetEmployee: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 12,
  },
  timestamp: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 16,
  },
});
