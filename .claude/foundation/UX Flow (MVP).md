# Memory Project — UX Flow (MVP)

## 1. UX Philosophy

This product is not about interaction efficiency — it is about emotional immersion.

Core UX direction:

* Calm and predictable
* Linear storytelling
* Content-first
* Minimal cognitive load
* Soft interactions only

User should feel:

> "I am gently moving through memories"

---

## 2. Global Flow

The experience is a **single continuous vertical journey**.

```
Intro (overlay)
   ↓
Hero
   ↓
About
   ↓
Film
   ↓
Memories
   ↓
Gallery
   ↓
Final block
```

No branching. No complex navigation.

---

## 3. Entry Point

### First Visit

1. User opens the page
2. Intro overlay appears
3. Subtle animation (2–3 sec)
4. Smooth fade-out
5. Hero section becomes visible

### Repeat Visit (optional)

* Intro is skipped (localStorage: introSeen = true)
* User lands directly on Hero

---

## 4. Scroll Behavior

### Core Principle

Scrolling is the **main interaction mechanic**.

### Behavior

* Smooth, native scrolling
* No scroll hijacking
* No forced snap (for MVP)

### Section Transitions

* Fade-in on enter (slight)
* Content appears progressively
* No sudden jumps

---

## 5. Section-by-Section UX

---

### 5.1 Intro (Overlay)

**Goal:** Emotional entry without friction

**UX Flow:**

* Overlay appears instantly
* Background content is already loaded behind
* Animation plays (subtle, not distracting)
* Opacity fades to 0
* Overlay is removed

**User Control:**

* Optional: tap to skip

---

### 5.2 Hero Section

**Goal:** Anchor identity and tone

**UX Behavior:**

* First visible "real" screen
* No animation overload
* Content fades in gently

**Interaction:**

* Scroll → continues journey
* No buttons required

**Emotional Role:**

* Establish respect, calmness, presence

---

### 5.3 About Section

**Goal:** Provide context

**UX Behavior:**

* Text appears with slight fade
* Narrow reading column improves focus

**Interaction:**

* Passive reading only

**Important:**

* No distractions
* Typography carries the experience

---

### 5.4 Film Section

**Goal:** Emotional peak

**UX Flow:**

1. User sees preview image + play button
2. User clicks/taps
3. Video opens

**Two possible behaviors:**

#### Option A (Recommended for MVP):

* Inline expansion (video replaces preview)

#### Option B:

* Modal overlay

**Playback UX:**

* No autoplay
* User-controlled start

**Exit:**

* Close button OR scroll away (if inline)

---

### 5.5 Memories Section

**Goal:** Core storytelling (immersive, focused, sequential)

#### Structure

* Horizontal carousel (instead of vertical list)
* One memory = one screen (or near-fullscreen card)
* Content is centered and readable

#### Mobile UX (Primary)

**Interaction Model:**

* Swipe left/right → switch between memories
* Smooth horizontal transitions
* Infinite loop:

    * Last → next → first
    * First → previous → last

**Controls:**

* Arrow buttons are always visible (overlay)
* Arrows may slightly overlap content area
* Tap zones must be large and accessible

#### Desktop UX

**Interaction Model:**

* Same horizontal flow as mobile

**Controls:**

* Arrow buttons on left/right sides of the screen
* Content block is centered
* Optional: keyboard navigation (← →)

#### Memory Item Layout

Each memory contains:

* Title (optional)
* Text (main content)
* Optional image

#### Presentation Approach

Two possible layouts:

**Option A (Recommended):**

* Text-first layout
* Image inline or below text

**Option B:**

* Split layout (image + text side-by-side on desktop)

#### Interaction Flow

1. User lands on section
2. First memory is visible
3. User swipes or clicks arrows
4. Next memory slides in
5. Transition is continuous and looped

#### Animation

* Horizontal slide (main transition)
* Slight fade during transition (optional)
* No abrupt snapping

#### UX Details

* No vertical scroll inside card (important)
* Content should fit screen or feel intentionally cropped
* Clear affordance:

    * Arrow buttons (primary)
    * Progress indicator (required)

#### Progress Indicator (Required)

* Visible at all times
* Shows current position (e.g., dots or “1 / N”)
* Updates on swipe / arrow click
* Should be subtle but readable

#### Auto-scroll (Enabled)

* Memories switch automatically after a delay
* Slow and calm timing (not distracting)
* Pauses when:

    * User interacts (swipe / click)
* Resumes after inactivity (optional delay)

#### Key UX Principle

> One memory at a time — full attention, no distractions.

#### Optional Enhancements (Later)

* Gesture sensitivity tuning
* Subtle haptic feedback (mobile)


### 5.6 Gallery Section

**Goal:** Visual immersion

**Layout:**

* Grid (responsive)

---

### Interaction Flow

1. User taps image
2. Lightbox opens

---

### Lightbox UX

**Behavior:**

* Fullscreen image
* Darkened background

**Controls:**

* Swipe (mobile)
* Arrows (desktop)
* Close button

**Animation:**

* Zoom-in effect (subtle)

---

### 5.7 Final Section

**Goal:** Emotional closure

**UX Behavior:**

* Large spacing
* Centered text
* No interactions

**Important:**

* This is a “pause” moment
* Nothing should distract

---

## 6. Navigation Model

MVP approach:

* No menu
* No anchors
* No header

User navigates only by:

* Scrolling
* Opening/closing modals

---

## 7. Interaction Model Summary

| Interaction      | Type      | Frequency |
| ---------------- | --------- | --------- |
| Scroll           | Primary   | Constant  |
| Tap (open modal) | Secondary | Medium    |
| Close modal      | Utility   | Medium    |
| Video play       | Optional  | Low       |

---

## 8. Animation Guidelines

### Allowed:

* Fade-in (sections)
* Opacity transitions
* Light scale (modals)
* Smooth easing

### Avoid:

* Parallax (for MVP)
* Heavy motion
* Complex choreography

---

## 9. Emotional Rhythm

The flow should feel like:

1. Entry → curiosity
2. Recognition → connection
3. Deepening → memories
4. Peak → film
5. Reflection → gallery
6. Closure → final words

---

## 10. UX Risks & Notes

### Risks:

* Over-design → breaks emotional tone
* Too many animations → distraction
* Weak typography → loss of impact

### Key Success Factor:

> Content must lead. Interface must disappear.

---

## 11. Future UX Extensions

* Timeline navigation
* Story mode (fullscreen swipe)
* Multi-person memory spaces
* Personal accounts & contributions

---
