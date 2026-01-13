# Changelog

All notable changes to Abyss Explorer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-01-15

### 🎉 Initial Release

The first public release of Abyss Explorer — the ultimate browser-based fractal navigator!

#### Added

**Core Features**
- Complete 2D fractal rendering engine with Canvas API
- Full 3D fractal rendering with Three.js and raymarching shaders
- Perturbation theory implementation for ultra-deep zooms (10^-300+)
- Series approximation for efficient iteration skipping
- Arbitrary precision arithmetic (10,000+ decimal digits)
- Web Worker parallelization for responsive UI

**2D Fractals (8 types)**
- Mandelbrot set with full perturbation support
- Julia sets with 25+ preset seeds
- Burning Ship and variants
- Tricorn (Mandelbar)
- Newton-Raphson fractals
- Phoenix fractal
- Custom formula input

**3D Fractals (7 types)**
- Mandelbulb (power 2-20)
- Mandelbox with Amazing Surf variation
- Menger Sponge
- Sierpinski (tetrahedron, octahedron, pyramid)
- Julia Quaternion
- Kleinian groups
- IFS fractals

**Coloring System (50+ algorithms)**
- Smooth iteration (continuous coloring)
- Orbit traps (50+ shapes)
- Distance estimation coloring
- Histogram equalization
- Triangle inequality average
- Stripe average
- Curvature mapping
- Angle decomposition
- Layer blending modes

**Palette System**
- 100+ built-in palettes
- Gradient editor
- Palette cycling animation
- Custom palette creation
- Import/export palettes

**Camera & Animation**
- 2D pan/zoom with smooth inertia
- 3D orbit camera with fly-through
- Keyframe animation system
- Multiple easing functions
- Timeline editor

**Export**
- PNG/JPEG/WebP up to 16K resolution
- MP4/WebM video export
- GIF animation export
- Shareable URL encoding
- Batch frame rendering

**Presets**
- 2,500+ curated locations
- Mandelbrot famous spots
- Julia set classics
- Deep zoom challenges
- 3D scenic viewpoints
- Procedural generation

**UI/UX**
- Dark/light themes
- Responsive design (desktop/tablet/mobile)
- Touch gestures (pinch, pan, rotate)
- Keyboard shortcuts
- Context menus
- Progressive rendering
- History navigation (undo/redo)

**Documentation**
- Comprehensive README
- Mathematics guide
- Perturbation theory docs
- Series approximation docs
- Coloring algorithms docs
- Shader reference
- API reference
- Contributing guide

---

## Development History

### Phase 20 - Final Polish
- Created README.md with badges and gallery
- Added LICENSE (MIT)
- Created .gitignore
- Added package.json
- Expanded CONTRIBUTING.md
- Created FINAL_NOTES.md with integration checklist
- Added CHANGELOG.md
- Created CONTRIBUTORS.md
- Added manifest.json for PWA

### Phase 19 - Documentation
- Mathematics documentation
- Perturbation theory guide
- Series approximation guide
- Coloring algorithms reference
- Shader reference
- API documentation
- Contributing guidelines
- Main docs README

### Phase 18 - Assets
- 85+ SVG icons
- Tutorial images
- Data files (themes, shortcuts, famous locations, math constants)
- Placeholder graphics

### Phase 17 - Utils, History, Libs
- Utility functions (debounce, storage, color-utils, math-utils)
- URL state management
- History/undo system
- Embedded libraries (big.js, gifenc)

### Phase 16 - Workers
- Render worker
- Perturbation worker
- Export worker
- Worker pool management

### Phase 15 - Shaders
- Mandelbulb shader
- Mandelbox shader
- Menger shader
- Julia quaternion shader
- Kleinian shader
- IFS shader
- Lighting system
- Ambient occlusion
- Post-processing

### Phase 14 - Presets
- Mandelbrot presets (500+)
- Julia presets (200+)
- Burning Ship presets (100+)
- Newton presets (100+)
- 3D presets (200+)
- Procedural generator
- Preset loader

### Phase 13 - Export
- Image export (PNG/JPEG/WebP)
- WebM encoder
- GIF encoder
- Animation recorder
- Location sharing

### Phase 12 - UI Components
- UI manager
- Sidebar panels
- Toolbar
- Modal system
- Notifications
- Info overlay
- Preset browser
- Gallery
- Formula editor
- Context menu
- Touch handler

### Phase 11 - Camera
- 2D camera with smooth navigation
- 3D orbit camera
- Keyframe system
- Animation controller

### Phase 10 - Palettes
- Palette engine
- 100+ preset palettes
- Gradient generator
- Palette editor
- Palette cycling

### Phase 9 - Coloring
- Coloring engine
- Smooth iteration
- Orbit traps (50+ shapes)
- Distance estimation
- Histogram equalization
- Triangle inequality
- Stripe average
- Curvature
- Angle decomposition
- Coloring registry

### Phase 8 - Rendering
- 2D renderer with tiles
- 3D renderer with Three.js
- Tile manager
- Supersampling
- Glitch detection
- Adaptive iterations

### Phase 7 - 3D Fractals
- Fractal3D base class
- Mandelbulb
- Mandelbox
- Menger Sponge
- Sierpinski variants
- Julia Quaternion
- Kleinian
- IFS fractals
- 3D registry

### Phase 6 - 2D Fractals
- Fractal base class
- Mandelbrot with perturbation
- Julia sets
- Burning Ship
- Tricorn
- Newton fractals
- Phoenix
- Custom formula
- Fractal registry

### Phase 5 - Math Foundation
- Complex number library
- Quaternion library
- Arbitrary precision (BigDecimal/BigComplex)
- Perturbation theory engine
- Series approximation
- Formula parser

### Phase 4 - Core Engine
- Main engine class
- State management
- Performance monitor
- Web Worker manager

### Phase 3 - CSS
- Main styles
- Control panel styles
- UI component styles
- Animations

### Phase 2 - HTML
- Index.html structure
- Canvas setup
- UI skeleton
- Meta tags

### Phase 1 - Architecture
- Project structure
- File organization
- Technical planning
- Feature specification

---

## Roadmap

### [1.1.0] - Planned
- WebXR VR mode for 3D fractals
- Audio reactive parameters
- Additional fractal types (Magnet, Lambda)

### [1.2.0] - Planned
- Plugin system for custom fractals
- Social features (sharing, leaderboards)
- AI-guided exploration

### [2.0.0] - Future
- WebGPU compute for massive parallelism
- Native app wrappers
- Real-time collaboration

---

## License

MIT License - see [LICENSE](LICENSE) for details.
