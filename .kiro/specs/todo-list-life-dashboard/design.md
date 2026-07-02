# Design Document: To-Do List Life Dashboard

## Overview

The To-Do List Life Dashboard is a zero-dependency, single-page web application (SPA) that runs entirely in the browser. It is built with only three source files — `index.html`, `css/style.css`, and `js/script.js` — and requires no build tools, bundlers, or network requests at runtime.

The application provides five core features on one screen:

1. **Live Clock & Greeting** — Shows the current time, date, and a time-sensitive personalized greeting.
2. **Pomodoro Focus Timer** — A 25-minute countdown timer with start/stop/reset controls.
3. **Task Manager** — A persistent to-do list with add, edit, complete, and delete capabilities.
4. **Quick Links Manager** — A bookmark-style panel for saving and opening website shortcuts.
5. **Theme Toggle** — Switches between light and dark color schemes.

All state is stored in `localStorage`. The UI follows a glassmorphism aesthetic with a purple/blue gradient background. The layout is responsive: single-column on mobile (< 600 px) and multi-column on desktop (≥ 600 px).

### Key Design Decisions

- **No framework, no CDN** — Pure HTML/CSS/JS keeps the app portable, fast to load, and free from supply-chain risk.
- **localStorage as the only persistence layer** — No server required; data survives browser refreshes within the same origin.
- **Module pattern in a single JS file** — Each feature is encapsulated in its own IIFE-like object/namespace within `script.js` to keep concerns separated without needing ES modules or a bundler.
- **setInterval for clock and timer** — Both the clock and the Pomodoro timer use `setInterval`; a guard flag prevents double-intervals on the timer.

---

## Architecture

The app is a classic three-tier front-end structure where all tiers live in the browser:

```
┌─────────────────────────────────────┐
│            index.html               │  Structure / Markup
├─────────────────────────────────────┤
│           css/style.css             │  Presentation / Theming
├─────────────────────────────────────┤
│           js/script.js              │  Logic / State / Persistence
└─────────────────────────────────────┘
         │                  │
   DOM Manipulation    localStorage API
```

### Runtime Flow

```
Browser loads index.html
  └─> Parses css/style.css (styles applied)
  └─> Parses js/script.js (DOMContentLoaded fires)
        ├─> ThemeModule.init()      — reads theme, applies class to <body>
        ├─> GreetingModule.init()   — reads userName, starts clock interval
        ├─> TimerModule.init()      — resets display to 25:00
        ├─> TaskModule.init()       — reads tasks[], renders list
        └─> LinksModule.init()      — reads quickLinks[], renders list
```

### Module Boundaries

| Module | Responsibilities |
|---|---|
| `ThemeModule` | Read/write theme to localStorage, toggle class on `<body>` |
| `GreetingModule` | Determine time period, read/write userName, update DOM greeting |
| `ClockModule` | `setInterval` every 1 s, format time & date, update DOM |
| `TimerModule` | Countdown logic, interval guard, start/stop/reset, alert on finish |
| `TaskModule` | CRUD for tasks, deduplication, render list, read/write localStorage |
| `LinksModule` | CRUD for quick links, URL validation, render list, read/write localStorage |
| `StorageModule` | Thin wrapper around `localStorage` with JSON parse/stringify and error handling |

---

## Components and Interfaces

### HTML Structure (index.html)

```
<body class="theme-light">
  <header>
    <!-- Clock, greeting, userName input, theme toggle -->
  </header>
  <main class="dashboard-grid">
    <section id="timer-card">    <!-- Pomodoro timer -->
    <section id="task-card">     <!-- Task manager -->
    <section id="links-card">    <!-- Quick links -->
  </main>
</body>
```

### CSS Architecture (style.css)

- **Custom properties (CSS variables)** on `:root` define the design tokens (colors, blur radius, border-radius). Dark mode overrides are applied via `body.theme-dark` selector.
- **Glassmorphism cards**: `backdrop-filter: blur()`, semi-transparent `background-color`, subtle border, and `box-shadow`.
- **Responsive grid**: `display: grid` with a single media query at `600px`. Below 600 px: `grid-template-columns: 1fr`. At or above 600 px: `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`.
- **Touch targets**: On mobile, all interactive elements receive `min-height: 44px; min-width: 44px` via the `@media (max-width: 599px)` block.

### JavaScript Modules (script.js)

#### StorageModule

```js
// Interface
StorageModule.get(key)           // Returns parsed JSON value or null
StorageModule.set(key, value)    // Serializes and stores value; swallows SecurityError
StorageModule.getArray(key)      // Returns parsed JSON array or [] (safe fallback)
```

#### ThemeModule

```js
ThemeModule.init()               // Reads 'theme' key, applies class, updates toggle icon
ThemeModule.toggle()             // Flips class, persists new value
```

#### ClockModule

```js
ClockModule.start()              // Calls tick() immediately, then setInterval(tick, 1000)
ClockModule.tick()               // Gets new Date(), formats, writes to DOM
// Format helpers (pure functions):
formatTime(date)   // → "HH:MM:SS"
formatDate(date)   // → "DayName, MonthName DD, YYYY"
```

#### GreetingModule

```js
GreetingModule.init()            // Reads userName, renders greeting
GreetingModule.render()          // Determines period (morning/afternoon/evening), writes DOM
GreetingModule.saveName(input)   // Validates length ≤ 50, trims, persists, calls render()
```

#### TimerModule

```js
TimerModule.init()               // Sets display to 25:00, clears any interval
TimerModule.start()              // Guard: no-op if running or at 00:00; else setInterval(tick, 1000)
TimerModule.stop()               // Clears interval, sets running = false
TimerModule.reset()              // Calls stop(), resets seconds to 1500, updates display
TimerModule.tick()               // Decrements seconds; if 0, stops and alerts user
TimerModule.display(seconds)     // Formats MM:SS and writes to DOM
```

#### TaskModule

```js
TaskModule.init()                // Reads tasks from storage, calls render()
TaskModule.add(text)             // Validates, deduplicates, creates task object, persists, renders
TaskModule.edit(id, newText)     // Finds task by id, updates text, persists, renders
TaskModule.toggleComplete(id)    // Flips completed boolean, persists, renders
TaskModule.delete(id)            // Filters out task by id, persists, renders
TaskModule.render()              // Clears list DOM, maps tasks[] to <li> elements
// Task factory:
createTask(text)                 // → { id: Date.now().toString(), text, completed: false }
```

#### LinksModule

```js
LinksModule.init()               // Reads quickLinks from storage, calls render()
LinksModule.add(name, url)       // Validates name/url, checks 50-link cap, persists, renders
LinksModule.delete(id)           // Filters out link by id, persists, renders
LinksModule.open(url)            // window.open(url, '_blank', 'noopener,noreferrer')
LinksModule.render()             // Clears list DOM, maps links[] to card elements; shows empty state if none
// URL validation:
isValidUrl(url)                  // Returns true if url starts with 'http://' or 'https://'
```

---

## Data Models

All data is stored in `localStorage` as JSON strings.

### Task Object

```json
{
  "id": "1706000000000",
  "text": "Buy groceries",
  "completed": false
}
```

| Field | Type | Constraints |
|---|---|---|
| `id` | `string` | `Date.now().toString()` at creation time; unique per session |
| `text` | `string` | 1–500 characters, trimmed; must be unique (case-insensitive) |
| `completed` | `boolean` | `false` on creation; toggled by checkbox |

### Quick Link Object

```json
{
  "id": "1706000000001",
  "name": "GitHub",
  "url": "https://github.com"
}
```

| Field | Type | Constraints |
|---|---|---|
| `id` | `string` | `Date.now().toString()` at creation time |
| `name` | `string` | Non-empty string |
| `url` | `string` | Must start with `http://` or `https://`; max 50 links total |

### localStorage Keys

| Key | Type | Default | Description |
|---|---|---|---|
| `tasks` | JSON array of Task | `[]` | Persisted task list |
| `quickLinks` | JSON array of Quick Link | `[]` | Persisted quick links |
| `userName` | string | `"User"` (display default) | User's display name (max 50 chars) |
| `theme` | `"light"` \| `"dark"` | `"light"` | Active theme |

### Data Validation Rules

- `userName`: trimmed length must be 1–50 characters to be saved; otherwise display defaults to `"User"`.
- `tasks` array from storage: wrapped in `try/catch` JSON.parse; if parse fails or result is not an array, treat as `[]`.
- `quickLinks` array from storage: same safe parse strategy.
- `theme` from storage: only `"light"` or `"dark"` are accepted; any other value falls back to `"light"`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Time Formatting Correctness

*For any* valid `Date` object, `formatTime(date)` SHALL return a string that matches the pattern `HH:MM:SS` where `HH` is the zero-padded 24-hour hour (00–23), `MM` is the zero-padded minute (00–59), and `SS` is the zero-padded second (00–59).

**Validates: Requirements 1.1**

---

### Property 2: Date Formatting Correctness

*For any* valid `Date` object, `formatDate(date)` SHALL return a string in the form `DayName, MonthName DD, YYYY` where the day name and month name match the locale-English full names, `DD` is the numeric day-of-month (1–31), and `YYYY` is the four-digit year.

**Validates: Requirements 1.3**

---

### Property 3: Greeting Period Partition

*For any* integer hour in the range [0, 23], `getGreetingPeriod(hour)` SHALL return exactly one of `"Morning"` (hours 0–11), `"Afternoon"` (hours 12–17), or `"Evening"` (hours 18–23) — every valid hour maps to exactly one period, and no valid hour is left unmapped.

**Validates: Requirements 2.1, 2.2, 2.3**

---

### Property 4: Greeting Name Resolution

*For any* non-empty string `name` (length 1–50), `renderGreeting(hour, name)` SHALL produce a string containing `name`. *For any* null, undefined, or empty string `name`, `renderGreeting(hour, name)` SHALL produce a string ending with `"User"`.

**Validates: Requirements 2.4, 2.5**

---

### Property 5: Name Save Trimming and Length Validation

*For any* input string `raw`: if `raw.trim().length` is between 1 and 50 (inclusive), `saveName(raw)` SHALL store `raw.trim()` in localStorage under `userName`. If `raw.trim().length` exceeds 50, `saveName(raw)` SHALL NOT modify the stored `userName` value.

**Validates: Requirements 2.6, 2.9**

---

### Property 6: Timer Countdown Decrement

*For any* timer state with `remaining > 0`, calling `tick()` once SHALL reduce `remaining` by exactly 1 and update the display to `formatTimer(remaining - 1)`.

**Validates: Requirements 3.2**

---

### Property 7: Timer Reset Invariant

*For any* timer state (running or stopped, any remaining time value), calling `reset()` SHALL result in `remaining === 1500` (25 minutes in seconds), `running === false`, and the display showing `"25:00"`.

**Validates: Requirements 3.4**

---

### Property 8: Timer Start Idempotence

*For any* number `n ≥ 1` of consecutive calls to `start()` while the timer is already running, the number of active intervals SHALL equal 1 (only one concurrent countdown runs at any time).

**Validates: Requirements 3.5**

---

### Property 9: Task Addition Round-Trip

*For any* valid task text (non-empty string, length 1–500, trimmed), calling `TaskModule.add(text)` SHALL result in: (a) the task list length increasing by 1, (b) a task with the trimmed text existing in the in-memory list, and (c) the updated list being present in localStorage under `tasks` as a valid JSON array containing the new task.

**Validates: Requirements 4.1, 4.2**

---

### Property 10: Task Duplicate Rejection

*For any* task text `t` already present in the task list, calling `TaskModule.add(s)` where `s.trim().toLowerCase() === t.trim().toLowerCase()` SHALL NOT add a new task and SHALL leave the task list length unchanged.

**Validates: Requirements 4.3**

---

### Property 11: Task Whitespace Rejection

*For any* string composed entirely of whitespace characters (including the empty string), calling `TaskModule.add(text)` SHALL NOT add a new task and SHALL leave the task list unchanged.

**Validates: Requirements 4.4**

---

### Property 12: Task Edit Round-Trip

*For any* existing task with `id` and *any* valid new text (non-empty, length 1–500), calling `TaskModule.edit(id, newText)` SHALL result in the task's stored text equaling `newText.trim()` in both the in-memory list and localStorage.

**Validates: Requirements 5.1**

---

### Property 13: Task Completion Toggle Round-Trip

*For any* task with any `completed` state `b`, calling `TaskModule.toggleComplete(id)` SHALL flip `completed` to `!b`. Calling it twice SHALL restore `completed` to the original value `b` (double-toggle is the identity).

**Validates: Requirements 5.3**

---

### Property 14: Task Completion Render Correctness

*For any* task with `completed === true`, the rendered DOM element SHALL have its checkbox in the checked state and the task text element SHALL have a `text-decoration: line-through` style applied. *For any* task with `completed === false`, the checkbox SHALL be unchecked and no line-through decoration SHALL be present.

**Validates: Requirements 5.4, 5.5**

---

### Property 15: Task Deletion Completeness

*For any* task list and *any* task `t` in that list, calling `TaskModule.delete(t.id)` SHALL result in `t` being absent from both the in-memory list and the JSON array stored in localStorage under `tasks`.

**Validates: Requirements 5.6**

---

### Property 16: Quick Link Addition and Persistence

*For any* valid `name` (non-empty string) and `url` (string starting with `http://` or `https://`) when the current link count is less than 50, calling `LinksModule.add(name, url)` SHALL increase the link list length by 1 and persist the new link to localStorage under `quickLinks`. When the link count is exactly 50, the addition SHALL be rejected and the list SHALL remain unchanged.

**Validates: Requirements 6.1**

---

### Property 17: Quick Link Deletion Completeness

*For any* quick links list and *any* link `l` in that list, calling `LinksModule.delete(l.id)` SHALL result in `l` being absent from both the in-memory list and localStorage under `quickLinks`.

**Validates: Requirements 6.3**

---

### Property 18: Quick Link Input Validation

*For any* submission where `name` is empty, `url` is empty, or `url` does not start with `http://` or `https://`, calling `LinksModule.add(name, url)` SHALL NOT create a new link entry and SHALL leave the links list unchanged.

**Validates: Requirements 6.5, 6.7**

---

### Property 19: Theme Toggle Round-Trip

*For any* active theme `t ∈ {"light", "dark"}`, calling `ThemeModule.toggle()` SHALL switch to the opposite theme, and calling `ThemeModule.toggle()` a second time SHALL restore the theme to `t`. After each toggle, localStorage under `theme` SHALL contain the currently active theme value.

**Validates: Requirements 7.1, 7.2**

---

## Error Handling

### localStorage Unavailability

The `StorageModule.get` and `StorageModule.set` methods wrap all `localStorage` access in `try/catch`. If `localStorage` is blocked by browser settings (e.g., private browsing on some browsers, `SecurityError`), the app defaults to in-memory state for the session. No unhandled errors are propagated.

```js
StorageModule.set = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // localStorage unavailable; in-memory state continues to work
  }
};
```

### Corrupted JSON in localStorage

`StorageModule.getArray` uses `JSON.parse` wrapped in `try/catch`. If the stored value is not valid JSON or the parsed result is not an array, it returns `[]`:

```js
StorageModule.getArray = (key) => {
  try {
    const val = JSON.parse(localStorage.getItem(key));
    return Array.isArray(val) ? val : [];
  } catch (e) {
    return [];
  }
};
```

### Invalid Theme Value

`ThemeModule.init` validates the stored theme value against the allowed set `{"light", "dark"}`. Any other value (including `null`) falls back to `"light"`.

### User Input Validation Errors

All user input validation errors are surfaced as in-DOM alert messages rather than `window.alert()` calls to avoid blocking the UI thread and to be dismissible. Each card section has a designated `<p class="error-msg">` element that is shown/hidden as needed.

### Timer Guard

`TimerModule.start()` checks `running === true` before setting a new interval. `TimerModule.start()` also checks `remaining === 0` before starting. These guards prevent double-intervals and no-op starts from corrupting state.

### Task Uniqueness Check

Before creating a new task, `TaskModule.add()` checks `tasks.some(t => t.text.trim().toLowerCase() === input.trim().toLowerCase())`. A case-insensitive, trimmed comparison ensures logical duplicates are caught regardless of user capitalization.

---

## Testing Strategy

### PBT Applicability Assessment

This feature is a Vanilla JS single-page app with multiple pure-function components (formatters, validators, state transformers). PBT **is** applicable for all the pure logic in the JS modules. The rendering/DOM layer and browser-dependent behaviors (localStorage availability, `window.open`, `setInterval`) are better covered by example-based tests.

### Dual Testing Approach

**Unit / Example-Based Tests** handle:
- Initialization smoke tests (timer shows 25:00 on load, theme class applied on init)
- Edge cases (timer at 00:00, cancel edit, localStorage unavailable, invalid JSON)
- Specific UI examples (empty-state message shows when no links exist)
- DOM interaction side-effects (window.open called with correct args)

**Property-Based Tests** handle:
- All 19 correctness properties defined above
- Each property must be run with a minimum of **100 iterations**
- Each property test is tagged with a comment referencing the design property

### Property-Based Testing Library

Use **[fast-check](https://fast-check.dev/)** (JavaScript/TypeScript PBT library) for all property tests. It supports Node.js test runners and browsers. Since the project has no build step, property tests live in a separate `test/` directory and run via Node.js + a test runner (Jest or Node's built-in `--experimental-test` runner).

Install: `npm install --save-dev fast-check jest`

### Tag Format

Each property test must include a comment:

```js
// Feature: todo-list-life-dashboard, Property N: <property_text>
```

### Property Test Examples

```js
// Feature: todo-list-life-dashboard, Property 1: Time Formatting Correctness
test('formatTime produces HH:MM:SS for any valid date', () => {
  fc.assert(
    fc.property(
      fc.date({ min: new Date(0), max: new Date('2099-12-31') }),
      (d) => {
        const result = formatTime(d);
        expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        const [hh, mm, ss] = result.split(':').map(Number);
        expect(hh).toBe(d.getHours());
        expect(mm).toBe(d.getMinutes());
        expect(ss).toBe(d.getSeconds());
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: todo-list-life-dashboard, Property 3: Greeting Period Partition
test('getGreetingPeriod covers all 24 hours with correct periods', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 23 }),
      (hour) => {
        const period = getGreetingPeriod(hour);
        if (hour <= 11) expect(period).toBe('Morning');
        else if (hour <= 17) expect(period).toBe('Afternoon');
        else expect(period).toBe('Evening');
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: todo-list-life-dashboard, Property 13: Task Completion Toggle Round-Trip
test('toggleComplete is its own inverse', () => {
  fc.assert(
    fc.property(
      fc.boolean(),
      (initialCompleted) => {
        const task = { id: '1', text: 'Test', completed: initialCompleted };
        const afterOne = toggleComplete(task);
        expect(afterOne.completed).toBe(!initialCompleted);
        const afterTwo = toggleComplete(afterOne);
        expect(afterTwo.completed).toBe(initialCompleted);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Examples

```js
// Smoke: timer initializes to 25:00
test('timer displays 25:00 on init', () => {
  TimerModule.init();
  expect(document.getElementById('timer-display').textContent).toBe('25:00');
});

// Edge case: starting timer at 00:00 is a no-op
test('timer start at 00:00 does nothing', () => {
  TimerModule.reset();
  TimerModule._state.remaining = 0;
  TimerModule.start();
  expect(TimerModule._state.running).toBe(false);
});

// Example: window.open called with correct arguments
test('opening a link calls window.open with noopener', () => {
  const spy = jest.spyOn(window, 'open').mockImplementation(() => {});
  LinksModule.open('https://example.com');
  expect(spy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
});
```

### Test Organization

```
test/
  unit/
    clock.test.js       — formatTime, formatDate (Properties 1, 2)
    greeting.test.js    — getGreetingPeriod, renderGreeting, saveName (Properties 3, 4, 5)
    timer.test.js       — tick, reset, start guard (Properties 6, 7, 8 + edge cases)
    tasks.test.js       — add, edit, toggle, delete, render (Properties 9–15)
    links.test.js       — add, delete, validate (Properties 16–18)
    theme.test.js       — toggle, init (Property 19)
    storage.test.js     — getArray with invalid JSON, unavailable localStorage
```
