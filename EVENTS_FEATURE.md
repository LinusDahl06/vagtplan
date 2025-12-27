# Calendar Events Feature

## Overview

A comprehensive calendar events system has been added to allow workspace owners and authorized users to create, edit, and delete special events on the calendar. Events are displayed alongside shifts in both week and month views.

## Key Features

### 1. Permission-Based Access
- **New Permission**: `manage_events` - Controls who can create, edit, and delete calendar events
- Workspace owners automatically have this permission
- Can be assigned to any role through the Roles & Permissions settings

### 2. Event Creation
Events can be customized with:
- **Name**: Title of the event (up to 50 characters)
- **Icon**: Choose from 16 different icons (star, trophy, gift, heart, flag, etc.)
- **Color**: Select from 8 vibrant colors (Gold, Red, Blue, Purple, Green, Orange, Pink, Teal)
- **Time Range**: Start and end times for the event
- **Description**: Optional details about the event (up to 500 characters)

### 3. Event Display

#### Week View
- Events appear below shifts for each day
- Shows icon, name, time range, and description
- Visual distinction with colored left border and icon badge
- Click to edit (if you have permission)
- Long-press to delete (if you have permission)

#### Month View
- Events are shown in the day's shift list modal when clicking a date
- Same visual styling as week view

### 4. Event Modal

The event creation/editing modal includes:
- **Icon Selection**: Grid of 16 icons to choose from
- **Color Picker**: 8 color options with visual preview
- **Time Input**: Start and end time selection
- **Description Field**: Multi-line text input
- **Live Preview**: See how your event will look before saving

## User Experience

### Creating an Event

1. Navigate to the Calendar view
2. In week view, click the "+ Add Event" button (visible only if you have `manage_events` permission)
3. Fill in the event details:
   - Enter event name
   - Choose an icon
   - Select a color
   - Set time range
   - Add description (optional)
4. Preview your event in the preview card
5. Click "Save" to add the event

### Editing an Event

1. Click on an existing event
2. Modify any details in the modal
3. Click "Save" to update

### Deleting an Event

1. Long-press on an event
2. Confirm deletion in the alert dialog
3. Event is removed from the calendar

## Technical Implementation

### Files Created
- `src/components/EventModal.js` - Modal component for creating/editing events
- `EVENTS_FEATURE.md` - This documentation

### Files Modified

#### src/components/RolesView.js
- Added `manage_events` permission to available permissions list
- Icon: `star`
- Automatically granted to Owner role

#### src/components/CalendarView.js
- Added event state management
- Added `canManageEvents` permission check
- Added event handler functions:
  - `getEventsForDate()` - Retrieves events for a specific date
  - `handleOpenAddEvent()` - Opens modal to create new event
  - `handleOpenEditEvent()` - Opens modal to edit existing event
  - `handleSaveEvent()` - Saves event to Firestore
  - `handleDeleteEvent()` - Deletes event from Firestore
- Integrated event display in week view
- Added EventModal component
- Added event styling

#### src/i18n/locales/en.json
- Added `manage_events` permission translations
- Added comprehensive events section with translations for:
  - Modal titles and buttons
  - Form labels and placeholders
  - Error messages
  - Delete confirmation

#### src/i18n/locales/da.json
- Added Danish translations for all event-related text

### Data Structure

**Workspace Document in Firestore:**
```javascript
{
  name: "My Workspace",
  ownerId: "user123",
  employees: [...],
  roles: [...],
  schedule: [...],
  events: [  // NEW: Events array
    {
      id: "1234567890",
      name: "Team Meeting",
      icon: "people",
      color: "#4ECDC4",
      startTime: "10:00",
      endTime: "11:00",
      description: "Monthly team sync",
      date: "2025-01-15"
    }
  ]
}
```

### Available Icons

- star
- trophy
- gift
- ribbon
- heart
- flag
- megaphone
- bulb
- rocket
- sparkles
- pizza
- cafe
- beer
- musical-notes
- people
- briefcase

### Available Colors

- Gold: `#FFD700`
- Red: `#FF6B6B`
- Blue: `#4ECDC4`
- Purple: `#9B59B6`
- Green: `#2ECC71`
- Orange: `#FF9F43`
- Pink: `#FD79A8`
- Teal: `#00CEC9`

## Benefits

### For Workspace Owners
1. **Highlight Special Events**: Mark important dates like meetings, celebrations, deadlines
2. **Team Communication**: Share event information with all team members
3. **Visual Organization**: Color-code and categorize different event types
4. **Flexible Permissions**: Delegate event management to trusted team members

### For Team Members
1. **Stay Informed**: See all important events at a glance
2. **Context**: Event descriptions provide additional details
3. **Visual Clarity**: Icons and colors make events easy to spot
4. **Integrated View**: Events and shifts in one unified calendar

## Permissions

### Owner
- Full access to create, edit, and delete all events
- Automatically has `manage_events` permission

### Users with manage_events Permission
- Can create new events
- Can edit existing events
- Can delete any event
- See "+ Add Event" button in calendar

### Users without manage_events Permission
- Can view all events (read-only)
- Cannot create, edit, or delete events
- Events are not clickable

## Use Cases

1. **Company Meetings**: Weekly team meetings, all-hands, stand-ups
2. **Celebrations**: Birthdays, anniversaries, team outings
3. **Deadlines**: Project milestones, submission dates
4. **Holidays**: Company holidays, closure dates
5. **Training**: Training sessions, workshops, onboarding
6. **Social Events**: Team lunches, happy hours, social gatherings

## Future Enhancements

Possible improvements:
1. **Recurring Events**: Create events that repeat daily, weekly, or monthly
2. **Event Categories**: Group events by type (meeting, celebration, deadline, etc.)
3. **Notifications**: Send reminders before events start
4. **Attendee Management**: Track who will attend each event
5. **All-Day Events**: Events without specific times
6. **Event Export**: Export events to device calendar
7. **Event Search**: Find events by name or description
8. **Color Themes**: Create custom color palettes

## Testing Checklist

- [ ] Create event with all fields filled
- [ ] Create event with minimal fields (name, icon, color only)
- [ ] Edit existing event
- [ ] Delete event
- [ ] Event displays correctly in week view
- [ ] Event displays correctly in month view (day modal)
- [ ] Permission check works (users without manage_events can't edit)
- [ ] Icon selection works
- [ ] Color selection works
- [ ] Time validation works (end after start)
- [ ] Preview card updates in real-time
- [ ] Translations work in both English and Danish
- [ ] Events persist after page refresh
- [ ] Multiple events on same day display correctly

## Screenshots Needed

1. Event modal with all fields filled
2. Icon selection grid
3. Color selection grid
4. Event preview card
5. Week view showing multiple events
6. Month view day modal with events
7. Event in calendar (week view)
8. Add event button
