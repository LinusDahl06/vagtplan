# Remaining Translation Updates - Quick Implementation Script

## ✅ COMPLETED
- SettingsScreen.js - Fully translated
- LoginScreen.js - Fully translated
- EmployeesView.js - Fully translated
- WorkspaceOverviewScreen.js - Default data translated (roles & shifts)

## 📝 REMAINING FILES

For each file below, follow these 3 simple steps:

### Step 1: Add Import
```javascript
import { useTranslation } from 'react-i18next';
```

### Step 2: Add Hook
```javascript
const { t } = useTranslation();
```

### Step 3: Replace Strings (see specific replacements below)

---

## 1. RolesView.js

**Strings to Replace:**

| Current String | Replace With |
|---|---|
| `'Roles & Permissions'` | `{t('roles.title')}` |
| `${roles.length} role/roles` | `{t('roles.count', { count: roles.length })}` |
| `'Roles are hierarchical...'` | `{t('roles.infoCard')}` |
| `'No roles defined'` | `{t('roles.emptyState.title')}` |
| `'Create roles to organize...'` | `{t('roles.emptyState.subtitle')}` |
| `'Add Role'` | `{t('roles.addRole')}` |
| `'Create New Role'` | `{t('roles.createModal.title')}` |
| `'Define a role with...'` | `{t('roles.createModal.subtitle')}` |
| `'Role name (e.g., Manager)'` | `{t('roles.createModal.placeholder')}` |
| `'Create Role'` | `{t('roles.createRole')}` |
| `'Creating...'` | `{t('roles.creating')}` |
| `'Edit Role'` | `{t('roles.editRole')}` |
| `'Save Changes'` | `{t('roles.saveChanges')}` |
| `'Saving...'` | `{t('roles.saving')}` |
| `'Delete Role'` | `{t('roles.deleteRole')}` |
| `'OWNER'` | `{t('roles.ownerBadge')}` |
| `${count} member/members` | `{t('roles.memberCount', { count })}` |
| `'+${count} more'` | `{t('roles.morePermissions', { count })}` |
| `'Manage Employees'` | `{t('roles.permissions.manage_employees')}` |
| `'Manage Roles'` | `{t('roles.permissions.manage_roles')}` |
| `'Manage Shifts'` | `{t('roles.permissions.manage_shifts')}` |
| `'Manage Schedule'` | `{t('roles.permissions.manage_schedule')}` |
| `'Analytics'` | `{t('roles.permissions.analytics')}` |

**Alerts:**
- `Alert.alert('Error', 'Please enter a role name')` → `Alert.alert(t('common.error'), t('roles.errors.enterName'))`
- `Alert.alert('Success', 'Role updated!')` → `Alert.alert(t('common.success'), t('roles.success.updated'))`

---

## 2. ShiftsView.js

**Strings to Replace:**

| Current String | Replace With |
|---|---|
| `'Shift Presets'` | `{t('shifts.title')}` |
| `${presets.length} preset/presets` | `{t('shifts.count', { count: presets.length })}` |
| `'Create reusable shift templates...'` | `{t('shifts.description')}` |
| `'Add Shift Preset'` | `{t('shifts.addShiftPreset')}` |
| `'No shift presets yet'` | `{t('shifts.emptyState.title')}` |
| `'Create shift templates...'` | `{t('shifts.emptyState.subtitle')}` |
| `'Create First Preset'` | `{t('shifts.emptyState.createButton')}` |
| `'Create Shift Preset'` | `{t('shifts.createModal.title')}` |
| `'Shift name (e.g., Morning Shift)'` | `{t('shifts.createModal.namePlaceholder')}` |
| `'Duration in hours (e.g., 8)'` | `{t('shifts.createModal.hoursPlaceholder')}` |
| `'${hours} hours'` | `{t('shifts.hoursLabel', { hours })}` |
| `'Create Preset'` | `{t('shifts.createPreset')}` |
| `'Creating...'` | `{t('shifts.creating')}` |

**Alerts:**
- All error alerts → use `t('common.error')` + `t('shifts.errors.*')`
- Success alerts → use `t('common.success')` + `t('shifts.success.*')`

---

## 3. WorkspaceScreen.js

**Strings to Replace:**

| Current String | Replace With |
|---|---|
| `'Calendar'` | `{t('workspace.tabs.calendar')}` |
| `'Employees'` | `{t('workspace.tabs.employees')}` |
| `'Analytics'` | `{t('workspace.tabs.analytics')}` |
| `'Settings'` | `{t('workspace.tabs.settings')}` |
| `'Back'` | `{t('common.back')}` |
| `'Owner'` | `{t('common.owner')}` |

---

## 4. WorkspaceOverviewScreen.js (UI Text)

**Add these imports:**
```javascript
import { useTranslation } from 'react-i18next';
```

**In component:**
```javascript
const { t } = useTranslation();
```

**Strings to Replace:**

| Current String | Replace With |
|---|---|
| `'My Workspaces'` | `{t('workspaceOverview.title')}` |
| `'Total Workspaces'` | `{t('workspaceOverview.totalWorkspaces')}` |
| `'Owned'` | `{t('workspaceOverview.owned')}` |
| `'Member'` | `{t('workspaceOverview.member')}` |
| `'Loading workspaces...'` | `{t('workspaceOverview.loadingWorkspaces')}` |
| `'No workspaces yet'` | `{t('workspaceOverview.emptyState.title')}` |
| `'Create your first workspace...'` | `{t('workspaceOverview.emptyState.subtitle')}` |
| `'Create Workspace'` | `{t('workspaceOverview.emptyState.createButton')}` |
| `'Workspace Name'` | `{t('workspaceOverview.createModal.placeholder')}` |
| `${members.length} members` | `{members.length} {t('common.members')}` |
| `'Owner'` (badge) | `{t('common.owner')}` |

**Alerts:**
- Replace all `Alert.alert('Error', ...)` → `Alert.alert(t('common.error'), t('workspaceOverview.errors.*'))`
- Replace all `Alert.alert('Success', ...)` → `Alert.alert(t('common.success'), t('workspaceOverview.success.*'))`

---

## 5. SignupScreen.js

This one is more complex due to multi-step form. Here's the pattern:

**Steps array:**
```javascript
const steps = [
  {
    title: t('signup.steps.username.title'),
    subtitle: t('signup.steps.username.subtitle'),
    placeholder: t('signup.steps.username.placeholder'),
    // ...
  },
  {
    title: t('signup.steps.name.title'),
    subtitle: t('signup.steps.name.subtitle'),
    placeholder: t('signup.steps.name.placeholder'),
    // ...
  },
  // ... etc for email, password, profilePicture
];
```

**Buttons:**
- `'Continue'` → `{t('signup.continue')}`
- `'Previous'` → `{t('signup.previous')}`
- `'Skip for now'` → `{t('signup.skipForNow')}`
- `'Create Account'` → `{t('auth.createAccount')}`
- `'Creating account...'` → `{t('auth.creatingAccount')}`

**All error alerts:**
- Use `t('common.error')` + `t('signup.errors.*')`

---

## 6. CalendarView.js

**Main strings:**
- `'Week'` → `{t('calendar.viewMode.week')}`
- `'Month'` → `{t('calendar.viewMode.month')}`
- Day names → `{t('calendar.days.monday')}`, etc.
- `'Add Shift'` → `{t('calendar.addShift')}`
- `'Select Employee'` → `{t('calendar.selectEmployee')}`
- `'Select Shift Preset'` → `{t('calendar.selectShiftPreset')}`
- `'Custom Hours'` → `{t('calendar.customHours')}`

---

## 7. AnalyticsView.js

**Main strings:**
- `'Analytics'` → `{t('analytics.title')}`
- `'Hours This Month'` → `{t('analytics.hoursThisMonth', { month: monthName })}`
- `'Monthly Hours Trend'` → `{t('analytics.monthlyTrend')}`
- `'Chart View'` → `{t('analytics.chartView')}`
- `'Table View'` → `{t('analytics.tableView')}`
- `'Select Employee'` → `{t('analytics.selectEmployee')}`
- `'No data available...'` → `{t('analytics.noDataAvailable')}`

---

## 8. ScheduleManagementView.js

**Main strings:**
- `'Schedule Management'` → `{t('scheduleManagement.title')}`
- `'Clear Month Schedule'` → `{t('scheduleManagement.clearMonth.title')}`
- `'Remove all shifts for...'` → `{t('scheduleManagement.clearMonth.description')}`
- `'Clear Month Schedule'` (button) → `{t('scheduleManagement.clearMonth.button')}`
- `'CLEAR MONTH'` → `{t('scheduleManagement.clearMonth.confirmKeyword')}`
- `'Clear All Schedules'` → `{t('scheduleManagement.clearAll.title')}`
- `'DELETE ALL'` → `{t('scheduleManagement.clearAll.confirmKeyword')}`

---

## Quick Testing Checklist

After updating each file:

1. ✅ Does the app compile without errors?
2. ✅ Switch to Danish in Settings - does text change?
3. ✅ Switch back to English - does it work?
4. ✅ Test the specific screen's functionality
5. ✅ Create a new workspace - are defaults in selected language?

---

## Common Patterns

### Alert Pattern
```javascript
// Before:
Alert.alert('Error', 'Something went wrong');

// After:
Alert.alert(t('common.error'), t('section.errors.specificError'));
```

### Conditional Text
```javascript
// Before:
{loading ? 'Loading...' : 'Save'}

// After:
{loading ? t('common.loading') : t('common.save')}
```

### Pluralization
```javascript
// Before:
`${count} role${count === 1 ? '' : 's'}`

// After:
{t('roles.count', { count })}
```

The translation files handle pluralization automatically with `_plural` suffix.

---

## Need Help?

All translation keys are in:
- `src/i18n/locales/en.json`
- `src/i18n/locales/da.json`

Search these files for the exact key names!
