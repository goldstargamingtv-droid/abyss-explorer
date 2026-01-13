<p align="center">
  <img src="assets/icons/logo.svg" alt="Abyss Explorer Logo" width="120" height="120">
</p>

<h1 align="center">🌀 ABYSS EXPLORER</h1>

<p align="center">
  <strong>The Ultimate Browser-Based Fractal Navigator</strong>
</p>

<p align="center">
  <em>Dive into infinity. Zoom to 10<sup>1000</sup> and beyond. No installation required.</em>
</p>

<p align="center">
  <a href="#-live-demo">Live Demo</a> •
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-controls">Controls</a> •
  <a href="#-gallery">Gallery</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/lines%20of%20code-97%2C600%2B-blue" alt="Lines of Code">
  <img src="https://img.shields.io/badge/fractals-15%2B%20types-purple" alt="Fractals">
  <img src="https://img.shields.io/badge/presets-2500%2B-orange" alt="Presets">
  <img src="https://img.shields.io/badge/coloring-50%2B%20algorithms-green" alt="Coloring">
  <img src="https://img.shields.io/badge/license-MIT-brightgreen" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome">
</p>

---

## 🎬 Live Demo

**[🚀 Launch Abyss Explorer](https://your-username.github.io/abyss-explorer/)**

> *No installation. No plugins. Just pure mathematical infinity in your browser.*

---

## ✨ Features

### 🔬 Ultra-Deep Zooming
- **Perturbation theory** with automatic glitch detection and correction
- **Series approximation** to skip millions of iterations instantly
- **Arbitrary precision arithmetic** (10,000+ decimal digits)
- Zoom to **10<sup>-1000</sup>** and beyond — deeper than any other browser fractal explorer
- Real-time **reference orbit rebasing** for artifact-free rendering

### 🎨 2D Fractals (8 Types)
| Fractal | Description |
|---------|-------------|
| **Mandelbrot** | The classic z² + c with full perturbation support |
| **Julia** | 25+ stunning preset seeds (Douady rabbit, dendrites, Siegel disks) |
| **Burning Ship** | The fiery |Re(z)|² + |Im(z)|² variant |
| **Tricorn/Mandelbar** | Complex conjugate dynamics |
| **Newton** | Multi-root polynomial convergence fractals |
| **Phoenix** | History-dependent z² + c + p·z_{n-1} |
| **Custom Formula** | Write your own! z^3 + sin(c*z), anything goes |

### 🌐 3D Fractals (7 Types, GPU-Accelerated)
| Fractal | Description |
|---------|-------------|
| **Mandelbulb** | Power 2-20 spherical, the iconic 3D Mandelbrot |
| **Mandelbox** | Box/sphere fold with incredible detail |
| **Menger Sponge** | Classic IFS with infinite surface area |
| **Sierpinski** | Tetrahedron/octahedron/pyramid variants |
| **Julia Quaternion** | 4D quaternion Julia sets in 3D slice |
| **Kleinian** | Möbius group limit sets |
| **IFS Fractals** | Affine transformation systems |

### 🎭 50+ Coloring Algorithms
- **Smooth iteration** (continuous escape-time coloring)
- **Orbit traps** (50+ shapes: point, line, cross, circle, star, spiral, grid, flower...)
- **Distance estimation** (boundary glows, interior shading)
- **Histogram equalization** (automatic contrast optimization)
- **Triangle inequality average** (phase-based smoothing)
- **Stripe average** (periodic banding effects)
- **Curvature mapping** (Gaussian curvature from orbit dynamics)
- **Angle decomposition** (radial waves, angular stripes)
- **Hybrid combinations** (layer and blend algorithms)

### 🎬 Animation System
- **Keyframe editor** with smooth interpolation (linear, ease, cubic, bounce)
- **Real-time preview** at any framerate
- **Export to MP4/WebM/GIF** up to 8K resolution
- **Palette cycling** animations
- **Camera fly-through** for 3D fractals

### 📤 Export & Share
- **PNG/JPEG/WebP** up to 16K resolution (16384×16384)
- **Video export** (MP4, WebM, GIF) with configurable quality
- **Shareable URLs** encode exact location, zoom, palette, settings
- **Batch rendering** for animation frames
- **Location bookmarks** with thumbnails

### 🎛️ 2,500+ Curated Presets
- Famous Mandelbrot locations (Seahorse Valley, Elephant Valley, Spiral Island)
- Mathematical constants (Golden Spiral at φ, π, e coordinates)
- Competition winners from fractal art communities
- Deep zoom challenges (10^-300 and beyond)
- 3D scenic viewpoints

### 🖥️ Modern UI/UX
- **Dark/light themes** with custom color schemes
- **Responsive design** (desktop, tablet, mobile)
- **Touch gestures** (pinch zoom, two-finger pan, rotation)
- **Keyboard shortcuts** for power users
- **Progressive rendering** (instant preview → refined → supersampled)
- **History navigation** (undo/redo with thumbnails)

---

## 🚀 Quick Start

### Option 1: GitHub Pages (Recommended)
```bash
# Clone the repository
git clone https://github.com/your-username/abyss-explorer.git

# Open in browser
cd abyss-explorer
open index.html   # macOS
start index.html  # Windows
xdg-open index.html  # Linux
```

### Option 2: Local Server
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

### Option 3: Deploy to GitHub Pages
1. Fork this repository
2. Go to Settings → Pages
3. Select "Deploy from a branch" → main → / (root)
4. Your explorer is live at `https://your-username.github.io/abyss-explorer/`

---

## 🎮 Controls

### Mouse (2D Mode)
| Action | Description |
|--------|-------------|
| **Click + Drag** | Pan the view |
| **Scroll Wheel** | Zoom in/out at cursor |
| **Double-click** | Center and zoom 2× |
| **Right-click** | Context menu (copy coords, set Julia seed) |
| **Shift + Click** | Set Julia c parameter from Mandelbrot point |

### Mouse (3D Mode)
| Action | Description |
|--------|-------------|
| **Click + Drag** | Rotate camera |
| **Right-click + Drag** | Pan camera |
| **Scroll Wheel** | Dolly in/out |
| **Middle-click + Drag** | Roll camera |

### Touch (Mobile/Tablet)
| Action | Description |
|--------|-------------|
| **One finger drag** | Pan |
| **Pinch** | Zoom |
| **Two finger drag** | (3D) Rotate |
| **Double tap** | Center and zoom |
| **Long press** | Context menu |

### Keyboard
| Key | Action |
|-----|--------|
| `Space` | Reset to default view |
| `R` | Render at full quality |
| `F` | Toggle fullscreen |
| `H` | Toggle UI visibility |
| `S` | Save screenshot |
| `P` | Open preset browser |
| `C` | Open coloring panel |
| `M` | Toggle 2D/3D mode |
| `I` | Increase iterations |
| `Shift+I` | Decrease iterations |
| `[` / `]` | Previous/next palette |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `?` | Show help |

---

## 🖼️ Gallery

### Famous Mandelbrot Locations

<table>
<tr>
<td align="center">
<strong>Seahorse Valley</strong><br>
<code>(-0.743643887, 0.131825904)</code><br>
<em>Spiral seahorse tails</em>
</td>
<td align="center">
<strong>Elephant Valley</strong><br>
<code>(0.275, 0.0)</code><br>
<em>Recursive elephant trunks</em>
</td>
<td align="center">
<strong>Spiral Island</strong><br>
<code>(-0.761574, -0.0847596)</code><br>
<em>Double spiral formation</em>
</td>
</tr>
<tr>
<td align="center">
<strong>Quad-Spiral Valley</strong><br>
<code>(-0.1592, -1.0317)</code><br>
<em>Four-armed spiral</em>
</td>
<td align="center">
<strong>Mini Mandelbrot</strong><br>
<code>(-1.768778833, -0.001738996)</code><br>
<em>Deep self-similarity at 10^-15</em>
</td>
<td align="center">
<strong>The Needle</strong><br>
<code>(-1.99999911758, 0.0)</code><br>
<em>Extreme western tip</em>
</td>
</tr>
</table>

### Julia Set Classics

<table>
<tr>
<td align="center">
<strong>Douady Rabbit</strong><br>
<code>c = -0.123 + 0.745i</code>
</td>
<td align="center">
<strong>San Marco Dragon</strong><br>
<code>c = -0.75 + 0i</code>
</td>
<td align="center">
<strong>Siegel Disk</strong><br>
<code>c = -0.390541 - 0.586788i</code>
</td>
</tr>
</table>

### 3D Fractals

<table>
<tr>
<td align="center">
<strong>Mandelbulb Power 8</strong><br>
<em>The classic triplex formula</em>
</td>
<td align="center">
<strong>Mandelbox Scale -1.5</strong><br>
<em>Amazing Surf variation</em>
</td>
<td align="center">
<strong>Menger-Sierpinski Hybrid</strong><br>
<em>IFS combination</em>
</td>
</tr>
</table>

---

## 🔧 Tech Stack

### Core Technologies
- **Vanilla JavaScript (ES6+)** — No frameworks, maximum performance
- **HTML5 Canvas** — 2D rendering with ImageData pixel manipulation
- **Three.js** — 3D raymarching with custom GLSL shaders
- **Web Workers** — Parallel computation for responsive UI

### Mathematical Libraries
- **big.js** (embedded) — Arbitrary precision decimal arithmetic
- **Custom Complex/Quaternion** — Optimized complex number operations
- **Perturbation Engine** — Reference orbit + delta calculations
- **Series Approximation** — Taylor polynomial iteration skipping

### Rendering Pipeline
```
┌─────────────────────────────────────────────────────────────┐
│                    RENDERING PIPELINE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────┐   │
│  │ Viewport │ -> │ Tile Manager │ -> │ Worker Pool (8) │   │
│  └──────────┘    └──────────────┘    └─────────────────┘   │
│                                              │               │
│                                              v               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              PRECISION SELECTOR                       │   │
│  │  zoom < 10^-14  │  10^-14 to 10^-300  │  > 10^-300   │   │
│  │  (float64)      │  (perturbation)      │  (arbitrary) │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         v                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                SERIES APPROXIMATION                   │   │
│  │  Skip iterations using Taylor polynomials             │   │
│  │  Automatic term management & error bounds             │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         v                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   ITERATION                           │   │
│  │  Standard / Perturbation / Arbitrary Precision        │   │
│  │  + Orbit collection + Distance estimation             │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         v                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                GLITCH DETECTION                       │   │
│  │  Reference orbit rebasing for deep zooms              │   │
│  │  Automatic re-render of affected tiles                │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         v                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   COLORING                            │   │
│  │  50+ algorithms • Palette engine • Layer blending     │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         v                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              SUPERSAMPLING (Optional)                 │   │
│  │  2x, 4x, 8x anti-aliasing for final quality           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Performance

### Benchmarks (Desktop, 1920×1080)

| Fractal | Zoom | Mode | Time |
|---------|------|------|------|
| Mandelbrot | 10^-15 | Standard | ~2s |
| Mandelbrot | 10^-100 | Perturbation | ~3s |
| Mandelbrot | 10^-500 | Perturbation + SA | ~5s |
| Mandelbulb | Power 8 | GPU Raymarch | 60 FPS |
| Mandelbox | Scale -1.5 | GPU Raymarch | 45 FPS |

### Memory Usage
- **Standard rendering**: ~50-100 MB
- **Deep zoom (10^-300)**: ~200-500 MB
- **High-res export (8K)**: ~500 MB-1 GB

### Browser Compatibility
| Browser | 2D | 3D | Deep Zoom | Workers |
|---------|----|----|-----------|---------|
| Chrome 90+ | ✅ | ✅ | ✅ | ✅ |
| Firefox 88+ | ✅ | ✅ | ✅ | ✅ |
| Safari 14+ | ✅ | ✅ | ✅ | ✅ |
| Edge 90+ | ✅ | ✅ | ✅ | ✅ |

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute
- 🐛 **Bug reports** — Found a glitch? Let us know!
- 🎨 **Presets** — Discovered an amazing location? Share it!
- 🧮 **Fractals** — Implement new fractal types
- 🖌️ **Coloring** — Add new coloring algorithms
- 📚 **Documentation** — Improve docs and tutorials
- 🌍 **Translations** — Help localize the interface

### Development Setup
```bash
git clone https://github.com/your-username/abyss-explorer.git
cd abyss-explorer
# Open in your editor and start hacking!
```

---

## 📚 Documentation

- [**Mathematics Guide**](docs/MATHEMATICS.md) — The math behind fractals
- [**Perturbation Theory**](docs/PERTURBATION_THEORY.md) — Deep zoom techniques
- [**Series Approximation**](docs/SERIES_APPROXIMATION.md) — Iteration skipping
- [**Coloring Algorithms**](docs/COLORING_ALGORITHMS.md) — 50+ coloring methods
- [**Shader Reference**](docs/SHADER_REFERENCE.md) — GLSL for 3D fractals
- [**API Reference**](docs/API.md) — JavaScript API for developers

---

## 🙏 Credits & References

### Mathematical Foundations
- **Perturbation Theory**: Based on work by K.I. Martin (SuperFractalThing)
- **Series Approximation**: Implemented following Pauldelbrot's methodology
- **Distance Estimation**: From Milnor, "Dynamics in One Complex Variable"
- **Orbit Traps**: Inspired by techniques in Ultra Fractal and Fractint

### Key Papers & Resources
- Peitgen, H.-O., & Richter, P. H. (1986). *The Beauty of Fractals*
- Milnor, J. (2006). *Dynamics in One Complex Variable*
- Devaney, R. L. (1992). *A First Course in Chaotic Dynamical Systems*
- [Fractal Forums](https://fractalforums.org/) — Community knowledge base
- [Inigo Quilez](https://iquilezles.org/) — Distance function techniques

### Embedded Libraries
- **big.js** by Michael Mclaughlin — Arbitrary precision decimals
- **gifenc** — GIF encoding for animation export
- **Three.js** (CDN) — WebGL 3D rendering

### Inspiration
- [Kalles Fraktaler](https://github.com/CIAvash/Kalles-Fraktaler) — The gold standard for deep zooming
- [XaoS](https://github.com/xaos-project/XaoS) — Real-time fractal zooming pioneer
- [Mandel Machine](https://mandel-machine.de/) — Java-based deep zoom explorer
- [Fractal eXtreme](https://www.cygnus-software.com/gallery/fx.htm) — Classic Windows fractal explorer

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🌟 Star History

If you enjoy Abyss Explorer, please consider giving it a ⭐ on GitHub!

---

<p align="center">
  <strong>Built with 💜 and ~100,000 lines of fractal obsession</strong>
</p>

<p align="center">
  <em>"The Mandelbrot set is not just a mathematical curiosity — it is a window into infinity."</em>
</p>

<p align="center">
  🌀 <strong>Start exploring the abyss</strong> 🌀
</p>
