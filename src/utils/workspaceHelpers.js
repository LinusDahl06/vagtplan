/**
 * Workspace Helper Functions
 * Utility functions for working with workspace data
 */

/**
 * Get total member count including owner
 * @param {object} workspace - Workspace object
 * @returns {number} - Total member count
 */
export const getTotalMemberCount = (workspace) => {
  if (!workspace) return 0;

  const ownerInEmployees = workspace.employees.some(emp => emp.userId === workspace.ownerId);
  return ownerInEmployees ? workspace.employees.length : workspace.employees.length + 1;
};

/**
 * Get employee count for a specific role, including owner if applicable
 * @param {object} workspace - Workspace object
 * @param {string} roleId - Role ID to count
 * @returns {number} - Employee count for this role
 */
export const getEmployeeCountForRole = (workspace, roleId) => {
  if (!workspace) return 0;

  let count = workspace.employees.filter(emp => emp.roleId === roleId).length;

  // If this is the Owner role (id: '1') and owner is not in employees array, add 1
  if (roleId === '1') {
    const ownerInEmployees = workspace.employees.some(emp => emp.userId === workspace.ownerId);
    if (!ownerInEmployees) {
      count += 1;
    }
  }

  return count;
};

/**
 * Check if owner is in employees array
 * @param {object} workspace - Workspace object
 * @returns {boolean} - True if owner is in employees array
 */
export const isOwnerInEmployees = (workspace) => {
  if (!workspace) return false;
  return workspace.employees.some(emp => emp.userId === workspace.ownerId);
};

/**
 * Get all employees including owner if not already in list
 * @param {object} workspace - Workspace object
 * @param {object} ownerInfo - Owner user info (name, email, photoURL, etc.)
 * @returns {array} - Array of all employees including owner
 */
export const getAllEmployeesIncludingOwner = (workspace, ownerInfo) => {
  if (!workspace) return [];

  const allEmployees = [...workspace.employees];
  const ownerInEmployees = workspace.employees.some(emp => emp.userId === workspace.ownerId);

  if (!ownerInEmployees && ownerInfo) {
    allEmployees.unshift({
      userId: workspace.ownerId,
      name: ownerInfo.name,
      username: ownerInfo.username,
      email: ownerInfo.email,
      photoURL: ownerInfo.photoURL || null,
      roleId: '1', // Owner role
      color: ownerInfo.color || null
    });
  }

  return allEmployees;
};
