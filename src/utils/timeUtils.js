/**
 * Calculates the total hours between two times
 * Handles overnight shifts (e.g., 22:00 to 06:00)
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {number} Total hours (rounded to 2 decimal places)
 */
export function calculateHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;

  // Handle overnight shifts (e.g., 22:00 to 06:00)
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // Add 24 hours
  }

  const totalMinutes = endMinutes - startMinutes;
  return Math.round((totalMinutes / 60) * 100) / 100; // 2 decimal places
}

/**
 * Formats a time range for display
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {string} Formatted time range (e.g., "09:00 - 17:00")
 */
export function formatTimeRange(startTime, endTime) {
  if (!startTime || !endTime) return '';

  const formatTo24Hour = (time) => {
    const [hour, minute] = time.split(':').map(Number);
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  return `${formatTo24Hour(startTime)} - ${formatTo24Hour(endTime)}`;
}

/**
 * Converts 24-hour time to 12-hour format
 * @param {string} time - Time in HH:MM format
 * @returns {string} Time in 12-hour format (e.g., "2:30 PM")
 */
export function formatTime12Hour(time) {
  if (!time) return '';

  const [hour, minute] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

/**
 * Generates an array of time options in 30-minute intervals
 * @returns {string[]} Array of time strings in HH:MM format
 */
export function generateTimeOptions() {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeString);
    }
  }
  return times;
  // Returns: ['00:00', '00:30', '01:00', '01:30', ..., '23:00', '23:30']
}

/**
 * Validates if a time string is in correct HH:MM format
 * @param {string} time - Time string to validate
 * @returns {boolean} True if valid
 */
export function isValidTime(time) {
  if (!time) return false;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Gets the current time in HH:MM format
 * @returns {string} Current time
 */
export function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
