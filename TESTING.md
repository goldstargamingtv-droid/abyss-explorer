# 🧪 TESTING.md — Comprehensive Testing Guide

> *"Testing leads to failure, and failure leads to understanding."*
> — Burt Rutan

This document provides a complete testing checklist to ensure Abyss Explorer works flawlessly across all features, browsers, and devices.

---

## Table of Contents

1. [Quick Smoke Test](#quick-smoke-test)
2. [Core Functionality Tests](#core-functionality-tests)
3. [Deep Zoom Stress Tests](#deep-zoom-stress-tests)
4. [Mobile & Touch Tests](#mobile--touch-tests)
5. [Export Tests](#export-tests)
6. [Browser Compatibility](#browser-compatibility)
7. [Performance Benchmarks](#performance-benchmarks)
8. [Edge Cases & Limits](#edge-cases--limits)
9. [Accessibility Tests](#accessibility-tests)
10. [Regression Test Suite](#regression-test-suite)

---

## Quick Smoke Test

Run these 10 tests in under 5 minutes to verify basic functionality:

| # | Test | Expected Result | ✓/✗ |
|---|------|-----------------|-----|
| 1 | Load `index.html` | UI appears, Mandelbrot renders | ☐ |
| 2 | Click + drag | Canvas pans smoothly | ☐ |
| 3 | Scroll wheel | Zooms in/out at cursor | ☐ |
| 4 | Click "Julia" in sidebar | Julia set renders | ☐ |
| 5 | Open preset browser | Presets load with thumbnails | ☐ |
| 6 | Click any preset | Navigates to location | ☐ |
| 7 | Change palette | Colors update immediately | ☐ |
| 8 | Toggle 3D mode | Mandelbulb renders | ☐ |
| 9 | Press 'S' key | Screenshot downloads | ☐ |
| 10 | Press 'F' key | Fullscreen toggles | ☐ |

**Pass criteria**: All 10 tests pass = Ready for deeper testing

---

## Core Functionality Tests

### 2D Mode

#### Navigation
| Test | Steps | Expected | ✓/✗ |
|------|-------|----------|-----|
| Pan | Click + drag | View moves with mouse | ☐ |
| Zoom in | Scroll up | Zooms toward cursor | ☐ |
| Zoom out | Scroll down | Zooms away from cursor | ☐ |
| Double-click zoom | Double-click | Centers + zooms 2× | ☐ |
| Reset view | Press Space | Returns to default | ☐ |
| Undo | Ctrl+Z | Previous view restored | ☐ |
| Redo | Ctrl+Shift+Z | Undo reversed | ☐ |

#### Fractal Types
| Fractal | Test | Expected | ✓/✗ |
|---------|------|----------|-----|
| Mandelbrot | Select + render | Classic shape appears | ☐ |
| Julia | Select + render | Julia set with current seed | ☐ |
| Burning Ship | Select + render | Ship shape visible | ☐ |
| Tricorn | Select + render | Three-fold symmetry | ☐ |
| Newton | Select + render | Multi-colored roots | ☐ |
| Phoenix | Select + render | Phoenix pattern | ☐ |
| Custom | Enter `z^3+c` | Cubic Mandelbrot | ☐ |

#### Coloring
| Test | Steps | Expected | ✓/✗ |
|------|-------|----------|-----|
| Smooth iteration | Select algorithm | Smooth color gradients | ☐ |
| Orbit traps | Select + render | Trap patterns visible | ☐ |
| Distance estimation | Select algorithm | Boundary highlighting | ☐ |
| Histogram | Select algorithm | Balanced contrast | ☐ |
| Palette change | Select new palette | Colors update | ☐ |
| Palette cycling | Enable animation | Colors animate | ☐ |

### 3D Mode

#### Navigation
| Test | Steps | Expected | ✓/✗ |
|------|-------|----------|-----|
| Orbit rotate | Click + drag | Camera orbits | ☐ |
| Pan | Right-click + drag | Camera pans | ☐ |
| Dolly | Scroll wheel | Camera moves in/out | ☐ |
| Reset camera | Press Space | Default view | ☐ |

#### 3D Fractals
| Fractal | Test | Expected | ✓/✗ |
|---------|------|----------|-----|
| Mandelbulb | Select + render | Bulb shape, proper lighting | ☐ |
| Mandelbox | Select + render | Box fold structure | ☐ |
| Menger Sponge | Select + render | Cubic holes pattern | ☐ |
| Sierpinski | Select + render | Tetrahedral form | ☐ |
| Julia Quaternion | Select + render | 4D slice visible | ☐ |
| Kleinian | Select + render | Limit set pattern | ☐ |
| IFS | Select + render | IFS structure | ☐ |

#### 3D Parameters
| Test | Steps | Expected | ✓/✗ |
|------|-------|----------|-----|
| Power slider | Adjust Mandelbulb power | Shape changes | ☐ |
| Scale slider | Adjust Mandelbox scale | Detail changes | ☐ |
| Iterations | Increase iterations | More detail | ☐ |
| Lighting | Adjust light position | Shadows move | ☐ |

---

## Deep Zoom Stress Tests

### Perturbation Theory Verification

Test at known locations that require perturbation:

#### Test Location 1: Mini-Mandelbrot at 10^-50
```
Center: (-1.768778833, -0.001738996)
Zoom: 1e-50
Max Iterations: 5000
```
| Check | Expected | ✓/✗ |
|-------|----------|-----|
| Renders without crashing | ☐ |
| No black artifacts | ☐ |
| Shape is recognizable mini-Mandelbrot | ☐ |
| Render time < 30 seconds | ☐ |

#### Test Location 2: Seahorse Valley at 10^-100
```
Center: (-0.743643887037158704752191506114774, 0.131825904205311970493132056385139)
Zoom: 1e-100
Max Iterations: 10000
```
| Check | Expected | ✓/✗ |
|-------|----------|-----|
| Renders without crashing | ☐ |
| Spiral patterns visible | ☐ |
| No glitch squares | ☐ |
| Series approximation activates | ☐ |

#### Test Location 3: Extreme Depth 10^-300
```
Center: (copy from deep preset)
Zoom: 1e-300
Max Iterations: 50000
```
| Check | Expected | ✓/✗ |
|-------|----------|-----|
| Renders (may be slow) | ☐ |
| Arbitrary precision activates | ☐ |
| Memory stays under 1GB | ☐ |
| Can cancel render | ☐ |

### Glitch Detection Tests

| Test | Steps | Expected | ✓/✗ |
|------|-------|----------|-----|
| Glitch appears | Zoom to known glitch area | Glitch detected | ☐ |
| Auto-rebase | Continue zooming | Glitch corrects | ☐ |
| Manual rebase | Click "Rebase" button | Reference updates | ☐ |

---

## Mobile & Touch Tests

### Device Matrix

| Device | Browser | Test Result | ✓/✗ |
|--------|---------|-------------|-----|
| iPhone (Safari) | iOS 15+ | | ☐ |
| iPhone (Chrome) | iOS 15+ | | ☐ |
| iPad (Safari) | iPadOS 15+ | | ☐ |
| Android Phone (Chrome) | Android 10+ | | ☐ |
| Android Tablet (Chrome) | Android 10+ | | ☐ |

### Touch Gestures

| Gesture | Action | Expected | ✓/✗ |
|---------|--------|----------|-----|
| One finger drag | Pan | View moves | ☐ |
| Pinch in | Zoom out | View zooms out | ☐ |
| Pinch out | Zoom in | View zooms in | ☐ |
| Double tap | Center zoom | Zooms 2× at point | ☐ |
| Long press | Context menu | Menu appears | ☐ |
| Two finger rotate | (3D) Rotate | Camera rotates | ☐ |

### Mobile UI

| Test | Expected | ✓/✗ |
|------|----------|-----|
| Sidebar collapses | Hamburger menu on small screens | ☐ |
| Buttons are tappable | Min 44px touch targets | ☐ |
| Text is readable | No overflow, proper scaling | ☐ |
| Modals fit screen | Scrollable if needed | ☐ |
| Keyboard doesn't break layout | Input fields work | ☐ |

### Mobile Performance

| Test | Expected | ✓/✗ |
|------|----------|-----|
| Initial load < 5s | On 4G connection | ☐ |
| Basic render < 3s | 1080p Mandelbrot | ☐ |
| No thermal throttling | After 5 min use | ☐ |
| Memory < 300MB | During normal use | ☐ |

---

## Export Tests

### Image Export

| Resolution | Format | Test | Expected | ✓/✗ |
|------------|--------|------|----------|-----|
| 1920×1080 | PNG | Export | File downloads, opens correctly | ☐ |
| 3840×2160 | PNG | Export | 4K image, ~5-20MB | ☐ |
| 7680×4320 | PNG | Export | 8K image, may take 30s+ | ☐ |
| 1920×1080 | JPEG | Export | Smaller file, some compression | ☐ |
| 1920×1080 | WebP | Export | Smallest file, good quality | ☐ |

### Video Export

| Test | Settings | Expected | ✓/✗ |
|------|----------|----------|-----|
| WebM 720p | 30fps, 10s | Video plays, ~2-5MB | ☐ |
| WebM 1080p | 30fps, 10s | Video plays, ~5-15MB | ☐ |
| GIF | 480p, 5s | Animated GIF, loops | ☐ |

### Animation Recording

| Test | Steps | Expected | ✓/✗ |
|------|-------|----------|-----|
| Record zoom | Start recording, zoom in | Video captures zoom | ☐ |
| Keyframe animation | Create keyframes, export | Smooth interpolation | ☐ |
| Cancel recording | Press cancel mid-record | Stops cleanly | ☐ |

### URL Sharing

| Test | Steps | Expected | ✓/✗ |
|------|-------|----------|-----|
| Generate URL | Click "Share Location" | URL with params | ☐ |
| URL length | Check for very deep zooms | Reasonable length (<2000 chars) | ☐ |
| Open shared URL | Paste in new tab | Exact location restored | ☐ |
| Copy to clipboard | Click copy button | URL in clipboard | ☐ |

---

## Browser Compatibility

### Desktop Browsers

| Browser | Version | 2D | 3D | Workers | Export | ✓/✗ |
|---------|---------|----|----|---------|--------|-----|
| Chrome | 100+ | ✓ | ✓ | ✓ | ✓ | ☐ |
| Firefox | 100+ | ✓ | ✓ | ✓ | ✓ | ☐ |
| Safari | 15+ | ✓ | ✓ | ✓ | ✓ | ☐ |
| Edge | 100+ | ✓ | ✓ | ✓ | ✓ | ☐ |

### Known Browser Issues

| Browser | Issue | Workaround |
|---------|-------|------------|
| Safari | WebGL context loss on tab switch | Re-render on focus |
| Firefox | Slower arbitrary precision | Use Chrome for extreme zooms |
| Mobile Safari | Memory limits | Reduce export resolution |

### Feature Detection Tests

| Feature | Test | Expected | ✓/✗ |
|---------|------|----------|-----|
| WebGL | 3D mode | Renders or shows fallback | ☐ |
| Web Workers | Render | Uses workers or falls back | ☐ |
| Canvas 2D | 2D mode | Always works | ☐ |
| LocalStorage | Settings | Persists or degrades | ☐ |
| Clipboard API | Copy URL | Works or shows prompt | ☐ |

---

## Performance Benchmarks

### 2D Rendering Benchmarks

Run on: _________________ (note your hardware)

| Test | Resolution | Iterations | Time | FPS |
|------|------------|------------|------|-----|
| Mandelbrot standard | 1920×1080 | 1000 | | |
| Mandelbrot standard | 3840×2160 | 1000 | | |
| Mandelbrot deep (1e-50) | 1920×1080 | 5000 | | |
| Mandelbrot deep (1e-100) | 1920×1080 | 10000 | | |
| Julia set | 1920×1080 | 1000 | | |

### 3D Rendering Benchmarks

| Test | Resolution | Iterations | FPS |
|------|------------|------------|-----|
| Mandelbulb | 1920×1080 | 100 | |
| Mandelbox | 1920×1080 | 100 | |
| Menger Sponge | 1920×1080 | 8 | |

### Memory Usage

| Scenario | Expected | Actual |
|----------|----------|--------|
| Initial load | < 100MB | |
| Standard render | < 200MB | |
| Deep zoom (1e-100) | < 500MB | |
| 8K export | < 1GB | |
| 16K export | < 3GB | |

### Target Benchmarks

| Hardware | Standard Render | Deep Zoom | 3D 60fps |
|----------|-----------------|-----------|----------|
| High-end desktop | < 1s | < 10s | ✓ |
| Mid-range laptop | < 3s | < 30s | ✓ |
| Mobile device | < 5s | < 60s | 30fps |

---

## Edge Cases & Limits

### Numerical Edge Cases

| Test | Input | Expected | ✓/✗ |
|------|-------|----------|-----|
| Zero zoom | zoom = 0 | Handled gracefully | ☐ |
| Negative zoom | zoom = -1 | Rejected or corrected | ☐ |
| Infinite iterations | iter = Infinity | Capped at max | ☐ |
| NaN coordinates | x = NaN | Reset to default | ☐ |
| Extreme coordinates | x = 1e308 | Handled or rejected | ☐ |

### UI Edge Cases

| Test | Action | Expected | ✓/✗ |
|------|--------|----------|-----|
| Rapid clicks | Click 100× fast | No crash, debounced | ☐ |
| Resize during render | Resize window | Render restarts | ☐ |
| Tab away during render | Switch tabs | Render pauses/continues | ☐ |
| Close modal during action | Press Escape | Modal closes cleanly | ☐ |
| Empty formula | Submit empty custom | Error message | ☐ |
| Invalid formula | Submit `z+++c` | Error message | ☐ |

### Memory Edge Cases

| Test | Action | Expected | ✓/✗ |
|------|--------|----------|-----|
| Long session | Use for 30+ min | No memory leak | ☐ |
| Many zooms | Zoom 100+ times | History bounded | ☐ |
| Large export fail | 32K export | Graceful error | ☐ |

### Concurrency Edge Cases

| Test | Action | Expected | ✓/✗ |
|------|--------|----------|-----|
| Cancel mid-render | Start render, cancel | Stops cleanly | ☐ |
| Change params during render | Adjust while rendering | Re-renders | ☐ |
| Multiple exports | Start 2 exports | Queued or rejected | ☐ |

---

## Accessibility Tests

### Keyboard Navigation

| Test | Keys | Expected | ✓/✗ |
|------|------|----------|-----|
| Tab through UI | Tab | Focus moves logically | ☐ |
| Activate buttons | Enter/Space | Buttons trigger | ☐ |
| Close modals | Escape | Modal closes | ☐ |
| Shortcuts work | S, F, H, etc. | Actions trigger | ☐ |

### Screen Reader

| Test | Expected | ✓/✗ |
|------|----------|-----|
| Page title announced | "Abyss Explorer" | ☐ |
| Buttons have labels | Meaningful names | ☐ |
| Images have alt text | Descriptive text | ☐ |
| Form fields labeled | Associated labels | ☐ |

### Visual

| Test | Expected | ✓/✗ |
|------|----------|-----|
| Color contrast | 4.5:1 minimum | ☐ |
| Focus indicators | Visible outlines | ☐ |
| Text resizable | Up to 200% | ☐ |
| No seizure triggers | No rapid flashing | ☐ |

---

## Regression Test Suite

Run these tests after any code changes:

### Critical Path (Must Pass)

1. ☐ App loads without errors
2. ☐ Mandelbrot renders
3. ☐ Zoom works
4. ☐ Pan works
5. ☐ Fractal type change works
6. ☐ Preset loading works
7. ☐ PNG export works
8. ☐ URL sharing works

### Extended Path (Should Pass)

1. ☐ All 8 2D fractal types render
2. ☐ All 7 3D fractal types render
3. ☐ All coloring algorithms work
4. ☐ Deep zoom (1e-50) works
5. ☐ Video export works
6. ☐ Mobile touch works
7. ☐ Keyboard shortcuts work
8. ☐ History undo/redo works

### Performance Path (Monitor)

1. ☐ Standard render < 3s
2. ☐ Memory < 500MB typical use
3. ☐ 3D maintains 30+ FPS
4. ☐ No memory leaks over time

---

## Test Report Template

```markdown
# Test Report

**Date**: YYYY-MM-DD
**Tester**: Name
**Version**: 1.0.0
**Environment**: Chrome 120 / Windows 11 / 16GB RAM

## Summary
- Total Tests: XX
- Passed: XX
- Failed: XX
- Skipped: XX

## Failed Tests
1. [Test Name] - Description of failure

## Notes
- Any observations or concerns

## Recommendation
☐ Ready for release
☐ Needs fixes
```

---

## Automated Testing (Future)

For future CI/CD integration:

```javascript
// Example Playwright test
test('basic render', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    const canvas = await page.locator('canvas');
    expect(await canvas.isVisible()).toBeTruthy();
});
```

---

**Happy Testing!** 🧪

*Remember: Finding bugs before users do is a gift to everyone.*
