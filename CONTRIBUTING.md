# Contributing to Abyss Explorer

> *"The best way to predict the future is to invent it."*
> — Alan Kay

Thank you for your interest in contributing to Abyss Explorer! This document provides comprehensive guidelines for contributing code, presets, documentation, and bug reports.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Code Style](#code-style)
4. [Adding New Features](#adding-new-features)
5. [Adding Presets](#adding-presets)
6. [Adding Fractals](#adding-fractals)
7. [Adding Coloring Algorithms](#adding-coloring-algorithms)
8. [Adding Shaders](#adding-shaders)
9. [Testing Deep Zooms](#testing-deep-zooms)
10. [Documentation](#documentation)
11. [Bug Reports](#bug-reports)
12. [Pull Request Process](#pull-request-process)
13. [Community Guidelines](#community-guidelines)

---

## Getting Started

### Ways to Contribute

- 🐛 **Bug Reports**: Report issues you encounter
- 🎨 **Presets**: Share interesting fractal locations you've discovered
- 🧮 **Fractals**: Implement new 2D or 3D fractal types
- 🖌️ **Coloring**: Add new coloring algorithms
- 🎭 **Shaders**: Create GLSL shaders for 3D effects
- 🔧 **Features**: Implement new functionality
- 📚 **Documentation**: Improve docs, tutorials, and examples
- 🌍 **Translations**: Help localize the interface
- ⚡ **Performance**: Optimize rendering and computation

### Prerequisites

- Basic understanding of JavaScript (ES6+)
- Familiarity with HTML5 Canvas or WebGL (for rendering contributions)
- Understanding of complex numbers and fractal mathematics (helpful but not required)
- Git for version control

---

## Development Setup

### Clone the Repository

```bash
git clone https://github.com/your-username/abyss-explorer.git
cd abyss-explorer
```

### Running Locally

**Option 1: Simple HTTP Server (Recommended)**
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

**Option 2: Direct File Access**
Most features work by opening `index.html` directly, but Web Workers require a server for security reasons.

### Project Structure

```
abyss-explorer/
├── index.html              # Main entry point
├── css/                    # Stylesheets
│   ├── main.css           # Core styles
│   ├── ui.css             # UI components
│   ├── controls.css       # Control panels
│   └── animations.css     # CSS animations
├── js/
│   ├── main.js            # Application bootstrap
│   ├── config.js          # Global configuration
│   ├── core/              # Engine, state, performance
│   ├── math/              # Complex numbers, perturbation, arbitrary precision
│   ├── fractals/          # 2D fractal implementations
│   ├── fractals3d/        # 3D fractal implementations
│   ├── coloring/          # Coloring algorithms
│   ├── rendering/         # 2D/3D renderers
│   ├── shaders/           # GLSL shader code
│   ├── ui/                # UI components
│   ├── export/            # Image/video export
│   ├── workers/           # Web Worker scripts
│   ├── presets/           # Location presets
│   ├── palettes/          # Color palettes
│   ├── camera/            # 2D/3D camera systems
│   ├── history/           # Undo/redo system
│   ├── utils/             # Utility functions
│   └── libs/              # Embedded libraries
├── assets/
│   ├── icons/             # SVG icons
│   ├── images/            # Images and thumbnails
│   └── data/              # JSON data files
└── docs/                  # Documentation
```

---

## Code Style

### JavaScript

We use ES6+ module syntax. Follow these conventions:

```javascript
// ✅ Good: Clear module structure
/**
 * @fileoverview Description of what this module does
 * @module path/to/module
 */

import { SomeDependency } from './dependency.js';

/**
 * Class description
 */
export class MyClass {
    /**
     * Constructor description
     * @param {Object} options - Configuration options
     * @param {number} options.width - Canvas width
     */
    constructor(options = {}) {
        this.width = options.width ?? 800;
    }

    /**
     * Method description
     * @param {Complex} z - Complex number input
     * @returns {Complex} Transformed complex number
     */
    transform(z) {
        // Implementation
    }
}

// ✅ Good: Constants at top
const MAX_ITERATIONS = 10000;
const BAILOUT_RADIUS = 1e10;

// ✅ Good: Descriptive variable names
const referenceOrbitPoints = [];
const deltaRealPart = z.re - reference.re;

// ❌ Bad: Single letter variables (except for math conventions)
const r = []; // What is this?
const d = z.re - ref.re; // Unclear

// ✅ OK: Mathematical conventions are fine
const c = new Complex(x, y);  // Standard fractal notation
const z = Complex.ZERO;        // Standard fractal notation
```

### Formatting

- **Indentation**: 4 spaces
- **Line length**: ~100 characters max
- **Semicolons**: Always use them
- **Quotes**: Single quotes for strings
- **Trailing commas**: Yes, in multiline arrays/objects

### Comments

```javascript
// ✅ Good: Explain the "why", not the "what"
// Use perturbation to avoid precision loss at deep zooms
const delta = z.sub(reference);

// ✅ Good: Document complex math
/**
 * Smooth iteration count using potential function
 * Formula: n + 1 - log(log|z|) / log(2)
 * Reference: Peitgen & Richter, "The Beauty of Fractals"
 */
const smoothed = n + 1 - Math.log(Math.log(z.abs())) / Math.LOG2;

// ❌ Bad: Redundant comments
// Add one to counter
counter++; // This is obvious
```

---

## Adding New Features

### Before You Start

1. **Check existing issues** for similar feature requests
2. **Open a discussion** for major features to get feedback
3. **Create a feature branch**: `git checkout -b feature/my-feature`

### Feature Guidelines

- Features should be **modular** and not break existing functionality
- Add appropriate **configuration options** in `config.js`
- Update relevant **documentation**
- Consider **mobile/touch** compatibility
- Think about **performance** implications

---

## Adding Presets

Presets are coordinates of interesting fractal locations. We love discovering new ones!

### Preset Format

```javascript
// In js/presets/mandelbrot-presets.js

{
    id: 'unique-preset-id',
    name: 'Descriptive Name',
    description: 'What makes this location special',
    fractal: 'mandelbrot',
    
    // Location (use strings for arbitrary precision)
    centerX: '-0.7436438870371587',
    centerY: '0.1318259043124085',
    zoom: '1e-12',  // or '0.000000000001'
    
    // Rendering settings
    maxIterations: 5000,
    bailout: 1e10,
    
    // Coloring
    coloringAlgorithm: 'smooth-iteration',
    palette: 'inferno',
    
    // Optional
    author: 'Your Name',
    discoveryDate: '2025-01-15',
    tags: ['spiral', 'deep-zoom', 'mini-mandelbrot']
}
```

### Finding Good Presets

1. **Explore** until you find something visually interesting
2. **Test multiple zoom levels** to ensure it remains interesting
3. **Note the coordinates** (use the "Copy Location" feature)
4. **Optimize settings** (iterations, coloring) for best appearance
5. **Give it a memorable name** and description

### Submitting Presets

Create a pull request with:
- The preset added to the appropriate file
- A screenshot (optional but helpful)
- Zoom level and any special rendering notes

---

## Adding Fractals

### 2D Fractals

New 2D fractals go in `js/fractals/`. Follow the base class pattern:

```javascript
// js/fractals/my-fractal.js

import { FractalBase, IterationResult } from './fractal-base.js';
import { Complex } from '../math/complex.js';

/**
 * My Custom Fractal
 * Formula: z = [your formula] + c
 * Reference: [paper or source]
 */
export class MyFractal extends FractalBase {
    static id = 'my-fractal';
    static name = 'My Fractal';
    static description = 'Description of the fractal';
    
    /**
     * Main iteration function
     * @param {Complex} c - The c parameter
     * @param {Object} params - Additional parameters
     * @returns {IterationResult}
     */
    iterate(c, params = {}) {
        const maxIter = params.maxIterations ?? 1000;
        const bailout = params.bailout ?? 4;
        
        let z = Complex.ZERO;
        let n = 0;
        
        while (n < maxIter && z.abs2() < bailout) {
            // Your iteration formula here
            z = z.mul(z).add(c);
            n++;
        }
        
        return new IterationResult({
            iterations: n,
            escaped: z.abs2() >= bailout,
            finalZ: z,
            // ... other data for coloring
        });
    }
    
    /**
     * Support perturbation for deep zooms?
     */
    supportsPerturbation() {
        return false; // Set true if you implement it
    }
    
    /**
     * Get default parameters
     */
    getDefaultParams() {
        return {
            maxIterations: 1000,
            bailout: 4,
            // Custom params...
        };
    }
}
```

Don't forget to register it in `js/fractals/fractal-registry.js`!

### 3D Fractals

3D fractals use distance estimation and go in `js/fractals3d/`. They require:

1. **JavaScript module** in `js/fractals3d/`
2. **GLSL shader** in `js/shaders/`
3. Registration in the 3D registry

---

## Adding Coloring Algorithms

Coloring algorithms transform iteration data into RGB colors.

```javascript
// js/coloring/my-coloring.js

import { ColoringAlgorithm } from './coloring-engine.js';

/**
 * My Custom Coloring Algorithm
 */
export class MyColoring extends ColoringAlgorithm {
    static id = 'my-coloring';
    static name = 'My Coloring';
    static description = 'What this algorithm does';
    
    /**
     * Calculate color value from iteration result
     * @param {IterationResult} result
     * @param {Object} params
     * @returns {number} Value in [0, 1] to map to palette
     */
    calculate(result, params = {}) {
        if (!result.escaped) {
            return 0; // Interior color
        }
        
        // Your algorithm here
        const value = /* ... */;
        
        return value % 1; // Normalize to [0, 1]
    }
    
    /**
     * Parameters this algorithm accepts
     */
    static getParameters() {
        return [
            {
                name: 'intensity',
                type: 'float',
                default: 1.0,
                min: 0,
                max: 10,
                description: 'Color intensity'
            }
        ];
    }
}
```

---

## Adding Shaders

GLSL shaders for 3D fractals go in `js/shaders/`:

```javascript
// js/shaders/my-fractal.glsl.js

export const myFractalShader = {
    name: 'My Fractal',
    
    // Distance estimation function
    distanceFunction: `
        float DE_MyFractal(vec3 pos, float power) {
            vec3 z = pos;
            float dr = 1.0;
            float r = 0.0;
            
            for (int i = 0; i < MAX_ITERATIONS; i++) {
                r = length(z);
                if (r > BAILOUT) break;
                
                // Your formula here
                // ...
                
                z = /* transformed z */;
                dr = /* derivative */;
            }
            
            return 0.5 * log(r) * r / dr;
        }
    `,
    
    // Uniforms specific to this fractal
    uniforms: {
        power: { type: 'float', default: 8.0 }
    }
};
```

---

## Testing Deep Zooms

When contributing perturbation or deep zoom features, test at multiple depths:

### Test Locations

```javascript
// Standard precision (zoom < 1e-14)
{ x: -0.5, y: 0, zoom: 1e-10 }

// Perturbation required (1e-14 to 1e-300)
{ x: -1.768778833, y: -0.001738996, zoom: 1e-50 }

// Series approximation needed (> 1e-100)
{ x: '-0.743643887037158704752191506114774', 
  y: '0.131825904205311970493132056385139', 
  zoom: '1e-200' }
```

### What to Check

- [ ] No visible glitches (dark spots, wrong colors)
- [ ] Smooth transitions when zooming
- [ ] Reference orbit rebasing works correctly
- [ ] Performance is reasonable (<10s for most views)
- [ ] Memory usage doesn't explode

---

## Documentation

### Documenting Code

Use JSDoc for all public functions:

```javascript
/**
 * Brief description of the function
 * 
 * Longer description if needed, including:
 * - Mathematical formulas
 * - Algorithm complexity
 * - Edge cases
 * 
 * @param {Complex} z - Input complex number
 * @param {number} [iterations=1000] - Maximum iterations
 * @returns {IterationResult} The iteration result
 * @throws {Error} If z is not a valid complex number
 * 
 * @example
 * const result = iterate(new Complex(-0.5, 0.5), 2000);
 * console.log(result.escaped); // true
 */
```

### Writing Docs

Documentation in `docs/` should:

- Explain concepts clearly for newcomers
- Include mathematical formulas where relevant
- Provide code examples
- Link to academic references

---

## Bug Reports

### Before Reporting

1. **Search existing issues** for duplicates
2. **Test in multiple browsers** if possible
3. **Try clearing localStorage** (Settings → Reset)
4. **Note your browser/OS version**

### Bug Report Template

```markdown
**Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots.

**Environment**
- Browser: Chrome 120
- OS: Windows 11
- Screen: 1920x1080

**Fractal Location** (if relevant)
- Coordinates: (-0.5, 0)
- Zoom: 1e-100
- Fractal type: Mandelbrot

**Console Errors**
Any errors from the browser console.
```

---

## Pull Request Process

### Before Submitting

1. **Create a feature branch**: `git checkout -b feature/my-feature`
2. **Write clean, documented code**
3. **Test your changes thoroughly**
4. **Update documentation if needed**
5. **Commit with clear messages**

### Commit Messages

```
type(scope): Brief description

Longer description if needed.

Fixes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How did you test these changes?

## Screenshots
If applicable.

## Checklist
- [ ] Code follows project style
- [ ] Self-reviewed my code
- [ ] Added comments where needed
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Tested on multiple browsers
```

---

## Community Guidelines

### Code of Conduct

- **Be respectful** and inclusive
- **Be constructive** in feedback
- **Assume good intentions**
- **Help newcomers** learn

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas
- **Pull Requests**: For code contributions

---

## Thank You! 🙏

Every contribution, no matter how small, helps make Abyss Explorer better. Whether you're fixing a typo, adding a preset, or implementing a major feature, your work is appreciated!

Happy fractal exploring! 🌀
