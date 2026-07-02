# Implementation Plan: To-Do List Life Dashboard

## Overview

Implement the To-Do List Life Dashboard as a zero-dependency single-page web application using only `index.html`, `css/style.css`, and `js/script.js`. Build incrementally: project scaffold → storage layer → modules (theme, clock, greeting, timer, tasks, links) → responsive styling → property and unit tests.

## Tasks

- [x] 1. Scaffold project files and HTML structure
  - Create `index.html`, `css/style.css`, and `js/script.js` files
  - Write the full semantic HTML skeleton: `<header>` with clock, greeting, userName input, and theme toggle; `<main class="dashboard-grid">` with `#timer-card`, `#task-card`, and `#links-card` sections
  - Add `<p class="error-msg">` elements inside each card for inline validation messages
  - Link `css/style.css` and `js/script.js` from `index.html`
  - _Requirements: 9.5_

- [x] 2. Implement StorageModule and ThemeModule
  - [x] 2.1 Implement `StorageModule` with `get`, `set`, and `getArray` methods wrapped in `try/catch` for `SecurityError` and invalid JSON
    - `getArray` must return `[]` if JSON.parse fails or result is not an array
    - _Requirements: 4.5, 4.6, 6.4, 7.5, 8.1, 8.2, 8.3, 8.4_

  - [x] 2.2 Implement `ThemeModule.init()` and `ThemeModule.toggle()`
    - `init()` reads `theme` key; accepts only `"light"` or `"dark"`, falls back to `"light"`
    - `toggle()` flips the class on `<body>` between `theme-light` and `theme-dark`, persists the new value
    - Wire theme toggle button click to `ThemeModule.toggle()`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_


- [x] 3. Implement ClockModule and GreetingModule
  - [x] 3.1 Implement `ClockModule` with `formatTime(date)` and `formatDate(date)` pure helpers and `start()` / `tick()` methods
    - `formatTime` returns zero-padded `HH:MM:SS` (24-hour)
    - `formatDate` returns `DayName, MonthName DD, YYYY`
    - `start()` calls `tick()` immediately then `setInterval(tick, 1000)`
    - _Requirements: 1.1, 1.2, 1.3_

 
  - [x] 3.4 Implement `GreetingModule` with `getGreetingPeriod(hour)`, `renderGreeting(hour, name)`, `render()`, `saveName(input)`, and `init()`
    - `getGreetingPeriod`: hours 0–11 → `"Morning"`, 12–17 → `"Afternoon"`, 18–23 → `"Evening"`
    - `saveName`: trim input, reject if length > 50 (show error message), persist under `userName`, call `render()`
    - `init()` reads `userName` from storage, calls `render()`
    - Wire userName input submit event to `GreetingModule.saveName()`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

 
- [ ] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement TimerModule
  - [x] 5.1 Implement `TimerModule` with `init()`, `start()`, `stop()`, `reset()`, `tick()`, and `display(seconds)` methods
    - `init()` sets `remaining = 1500`, `running = false`, calls `display(1500)`
    - `start()`: guard — no-op if `running === true` or `remaining === 0`; otherwise sets `running = true` and calls `setInterval(tick, 1000)`
    - `stop()`: clears interval, sets `running = false`
    - `reset()`: calls `stop()`, sets `remaining = 1500`, calls `display(1500)`
    - `tick()`: decrements `remaining`; if `remaining === 0`, calls `stop()` and shows session-end notification
    - Wire Start, Stop, Reset button click events to the respective methods
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_


- [x] 6. Implement TaskModule
  - [x] 6.1 Implement `createTask(text)` factory and `TaskModule.init()` / `TaskModule.render()`
    - `createTask`: returns `{ id: Date.now().toString(), text: trimmed, completed: false }`
    - `render()` clears the task list DOM and maps `tasks[]` to `<li>` elements with checkbox, text, edit button, and delete button
    - Completed tasks render with a checked checkbox and `text-decoration: line-through`
    - `init()` calls `StorageModule.getArray('tasks')`, stores result, calls `render()`
    - _Requirements: 4.5, 4.6, 5.4, 5.5, 8.1_

  - [x] 6.2 Implement `TaskModule.add(text)`
    - Reject empty/whitespace input (show error message)
    - Reject duplicates by case-insensitive trimmed comparison (show "Task already exists" alert)
    - Reject text longer than 500 characters
    - On success: push new task, persist, re-render
    - Wire task input form submit to `TaskModule.add()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

 
  - [x] 6.6 Implement `TaskModule.edit(id, newText)` and `TaskModule.toggleComplete(id)`
    - `edit()`: enter inline edit mode on edit button click; confirm on Enter/save-button; cancel on Escape/cancel-button, restoring original text; validate new text (non-empty, ≤ 500 chars); persist and re-render on confirm
    - `toggleComplete()`: flip `completed` boolean, persist, re-render
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_


  - [x] 6.10 Implement `TaskModule.delete(id)`
    - Filter out the task by id, persist the updated array, re-render
    - Wire delete button click to `TaskModule.delete()`
    - _Requirements: 5.6_


- [ ] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement LinksModule
  - [x] 8.1 Implement `isValidUrl(url)`, `LinksModule.init()`, `LinksModule.render()`, and `LinksModule.open(url)`
    - `isValidUrl`: returns `true` if url starts with `http://` or `https://`
    - `render()` maps `links[]` to card elements with name, open button, and delete button; shows "No links saved yet" empty-state when list is empty
    - `open(url)` calls `window.open(url, '_blank', 'noopener,noreferrer')`
    - `init()` reads from `StorageModule.getArray('quickLinks')`, calls `render()`
    - _Requirements: 6.2, 6.4, 6.6, 8.2_

  - [x] 8.2 Implement `LinksModule.add(name, url)` and `LinksModule.delete(id)`
    - `add()`: reject empty name or empty url (show validation message); reject url not starting with `http://` or `https://` (show format message); reject if link count is already 50; on success persist and re-render
    - `delete()`: filter out link by id, persist, re-render
    - Wire quick-link form submit to `LinksModule.add()` and delete buttons to `LinksModule.delete()`
    - _Requirements: 6.1, 6.3, 6.5, 6.7_



- [x] 9. Implement CSS — glassmorphism styles, CSS variables, and theming
  - Define CSS custom properties on `:root` for colors, blur radius, border-radius, and spacing (light theme defaults)
  - Add `body.theme-dark` overrides for all color tokens
  - Style the glassmorphism cards: `backdrop-filter: blur()`, semi-transparent background, subtle border, `box-shadow`
  - Style header, timer display, task list items (including line-through for completed), quick link cards, error messages, and theme toggle button
  - Apply `body.theme-light` and `body.theme-dark` class-based theming without a visible flash on load
  - _Requirements: 7.1, 7.3, 9.1_

- [x] 10. Implement responsive layout and mobile touch targets
  - Implement `display: grid` with `grid-template-columns: 1fr` below 600 px and `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))` at or above 600 px
  - Add `@media (max-width: 599px)` block setting `min-height: 44px; min-width: 44px` on all interactive elements (buttons, checkboxes, links, inputs)
  - Verify no horizontal overflow occurs at viewport widths down to 320 px
  - _Requirements: 9.1, 9.2_

- [x] 11. Wire all modules in `DOMContentLoaded` and finalize `script.js`
  - Add `document.addEventListener('DOMContentLoaded', ...)` boot sequence calling `ThemeModule.init()`, `GreetingModule.init()`, `ClockModule.start()`, `TimerModule.init()`, `TaskModule.init()`, `LinksModule.init()` in order
  - Confirm no external libraries, CDN resources, or ES module imports are present
  - _Requirements: 1.2, 7.3, 8.1, 8.2, 8.3, 8.4, 9.3, 9.4_

- [ ] 12. Set up test infrastructure and write StorageModule unit tests
  - Initialize `package.json` with `npm init -y`, install `jest` and `fast-check` as dev dependencies (`npm install --save-dev jest fast-check`)
  - Create `test/` directory with `unit/` subdirectory and jest config pointing to `test/unit/`
  - Write `test/unit/storage.test.js` covering: `getArray` with invalid JSON returns `[]`, `getArray` with non-array JSON returns `[]`, `set` does not throw when localStorage is unavailable
  - _Requirements: 4.6, 7.5, 8.1, 8.2_

- [ ] 13. Final checkpoint — Ensure all tests pass
  - Run `npx jest --run` (or equivalent) and confirm all unit and property tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The design specifies Vanilla JS — no frameworks, no CDN dependencies (Requirement 9.4)
- Property tests use **fast-check** and live in `test/unit/`; each must run with `numRuns: 100` and include the tag comment `// Feature: todo-list-life-dashboard, Property N: <property_text>`
- Unit tests complement property tests for edge cases and DOM/browser-API side-effects
- The `StorageModule` must be implemented before all other modules since they all depend on it

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "3.1", "3.4", "5.1"] },
    { "id": 2, "tasks": ["2.3", "3.2", "3.3", "3.5", "3.6", "3.7", "5.2", "5.3", "5.4", "5.5"] },
    { "id": 3, "tasks": ["6.1", "8.1"] },
    { "id": 4, "tasks": ["6.2", "6.6", "6.10", "8.2"] },
    { "id": 5, "tasks": ["6.3", "6.4", "6.5", "6.7", "6.8", "6.9", "6.11", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 6, "tasks": ["12"] },
    { "id": 7, "tasks": ["9", "10", "11"] }
  ]
}
```
