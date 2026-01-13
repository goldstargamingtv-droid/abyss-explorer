# Abyss Explorer Documentation

Welcome to the Abyss Explorer documentation! This collection of guides will help you understand the mathematics, techniques, and code behind fractal rendering.

## 📚 Documentation Index

### For Users

| Document | Description |
|----------|-------------|
| [MATHEMATICS.md](./MATHEMATICS.md) | Fractal mathematics fundamentals: escape-time algorithm, smooth iteration, complex dynamics |

### For Power Users

| Document | Description |
|----------|-------------|
| [COLORING_ALGORITHMS.md](./COLORING_ALGORITHMS.md) | Complete reference for 50+ coloring algorithms with formulas and visual descriptions |
| [PERTURBATION_THEORY.md](./PERTURBATION_THEORY.md) | Deep zoom techniques: perturbation theory, reference orbits, glitch correction |
| [SERIES_APPROXIMATION.md](./SERIES_APPROXIMATION.md) | Series approximation for ultra-deep zooms with mathematical derivations |

### For Developers

| Document | Description |
|----------|-------------|
| [API.md](./API.md) | JavaScript API reference: classes, events, extending the system |
| [SHADER_REFERENCE.md](./SHADER_REFERENCE.md) | GLSL shader reference: distance estimators, lighting, post-processing |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines: adding presets, fractals, shaders, code style |

## 🎯 Quick Start by Goal

### "I want to understand fractals"
Start with [MATHEMATICS.md](./MATHEMATICS.md) for the foundations, then explore [COLORING_ALGORITHMS.md](./COLORING_ALGORITHMS.md) to see how mathematics becomes art.

### "I want to zoom deeper"
Read [PERTURBATION_THEORY.md](./PERTURBATION_THEORY.md) and [SERIES_APPROXIMATION.md](./SERIES_APPROXIMATION.md) to understand how we achieve zooms beyond 10^300.

### "I want to add my own fractals"
Check [API.md](./API.md) for the class structure, [SHADER_REFERENCE.md](./SHADER_REFERENCE.md) for 3D rendering, and [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### "I want to share a location"
See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to add presets and share discoveries.

## 📖 Reading Order (Recommended)

1. **MATHEMATICS.md** — Foundation
2. **COLORING_ALGORITHMS.md** — Visual techniques
3. **PERTURBATION_THEORY.md** — Deep zoom math
4. **SERIES_APPROXIMATION.md** — Optimization
5. **API.md** — Code structure
6. **SHADER_REFERENCE.md** — GPU rendering
7. **CONTRIBUTING.md** — Join us!

## 🔗 External Resources

### Papers & Articles
- [Renormalizing the Mandelbrot Escape](https://linas.org/art-gallery/escape/escape.html) — Linas Vepstas
- [Mu-Ency: The Encyclopedia of the Mandelbrot Set](https://mrob.com/pub/muency.html) — Robert Munafo
- [Distance Estimation](https://iquilezles.org/articles/distfunctions/) — Inigo Quilez

### Books
- *The Fractal Geometry of Nature* — Benoit Mandelbrot (1982)
- *The Beauty of Fractals* — Peitgen & Richter (1986)
- *Dynamics in One Complex Variable* — John Milnor (2006)

### Community
- [Fractal Forums](https://fractalforums.org/) — Active community
- [Shadertoy](https://shadertoy.com/) — Shader experimentation

## 📝 Documentation Conventions

### Mathematical Notation
- Equations use LaTeX syntax: `$z_{n+1} = z_n^2 + c$`
- Complex numbers: $z = x + iy$ or $z = re^{i\theta}$
- Absolute value / magnitude: $|z|$

### Code Examples
- JavaScript uses ES6+ syntax
- GLSL uses version 300 es
- All code is runnable as-is

### Visual Descriptions
Since documentation is text-based, we describe visual appearances:
- "Creates concentric ring patterns" 
- "Produces zebra-stripe effects"

## 🤝 Contributing to Documentation

Found an error? Want to improve clarity? See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to submit changes.

---

*Explore the infinite. Document the journey.*
