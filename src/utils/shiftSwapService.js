import { collection, addDoc, updateDoc, doc, query, where, getDocs, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { sendPushNotification } from './notificationService';

/**
 * Create a shift swap request
 * @param {Object} params - Swap request parameters
 * @param {string} params.workspaceId - Workspace ID
 * @param {string} params.workspaceName - Workspace name
 * @param {Object} params.myShift - The shift being offered
 * @param {Object} params.theirShift - The shift being requested (optional for open swaps)
 * @param {string} params.targetEmployeeId - Employee to swap with (optional for open swaps)
 * @param {string} params.targetEmployeeName - Name of employee to swap with
 * @param {string} params.message - Optional message
 */
export async function createShiftSwapRequest({
  workspaceId,
  workspaceName,
  myShift,
  theirShift = null,
  targetEmployeeId = null,
  targetEmployeeName = '',
  message = ''
}) {
  try {
    const currentUser = auth.currentUser;
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const userData = userDoc.data();

    const swapRequest = {
      workspaceId,
      workspaceName,
      requesterId: currentUser.uid,
      requesterName: userData.name,
      myShift: {
        id: myShift.id,
        date: myShift.date,
        startTime: myShift.startTime,
        endTime: myShift.endTime,
        shiftName: myShift.shiftName,
        hours: myShift.hours
      },
      targetEmployeeId,
      targetEmployeeName,
      theirShift: theirShift ? {
        id: theirShift.id,
        date: theirShift.date,
        startTime: theirShift.startTime,
        endTime: theirShift.endTime,
        shiftName: theirShift.shiftName,
        hours: theirShift.hours
      } : null,
      message,
      status: 'pending', // pending, accepted, declined, cancelled
      createdAt: new Date().toISOString(),
      isOpenSwap: !targetEmployeeId // Open swap if no specific target
    };

    const docRef = await addDoc(collection(db, 'shiftSwapRequests'), swapRequest);

    // Send notification to target employee if specified
    if (targetEmployeeId) {
      await notifySwapRequest(targetEmployeeId, userData.name, workspaceName, myShift);
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating shift swap request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Accept a shift swap request
 * @param {string} swapRequestId - ID of the swap request
 * @param {Object} workspace - Workspace object
 */
export async function acceptShiftSwapRequest(swapRequestId, workspace) {
  try {
    const swapDoc = await getDoc(doc(db, 'shiftSwapRequests', swapRequestId));
    if (!swapDoc.exists()) {
      throw new Error('Swap request not found');
    }

    const swapData = swapDoc.data();

    // Update the shifts in the workspace schedule
    const updatedSchedule = [...workspace.schedule];

    // Find and update the shifts
    const myShiftIndex = updatedSchedule.findIndex(s => s.id === swapData.myShift.id);
    const theirShiftIndex = swapData.theirShift
      ? updatedSchedule.findIndex(s => s.id === swapData.theirShift.id)
      : -1;

    if (myShiftIndex === -1) {
      throw new Error('Original shift not found');
    }

    // Swap the employee IDs
    if (theirShiftIndex !== -1) {
      const tempEmployeeId = updatedSchedule[myShiftIndex].employeeId;
      const tempEmployeeName = updatedSchedule[myShiftIndex].employeeName;

      updatedSchedule[myShiftIndex].employeeId = updatedSchedule[theirShiftIndex].employeeId;
      updatedSchedule[myShiftIndex].employeeName = updatedSchedule[theirShiftIndex].employeeName;

      updatedSchedule[theirShiftIndex].employeeId = tempEmployeeId;
      updatedSchedule[theirShiftIndex].employeeName = tempEmployeeName;
    } else {
      // For open swaps, just assign the shift to the accepter
      updatedSchedule[myShiftIndex].employeeId = auth.currentUser.uid;
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      updatedSchedule[myShiftIndex].employeeName = userDoc.data().name;
    }

    // Update workspace
    await updateDoc(doc(db, 'workspaces', workspace.id), {
      schedule: updatedSchedule
    });

    // Update swap request status
    await updateDoc(doc(db, 'shiftSwapRequests', swapRequestId), {
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      acceptedBy: auth.currentUser.uid
    });

    // Notify requester
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    await notifySwapAccepted(swapData.requesterId, userDoc.data().name, swapData.workspaceName);

    // Notify workspace owner
    await notifyOwnerOfSwap(
      workspace.ownerId,
      swapData.requesterName,
      userDoc.data().name,
      swapData.myShift,
      swapData.workspaceName
    );

    return { success: true };
  } catch (error) {
    console.error('Error accepting shift swap:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Decline a shift swap request
 * @param {string} swapRequestId - ID of the swap request
 */
export async function declineShiftSwapRequest(swapRequestId) {
  try {
    const swapDoc = await getDoc(doc(db, 'shiftSwapRequests', swapRequestId));
    if (!swapDoc.exists()) {
      throw new Error('Swap request not found');
    }

    const swapData = swapDoc.data();

    await updateDoc(doc(db, 'shiftSwapRequests', swapRequestId), {
      status: 'declined',
      declinedAt: new Date().toISOString(),
      declinedBy: auth.currentUser.uid
    });

    // Notify requester
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    await notifySwapDeclined(swapData.requesterId, userDoc.data().name, swapData.workspaceName);

    return { success: true };
  } catch (error) {
    console.error('Error declining shift swap:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancel a shift swap request (by requester)
 * @param {string} swapRequestId - ID of the swap request
 */
export async function cancelShiftSwapRequest(swapRequestId) {
  try {
    await updateDoc(doc(db, 'shiftSwapRequests', swapRequestId), {
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error cancelling shift swap:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get pending swap requests for a user
 * @param {string} userId - User ID
 * @param {string} workspaceId - Workspace ID (optional)
 */
export async function getPendingSwapRequests(userId, workspaceId = null) {
  try {
    const swapRequestsRef = collection(db, 'shiftSwapRequests');
    let q;

    if (workspaceId) {
      // Get swaps for specific workspace where user is target or it's an open swap
      q = query(
        swapRequestsRef,
        where('workspaceId', '==', workspaceId),
        where('status', '==', 'pending')
      );
    } else {
      // Get all pending swaps for user
      q = query(
        swapRequestsRef,
        where('status', '==', 'pending')
      );
    }

    const snapshot = await getDocs(q);
    const swaps = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Include if user is target, or it's an open swap and user is not requester
      if (data.targetEmployeeId === userId ||
          (data.isOpenSwap && data.requesterId !== userId)) {
        swaps.push({ id: doc.id, ...data });
      }
    });

    return swaps;
  } catch (error) {
    console.error('Error getting pending swap requests:', error);
    return [];
  }
}

/**
 * Get swap requests created by a user
 * @param {string} userId - User ID
 */
export async function getMySwapRequests(userId) {
  try {
    const swapRequestsRef = collection(db, 'shiftSwapRequests');
    const q = query(
      swapRequestsRef,
      where('requesterId', '==', userId),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    const swaps = [];

    snapshot.forEach((doc) => {
      swaps.push({ id: doc.id, ...doc.data() });
    });

    return swaps;
  } catch (error) {
    console.error('Error getting my swap requests:', error);
    return [];
  }
}

/**
 * Send notification for new swap request
 */
async function notifySwapRequest(targetUserId, requesterName, workspaceName, shift) {
  try {
    const userDoc = await getDoc(doc(db, 'users', targetUserId));
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const pushToken = userData.pushToken;

    if (!pushToken) return;

    await sendPushNotification(
      pushToken,
      '🔄 Shift Swap Request',
      `${requesterName} wants to swap shifts with you at ${workspaceName}`,
      {
        type: 'shift_swap_request',
        requesterName,
        workspaceName
      }
    );
  } catch (error) {
    console.error('Error sending swap request notification:', error);
  }
}

/**
 * Send notification when swap is accepted
 */
async function notifySwapAccepted(requesterId, accepterName, workspaceName) {
  try {
    const userDoc = await getDoc(doc(db, 'users', requesterId));
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const pushToken = userData.pushToken;

    if (!pushToken) return;

    await sendPushNotification(
      pushToken,
      '✅ Shift Swap Accepted',
      `${accepterName} accepted your shift swap request at ${workspaceName}`,
      {
        type: 'shift_swap_accepted',
        accepterName,
        workspaceName
      }
    );
  } catch (error) {
    console.error('Error sending swap accepted notification:', error);
  }
}

/**
 * Send notification when swap is declined
 */
async function notifySwapDeclined(requesterId, declinerName, workspaceName) {
  try {
    const userDoc = await getDoc(doc(db, 'users', requesterId));
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const pushToken = userData.pushToken;

    if (!pushToken) return;

    await sendPushNotification(
      pushToken,
      '❌ Shift Swap Declined',
      `${declinerName} declined your shift swap request at ${workspaceName}`,
      {
        type: 'shift_swap_declined',
        declinerName,
        workspaceName
      }
    );
  } catch (error) {
    console.error('Error sending swap declined notification:', error);
  }
}

/**
 * Send notification to workspace owner when a swap is completed
 */
async function notifyOwnerOfSwap(ownerId, requesterName, accepterName, shift, workspaceName) {
  try {
    // Don't notify if owner is one of the people in the swap
    if (ownerId === auth.currentUser.uid) return;

    const ownerDoc = await getDoc(doc(db, 'users', ownerId));
    if (!ownerDoc.exists()) return;

    const ownerData = ownerDoc.data();
    const pushToken = ownerData.pushToken;

    if (!pushToken) return;

    const shiftDate = new Date(shift.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    await sendPushNotification(
      pushToken,
      '🔄 Shift Swap Completed',
      `${requesterName} and ${accepterName} swapped shifts (${shift.shiftName || 'Shift'} on ${shiftDate}) at ${workspaceName}`,
      {
        type: 'shift_swap_owner_notification',
        requesterName,
        accepterName,
        workspaceName,
        shiftDate: shift.date
      }
    );
  } catch (error) {
    console.error('Error sending owner swap notification:', error);
  }
}
