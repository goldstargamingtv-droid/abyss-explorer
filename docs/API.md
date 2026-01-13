# JavaScript API Reference

> *"Programs must be written for people to read, and only incidentally for machines to execute."*
> — Harold Abelson

This document provides a comprehensive API reference for developers who want to extend, modify, or integrate with Abyss Explorer.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Classes](#core-classes)
3. [Camera System](#camera-system)
4. [Fractal System](#fractal-system)
5. [Coloring System](#coloring-system)
6. [Rendering Pipeline](#rendering-pipeline)
7. [State Management](#state-management)
8. [Event System](#event-system)
9. [Worker Communication](#worker-communication)
10. [Extending the System](#extending-the-system)
11. [Utility Functions](#utility-functions)
12. [Type Definitions](#type-definitions)

---

## Architecture Overview

### Module Structure

```
js/
├── core/           # Core engine, state, performance
├── camera/         # 2D/3D camera, animation
├── fractals/       # 2D fractal implementations
├── fractals3d/     # 3D fractal implementations
├── coloring/       # Coloring algorithms
├── rendering/      # Renderers, tile manager
├── math/           # Complex, quaternion, perturbation
├── palettes/       # Color palettes, editor
├── ui/             # UI components
├── workers/        # Web Workers
├── export/         # Image/video export
├── utils/          # Utility functions
└── main.js         # Entry point
```

### Initialization Flow

```javascript
// 1. Import modules
import { Engine } from './core/engine.js';
import { StateManager } from './core/state.js';

// 2. Initialize engine
const engine = new Engine({
    canvas: document.getElementById('fractal-canvas'),
    width: window.innerWidth,
    height: window.innerHeight
});

// 3. Start rendering
engine.start();
```

---

## Core Classes

### Engine

The main rendering engine coordinating all systems.

```javascript
import { Engine } from './js/core/engine.js';

const engine = new Engine(options);
```

#### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `canvas` | HTMLCanvasElement | required | Target canvas |
| `width` | number | 800 | Canvas width |
| `height` | number | 600 | Canvas height |
| `workerCount` | number | navigator.hardwareConcurrency | Worker threads |
| `useGPU` | boolean | true | Enable WebGL |
| `antialias` | boolean | true | Enable antialiasing |

#### Methods

```javascript
// Lifecycle
engine.start()              // Start render loop
engine.stop()               // Stop render loop
engine.dispose()            // Clean up resources

// Rendering
engine.render()             // Force immediate render
engine.resize(width, height) // Resize canvas
engine.setQuality(level)    // 'low' | 'medium' | 'high' | 'ultra'

// State
engine.getState()           // Get current state
engine.setState(state)      // Set state (triggers render)
engine.resetView()          // Reset to default view

// Export
engine.exportImage(options) // Export as image
engine.startRecording(options) // Start video recording
engine.stopRecording()      // Stop recording
```

#### Events

```javascript
engine.on('render', (stats) => {
    console.log(`Rendered in ${stats.time}ms`);
});

engine.on('progress', (percent) => {
    console.log(`${percent}% complete`);
});

engine.on('error', (error) => {
    console.error('Render error:', error);
});
```

---

### StateManager

Centralized application state management.

```javascript
import { StateManager, getState } from './js/core/state.js';

const state = getState();
```

#### State Structure

```typescript
interface AppState {
    // Fractal
    fractalType: string;
    fractalParams: Record<string, any>;
    
    // View
    centerX: string;          // Arbitrary precision
    centerY: string;          // Arbitrary precision
    zoom: string;             // Arbitrary precision
    rotation: number;
    
    // Rendering
    maxIterations: number;
    bailout: number;
    coloringMethod: string;
    
    // Palette
    paletteId: string;
    paletteOffset: number;
    paletteCycling: boolean;
    
    // 3D specific
    camera3D: Camera3DState;
    lighting: LightingState;
}
```

#### Methods

```javascript
// Get/Set
state.get('fractalType')
state.set('fractalType', 'mandelbrot')
state.setMultiple({ zoom: '1e10', maxIterations: 5000 })

// Subscribe to changes
const unsubscribe = state.subscribe('zoom', (newZoom, oldZoom) => {
    console.log(`Zoom changed from ${oldZoom} to ${newZoom}`);
});

// Batch updates
state.batch(() => {
    state.set('centerX', '-0.75');
    state.set('centerY', '0.1');
    state.set('zoom', '1e6');
});

// History
state.undo()
state.redo()
state.canUndo()
state.canRedo()

// Persistence
state.save('myPreset')
state.load('myPreset')
state.export()              // Returns JSON string
state.import(jsonString)
```

---

## Camera System

### Camera2D

Handles 2D fractal view navigation.

```javascript
import { Camera2D } from './js/camera/camera2d.js';

const camera = new Camera2D({
    centerX: '-0.5',
    centerY: '0',
    zoom: '1',
    rotation: 0
});
```

#### Methods

```javascript
// Navigation
camera.pan(dx, dy)          // Pan by screen pixels
camera.zoomAt(x, y, factor) // Zoom at screen position
camera.zoomIn(factor = 2)   // Zoom in at center
camera.zoomOut(factor = 2)  // Zoom out at center
camera.setCenter(x, y)      // Set center (arbitrary precision strings)
camera.setZoom(zoom)        // Set zoom level
camera.rotate(angle)        // Rotate view (radians)
camera.reset()              // Reset to default

// Coordinate conversion
camera.screenToComplex(screenX, screenY) // Returns {re, im}
camera.complexToScreen(re, im)           // Returns {x, y}

// State
camera.getState()           // Get camera state object
camera.setState(state)      // Set camera state

// Animation
camera.animateTo(target, duration, easing)
camera.isAnimating()
camera.stopAnimation()
```

#### Properties

```javascript
camera.centerX    // string (arbitrary precision)
camera.centerY    // string (arbitrary precision)
camera.zoom       // string (arbitrary precision)
camera.rotation   // number (radians)
camera.width      // number (pixels)
camera.height     // number (pixels)
```

---

### Camera3D

Handles 3D fractal view navigation.

```javascript
import { Camera3D } from './js/camera/camera3d.js';

const camera = new Camera3D({
    position: [2, 2, 2],
    target: [0, 0, 0],
    up: [0, 1, 0],
    fov: 60
});
```

#### Methods

```javascript
// Movement
camera.orbit(deltaTheta, deltaPhi)  // Orbit around target
camera.pan(dx, dy)                   // Pan camera and target
camera.dolly(distance)               // Move toward/away from target
camera.truck(dx, dy)                 // Move perpendicular to view
camera.roll(angle)                   // Roll around view axis

// Positioning
camera.setPosition(x, y, z)
camera.setTarget(x, y, z)
camera.lookAt(target)
camera.setFOV(degrees)

// Matrices
camera.getViewMatrix()               // Returns Float32Array(16)
camera.getProjectionMatrix()         // Returns Float32Array(16)
camera.getViewProjectionMatrix()     // Combined matrix

// Ray casting
camera.getRay(screenX, screenY)      // Returns {origin, direction}
```

---

### AnimationController

Manages keyframe-based camera animations.

```javascript
import { AnimationController } from './js/camera/animation-controller.js';

const animator = new AnimationController(camera);
```

#### Methods

```javascript
// Keyframes
animator.addKeyframe(time, state)    // Add keyframe
animator.removeKeyframe(index)       // Remove keyframe
animator.updateKeyframe(index, state)// Update keyframe
animator.getKeyframes()              // Get all keyframes

// Playback
animator.play()
animator.pause()
animator.stop()
animator.seek(time)                  // Seek to time (0-1)
animator.setDuration(seconds)        // Set total duration
animator.setLoop(boolean)            // Set looping

// State
animator.isPlaying()
animator.getCurrentTime()
animator.getTotalDuration()

// Events
animator.on('frame', (state) => {})
animator.on('complete', () => {})
```

---

## Fractal System

### FractalBase

Abstract base class for all fractal implementations.

```javascript
import { FractalBase } from './js/fractals/fractal-base.js';

class MyFractal extends FractalBase {
    constructor() {
        super({
            id: 'my-fractal',
            name: 'My Custom Fractal',
            description: 'A custom fractal implementation'
        });
    }
    
    iterate(zRe, zIm, cRe, cIm, maxIter, bailout) {
        // Implement iteration logic
        // Return { n, zRe, zIm, escaped }
    }
    
    getDefaultParams() {
        return {
            power: 2,
            customParam: 1.0
        };
    }
}
```

#### Required Methods

```javascript
// Must implement
iterate(zRe, zIm, cRe, cIm, maxIter, bailout)

// Optional overrides
getDefaultParams()
getDefaultView()
getDerivative(zRe, zIm, cRe, cIm, dzRe, dzIm)
getPerturbationCoeffs(refOrbit)
```

### FractalRegistry

Registry for all available fractal types.

```javascript
import { FractalRegistry, getFractal } from './js/fractals/fractal-registry.js';

// Register a new fractal
FractalRegistry.register(new MyFractal());

// Get a fractal by ID
const mandelbrot = getFractal('mandelbrot');

// List all fractals
const allFractals = FractalRegistry.getAll();

// Get fractals by category
const fractal2D = FractalRegistry.getByCategory('2d');
const fractal3D = FractalRegistry.getByCategory('3d');
```

### Built-in Fractals

| ID | Class | Description |
|----|-------|-------------|
| `mandelbrot` | Mandelbrot | Classic z² + c |
| `julia` | Julia | Julia set |
| `burning-ship` | BurningShip | Abs value variant |
| `tricorn` | Tricorn | Conjugate variant |
| `newton` | Newton | Newton's method |
| `phoenix` | Phoenix | Memory term |
| `custom` | CustomFormula | User-defined |
| `mandelbulb` | Mandelbulb | 3D power 8 |
| `mandelbox` | Mandelbox | Box folding |
| `menger` | MengerSponge | Menger sponge |
| `sierpinski` | Sierpinski | Tetrahedron |
| `kleinian` | Kleinian | Kleinian groups |

---

## Coloring System

### ColoringEngine

Manages coloring algorithm application.

```javascript
import { ColoringEngine } from './js/coloring/coloring-engine.js';

const coloring = new ColoringEngine({
    method: 'smooth-iteration',
    params: { stripeDensity: 1.0 }
});
```

#### Methods

```javascript
// Apply coloring
coloring.getValue(n, z, orbit, c, params)  // Returns 0-1 value

// Configure
coloring.setMethod(methodId)
coloring.setParams(params)
coloring.getAvailableMethods()
```

### ColoringRegistry

Registry for coloring algorithms.

```javascript
import { ColoringRegistry } from './js/coloring/coloring-registry.js';

// Register custom coloring
ColoringRegistry.register({
    id: 'my-coloring',
    name: 'My Coloring',
    compute: (n, z, orbit, c, params) => {
        // Return value 0-1
    },
    params: {
        intensity: { type: 'float', default: 1.0, min: 0, max: 2 }
    }
});
```

---

## Rendering Pipeline

### Renderer2D

Renders 2D fractals using canvas or WebGL.

```javascript
import { Renderer2D } from './js/rendering/renderer2d.js';

const renderer = new Renderer2D(canvas, {
    useWebGL: true,
    tileSize: 256
});
```

#### Methods

```javascript
renderer.render(state)              // Full render
renderer.renderTile(x, y, w, h)     // Render single tile
renderer.abort()                    // Abort current render
renderer.setSize(width, height)
renderer.getPixelData()             // Returns ImageData
```

### Renderer3D

Renders 3D fractals using WebGL.

```javascript
import { Renderer3D } from './js/rendering/renderer3d.js';

const renderer = new Renderer3D(canvas, {
    antialias: true,
    maxSteps: 256
});
```

#### Methods

```javascript
renderer.render(state, camera)
renderer.setFractal(fractalId)
renderer.setShader(shaderId)
renderer.updateUniforms(uniforms)
```

### TileManager

Manages progressive tile-based rendering.

```javascript
import { TileManager } from './js/rendering/tile-manager.js';

const tiles = new TileManager({
    width: 1920,
    height: 1080,
    tileSize: 256,
    priority: 'center-out'
});
```

---

## State Management

### URL State

Encode/decode state to URL hash.

```javascript
import { encodeState, decodeState, updateURLHash } from './js/utils/url-state.js';

// Encode state to URL
const url = encodeState(state);

// Decode state from URL
const state = decodeState(window.location.hash);

// Update URL without reload
updateURLHash(state);
```

### Storage

Persistent storage utilities.

```javascript
import { Storage, getStorage } from './js/utils/storage.js';

const storage = getStorage();

// Save/load
storage.set('key', value);
storage.get('key');
storage.remove('key');
storage.clear();
```

---

## Event System

### Event Emitter

Base event emitter used throughout the application.

```javascript
import { EventEmitter } from './js/utils/events.js';

class MyClass extends EventEmitter {
    doSomething() {
        this.emit('something', { data: 123 });
    }
}

const obj = new MyClass();
obj.on('something', (data) => console.log(data));
obj.once('something', (data) => {}); // Fire once
obj.off('something', handler);       // Remove handler
```

### Global Events

```javascript
import { events } from './js/core/events.js';

events.on('fractal:changed', (newType) => {});
events.on('zoom:changed', (newZoom) => {});
events.on('render:start', () => {});
events.on('render:complete', (stats) => {});
events.on('render:progress', (percent) => {});
```

---

## Worker Communication

### WorkerManager

Manages web worker pool.

```javascript
import { WorkerManager } from './js/core/webworker-manager.js';

const workers = new WorkerManager({
    workerCount: 4,
    workerScript: './js/workers/render-worker.js'
});
```

#### Methods

```javascript
// Task distribution
workers.submitTask(task)           // Returns Promise
workers.submitBatch(tasks)         // Submit multiple tasks

// Control
workers.abort()                    // Abort all tasks
workers.terminate()                // Terminate workers

// Status
workers.getActiveCount()
workers.getPendingCount()
```

### Worker Protocol

Message format for worker communication:

```javascript
// To worker
{
    type: 'render-tile',
    id: 'task-123',
    data: {
        x: 0, y: 0,
        width: 256, height: 256,
        state: { /* fractal state */ }
    }
}

// From worker
{
    type: 'tile-complete',
    id: 'task-123',
    data: {
        pixels: Uint8ClampedArray,
        stats: { iterations: 1000000, time: 50 }
    }
}
```

---

## Extending the System

### Adding a New Fractal

```javascript
// 1. Create fractal class
import { FractalBase } from './js/fractals/fractal-base.js';

export class MyFractal extends FractalBase {
    constructor() {
        super({
            id: 'my-fractal',
            name: 'My Fractal',
            category: '2d',
            description: 'A custom fractal'
        });
    }
    
    iterate(zRe, zIm, cRe, cIm, maxIter, bailout) {
        let n = 0;
        
        for (; n < maxIter; n++) {
            // Your iteration logic
            const zReNew = /* ... */;
            const zImNew = /* ... */;
            
            if (zReNew*zReNew + zImNew*zImNew > bailout*bailout) {
                return { n, zRe: zReNew, zIm: zImNew, escaped: true };
            }
            
            zRe = zReNew;
            zIm = zImNew;
        }
        
        return { n: maxIter, zRe, zIm, escaped: false };
    }
}

// 2. Register
import { FractalRegistry } from './js/fractals/fractal-registry.js';
FractalRegistry.register(new MyFractal());
```

### Adding a New Coloring Method

```javascript
import { ColoringRegistry } from './js/coloring/coloring-registry.js';

ColoringRegistry.register({
    id: 'my-coloring',
    name: 'My Coloring Method',
    category: 'geometric',
    
    compute(n, z, orbit, c, params) {
        // Your coloring logic
        // Return value in range [0, 1]
        return Math.sin(n * params.frequency) * 0.5 + 0.5;
    },
    
    params: {
        frequency: {
            type: 'float',
            default: 1.0,
            min: 0.1,
            max: 10.0,
            label: 'Frequency'
        }
    }
});
```

### Adding a New Preset

```javascript
import { PresetLoader } from './js/presets/preset-loader.js';

PresetLoader.addPreset({
    id: 'my-location',
    name: 'My Discovery',
    category: 'custom',
    fractalType: 'mandelbrot',
    state: {
        centerX: '-0.74364388703715904',
        centerY: '0.13182590420531254',
        zoom: '1e12',
        maxIterations: 5000,
        paletteId: 'electric'
    }
});
```

---

## Utility Functions

### Math Utilities

```javascript
import { clamp, lerp, smoothstep, Complex } from './js/utils/math-utils.js';

clamp(value, min, max)
lerp(a, b, t)
smoothstep(edge0, edge1, x)

const z = new Complex(1, 2);
z.add(other)
z.mul(other)
z.abs()
z.arg()
```

### Color Utilities

```javascript
import { rgbToHsv, hsvToRgb, lerpColor } from './js/utils/color-utils.js';

rgbToHsv(r, g, b)           // Returns [h, s, v]
hsvToRgb(h, s, v)           // Returns [r, g, b]
lerpColor(color1, color2, t) // Interpolate colors
```

### Debounce/Throttle

```javascript
import { debounce, throttle } from './js/utils/debounce.js';

const debouncedFn = debounce(fn, 100);
const throttledFn = throttle(fn, 16);
```

---

## Type Definitions

### TypeScript Definitions

```typescript
// Complex number
interface Complex {
    re: number;
    im: number;
}

// Iteration result
interface IterationResult {
    n: number;
    zRe: number;
    zIm: number;
    escaped: boolean;
}

// Render tile
interface RenderTile {
    x: number;
    y: number;
    width: number;
    height: number;
    pixels: Uint8ClampedArray;
}

// Camera state
interface Camera2DState {
    centerX: string;
    centerY: string;
    zoom: string;
    rotation: number;
}

interface Camera3DState {
    position: [number, number, number];
    target: [number, number, number];
    up: [number, number, number];
    fov: number;
}

// Palette
interface Palette {
    id: string;
    name: string;
    colors: Array<[number, number, number]>;
    positions?: number[];
}
```

---

## Best Practices

### Performance

1. **Batch state updates** using `state.batch()`
2. **Debounce** user input handlers
3. **Use workers** for heavy computation
4. **Cache** expensive calculations
5. **Abort** pending renders when state changes

### Memory

1. **Dispose** unused objects
2. **Clear** large arrays when done
3. **Use TypedArrays** for pixel data
4. **Pool** frequently created objects

### Error Handling

```javascript
try {
    engine.render();
} catch (error) {
    if (error instanceof RenderAbortedError) {
        // Normal abort, ignore
    } else if (error instanceof PrecisionError) {
        // Switch to perturbation mode
    } else {
        console.error('Render failed:', error);
    }
}
```

---

*This document is part of the Abyss Explorer project. For implementation details, see the source code in `js/` directory.*
