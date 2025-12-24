/**
 * Subscription Management Utilities
 * Handles subscription tiers, limits, and validation
 */

// Subscription tier constants
export const SUBSCRIPTION_TIERS = {
  BASIC: 'basic',
  EXTENDED: 'extended',
  UNLIMITED: 'unlimited'
};

// Subscription limits configuration
export const SUBSCRIPTION_LIMITS = {
  [SUBSCRIPTION_TIERS.BASIC]: {
    maxWorkspaces: 1,
    maxEmployeesPerWorkspace: 8,
    name: 'Basic',
    nameKey: 'subscriptions.tiers.basic.name'
  },
  [SUBSCRIPTION_TIERS.EXTENDED]: {
    maxWorkspaces: 3,
    maxEmployeesPerWorkspace: 15,
    name: 'Extended',
    nameKey: 'subscriptions.tiers.extended.name'
  },
  [SUBSCRIPTION_TIERS.UNLIMITED]: {
    maxWorkspaces: Infinity,
    maxEmployeesPerWorkspace: Infinity,
    name: 'Unlimited',
    nameKey: 'subscriptions.tiers.unlimited.name'
  }
};

/**
 * Get subscription limits for a given tier
 * @param {string} tier - Subscription tier
 * @returns {object} Subscription limits
 */
export function getSubscriptionLimits(tier) {
  return SUBSCRIPTION_LIMITS[tier] || SUBSCRIPTION_LIMITS[SUBSCRIPTION_TIERS.BASIC];
}

/**
 * Check if user can create a new workspace
 * @param {string} tier - User's subscription tier
 * @param {number} currentWorkspaceCount - Number of workspaces user currently owns
 * @returns {object} { allowed: boolean, reason: string }
 */
export function canCreateWorkspace(tier, currentWorkspaceCount) {
  const limits = getSubscriptionLimits(tier);

  if (currentWorkspaceCount >= limits.maxWorkspaces) {
    return {
      allowed: false,
      reason: 'workspace_limit_reached',
      limit: limits.maxWorkspaces
    };
  }

  return { allowed: true };
}

/**
 * Check if user can add an employee to a workspace
 * @param {string} tier - User's subscription tier
 * @param {number} currentEmployeeCount - Number of employees currently in workspace
 * @returns {object} { allowed: boolean, reason: string }
 */
export function canAddEmployee(tier, currentEmployeeCount) {
  const limits = getSubscriptionLimits(tier);

  if (currentEmployeeCount >= limits.maxEmployeesPerWorkspace) {
    return {
      allowed: false,
      reason: 'employee_limit_reached',
      limit: limits.maxEmployeesPerWorkspace
    };
  }

  return { allowed: true };
}

/**
 * Get user's current workspace count (workspaces they own)
 * @param {array} workspaces - All workspaces
 * @param {string} userId - User ID
 * @returns {number} Number of workspaces owned by user
 */
export function getUserWorkspaceCount(workspaces, userId) {
  if (!workspaces || !userId) return 0;
  return workspaces.filter(ws => ws.ownerId === userId).length;
}

/**
 * Get employee count for a workspace (including owner if not in employees array)
 * @param {object} workspace - Workspace object
 * @returns {number} Total employee count
 */
export function getWorkspaceEmployeeCount(workspace) {
  if (!workspace) return 0;

  const ownerInEmployees = workspace.employees?.some(emp => emp.userId === workspace.ownerId);
  const employeeCount = workspace.employees?.length || 0;

  return ownerInEmployees ? employeeCount : employeeCount + 1;
}

/**
 * Check if workspace would exceed limits with new employee
 * @param {string} tier - User's subscription tier
 * @param {object} workspace - Workspace object
 * @returns {object} { allowed: boolean, reason: string, currentCount: number, limit: number }
 */
export function canWorkspaceAddEmployee(tier, workspace) {
  const currentCount = getWorkspaceEmployeeCount(workspace);
  const limits = getSubscriptionLimits(tier);

  if (currentCount >= limits.maxEmployeesPerWorkspace) {
    return {
      allowed: false,
      reason: 'employee_limit_reached',
      currentCount,
      limit: limits.maxEmployeesPerWorkspace
    };
  }

  return { allowed: true, currentCount, limit: limits.maxEmployeesPerWorkspace };
}

/**
 * Get default subscription tier for new users
 * @returns {string} Default tier
 */
export function getDefaultSubscriptionTier() {
  return SUBSCRIPTION_TIERS.BASIC;
}

/**
 * Validate subscription tier
 * @param {string} tier - Tier to validate
 * @returns {boolean} True if valid tier
 */
export function isValidSubscriptionTier(tier) {
  return Object.values(SUBSCRIPTION_TIERS).includes(tier);
}

/**
 * Get formatted subscription info for display
 * @param {string} tier - Subscription tier
 * @returns {object} Formatted subscription info
 */
export function getSubscriptionInfo(tier) {
  const limits = getSubscriptionLimits(tier);

  return {
    tier,
    name: limits.name,
    nameKey: limits.nameKey,
    maxWorkspaces: limits.maxWorkspaces === Infinity ? 'Unlimited' : limits.maxWorkspaces,
    maxEmployees: limits.maxEmployeesPerWorkspace === Infinity ? 'Unlimited' : limits.maxEmployeesPerWorkspace,
    isUnlimited: tier === SUBSCRIPTION_TIERS.UNLIMITED
  };
}
