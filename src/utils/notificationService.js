import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registers device for push notifications and saves token to Firestore
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;

    // Save token to user's Firestore document
    if (auth.currentUser && token) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          pushToken: token,
          pushTokenUpdatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error saving push token:', error);
      }
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Schedule a local notification for upcoming shift
 * @param {Object} shift - Shift object with date, startTime, employeeName
 * @param {number} minutesBefore - How many minutes before shift to notify
 * @param {string} workspaceName - Name of the workspace
 */
export async function scheduleShiftNotification(shift, minutesBefore, workspaceName) {
  try {
    console.log('Scheduling shift notification:', { shift, minutesBefore, workspaceName });

    // Parse shift date and time
    const [year, month, day] = shift.date.split('-').map(Number);
    const [hours, minutes] = shift.startTime.split(':').map(Number);

    const shiftDate = new Date(year, month - 1, day, hours, minutes);
    const notificationDate = new Date(shiftDate.getTime() - minutesBefore * 60 * 1000);

    console.log('Shift date:', shiftDate);
    console.log('Notification will be sent at:', notificationDate);
    console.log('Current time:', new Date());

    // Only schedule if notification time is in the future
    if (notificationDate > new Date()) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📅 Upcoming Shift Reminder',
          body: `Your ${shift.shiftName || 'shift'} at ${workspaceName} starts at ${shift.startTime}`,
          data: {
            type: 'shift_reminder',
            shiftId: shift.id,
            workspaceId: shift.workspaceId,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: 'date',
          date: notificationDate,
        },
      });

      console.log('Notification scheduled successfully with ID:', notificationId);
      return notificationId;
    } else {
      console.log('Notification not scheduled - time is in the past');
    }

    return null;
  } catch (error) {
    console.error('Error scheduling shift notification:', error);
    console.error('Shift data:', shift);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 * @param {string} notificationId - The notification ID to cancel
 */
export async function cancelScheduledNotification(notificationId) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Send a local notification immediately (for testing or instant notifications)
 */
export async function sendImmediateNotification(title, body, data = {}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending immediate notification:', error);
  }
}

/**
 * Get notification settings from user document
 * @returns {Object} Notification settings
 */
export async function getNotificationSettings() {
  try {
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        invitationsEnabled: userData.notificationSettings?.invitationsEnabled ?? true,
        shiftsEnabled: userData.notificationSettings?.shiftsEnabled ?? true,
        shiftReminderTime: userData.notificationSettings?.shiftReminderTime ?? 300, // Default 5 hours (300 minutes)
      };
    }
  } catch (error) {
    console.error('Error getting notification settings:', error);
  }

  return {
    invitationsEnabled: true,
    shiftsEnabled: true,
    shiftReminderTime: 300, // Default 5 hours
  };
}

/**
 * Update notification settings in user document
 */
export async function updateNotificationSettings(settings) {
  try {
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      notificationSettings: settings,
    });
    return true;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return false;
  }
}

/**
 * Send a push notification to a user via Expo Push API
 * @param {string} pushToken - The user's Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send with notification
 */
export async function sendPushNotification(pushToken, title, body, data = {}) {
  try {
    const message = {
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      priority: 'high',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data && result.data[0] && result.data[0].status === 'error') {
      console.error('Error sending push notification:', result.data[0].message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Send invitation notification to a user
 * @param {string} invitedUserId - User ID of the person being invited
 * @param {string} inviterName - Name of person sending invitation
 * @param {string} workspaceName - Name of the workspace
 */
export async function sendInvitationNotification(invitedUserId, inviterName, workspaceName) {
  try {
    // Get invited user's settings and push token
    const userDoc = await getDoc(doc(db, 'users', invitedUserId));
    if (!userDoc.exists()) {
      console.log('User not found:', invitedUserId);
      return false;
    }

    const userData = userDoc.data();
    const invitationsEnabled = userData.notificationSettings?.invitationsEnabled ?? true;
    const pushToken = userData.pushToken;

    // Check if user has notifications enabled
    if (!invitationsEnabled || !pushToken) {
      console.log('Notifications disabled or no push token for user:', invitedUserId);
      return false;
    }

    // Send push notification
    return await sendPushNotification(
      pushToken,
      '📬 Workspace Invitation',
      `${inviterName} invited you to join ${workspaceName}`,
      {
        type: 'workspace_invitation',
        inviterName: inviterName,
        workspaceName: workspaceName,
      }
    );
  } catch (error) {
    console.error('Error sending invitation notification:', error);
    return false;
  }
}
