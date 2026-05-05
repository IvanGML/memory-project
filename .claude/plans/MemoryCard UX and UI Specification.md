# Memory Project — MemoryCard UX / UI Specification

## 1. Purpose

MemoryCard is the **core content unit** of the entire experience.

It must:

* Hold attention
* Be easy to read
* Feel calm and respectful
* Avoid visual noise

> One card = one complete emotional moment

---

## 2. Layout Principles

* Near-fullscreen presence
* Centered content
* Strong vertical rhythm
* Clear hierarchy: title → text → image

---

## 3. Structure

```id="mc1"
<MemoryCard>
  <Container>

    <Content>

      <Title />        // optional

      <Text />

      <Image />        // optional

    </Content>

  </Container>
</MemoryCard>
```

---

## 4. Layout Variants

### 4.1 Mobile (Primary)

```id="mc2"
[ safe top spacing ]

Title (optional)

Text (main block)

Image (optional)

[ safe bottom spacing ]
```

**Rules:**

* Content centered vertically (or slightly above center)
* Comfortable side padding (16–20px)
* Text width = full available width
* Image:

    * below text
    * full width or slightly inset

---

### 4.2 Desktop

```id="mc3"
        [ centered container ]

        Title

        Text block (narrow width)

        Image (below OR side)
```

**Rules:**

* Max-width container (600–800px)
* Text is narrower for readability
* Image:

    * below text (default)
    * OR side-by-side (optional enhancement)

---

## 5. Typography

### Title (optional)

* Slightly larger than text
* Medium weight (not bold-heavy)
* Calm, not dominant

---

### Text (Main Content)

* Highest priority element
* Line height: comfortable (1.5–1.7)
* No long line width on desktop
* Paragraph spacing is important

---

## 6. Content Behavior

### Critical Rule:

> No vertical scrolling inside the card

---

### If content is long:

Options:

1. Trim content (preferred for MVP)
2. Allow slight overflow with fade hint (advanced)
3. Split into multiple memories (best long-term)

---

## 7. Image Behavior

### Placement

* After text (default)
* Optional: between paragraphs (later)

---

### Size

* Not overwhelming
* Should support text, not dominate it

---

### Style

* Slight border-radius (subtle)
* No heavy shadows
* Clean presentation

---

## 8. Alignment & Spacing

* Vertical spacing between elements: consistent rhythm
* Avoid dense blocks
* Use whitespace as primary design tool

---

## 9. Interaction

### Passive by default

* No clicks inside content
* No hover effects (except very subtle on desktop)

---

### Integrated with carousel

* Entire card participates in swipe
* No internal gesture conflicts

---

## 10. Animation

### On appearance (carousel change):

* Horizontal slide (from side)
* Optional slight fade

---

### Timing:

* Smooth, not fast
* No bounce, no aggressive easing

---

## 11. Visual Tone

Two possible directions (to decide later):

### Light Theme

* Soft background (off-white / warm gray)
* Dark text
* Feels like paper / memory album

---

### Dark Theme

* Deep background
* Light text
* Feels more cinematic / intimate

---

## 12. Edge Cases

* No title → text moves up naturally
* No image → text becomes primary focus
* Very short text → keep vertical balance (don’t stick to top)

---

## 13. Key UX Principle

> The card should disappear, leaving only the memory.

---

## 14. Future Enhancements

* Highlight quotes inside text
* Subtle background textures
* Audio memories (voice playback)
* Multi-image memories
