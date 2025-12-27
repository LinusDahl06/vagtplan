import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';

/**
 * Request calendar permissions
 */
export async function requestCalendarPermissions() {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();

    if (status !== 'granted') {
      return { granted: false };
    }

    return { granted: true };
  } catch (error) {
    console.error('Error requesting calendar permissions:', error);
    return { granted: false, error };
  }
}

/**
 * Get or create the ScheduHub calendar
 */
async function getOrCreateCalendar() {
  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

    // Look for existing ScheduHub calendar
    let scheduHubCalendar = calendars.find(cal => cal.title === 'ScheduHub');

    if (scheduHubCalendar) {
      return scheduHubCalendar.id;
    }

    // Create new calendar
    const defaultCalendarSource =
      Platform.OS === 'ios'
        ? await getDefaultCalendarSource()
        : { isLocalAccount: true, name: 'ScheduHub', type: Calendar.SourceType.LOCAL };

    const newCalendarId = await Calendar.createCalendarAsync({
      title: 'ScheduHub',
      color: '#7c3aed', // Primary brand color
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: defaultCalendarSource.id,
      source: defaultCalendarSource,
      name: 'ScheduHub',
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    return newCalendarId;
  } catch (error) {
    console.error('Error getting/creating calendar:', error);
    throw error;
  }
}

/**
 * Get default calendar source for iOS
 */
async function getDefaultCalendarSource() {
  const sources = await Calendar.getSourcesAsync();
  const defaultSource = sources.find(s => s.name === 'Default') || sources[0];
  return defaultSource;
}

/**
 * Export a single shift to device calendar
 */
export async function exportShiftToCalendar(shift, workspaceName) {
  try {
    // Request permissions
    const { granted } = await requestCalendarPermissions();
    if (!granted) {
      throw new Error('Calendar permission not granted');
    }

    // Get or create calendar
    const calendarId = await getOrCreateCalendar();

    // Parse shift date and times
    const shiftDate = new Date(shift.date);
    const [startHour, startMinute] = shift.startTime.split(':').map(Number);
    const [endHour, endMinute] = shift.endTime.split(':').map(Number);

    const startDate = new Date(shiftDate);
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date(shiftDate);
    endDate.setHours(endHour, endMinute, 0, 0);

    // If end time is before start time, it means it ends the next day
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    // Create event
    const eventId = await Calendar.createEventAsync(calendarId, {
      title: `${shift.shiftName || 'Shift'} - ${workspaceName}`,
      startDate: startDate,
      endDate: endDate,
      location: workspaceName,
      notes: `Employee: ${shift.employeeName}\nHours: ${shift.hours}`,
      alarms: [
        { relativeOffset: -60 }, // 1 hour before
        { relativeOffset: -30 }, // 30 minutes before
      ],
    });

    return { success: true, eventId };
  } catch (error) {
    console.error('Error exporting shift to calendar:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export multiple shifts to device calendar
 */
export async function exportShiftsToCalendar(shifts, workspaceName, onProgress = null) {
  try {
    // Request permissions
    const { granted } = await requestCalendarPermissions();
    if (!granted) {
      throw new Error('Calendar permission not granted');
    }

    // Get or create calendar
    const calendarId = await getOrCreateCalendar();

    const results = {
      total: shifts.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < shifts.length; i++) {
      const shift = shifts[i];

      try {
        // Parse shift date and times
        const shiftDate = new Date(shift.date);
        const [startHour, startMinute] = shift.startTime.split(':').map(Number);
        const [endHour, endMinute] = shift.endTime.split(':').map(Number);

        const startDate = new Date(shiftDate);
        startDate.setHours(startHour, startMinute, 0, 0);

        const endDate = new Date(shiftDate);
        endDate.setHours(endHour, endMinute, 0, 0);

        // If end time is before start time, it means it ends the next day
        if (endDate < startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }

        // Create event
        await Calendar.createEventAsync(calendarId, {
          title: `${shift.shiftName || 'Shift'} - ${workspaceName}`,
          startDate: startDate,
          endDate: endDate,
          location: workspaceName,
          notes: `Employee: ${shift.employeeName}\nHours: ${shift.hours}`,
          alarms: [
            { relativeOffset: -60 }, // 1 hour before
            { relativeOffset: -30 }, // 30 minutes before
          ],
        });

        results.successful++;
      } catch (error) {
        console.error(`Error exporting shift ${shift.id}:`, error);
        results.failed++;
        results.errors.push({ shift: shift.id, error: error.message });
      }

      // Report progress
      if (onProgress) {
        onProgress((i + 1) / shifts.length);
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error exporting shifts to calendar:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Export user's own shifts for a date range
 */
export async function exportMyShifts(userId, shifts, workspaceName, startDate = null, endDate = null) {
  try {
    // Filter shifts for current user
    let userShifts = shifts.filter(shift => shift.employeeId === userId);

    // Filter by date range if provided
    if (startDate) {
      userShifts = userShifts.filter(shift => new Date(shift.date) >= new Date(startDate));
    }
    if (endDate) {
      userShifts = userShifts.filter(shift => new Date(shift.date) <= new Date(endDate));
    }

    if (userShifts.length === 0) {
      return { success: false, error: 'No shifts found for export' };
    }

    return await exportShiftsToCalendar(userShifts, workspaceName);
  } catch (error) {
    console.error('Error exporting my shifts:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear all ScheduHub events from the calendar
 */
export async function clearScheduHubCalendar() {
  try {
    const { granted } = await requestCalendarPermissions();
    if (!granted) {
      throw new Error('Calendar permission not granted');
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const scheduHubCalendar = calendars.find(cal => cal.title === 'ScheduHub');

    if (!scheduHubCalendar) {
      return { success: true, message: 'No ScheduHub calendar found' };
    }

    // Get all events from the calendar
    const now = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(now.getFullYear() + 1);

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const events = await Calendar.getEventsAsync(
      [scheduHubCalendar.id],
      oneYearAgo,
      oneYearFromNow
    );

    // Delete all events
    for (const event of events) {
      await Calendar.deleteEventAsync(event.id);
    }

    return { success: true, deletedCount: events.length };
  } catch (error) {
    console.error('Error clearing calendar:', error);
    return { success: false, error: error.message };
  }
}
