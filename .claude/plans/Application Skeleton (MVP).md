# Memory Project — Application Skeleton (MVP)

## 1. Global Layout

```
<App>
  <IntroOverlay />

  <MainScrollContainer>
    <HeroSection />
    <AboutSection />
    <FilmSection />
    <MemoriesSection />
    <GallerySection />
    <FinalSection />
  </MainScrollContainer>
</App>
```

---

## 2. IntroOverlay

```
<IntroOverlay>
  <Animation />        // abstract white bird (placeholder)
</IntroOverlay>
```

**Behavior:**

* Visible on first load
* Duration: ~2–3 seconds
* Fade-out transition
* Does not block background rendering
* Optional skip (tap)
* Hidden on repeat visits (localStorage)

---

## 3. HeroSection

```
<HeroSection>
  <BackgroundImage />

  <Content>
    <Name />
    <Years />
    <Subtitle />       // optional
  </Content>
</HeroSection>
```

**Layout:**

* Fullscreen height
* Centered content

**Behavior:**

* Soft fade-in on load
* No interactions (scroll only)

---

## 4. AboutSection

```
<AboutSection>
  <TextBlock />
</AboutSection>
```

**Layout:**

* Narrow readable column
* Centered or slightly offset

**Behavior:**

* Passive reading
* Fade-in on scroll

---

## 5. FilmSection

```
<FilmSection>
  <VideoPreview>
    <PosterImage />
    <PlayButton />
  </VideoPreview>

  <Title />
</FilmSection>
```

**On Play:**

Option A (recommended):

```
<InlineVideoPlayer />
```

Option B:

```
<VideoModal>
  <VideoPlayer />
  <CloseButton />
</VideoModal>
```

**Behavior:**

* No autoplay
* User-initiated playback

---

## 6. MemoriesSection

```
<MemoriesSection>
  <Carousel>

    <MemoryCard />

    <ArrowLeft />
    <ArrowRight />

    <ProgressIndicator />

  </Carousel>
</MemoriesSection>
```

---

### 6.1 MemoryCard

```
<MemoryCard>
  <Content>
    <Title />        // optional
    <Text />
    <Image />        // optional
  </Content>
</MemoryCard>
```

---

### 6.2 Carousel Behavior

```
state:
  currentIndex

actions:
  next()
  prev()
  goTo(index)
```

**Interaction:**

* Swipe (mobile)
* Arrow buttons (mobile + desktop)
* Keyboard arrows (optional desktop)

**Looping:**

```
if last → next → first
if first → prev → last
```

---

### 6.3 Controls

```
<ArrowLeft />
<ArrowRight />
```

**Behavior:**

* Always visible
* Mobile: overlay on content
* Desktop: sides of centered content

---

### 6.4 ProgressIndicator

```
<ProgressIndicator>
  <Dots /> OR <Counter />
</ProgressIndicator>
```

**Behavior:**

* Always visible
* Reflects current index
* Updates on interaction and auto-scroll

---

### 6.5 AutoScroll

```
useEffect:
  setInterval(next, delay)
```

**Behavior:**

* Slow automatic transition
* Pauses on user interaction
* Optional resume after inactivity

---

### 6.6 Animation

* Horizontal slide transition
* Optional slight fade
* No abrupt snapping

---

## 7. GallerySection

```
<GallerySection>
  <Grid>
    <GalleryItem />
  </Grid>
</GallerySection>
```

---

### 7.1 GalleryItem

```
<GalleryItem>
  <Image />
</GalleryItem>
```

---

### 7.2 Lightbox

```
<Lightbox>
  <Image />
  <ArrowLeft />
  <ArrowRight />
  <CloseButton />
</Lightbox>
```

**Interaction:**

* Click → open
* Swipe (mobile)
* Arrows (desktop)

---

## 8. FinalSection

```
<FinalSection>
  <TextBlock />
</FinalSection>
```

**Layout:**

* Centered text
* Large spacing

**Behavior:**

* No interactions
* Final emotional pause

---

## 9. Global State (Minimal)

```
state:
  introSeen: boolean
  currentMemoryIndex: number
  isVideoOpen: boolean
  selectedImageIndex: number | null
```

---

## 10. Global Behavior

**Scroll:**

* Native vertical scroll
* No scroll hijacking

**Transitions:**

* Fade-in on section enter
* Smooth easing

**Philosophy:**

* Content first
* Interface is invisible
* No unnecessary UI
