# Memory Project — Frontend Specification (MVP)

## 1. Overview

Memory Project is a single-page web application designed as an emotional, immersive experience dedicated to a person (Larisa Somova).

The goal is not task completion, but emotional engagement:

> The user should feel like they are entering a memory space.

---

## 2. Core Principles

- Minimalistic UI  
- Emotion-first experience  
- No unnecessary interactions  
- Smooth transitions  
- Mobile-first design  
- Content-driven layout  

---

## 3. Application Type

- SPA (Single Page Application)  
- Vertical scroll-based experience  
- No traditional multi-page routing (for MVP)  

---

## 4. Global Structure

Application consists of the following sections (in order):

1. Intro (overlay)  
2. Hero (main screen)  
3. About  
4. Film  
5. Memories  
6. Gallery  
7. Final block  

---

## 5. Sections Specification

### 5.1 Intro (Overlay)

Purpose: Emotional entry  

Behavior:
- Appears on first load  
- Duration: ~2–3 seconds  
- Smooth fade-out transition  

Content:
- Abstract white bird animation (placeholder for now)  

Requirements:
- Should not block rendering completely  
- Optional: skip on repeat visits (localStorage flag)  

---

### 5.2 Hero Section

Purpose: Identity anchor  

Content:
- Main photo  
- Name: Larisa Somova  
- Years (e.g., 196X — 2024)  
- Short phrase (optional)  

Layout:
- Centered  
- Fullscreen height  

Notes:
- Typography is critical  
- High-quality image required  

---

### 5.3 About Section

Purpose: Provide context  

Content:
- 1–2 paragraphs text  

Layout:
- Narrow readable column  
- Centered or slightly offset  

---

### 5.4 Film Section

Purpose: Emotional peak  

Content:
- Video preview (poster image)  
- Play button  
- Title (e.g., "О ней говорят близкие")  

Behavior:
- Click → open video player (modal or inline)  
- No autoplay  

Optional:
- Fullscreen modal player  

---

### 5.5 Memories Section

Purpose: Core content (stories)  

Content:
- List of memories  

Memory item:
- Title (optional)  
- Text  
- Optional image  

Layout:
- Vertical list OR cards  

Interaction:
- Click → open fullscreen modal  

Modal:
- Scrollable content  
- Close button  
- Focused reading experience  

---

### 5.6 Gallery Section

Purpose: Visual memory  

Content:
- Photo collection  

Layout:
- Responsive grid  

Interaction:
- Click → open image viewer (lightbox/modal)  

Optional (later):
- Swipe navigation  

---

### 5.7 Final Section

Purpose: Emotional closure  

Content (example):

Любимая мама, нам тебя не хватает.  
Вечная память.  
Мы очень скучаем.  

Layout:
- Centered  
- Large spacing  
- Minimal UI  

---

## 6. Navigation

MVP:
- No visible navigation menu  

Optional:
- Scroll-based navigation only  

---

## 7. Responsiveness

Approach: Mobile-first  

Mobile (priority):
- Vertical flow  
- Large tap areas  
- Readable typography  

Desktop:
- Centered content  
- Increased spacing  
- Maintain minimalism  

---

## 8. Animations

- Subtle fade-ins  
- Smooth transitions between sections  
- Avoid heavy animations  

Examples:
- Section appears on scroll  
- Image fade-in  
- Modal transitions  

---

## 9. State Management

Minimal global state:

- introSeen (boolean)  
- modal state (open/close)  
- selected memory  
- selected image  

---

## 10. Data Structure (Frontend Model)

Hero:
- name: string  
- years: string  
- subtitle?: string  
- imageUrl: string  

About:
- text: string  

Film:
- videoUrl: string  
- previewImage: string  
- title: string  

Memory:
- id: string  
- title?: string  
- content: string  
- imageUrl?: string  

GalleryImage:
- id: string  
- url: string  

---

## 11. Tech Stack (recommended)

- React + Vite  
- TypeScript  
- CSS (Tailwind or simple modules)  
- Minimal dependencies  

---

## 12. Performance Considerations

- Optimize images  
- Lazy load images and video  
- Avoid heavy JS  

---

## 13. Accessibility (basic)

- Alt text for images  
- Proper contrast  
- Keyboard navigation for modals  

---

## 14. Out of Scope (MVP)

- Authentication  
- User-generated content  
- Multi-language support  
- Complex animations  
- Timeline feature  

---

## 15. Future Extensions

- Admin panel integration  
- User accounts  
- Private content  
- Multi-project support  
- Platform scaling  

---

## 16. Definition of Done (MVP)

- All sections implemented  
- Responsive on mobile  
- Smooth scrolling experience  
- Content is readable and emotionally consistent  
- No critical UI bugs  