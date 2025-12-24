// Employee color palette - 20 distinct colors designed for both light and dark themes
export const employeeColorPalette = [
  '#10b981', // Emerald green
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#a855f7', // Violet
  '#ef4444', // Red
  '#22c55e', // Green
  '#6366f1', // Indigo
  '#eab308', // Yellow
  '#d946ef', // Fuchsia
  '#0ea5e9', // Sky blue
  '#f43f5e', // Rose
  '#84cc16', // Lime
  '#a78bfa', // Light purple
  '#fb923c', // Light orange
  '#2dd4bf', // Light teal
];

/**
 * Generates a consistent color for an employee based on their userId
 * @param {string} userId - The user's unique ID
 * @returns {string} A hex color code
 */
export function getEmployeeColor(userId) {
  if (!userId) return employeeColorPalette[0];

  // Create a simple hash from the userId to get a consistent index
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Use the hash to select a color from the palette
  const index = Math.abs(hash) % employeeColorPalette.length;
  return employeeColorPalette[index];
}

/**
 * Converts a hex color to RGBA with specified alpha transparency
 * Optionally boosts saturation for current user's shifts
 * @param {string} color - Hex color code
 * @param {number} alpha - Transparency (0-1)
 * @param {boolean} isCurrentUser - Whether this is the current user's shift
 * @returns {string} RGBA color string
 */
export function getColorWithAlpha(color, alpha = 0.15, isCurrentUser = false) {
  if (!color) return `rgba(128, 128, 128, ${alpha})`;

  // Convert hex to RGB
  const hex = color.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // If current user's shift, boost saturation and opacity
  if (isCurrentUser) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    // Boost the dominant color channel
    if (max !== min) {
      const boost = 1.25;
      if (r === max) r = Math.min(255, r * boost);
      else if (g === max) g = Math.min(255, g * boost);
      else if (b === max) b = Math.min(255, b * boost);
    }

    // Increase opacity for current user
    alpha = Math.min(1, alpha * 1.5);
  }

  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
}

/**
 * Creates a more vibrant version of a color by boosting saturation
 * Used for border colors of current user's shifts
 * @param {string} color - Hex color code
 * @returns {string} Enhanced hex color code
 */
export function getVibrantColor(color) {
  if (!color) return '#808080';

  // Convert hex to RGB
  const hex = color.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Boost saturation by enhancing the dominant color
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  if (max !== min) {
    const boost = 1.3;
    if (r === max) r = Math.min(255, r * boost);
    else if (g === max) g = Math.min(255, g * boost);
    else if (b === max) b = Math.min(255, b * boost);
  }

  // Convert back to hex
  const toHex = (num) => Math.round(num).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
