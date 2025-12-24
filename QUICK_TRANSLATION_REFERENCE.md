# Quick Translation Reference

## Quick Start: Translate a Screen in 3 Steps

### Step 1: Add the import
```javascript
import { useTranslation } from 'react-i18next';
```

### Step 2: Add the hook
```javascript
export default function YourScreen() {
  const { t } = useTranslation();
  // ...
}
```

### Step 3: Replace strings
```javascript
// Before:
<Text>Settings</Text>

// After:
<Text>{t('settings.title')}</Text>
```

## Common Patterns

### Simple Text
```javascript
<Text>{t('common.save')}</Text>
```

### Placeholders
```javascript
<TextInput
  placeholder={t('login.emailPlaceholder')}
/>
```

### Alerts
```javascript
Alert.alert(
  t('common.error'),
  t('settings.errors.saveFailed')
);
```

### Conditional Text
```javascript
{loading ? t('common.saving') : t('common.save')}
```

### Dynamic Values
```javascript
t('roles.memberCount', { count: 5 })  // "5 members"
```

## Translation Keys Cheat Sheet

### Common
- `common.cancel` → "Cancel"
- `common.save` → "Save"
- `common.delete` → "Delete"
- `common.error` → "Error"
- `common.success` → "Success"
- `common.loading` → "Loading..."
- `common.back` → "Back"

### Authentication
- `auth.signIn` → "Sign In"
- `auth.signUp` → "Sign up"
- `auth.signOut` → "Logout"
- `auth.email` → "Email"
- `auth.password` → "Password"

### Settings
- `settings.title` → "Settings"
- `settings.profile.title` → "Profile"
- `settings.appearance.title` → "Appearance"
- `settings.language.title` → "Language"
- `settings.account.title` → "Account"

### Workspace
- `workspaceOverview.title` → "My Workspaces"
- `workspace.tabs.calendar` → "Calendar"
- `workspace.tabs.employees` → "Employees"
- `workspace.tabs.analytics` → "Analytics"
- `workspace.tabs.settings` → "Settings"

### Quick Test

1. Switch language in Settings → Language
2. Navigate through screens
3. Verify text changes

## Files Status

✅ **Done:**
- LoginScreen.js
- SettingsScreen.js
- WorkspaceOverviewScreen.js (defaults only)

❌ **Todo:**
- SignupScreen.js
- WorkspaceOverviewScreen.js (UI text)
- WorkspaceScreen.js
- CalendarView.js
- EmployeesView.js
- RolesView.js
- ShiftsView.js
- AnalyticsView.js
- ScheduleManagementView.js

## Full Translation Keys Location

See `src/i18n/locales/en.json` for all available keys.
