# Translation Implementation Guide

This guide explains how the i18n (internationalization) system has been implemented in the Schedule Manager app.

## Overview

The app now supports multiple languages (English and Danish) with the ability to easily add more languages in the future.

## Implementation Status

### ✅ Completed
- **i18n Setup**: Configured i18next and react-i18next
- **Translation Files**: Created comprehensive English (`en.json`) and Danish (`da.json`) translation files
- **LanguageContext**: Created context provider for language state management
- **AsyncStorage Integration**: Language preference persists across app restarts
- **SettingsScreen**: Added language selector with full translations
- **WorkspaceOverviewScreen**: Configured to create default roles and shift presets in the selected language
- **App.js**: Wrapped with LanguageProvider

### 🔄 Remaining Updates Needed

The following files need to be updated to use the translation system. Follow the pattern shown below:

## How to Update a Screen/Component

### Step 1: Import Required Modules

Add these imports at the top of the file:

```javascript
import { useTranslation } from 'react-i18next';
```

### Step 2: Add Translation Hook

In your component function, add:

```javascript
export default function YourComponent() {
  const { t } = useTranslation();
  // ... rest of your code
}
```

### Step 3: Replace Hard-coded Text

Replace all hard-coded strings with translation keys:

**Before:**
```javascript
<Text>Settings</Text>
```

**After:**
```javascript
<Text>{t('settings.title')}</Text>
```

**Before:**
```javascript
Alert.alert('Error', 'Failed to save');
```

**After:**
```javascript
Alert.alert(t('common.error'), t('settings.errors.saveFailed'));
```

## Files to Update

### 1. LoginScreen.js
- Import: `useTranslation`
- Translation keys to use:
  - `login.title`, `login.subtitle`
  - `login.emailPlaceholder`, `login.passwordPlaceholder`
  - `login.signInButton`, `login.signingIn`
  - All error messages: `login.errors.*`

### 2. SignupScreen.js
- Import: `useTranslation`
- Translation keys to use:
  - `signup.steps.*` for all step titles/subtitles/placeholders
  - `signup.continue`, `signup.previous`, `signup.skipForNow`
  - All error messages: `signup.errors.*`

### 3. WorkspaceOverviewScreen.js
- Import: `useTranslation`
- Translation keys to use:
  - `workspaceOverview.*` for all UI text
  - Update all Alert messages to use translations

### 4. WorkspaceScreen.js
- Import: `useTranslation`
- Translation keys to use:
  - `workspace.tabs.*` for tab labels
  - `common.back`, `common.owner`

### 5. CalendarView.js
- Import: `useTranslation`
- Translation keys to use:
  - `calendar.*` for all calendar-related text
  - Day names: `calendar.days.*`

### 6. EmployeesView.js
- Import: `useTranslation`
- Translation keys to use:
  - `employees.*` for all employee management text

### 7. RolesView.js
- Import: `useTranslation`
- Translation keys to use:
  - `roles.*` for all role management text
  - `roles.permissions.*` for permission descriptions

### 8. ShiftsView.js
- Import: `useTranslation`
- Translation keys to use:
  - `shifts.*` for all shift preset text

### 9. AnalyticsView.js
- Import: `useTranslation`
- Translation keys to use:
  - `analytics.*` for all analytics text

### 10. ScheduleManagementView.js
- Import: `useTranslation`
- Translation keys to use:
  - `scheduleManagement.*` for all schedule management text

## Translation Key Structure

All translation keys are organized in a hierarchical structure in `src/i18n/locales/en.json` and `src/i18n/locales/da.json`:

```
common/              - Common UI elements (buttons, labels, etc.)
auth/                - Authentication related
login/               - Login screen
signup/              - Signup screen
workspaceOverview/   - Workspace overview screen
workspace/           - Workspace screen (tabs)
calendar/            - Calendar view
employees/           - Employees view
roles/               - Roles & permissions view
shifts/              - Shift presets view
analytics/           - Analytics view
scheduleManagement/  - Schedule management view
settings/            - Settings screen
defaultRoles/        - Default role names
defaultShiftPresets/ - Default shift preset names
```

## Adding a New Language

1. Create a new translation file in `src/i18n/locales/` (e.g., `de.json` for German)
2. Copy the structure from `en.json` and translate all values
3. Import the new file in `src/i18n/i18n.js`:
   ```javascript
   import de from './locales/de.json';
   ```
4. Add it to the resources:
   ```javascript
   resources: {
     en: { translation: en },
     da: { translation: da },
     de: { translation: de },  // Add new language
   }
   ```
5. Update `SettingsScreen.js` to include the new language option

## Testing Translations

1. Run the app
2. Go to Settings
3. Tap on Language section
4. Switch between English and Danish
5. Navigate through all screens to verify translations appear correctly

## Important Notes

- **Default Data**: Roles and shift presets are created in the language selected at workspace creation time
- **Persistence**: Language selection is saved to AsyncStorage and persists across app restarts
- **Fallback**: If a translation key is missing, the app falls back to English
- **Dynamic Content**: Use interpolation for dynamic values:
  ```javascript
  t('roles.memberCount', { count: 5 })  // "5 members"
  ```

## Common Translation Patterns

### Alerts
```javascript
Alert.alert(
  t('common.error'),
  t('specific.error.key')
);
```

### Conditional Text
```javascript
{loading ? t('common.saving') : t('common.save')}
```

### Pluralization
The translation system supports pluralization:
```javascript
t('roles.count', { count: 1 })  // "1 role"
t('roles.count', { count: 5 })  // "5 roles"
```

Use `_plural` suffix in translation files for plural forms.

## File Locations

- **i18n Configuration**: `src/i18n/i18n.js`
- **Translation Files**: `src/i18n/locales/en.json`, `src/i18n/locales/da.json`
- **LanguageContext**: `src/context/LanguageContext.js`
- **Translation Helpers**: `src/i18n/translationHelpers.js`
