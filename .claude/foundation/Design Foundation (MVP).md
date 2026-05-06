# Memory Project — Design Foundation (MVP)

## 1. Overview

This document defines the **core design system** for the Memory Project.

Goals:

* Consistency across all sections
* Minimalistic and emotional UI
* Easy scalability (themes, localization, admin panel)

---

## 2. Theming

### Supported Themes

* `light` (default)
* `dark` (auto via system)

---

### Theme Strategy

* Use CSS variables for all colors
* Default: `prefers-color-scheme`
* Manual override (future):

    * Theme switcher (planned in menu)
    * Stored in localStorage

---

### Color Tokens

#### Light Theme

```css
:root {
  --color-bg: #f7f7f5;
  --color-text: #1a1a1a;
  --color-muted: #6b6b6b;
  --color-accent: #d6d3cd;

  --color-overlay: rgba(0, 0, 0, 0.4);
}
```

---

#### Dark Theme

```css
[data-theme="dark"] {
  --color-bg: #0f0f10;
  --color-text: #f2f2f2;
  --color-muted: #a1a1a1;
  --color-accent: #2a2a2a;

  --color-overlay: rgba(0, 0, 0, 0.6);
}
```

---

## 3. Typography

### Font Strategy

* **Primary (UI & text):**

    * Inter (or system fallback)

* **Secondary (accent):**

    * Serif font (e.g., Playfair Display / Georgia)

---

### Usage

| Element        | Font  | Weight  | Notes               |
| -------------- | ----- | ------- | ------------------- |
| Body text      | Sans  | 400     | Main readable text  |
| Title (memory) | Sans  | 500–600 | Subtle emphasis     |
| Hero name      | Serif | 500     | Emotional accent    |
| Final text     | Serif | 400–500 | Soft and expressive |

---

### Text Rules

* Line height: `1.5–1.7`
* Avoid long lines (max-width controlled)
* Paragraph spacing required
* Text is primary content → must remain highly readable

---

## 4. Layout System

### Container

```css
.container {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 16px;
}
```

---

### Spacing Scale

Use consistent spacing units:

```css
--space-1: 8px;
--space-2: 16px;
--space-3: 24px;
--space-4: 32px;
--space-5: 48px;
--space-6: 64px;
```

---

### Section Spacing

* Large vertical spacing between sections
* Avoid dense stacking

---

## 5. Breakpoints

```css
--bp-mobile: 0px;
--bp-tablet: 768px;
--bp-desktop: 1024px;
```

### Strategy

* Mobile-first
* Desktop = centered + more spacing

---

## 6. Animation System

### Duration

* Fast: `200ms`
* Normal: `300ms`
* Slow: `400–500ms`

---

### Easing

```css
ease: cubic-bezier(0.4, 0, 0.2, 1);
```

---

### Allowed Animations

* Fade (opacity)
* Slide (horizontal for carousel)
* Scale (modals only)

---

### Avoid

* Parallax
* Complex chained animations
* Overuse of motion

---

## 7. Media Strategy

### Images

* Supported formats:

    * JPEG (initial)
    * WebP (optional optimization later)

* Rules:

    * Optimize size before upload
    * Use responsive sizing
    * Lazy loading enabled

---

### Video

#### Options:

1. **YouTube (quick start)**

    * Easy to manage
    * But less visual control

2. **Custom hosting (recommended later)**

    * Full UI control
    * Better integration with design

---

### MVP Decision

* Start with **flexible video source**
* Abstract via config:

```ts
type VideoSource = {
  type: 'youtube' | 'file'
  url: string
}
```

---

## 8. Content Model (Frontend)

### Memory

```ts
type Memory = {
  id: string
  title?: string
  content: string
  imageUrl?: string
}
```

---

### Text Rules

* Supports paragraphs
* No rich formatting (MVP)
* Title is optional

---

## 9. Localization (i18n)

### Strategy

* Localization-ready from start
* Single language in MVP (no UI switcher yet)
* One file per language
* Structure is identical across all languages

---

### File Structure

```id="i18n_fs"
locales/
  ru.json
  en.json (future)
```

---

### JSON Structure Principles

* Keys must reflect **meaning**, not UI position
* No generic names like `title1`, `header2`
* Group by **application sections** (intro, hero, film, etc.)
* Keep structure consistent across all languages

---

### Example (ru.json)

```json id="i18n_ru"
{
  "intro": {
    "skip": "Пропустить"
  },
  "hero": {
    "name": "Лариса Сомова",
    "years": "196X — 2024",
    "subtitle": "Мы будем помнить всегда"
  },
  "film": {
    "title": "О ней говорят близкие"
  },
  "final": {
    "line1": "Любимая мама, нам тебя не хватает.",
    "line2": "Вечная память.",
    "line3": "Мы очень скучаем."
  }
}
```

---

### Example (en.json — future)

```json id="i18n_en"
{
  "intro": {
    "skip": "Skip"
  },
  "hero": {
    "name": "Larisa Somova",
    "years": "196X — 2024",
    "subtitle": "We will always remember"
  },
  "film": {
    "title": "Loved ones speak about her"
  },
  "final": {
    "line1": "Dear mom, we miss you.",
    "line2": "Forever in our hearts.",
    "line3": "We miss you deeply."
  }
}
```

---

### Usage

```ts id="i18n_usage"
t('hero.name')
t('film.title')
```

---

### Notes

* No language switcher in MVP
* New language = new JSON file with identical structure
* All UI text must come from i18n (no hardcoded strings)

---

### Important Boundary

* i18n JSON → **UI/static text only**
* Dynamic content (memories, etc.) → comes from backend

Example:

```ts id="i18n_boundary"
type Memory = {
  id: string
  title?: string
  content: string
}
```

---

### Future Extensions

* Add language switcher (UI)
* Load translations dynamically
* Support localized backend content if needed

## 10. UI Primitives

### Core Components

* Button (minimal, low emphasis)
* Modal (used for video / gallery if needed)
* Typography (Text, Title)
* Container (layout wrapper)

---

### Design Rules

* No heavy styling
* Minimal borders, shadows
* Focus on spacing and typography

---

## 11. Theme Switch (Future-ready)

### Behavior

* Default: system theme
* Manual override:

    * Stored in localStorage
    * Applied via `data-theme` attribute

---

### Example

```js
document.documentElement.dataset.theme = 'dark'
```

---

## 12. Core Design Principles

* Content over interface
* Calm over interaction
* Simplicity over features
* Emotion over decoration

---

## 13. Implementation Notes

* Use CSS variables from start
* Avoid hardcoded colors
* Keep components theme-agnostic
* Keep layout predictable

---

## 14. Definition of Done (Design Layer)

* Light & dark themes supported
* Typography consistent
* Layout system applied everywhere
* Animations subtle and consistent
* UI does not distract from content
