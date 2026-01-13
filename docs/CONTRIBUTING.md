# Contributing to Abyss Explorer

> *"The best way to predict the future is to invent it."*
> — Alan Kay

Thank you for your interest in contributing to Abyss Explorer! This document provides guidelines for contributing code, presets, documentation, and bug reports.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Code Style](#code-style)
4. [Adding New Features](#adding-new-features)
5. [Adding Presets](#adding-presets)
6. [Adding Fractals](#adding-fractals)
7. [Adding Shaders](#adding-shaders)
8. [Testing](#testing)
9. [Documentation](#documentation)
10. [Bug Reports](#bug-reports)
11. [Pull Request Process](#pull-request-process)
12. [Community](#community)

---

## Getting Started

### Ways to Contribute

- 🐛 **Bug Reports**: Report issues you encounter
- 🎨 **Presets**: Share interesting fractal locations
- 🧮 **Fractals**: Implement new fractal types
- 🖌️ **Coloring**: Add new coloring algorithms
- 🔧 **Features**: Implement new functionality
- 📚 **Documentation**: Improve docs and tutorials
- 🌍 **Translations**: Help localize the interface

### Prerequisites

- Basic understanding of JavaScript (ES6+)
- Familiarity with fractal mathematics (helpful)
- Git for version control

---

## Development Setup

### Clone the Repository

```bash
git clone https://github.com/your-username/abyss-explorer.git
cd abyss-explorer
```

### Install Dependencies

```bash
# If using npm
npm install

# Or with a simple HTTP server
npx serve .
```

### Run Development Server

```bash
npm run dev
# Opens at http://localhost:3000
```

### Project Structure

```
abyss-explorer/
├── index.html          # Main HTML entry point
├── css/                # Stylesheets
├── js/                 # JavaScript source
│   ├── core/           # Engine, state management
│   ├── fractals/       # 2D fractal implementations
│   ├── fractals3d/     # 3D fractal implementations
│   ├── coloring/       # Coloring algorithms
│   ├── rendering/      # Render pipeline
│   ├── math/           # Mathematical utilities
│   ├── camera/         # Camera controls
│   ├── palettes/       # Color palettes
│   ├── ui/             # User interface
│   ├── workers/        # Web Workers
│   ├── export/         # Export functionality
│   ├── presets/        # Location presets
│   └── utils/          # General utilities
├── assets/             # Images, icons, data
└── docs/               # Documentation
```

---

## Code Style

### JavaScript Guidelines

We follow a consistent coding style. Key points:

```javascript
// ✅ Good: Use ES6+ features
const sum = (a, b) => a + b;
const { x, y } = point;
const items = [...array1, ...array2];

// ✅ Good: Meaningful names
const calculateSmoothIteration = (n, z, bailout) => { /* ... */ };

// ❌ Bad: Abbreviations
const calcSI = (n, z, b) => { /* ... */ };

// ✅ Good: Document complex functions
/**
 * Calculate the smooth iteration count for coloring.
 * @param {number} n - Escape iteration
 * @param {Complex} z - Final z value
 * @param {number} bailout - Bailout radius
 * @returns {number} Smooth iteration value
 */
function smoothIteration(n, z, bailout) {
    // Implementation
}

// ✅ Good: Use const/let, never var
const MAX_ITERATIONS = 10000;
let currentZoom = 1.0;

// ✅ Good: Consistent formatting
if (condition) {
    doSomething();
} else {
    doSomethingElse();
}

// ✅ Good: Error handling
try {
    riskyOperation();
} catch (error) {
    console.error('Operation failed:', error);
    throw new CustomError('Context', error);
}
```

### File Naming

- **Classes**: PascalCase (`FractalBase.js`)
- **Utilities**: kebab-case (`math-utils.js`)
- **Constants**: UPPER_SNAKE_CASE in code

### Comments

```javascript
// Single-line comments for brief explanations

/*
 * Multi-line comments for longer explanations
 * that span multiple lines.
 */

/**
 * JSDoc comments for functions and classes.
 * @param {Type} paramName - Description
 * @returns {Type} Description
 */
```

### Module Structure

```javascript
/**
 * Module description
 * @module module-name
 */

// Imports (grouped and sorted)
import { Something } from './external.js';
import { Internal } from './internal.js';

// Constants
const CONSTANT = 'value';

// Main class/function
export class MyClass {
    // ...
}

// Helper functions (not exported)
function helperFunction() {
    // ...
}

// Default export (if applicable)
export default MyClass;
```

---

## Adding New Features

### Feature Request Process

1. **Open an Issue**: Describe the feature
2. **Discuss**: Get feedback from maintainers
3. **Design**: Document the approach
4. **Implement**: Write the code
5. **Test**: Ensure quality
6. **Document**: Update docs
7. **Submit PR**: Request review

### Implementation Guidelines

1. **Keep it modular**: One feature per file/module
2. **Maintain backwards compatibility**: Don't break existing APIs
3. **Write tests**: Cover new functionality
4. **Update documentation**: Include usage examples
5. **Consider performance**: Profile critical paths

---

## Adding Presets

### Preset Format

Create presets in `js/presets/`:

```javascript
// js/presets/my-presets.js
export const MY_PRESETS = [
    {
        id: 'my-unique-id',
        name: 'My Discovery',
        description: 'A beautiful spiral in Seahorse Valley',
        category: 'seahorse',
        fractalType: 'mandelbrot',
        thumbnail: 'my-discovery.webp',  // Optional
        author: 'Your Name',
        dateAdded: '2024-01-15',
        
        // Required state
        state: {
            centerX: '-0.7463',
            centerY: '0.1102',
            zoom: '500',
            maxIterations: 500,
            bailout: 256,
            coloringMethod: 'smooth-iteration',
            paletteId: 'classic-blue'
        },
        
        // Optional metadata
        tags: ['spiral', 'classic', 'beginner'],
        difficulty: 'beginner',  // beginner, intermediate, advanced, expert
        renderTime: 'fast',      // fast, medium, slow
        mathematicalInterest: 'Demonstrates the Seahorse Valley structure'
    }
];
```

### Finding Interesting Locations

1. **Explore manually**: Use the app to find locations
2. **Use URL export**: Copy the share URL
3. **Document coordinates**: Note the exact position
4. **Verify reproducibility**: Ensure it renders correctly

### Preset Checklist

- [ ] Unique, descriptive ID
- [ ] Clear, evocative name
- [ ] Accurate coordinates (verify!)
- [ ] Appropriate iteration count
- [ ] Good color palette choice
- [ ] Category and tags
- [ ] Difficulty rating
- [ ] Optional: thumbnail image
- [ ] Optional: mathematical notes

---

## Adding Fractals

### 2D Fractal Template

```javascript
// js/fractals/my-fractal.js
import { FractalBase } from './fractal-base.js';

/**
 * My Custom Fractal
 * Mathematical formula: z_{n+1} = ...
 */
export class MyFractal extends FractalBase {
    constructor() {
        super({
            id: 'my-fractal',
            name: 'My Fractal',
            category: '2d',
            description: 'Description of the fractal',
            formula: 'z_{n+1} = z_n^2 + c',  // LaTeX formula
            reference: 'https://...'  // Optional paper/source
        });
    }
    
    /**
     * Get default parameters
     */
    getDefaultParams() {
        return {
            power: 2,
            customParam: 1.0
        };
    }
    
    /**
     * Get default view
     */
    getDefaultView() {
        return {
            centerX: '0',
            centerY: '0',
            zoom: '1'
        };
    }
    
    /**
     * Main iteration function
     * @param {number} zRe - Real part of z
     * @param {number} zIm - Imaginary part of z
     * @param {number} cRe - Real part of c
     * @param {number} cIm - Imaginary part of c
     * @param {number} maxIter - Maximum iterations
     * @param {number} bailout - Escape radius
     * @returns {Object} { n, zRe, zIm, escaped }
     */
    iterate(zRe, zIm, cRe, cIm, maxIter, bailout) {
        const bailout2 = bailout * bailout;
        let n = 0;
        
        for (; n < maxIter; n++) {
            // Your iteration logic here
            const zRe2 = zRe * zRe;
            const zIm2 = zIm * zIm;
            
            if (zRe2 + zIm2 > bailout2) {
                return { n, zRe, zIm, escaped: true };
            }
            
            // z = z^2 + c (example)
            const newRe = zRe2 - zIm2 + cRe;
            const newIm = 2 * zRe * zIm + cIm;
            zRe = newRe;
            zIm = newIm;
        }
        
        return { n: maxIter, zRe, zIm, escaped: false };
    }
    
    /**
     * Optional: Derivative for distance estimation
     */
    getDerivative(zRe, zIm, cRe, cIm, dzRe, dzIm) {
        // Return derivative of z with respect to c
        return {
            re: 2 * (zRe * dzRe - zIm * dzIm) + 1,
            im: 2 * (zRe * dzIm + zIm * dzRe)
        };
    }
}

// Register the fractal
import { FractalRegistry } from './fractal-registry.js';
FractalRegistry.register(new MyFractal());
```

### 3D Fractal Template

```javascript
// js/fractals3d/my-3d-fractal.js
import { Fractal3DBase } from './fractal3d-base.js';

export class My3DFractal extends Fractal3DBase {
    constructor() {
        super({
            id: 'my-3d-fractal',
            name: 'My 3D Fractal',
            category: '3d',
            description: 'A 3D fractal description',
            shaderFile: 'my-fractal.glsl'  // Optional custom shader
        });
    }
    
    /**
     * Distance estimator (JavaScript version for CPU)
     */
    distanceEstimate(x, y, z, params) {
        // Return estimated distance to surface
    }
    
    /**
     * Get shader uniforms
     */
    getUniforms(params) {
        return {
            u_power: params.power || 8,
            u_iterations: params.iterations || 15
        };
    }
}
```

### Fractal Checklist

- [ ] Unique ID
- [ ] Clear name and description
- [ ] Correct mathematical formula
- [ ] Efficient iteration implementation
- [ ] Default parameters and view
- [ ] Optional: derivative for DE
- [ ] Optional: perturbation support
- [ ] Tests for edge cases
- [ ] Documentation

---

## Adding Shaders

### Shader Template

```glsl
// js/shaders/my-fractal.glsl.js

export const MY_FRACTAL_SHADER = `
// Distance estimator for My Fractal
float DE_MyFractal(vec3 pos) {
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    
    for (int i = 0; i < u_maxIterations; i++) {
        r = length(z);
        if (r > u_bailout) break;
        
        // Your distance estimator logic
        // ...
        
        dr = /* derivative */ dr + 1.0;
        z = /* transformation */ z + pos;
    }
    
    return 0.5 * log(r) * r / dr;
}
`;
```

### Shader Guidelines

1. **Use uniforms**: For all parameters
2. **Avoid branching**: Where possible
3. **Comment math**: Explain non-obvious operations
4. **Test on multiple GPUs**: If possible

---

## Testing

### Manual Testing

1. **Visual verification**: Does it look correct?
2. **Edge cases**: Test extreme zoom, iterations
3. **Performance**: Check FPS, memory usage
4. **Cross-browser**: Test in Chrome, Firefox, Safari

### Deep Zoom Testing

When testing deep zoom functionality:

```javascript
// Test coordinates for deep zoom verification
const TEST_LOCATIONS = [
    {
        name: 'Shallow zoom',
        zoom: '1e3',
        expectedResult: 'Standard precision sufficient'
    },
    {
        name: 'Medium zoom',
        zoom: '1e10',
        expectedResult: 'Double precision sufficient'
    },
    {
        name: 'Deep zoom',
        zoom: '1e15',
        expectedResult: 'Perturbation required'
    },
    {
        name: 'Ultra-deep zoom',
        zoom: '1e50',
        expectedResult: 'Series approximation required'
    }
];
```

### Testing Checklist

- [ ] Renders correctly at all zoom levels
- [ ] No visual artifacts
- [ ] Smooth animation
- [ ] Memory doesn't leak
- [ ] Workers function correctly
- [ ] Export works
- [ ] URL sharing works

---

## Documentation

### Documentation Guidelines

1. **Keep it current**: Update docs when code changes
2. **Include examples**: Show, don't just tell
3. **Use clear language**: Avoid jargon when possible
4. **Add visuals**: Screenshots, diagrams where helpful

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `docs/MATHEMATICS.md` | Mathematical foundations |
| `docs/PERTURBATION_THEORY.md` | Deep zoom technique |
| `docs/SERIES_APPROXIMATION.md` | Series optimization |
| `docs/COLORING_ALGORITHMS.md` | Coloring reference |
| `docs/SHADER_REFERENCE.md` | GLSL shader docs |
| `docs/API.md` | Developer API |
| `docs/CONTRIBUTING.md` | This file |

---

## Bug Reports

### Good Bug Report Template

```markdown
## Bug Description
A clear description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Zoom to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Screenshots
If applicable, add screenshots.

## Environment
- Browser: Chrome 120
- OS: Windows 11
- GPU: NVIDIA RTX 3080
- Zoom level: 1e15
- Fractal type: Mandelbrot

## Additional Context
Any other relevant information.

## Coordinates (if applicable)
- Center: -0.74364388703715904 + 0.13182590420531254i
- Zoom: 1e12
- URL: [share link]
```

### What Makes a Good Bug Report

1. **Reproducible**: Steps to recreate
2. **Specific**: Exact coordinates, settings
3. **Complete**: All relevant information
4. **Minimal**: Simplest case that shows the bug

---

## Pull Request Process

### Before Submitting

1. **Fork** the repository
2. **Create a branch**: `feature/my-feature` or `fix/bug-description`
3. **Make changes**: Follow code style
4. **Test thoroughly**: Verify everything works
5. **Update docs**: If needed
6. **Commit**: Clear, descriptive messages

### Commit Message Format

```
type(scope): short description

Longer description if needed.

Fixes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### PR Description Template

```markdown
## Description
What does this PR do?

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots
If applicable.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass
```

### Review Process

1. Submit PR
2. Automated checks run
3. Maintainer review
4. Address feedback
5. Approval and merge

---

## Community

### Communication

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas
- **Discord**: Real-time chat (if available)

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Give constructive feedback
- Focus on the work, not the person
- Assume good intentions

### Recognition

Contributors are recognized in:
- `CONTRIBUTORS.md` file
- Release notes
- Preset author credits

---

## Thank You!

Your contributions make Abyss Explorer better for everyone. Whether you're fixing a typo, adding a preset, or implementing a new fractal type, every contribution is valued.

Happy exploring! 🌀

---

*This document is part of the Abyss Explorer project.*
