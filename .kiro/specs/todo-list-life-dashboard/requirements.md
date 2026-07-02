# Requirements Document

## Introduction

The To-Do List Life Dashboard is a single-page, responsive web application that helps users organize their daily activities. It runs entirely in the browser with no backend, using only HTML, CSS, and Vanilla JavaScript. The dashboard presents a unified card-based interface featuring a live clock with dynamic greeting, a Pomodoro focus timer, a persistent to-do list, and a quick links manager. All user data persists across browser sessions via the Local Storage API. The design follows a modern glassmorphism aesthetic with a purple/blue gradient background and supports both light and dark themes.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Clock**: The UI component that displays the current live time and date.
- **Greeting**: The time-sensitive salutation displayed to the user, incorporating their saved name.
- **Focus_Timer**: The Pomodoro-style countdown timer component.
- **Task_Manager**: The UI component responsible for adding, editing, completing, and deleting tasks.
- **Task**: A single to-do item with a unique ID, text content, and completion status.
- **Quick_Links_Manager**: The UI component for managing saved website shortcuts.
- **Quick_Link**: A saved website entry consisting of a display name and a URL.
- **Local_Storage**: The browser's `localStorage` API used for all data persistence.
- **Theme**: The visual color scheme of the Dashboard, either light or dark.
- **userName**: The Local Storage key used to store the user's display name.
- **tasks**: The Local Storage key used to store the serialized array of Tasks.
- **quickLinks**: The Local Storage key used to store the serialized array of Quick Links.
- **theme**: The Local Storage key used to store the active Theme preference.

---

## Requirements

### Requirement 1: Live Clock Display

**User Story:** As a user, I want to see the current time and date updating in real time, so that I always have an at-a-glance reference without leaving the Dashboard.

#### Acceptance Criteria

1. THE Clock SHALL display the current time in `HH:MM:SS` (24-hour) format, based on the local device timezone.
2. WHEN the Dashboard loads, THE Clock SHALL begin updating the displayed time every 1 second using `setInterval`, without requiring a page reload.
3. THE Clock SHALL display the current date in the format `DayName, MonthName DD, YYYY` (e.g., `Tuesday, January 21, 2026`), based on the local device timezone.

---

### Requirement 2: Dynamic Greeting

**User Story:** As a user, I want to see a personalized greeting that changes based on the time of day, so that the Dashboard feels welcoming and contextually relevant.

#### Acceptance Criteria

1. WHEN the current hour is between 00 and 11 (inclusive), THE Greeting SHALL display the text `Good Morning`.
2. WHEN the current hour is between 12 and 17 (inclusive), THE Greeting SHALL display the text `Good Afternoon`.
3. WHEN the current hour is between 18 and 23 (inclusive), THE Greeting SHALL display the text `Good Evening`.
4. IF a non-empty user name is saved in Local Storage under the key `userName`, THEN THE Greeting SHALL append the stored name to the greeting text, producing output in the format `Good [Period], [Name]` (e.g., `Good Morning, Fadhil`).
5. IF no user name is saved in Local Storage, or if the stored value is an empty string, THEN THE Greeting SHALL display the salutation followed by the default name `User` (e.g., `Good Morning, User`).
6. WHEN the user submits a new name via the name input field, THE Dashboard SHALL save the trimmed name to Local Storage under the key `userName`.
7. WHEN the user submits a new name via the name input field, THE Dashboard SHALL update the Greeting immediately to reflect the new name.
8. WHEN the Dashboard loads, THE Greeting SHALL read the `userName` value from Local Storage and render the greeting using the time-period logic defined in criteria 1–3 and the name-resolution logic defined in criteria 4–5.
9. WHEN the user submits a name longer than 50 characters, THE Dashboard SHALL NOT save or display the name and SHALL notify the user that the name is too long.

---

### Requirement 3: Focus Timer (Pomodoro)

**User Story:** As a user, I want a Pomodoro countdown timer, so that I can structure focused work sessions and improve my productivity.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Focus_Timer SHALL display a default duration of `25:00` in `MM:SS` format.
2. WHEN the user activates the Start button and the displayed time is greater than `00:00`, THE Focus_Timer SHALL begin counting down from the currently displayed time, decrementing by 1 second per second.
3. WHEN the user activates the Stop button, THE Focus_Timer SHALL pause the countdown at the current remaining time.
4. WHEN the user activates the Reset button, THE Focus_Timer SHALL stop any active countdown and restore the display to `25:00`.
5. WHEN the Start button is activated while the Focus_Timer is already counting down, THE Focus_Timer SHALL NOT start a second concurrent interval, ensuring only one countdown interval runs at any time.
6. WHEN the Focus_Timer countdown reaches `00:00`, THE Focus_Timer SHALL stop the countdown automatically and display a notification (e.g., an alert or visible message) to inform the user that the session has ended.
7. WHEN the user activates the Start button while the displayed time is `00:00`, THE Focus_Timer SHALL NOT start a new countdown.
8. WHEN the user activates the Stop button while the Focus_Timer is not running, THE Focus_Timer SHALL remain unchanged with no side effects.

---

### Requirement 4: To-Do List — Add and Persist Tasks

**User Story:** As a user, I want to add tasks and have them saved automatically, so that my to-do list is available every time I return to the Dashboard.

#### Acceptance Criteria

1. WHEN the user submits a non-empty task text (up to 500 characters) via the task input, THE Task_Manager SHALL create a new Task with a unique ID, the trimmed text, and a default completion status of `false`.
2. WHEN a new Task is created, THE Task_Manager SHALL append the Task to the displayed list and save the updated task array to Local Storage under the key `tasks`.
3. WHEN the user submits a task text that already exists in the task list (case-insensitive comparison of trimmed values), THE Task_Manager SHALL NOT add the duplicate Task and SHALL display an alert with the message `Task already exists`.
4. WHEN the user submits an empty or whitespace-only task text, THE Task_Manager SHALL NOT create a new Task and SHALL display a user-visible alert or validation message.
5. WHEN the Dashboard loads, THE Task_Manager SHALL read the task array from Local Storage under the key `tasks`; IF the key is absent, THE Task_Manager SHALL treat it as an empty array and render no tasks.
6. WHEN the Dashboard loads and the value stored under the key `tasks` is not a valid JSON array, THE Task_Manager SHALL discard the corrupted data, treat it as an empty array, and render no tasks.

---

### Requirement 5: To-Do List — Edit, Complete, and Delete Tasks

**User Story:** As a user, I want to edit, complete, and delete tasks, so that I can keep my to-do list accurate and up to date.

#### Acceptance Criteria

1. WHEN the user activates the edit control for a Task, THE Task_Manager SHALL enter an edit mode that allows the user to modify the task text; WHEN the user confirms the edit by pressing Enter or activating a save control, THE Task_Manager SHALL save the updated text (up to 500 characters) to Local Storage.
2. WHEN the user activates the edit control for a Task and then cancels the edit (e.g., by pressing Escape or activating a cancel control), THE Task_Manager SHALL discard the changes and restore the original task text.
3. WHEN the user toggles the completion checkbox for a Task, THE Task_Manager SHALL update the Task's completion status to the opposite boolean value and save the updated task array to Local Storage.
4. WHILE a Task has a completion status of `true`, THE Task_Manager SHALL render the Task's text with a checked checkbox and a line-through text decoration.
5. WHILE a Task has a completion status of `false`, THE Task_Manager SHALL render the Task's text with an unchecked checkbox and no line-through decoration.
6. WHEN the user activates the delete control for a Task, THE Task_Manager SHALL remove the Task from the displayed list and save the updated task array to Local Storage.

---

### Requirement 6: Quick Links Manager

**User Story:** As a user, I want to save, open, and delete website shortcuts, so that I can quickly access frequently visited URLs from the Dashboard.

#### Acceptance Criteria

1. WHEN the user submits a non-empty website name and a valid URL (starting with `http://` or `https://`) via the quick link input fields, THE Quick_Links_Manager SHALL create a new Quick_Link entry and save the updated links array to Local Storage under the key `quickLinks`, up to a maximum of 50 saved links.
2. WHEN the user activates a saved Quick_Link, THE Quick_Links_Manager SHALL open the associated URL in a new browser tab.
3. WHEN the user activates the delete control for a Quick_Link, THE Quick_Links_Manager SHALL remove the entry from the displayed list and save the updated links array to Local Storage.
4. WHEN the Dashboard loads, THE Quick_Links_Manager SHALL read the links array from Local Storage under the key `quickLinks` and render all saved Quick_Links.
5. IF the user submits a Quick_Link with an empty website name or an empty URL, THEN THE Quick_Links_Manager SHALL NOT create the entry and SHALL display a user-visible validation message.
6. WHEN the Quick_Links_Manager contains no saved links, THE Quick_Links_Manager SHALL display an empty-state message (e.g., "No links saved yet").
7. IF the user submits a URL that does not start with `http://` or `https://`, THEN THE Quick_Links_Manager SHALL NOT create the entry and SHALL display a user-visible message indicating the URL format requirement.

---

### Requirement 7: Light/Dark Mode Theme Toggle

**User Story:** As a user, I want to switch between light and dark themes, so that I can choose the visual style that suits my environment and preference.

#### Acceptance Criteria

1. WHEN the user activates the theme toggle control, THE Dashboard SHALL switch the active Theme between light and dark mode and update the toggle control's visual state to reflect the newly active theme.
2. WHEN the Theme is switched, THE Dashboard SHALL save the selected Theme value (`"light"` or `"dark"`) to Local Storage under the key `theme`.
3. WHEN the Dashboard loads, THE Dashboard SHALL read the `theme` value from Local Storage and apply the corresponding Theme without a visible flash of an incorrect theme.
4. IF no `theme` value is found in Local Storage, or if the stored value is not `"light"` or `"dark"`, THEN THE Dashboard SHALL apply the light Theme as the default.
5. IF Local Storage is unavailable (e.g., blocked by browser settings), THEN THE Dashboard SHALL default to the light Theme for the session without throwing an unhandled error.

---

### Requirement 8: Data Persistence Across Sessions

**User Story:** As a user, I want all my data to be retained after a browser refresh, so that I never lose my tasks, links, name, or theme preference.

#### Acceptance Criteria

1. WHEN the Dashboard is refreshed, THE Dashboard SHALL read the `tasks` array from Local Storage and render all saved Tasks in the task list; IF the value is absent or not a valid JSON array, THE Dashboard SHALL render an empty task list.
2. WHEN the Dashboard is refreshed, THE Dashboard SHALL read the `quickLinks` array from Local Storage and render all saved Quick_Links; IF the value is absent or not a valid JSON array, THE Dashboard SHALL render an empty links list.
3. WHEN the Dashboard is refreshed, THE Dashboard SHALL read the `userName` value from Local Storage and render the Greeting using the resolved name; IF the value is absent or empty, THE Dashboard SHALL use the default name `User`.
4. WHEN the Dashboard is refreshed, THE Dashboard SHALL read the `theme` value from Local Storage and apply the corresponding Theme; IF the value is absent or invalid, THE Dashboard SHALL apply the light Theme.

---

### Requirement 9: Responsive Layout and Compatibility

**User Story:** As a user, I want the Dashboard to be usable on different screen sizes, so that I can access it from desktop or mobile browsers.

#### Acceptance Criteria

1. THE Dashboard SHALL render a card-based layout that displays a single-column stack on viewports narrower than 600px and a multi-column grid on viewports 600px and wider, with no horizontal overflow on any viewport width down to 320px.
2. All interactive elements (buttons, checkboxes, links, inputs) SHALL have a minimum touch target size of 44×44 CSS pixels on viewports narrower than 600px.
3. THE Dashboard SHALL be compatible with Chrome, Firefox, Edge, and Safari, meaning all required features render and function without JavaScript errors in each of those browsers.
4. THE Dashboard SHALL NOT depend on any external CSS frameworks, JavaScript libraries, or CDN-hosted resources.
5. THE Dashboard SHALL use only the files `index.html`, `css/style.css`, and `js/script.js` as its source artifacts.
