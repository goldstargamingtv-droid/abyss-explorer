/**
 * ============================================================================
 * ABYSS EXPLORER - GRADIENT GENERATOR
 * ============================================================================
 * 
 * Advanced gradient creation system with multiple generation algorithms
 * including procedural, harmonic, and fractal-inspired methods.
 * 
 * Generation Methods:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  Mathematical Harmonics:                                               │
 * │    - Color wheel harmonies (complementary, triadic, etc.)             │
 * │    - Golden ratio based spacing                                       │
 * │    - Fibonacci sequence colors                                        │
 * │                                                                        │
 * │  Procedural Methods:                                                   │
 * │    - Perlin noise based gradients                                     │
 * │    - Random walks in color space                                      │
 * │    - Seeded deterministic generation                                  │
 * │                                                                        │
 * │  Fractal-Inspired:                                                    │
 * │    - Iteration-based color sequences                                  │
 * │    - Mandelbrot orbit colors                                          │
 * │    - Self-similar gradient structures                                 │
 * │                                                                        │
 * │  Natural Phenomena:                                                    │
 * │    - Sunset/sunrise gradients                                         │
 * │    - Ocean depth colors                                               │
 * │    - Fire/lava heat maps                                              │
 * │    - Aurora borealis                                                  │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * @module palettes/gradient-generator
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { 
    Palette, 
    hsvToRgb, 
    rgbToHsv, 
    hslToRgb,
    oklabToRgb,
    INTERPOLATION,
    COLOR_SPACE
} from './palette-engine.js';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Golden ratio */
const PHI = (1 + Math.sqrt(5)) / 2;

/** Golden angle in degrees */
const GOLDEN_ANGLE = 360 / (PHI * PHI);

/** Two PI */
const TWO_PI = 2 * Math.PI;

// ============================================================================
// SEEDED RANDOM
// ============================================================================

/**
 * Seeded random number generator (Mulberry32)
 */
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    
    next() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    
    range(min, max) {
        return min + this.next() * (max - min);
    }
    
    int(min, max) {
        return Math.floor(this.range(min, max));
    }
}

// ============================================================================
// NOISE FUNCTIONS
// ============================================================================

/**
 * Simple 1D noise function
 */
function noise1D(x, seed = 0) {
    const n = Math.sin(x * 12.9898 + seed * 78.233) * 43758.5453;
    return n - Math.floor(n);
}

/**
 * Smoothed noise with interpolation
 */
function smoothNoise1D(x, seed = 0) {
    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const t = x - x0;
    
    // Smoothstep interpolation
    const st = t * t * (3 - 2 * t);
    
    return noise1D(x0, seed) * (1 - st) + noise1D(x1, seed) * st;
}

/**
 * Fractal Brownian motion (fBm) noise
 */
function fbmNoise(x, octaves = 4, lacunarity = 2, gain = 0.5, seed = 0) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
        value += amplitude * smoothNoise1D(x * frequency, seed + i * 1000);
        maxValue += amplitude;
        amplitude *= gain;
        frequency *= lacunarity;
    }
    
    return value / maxValue;
}

// ============================================================================
// GRADIENT GENERATOR CLASS
// ============================================================================

export class GradientGenerator {
    constructor(options = {}) {
        this.seed = options.seed || Date.now();
        this.rng = new SeededRandom(this.seed);
    }
    
    /**
     * Set seed for reproducible generation
     * @param {number} seed - Random seed
     */
    setSeed(seed) {
        this.seed = seed;
        this.rng = new SeededRandom(seed);
    }
    
    // ========================================================================
    // COLOR HARMONY GENERATORS
    // ========================================================================
    
    /**
     * Generate complementary color palette
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateComplementary(options = {}) {
        const baseHue = options.baseHue ?? this.rng.range(0, 360);
        const stops = options.stops || 5;
        
        const palette = new Palette({
            name: 'Complementary Harmony',
            interpolation: options.interpolation || INTERPOLATION.SMOOTH,
            colorSpace: options.colorSpace || COLOR_SPACE.HSV
        });
        
        for (let i = 0; i < stops; i++) {
            const t = i / (stops - 1);
            const hue = (baseHue + t * 180) % 360;
            const sat = 0.6 + Math.sin(t * Math.PI) * 0.3;
            const val = 0.3 + t * 0.6;
            
            const rgb = hsvToRgb(hue, sat, val);
            palette.addStop(t, rgb);
        }
        
        return palette;
    }
    
    /**
     * Generate triadic color palette
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateTriadic(options = {}) {
        const baseHue = options.baseHue ?? this.rng.range(0, 360);
        const stops = options.stops || 6;
        
        const palette = new Palette({
            name: 'Triadic Harmony',
            interpolation: options.interpolation || INTERPOLATION.SMOOTH,
            colorSpace: options.colorSpace || COLOR_SPACE.HSV
        });
        
        const hues = [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360];
        
        for (let i = 0; i < stops; i++) {
            const t = i / (stops - 1);
            const hueIdx = Math.floor(t * 3) % 3;
            const localT = (t * 3) % 1;
            
            const hue = hues[hueIdx] + localT * 20 - 10;
            const sat = 0.5 + Math.sin(t * Math.PI) * 0.4;
            const val = 0.2 + t * 0.7;
            
            const rgb = hsvToRgb(hue, sat, val);
            palette.addStop(t, rgb);
        }
        
        return palette;
    }
    
    /**
     * Generate analogous color palette
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateAnalogous(options = {}) {
        const baseHue = options.baseHue ?? this.rng.range(0, 360);
        const spread = options.spread || 60;
        const stops = options.stops || 5;
        
        const palette = new Palette({
            name: 'Analogous Harmony',
            interpolation: options.interpolation || INTERPOLATION.SMOOTH,
            colorSpace: options.colorSpace || COLOR_SPACE.HSV
        });
        
        for (let i = 0; i < stops; i++) {
            const t = i / (stops - 1);
            const hue = (baseHue - spread/2 + t * spread + 360) % 360;
            const sat = 0.5 + Math.sin(t * Math.PI * 2) * 0.3;
            const val = 0.3 + t * 0.6;
            
            const rgb = hsvToRgb(hue, sat, val);
            palette.addStop(t, rgb);
        }
        
        return palette;
    }
    
    /**
     * Generate split-complementary palette
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateSplitComplementary(options = {}) {
        const baseHue = options.baseHue ?? this.rng.range(0, 360);
        const splitAngle = options.splitAngle || 30;
        const stops = options.stops || 6;
        
        const palette = new Palette({
            name: 'Split Complementary',
            interpolation: INTERPOLATION.SMOOTH,
            colorSpace: COLOR_SPACE.HSV
        });
        
        const hues = [
            baseHue,
            (baseHue + 180 - splitAngle + 360) % 360,
            (baseHue + 180 + splitAngle) % 360
        ];
        
        for (let i = 0; i < stops; i++) {
            const t = i / (stops - 1);
            const hueIdx = Math.floor(t * 3) % 3;
            const hue = hues[hueIdx];
            const sat = 0.6 + Math.sin(t * Math.PI) * 0.3;
            const val = 0.2 + t * 0.7;
            
            const rgb = hsvToRgb(hue, sat, val);
            palette.addStop(t, rgb);
        }
        
        return palette;
    }
    
    /**
     * Generate tetradic (rectangle) palette
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateTetradic(options = {}) {
        const baseHue = options.baseHue ?? this.rng.range(0, 360);
        const stops = options.stops || 8;
        
        const palette = new Palette({
            name: 'Tetradic Harmony',
            interpolation: INTERPOLATION.SMOOTH,
            colorSpace: COLOR_SPACE.HSV
        });
        
        const hues = [
            baseHue,
            (baseHue + 60) % 360,
            (baseHue + 180) % 360,
            (baseHue + 240) % 360
        ];
        
        for (let i = 0; i < stops; i++) {
            const t = i / (stops - 1);
            const hueIdx = Math.floor(t * 4) % 4;
            const hue = hues[hueIdx];
            const sat = 0.5 + Math.sin(t * Math.PI * 2) * 0.4;
            const val = 0.2 + t * 0.7;
            
            const rgb = hsvToRgb(hue, sat, val);
            palette.addStop(t, rgb);
        }
        
        return palette;
    }
    
    // ========================================================================
    // GOLDEN RATIO GENERATORS
    // ========================================================================
    
    /**
     * Generate palette using golden ratio angle
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateGoldenRatio(options = {}) {
        const baseHue = options.baseHue ?? this.rng.range(0, 360);
        const stops = options.stops || 8;
        const satRange = options.satRange || [0.4, 0.9];
        const valRange = options.valRange || [0.3, 0.9];
        
        const palette = new Palette({
            name: 'Golden Ratio',
            interpolation: INTERPOLATION.SMOOTH,
            colorSpace: COLOR_SPACE.HSV
        });
        
        for (let i = 0; i < stops; i++) {
            const t = i / (stops - 1);
            const hue = (baseHue + i * GOLDEN_ANGLE) % 360;
            const sat = satRange[0] + t * (satRange[1] - satRange[0]);
            const val = valRange[0] + t * (valRange[1] - valRange[0]);
            
            const rgb = hsvToRgb(hue, sat, val);
            palette.addStop(t, rgb);
        }
        
        return palette;
    }
    
    /**
     * Generate Fibonacci sequence palette
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateFibonacci(options = {}) {
        const baseHue = options.baseHue ?? this.rng.range(0, 360);
        const stops = options.stops || 8;
        
        const palette = new Palette({
            name: 'Fibonacci Sequence',
            interpolation: INTERPOLATION.SMOOTH,
            colorSpace: COLOR_SPACE.HSV
        });
        
        // Generate Fibonacci sequence
        const fib = [1, 1];
        for (let i = 2; i < stops; i++) {
            fib.push(fib[i-1] + fib[i-2]);
        }
        const maxFib = fib[fib.length - 1];
        
        for (let i = 0; i < stops; i++) {
            const t = i / (stops - 1);
            const fibRatio = fib[i] / maxFib;
            
            const hue = (baseHue + fibRatio * 360) % 360;
            const sat = 0.5 + fibRatio * 0.4;
            const val = 0.2 + fibRatio * 0.7;
            
            const rgb = hsvToRgb(hue, sat, val);
            palette.addStop(t, rgb);
        }
        
        return palette;
    }
    
    // ========================================================================
    // PROCEDURAL GENERATORS
    // ========================================================================
    
    /**
     * Generate palette using Perlin-like noise
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateNoiseGradient(options = {}) {
        const stops = options.stops || 10;
        const octaves = options.octaves || 3;
        const frequency = options.frequency || 1;
        const seed = options.seed ?? this.seed;
        
        const palette = new Palette({
            name: 'Noise Gradient',
            interpolation: INTERPOLATION.SMOOTH,
            colorSpace: COLOR_SPACE.HSV
        });
        
        const baseHue = fbmNoise(seed * 0.01, 2, 2, 0.5, seed) * 360;
        
        for (let i = 0; i < stops; i++) {
            const t = i / (stops - 1);
            const x = t * frequency;
            
            const hueNoise = fbmNoise(x, octaves, 2, 0.5, seed);
            const satNoise = fbmNoise(x + 100, octaves, 2, 0.5, seed);
            const valNoise = fbmNoise(x + 200, octaves, 2, 0.5, seed);
            
            const hue = (baseHue + hueNoise * 180) % 360;
            const sat = 0.3 + satNoise * 0.6;
            const val = 0.2 + valNoise * 0.7;
            
            const rgb = hsvToRgb(hue, sat, val);
            palette.addStop(t, rgb);
        }
        
        return palette;
    }
    
    /**
     * Generate palette using random walk in HSV space
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateRandomWalk(options = {}) {
        const stops = options.stops || 8;
        const stepSize = options.stepSize || 30;
        
        const palette = new Palette({
            name: 'Random Walk',
            interpolation: INTERPOLATION.SMOOTH,
            colorSpace: COLOR_SPACE.HSV
        });
        
        let hue = this.rng.range(0, 360);
        let sat = this.rng.range(0.4, 0.8);
        let val = this.rng.range(0.3, 0.7);
        
        for (let i = 0; i < stops; i++) {
            const t = i / (stops - 1);
            
            const rgb = hsvToRgb(hue, sat, val);
            palette.addStop(t, rgb);
            
            // Random walk step
            hue = (hue + this.rng.range(-stepSize, stepSize) + 360) % 360;
            sat = Math.max(0.2, Math.min(1, sat + this.rng.range(-0.1, 0.1)));
            val = Math.max(0.1, Math.min(1, val + this.rng.range(-0.15, 0.15)));
        }
        
        return palette;
    }
    
    /**
     * Generate palette from mathematical function
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateMathematical(options = {}) {
        const stops = options.stops || 12;
        const formula = options.formula || 'sin';
        const frequency = options.frequency || 2;
        const baseHue = options.baseHue ?? this.rng.range(0, 360);
        
        const palette = new Palette({
            name: `Mathematical (${formula})`,
            interpolation: INTERPOLATION.SMOOTH,
            colorSpace: COLOR_SPACE.HSV
        });
        
        for (let i = 0; i < stops; i++) {
            const t = i / (stops - 1);
            const x = t * frequency * Math.PI * 2;
            
            let value;
            switch (formula) {
                case 'sin':
                    value = (Math.sin(x) + 1) / 2;
                    break;
                case 'cos':
                    value = (Math.cos(x) + 1) / 2;
                    break;
                case 'tan':
                    value = (Math.tanh(Math.sin(x)) + 1) / 2;
                    break;
                case 'sincos':
                    value = (Math.sin(x) * Math.cos(x * 0.5) + 1) / 2;
                    break;
                case 'exp':
                    value = 1 - Math.exp(-t * 3);
                    break;
                case 'log':
                    value = Math.log(t * 9 + 1) / Math.log(10);
                    break;
                default:
                    value = t;
            }
            
            const hue = (baseHue + value * 180) % 360;
            const sat = 0.4 + Math.sin(t * Math.PI) * 0.5;
            const val = 0.2 + value * 0.7;
            
            const rgb = hsvToRgb(hue, sat, val);
            palette.addStop(t, rgb);
        }
        
        return palette;
    }
    
    // ========================================================================
    // FRACTAL-INSPIRED GENERATORS
    // ========================================================================
    
    /**
     * Generate palette inspired by Mandelbrot iteration colors
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateMandelbrotInspired(options = {}) {
        const stops = options.stops || 12;
        const iterations = options.iterations || 100;
        
        const palette = new Palette({
            name: 'Mandelbrot Inspired',
            interpolation: INTERPOLATION.SMOOTH,
            colorSpace: COLOR_SPACE.HSV
        });
        
        // Sample colors from a Mandelbrot orbit
        let zr = 0, zi = 0;
        const cr = -0.7, ci = 0.27015;
        
        const samples = [];
        for (let i = 0; i < iterations && zr*zr + zi*zi < 4; i++) {
            const newZr = zr * zr - zi * zi + cr;
            const newZi = 2 * zr * zi + ci;
            zr = newZr;
            zi = newZi;
            
            if (i % Math.floor(iterations / stops) === 0) {
                samples.push({ r: zr, i: zi });
            }
        }
        
        // Convert orbit points to colors
        for (let i = 0; i < stops; i++) {
            const t = i / (stops - 1);
            const sample = samples[Math.min(i, samples.length - 1)] || { r: 0, i: 0 };
            
            const hue = (Math.atan2(sample.i, sample.r) / Math.PI * 180 + 180) % 360;
            const mag = Math.sqrt(sample.r * sample.r + sample.i * sample.i);
            const sat = Math.min(1, mag * 0.5);
            const val = 0.2 + t * 0.7;
            
            const rgb = hsvToRgb(hue, sat, val);
            palette.addStop(t, rgb);
        }
        
        return palette;
    }
    
    /**
     * Generate self-similar gradient structure
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateSelfSimilar(options = {}) {
        const stops = options.stops || 16;
        const depth = options.depth || 3;
        const baseHue = options.baseHue ?? this.rng.range(0, 360);
        
        const palette = new Palette({
            name: 'Self-Similar',
            interpolation: INTERPOLATION.SMOOTH,
            colorSpace: COLOR_SPACE.HSV
        });
        
        // Generate hierarchical color structure
        const generateLevel = (start, end, hue, level) => {
            if (level === 0) return;
            
            const mid = (start + end) / 2;
            const range = end - start;
            
            // Add colors at this level
            const sat = 0.4 + (depth - level) * 0.15;
            const val = 0.3 + (depth - level) * 0.2;
            
            palette.addStop(mid, hsvToRgb(hue, sat, val));
            
            // Recurse with shifted hues
            generateLevel(start, mid, (hue + 30) % 360, level - 1);
            generateLevel(mid, end, (hue - 30 + 360) % 360, level - 1);
        };
        
        // Start and end colors
        palette.addStop(0, hsvToRgb(baseHue, 0.5, 0.2));
        palette.addStop(1, hsvToRgb((baseHue + 180) % 360, 0.5, 0.9));
        
        generateLevel(0, 1, (baseHue + 90) % 360, depth);
        
        return palette;
    }
    
    // ========================================================================
    // NATURAL PHENOMENA GENERATORS
    // ========================================================================
    
    /**
     * Generate sunset-inspired gradient
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateSunset(options = {}) {
        const variation = options.variation || this.rng.next();
        
        const palette = new Palette({
            name: 'Sunset',
            interpolation: INTERPOLATION.SMOOTH,
            colorSpace: COLOR_SPACE.HSV
        });
        
        // Sunset colors: deep blue → purple → red → orange → yellow
        const sunsetColors = [
            { h: 220 + variation * 20, s: 0.7, v: 0.2 },  // Deep blue
            { h: 270 + variation * 15, s: 0.5, v: 0.3 },  // Purple
            { h: 340 + variation * 10, s: 0.8, v: 0.5 },  // Magenta/red
            { h: 20 + variation * 10, s: 0.9, v: 0.7 },   // Orange
            { h: 45 + variation * 10, s: 0.8, v: 0.95 }   // Yellow/white
        ];
        
        sunsetColors.forEach((color, i) => {
            const rgb = hsvToRgb(color.h % 360, color.s, color.v);
            palette.addStop(i / (sunsetColors.length - 1), rgb);
        });
        
        return palette;
    }
    
    /**
     * Generate ocean depth gradient
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateOceanDepth(options = {}) {
        const palette = new Palette({
            name: 'Ocean Depth',
            interpolation: INTERPOLATION.SMOOTH,
            colorSpace: COLOR_SPACE.RGB
        });
        
        const oceanColors = [
            { r: 0.02, g: 0.02, b: 0.08 },   // Abyss
            { r: 0.0, g: 0.1, b: 0.25 },     // Deep ocean
            { r: 0.0, g: 0.2, b: 0.4 },      // Mid depth
            { r: 0.0, g: 0.4, b: 0.5 },      // Shallow
            { r: 0.2, g: 0.7, b: 0.8 },      // Surface
            { r: 0.6, g: 0.95, b: 1.0 }      // Sunlit surface
        ];
        
        oceanColors.forEach((color, i) => {
            palette.addStop(i / (oceanColors.length - 1), color);
        });
        
        return palette;
    }
    
    /**
     * Generate fire/lava gradient
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateFire(options = {}) {
        const intensity = options.intensity || 1;
        
        const palette = new Palette({
            name: 'Fire',
            interpolation: INTERPOLATION.SMOOTH,
            colorSpace: COLOR_SPACE.RGB
        });
        
        const fireColors = [
            { r: 0.1, g: 0.0, b: 0.0 },       // Dark ember
            { r: 0.4 * intensity, g: 0.0, b: 0.0 },  // Deep red
            { r: 0.8 * intensity, g: 0.2, b: 0.0 },  // Red-orange
            { r: 1.0, g: 0.5 * intensity, b: 0.0 },  // Orange
            { r: 1.0, g: 0.8, b: 0.2 },       // Yellow-orange
            { r: 1.0, g: 1.0, b: 0.6 },       // Bright yellow
            { r: 1.0, g: 1.0, b: 1.0 }        // White hot
        ];
        
        fireColors.forEach((color, i) => {
            palette.addStop(i / (fireColors.length - 1), color);
        });
        
        return palette;
    }
    
    /**
     * Generate aurora borealis gradient
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateAurora(options = {}) {
        const palette = new Palette({
            name: 'Aurora Borealis',
            interpolation: INTERPOLATION.SMOOTH,
            colorSpace: COLOR_SPACE.HSV
        });
        
        const auroraColors = [
            { h: 120, s: 0.8, v: 0.3 },   // Deep green
            { h: 150, s: 0.7, v: 0.6 },   // Teal-green
            { h: 180, s: 0.6, v: 0.8 },   // Cyan
            { h: 200, s: 0.5, v: 0.7 },   // Light blue
            { h: 280, s: 0.6, v: 0.6 },   // Purple
            { h: 320, s: 0.5, v: 0.4 },   // Pink-purple
            { h: 120, s: 0.8, v: 0.2 }    // Back to green
        ];
        
        auroraColors.forEach((color, i) => {
            const rgb = hsvToRgb(color.h, color.s, color.v);
            palette.addStop(i / (auroraColors.length - 1), rgb);
        });
        
        return palette;
    }
    
    /**
     * Generate forest gradient
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateForest(options = {}) {
        const palette = new Palette({
            name: 'Forest',
            interpolation: INTERPOLATION.SMOOTH,
            colorSpace: COLOR_SPACE.HSV
        });
        
        const forestColors = [
            { h: 30, s: 0.6, v: 0.15 },   // Dark earth
            { h: 45, s: 0.5, v: 0.25 },   // Bark brown
            { h: 80, s: 0.5, v: 0.3 },    // Moss
            { h: 100, s: 0.6, v: 0.4 },   // Dark green
            { h: 120, s: 0.7, v: 0.5 },   // Forest green
            { h: 90, s: 0.8, v: 0.7 },    // Bright leaves
            { h: 60, s: 0.6, v: 0.9 }     // Sunlit canopy
        ];
        
        forestColors.forEach((color, i) => {
            const rgb = hsvToRgb(color.h, color.s, color.v);
            palette.addStop(i / (forestColors.length - 1), rgb);
        });
        
        return palette;
    }
    
    // ========================================================================
    // UTILITY GENERATORS
    // ========================================================================
    
    /**
     * Generate monochromatic gradient
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateMonochromatic(options = {}) {
        const baseHue = options.baseHue ?? this.rng.range(0, 360);
        const stops = options.stops || 6;
        
        const palette = new Palette({
            name: 'Monochromatic',
            interpolation: INTERPOLATION.LINEAR,
            colorSpace: COLOR_SPACE.HSV
        });
        
        for (let i = 0; i < stops; i++) {
            const t = i / (stops - 1);
            const sat = 0.2 + Math.sin(t * Math.PI) * 0.6;
            const val = t;
            
            const rgb = hsvToRgb(baseHue, sat, val);
            palette.addStop(t, rgb);
        }
        
        return palette;
    }
    
    /**
     * Generate rainbow gradient
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateRainbow(options = {}) {
        const stops = options.stops || 7;
        const saturation = options.saturation || 0.9;
        const value = options.value || 0.9;
        
        const palette = new Palette({
            name: 'Rainbow',
            interpolation: INTERPOLATION.LINEAR,
            colorSpace: COLOR_SPACE.HSV
        });
        
        for (let i = 0; i < stops; i++) {
            const t = i / (stops - 1);
            const hue = t * 360;
            
            const rgb = hsvToRgb(hue, saturation, value);
            palette.addStop(t, rgb);
        }
        
        return palette;
    }
    
    /**
     * Generate grayscale gradient
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateGrayscale(options = {}) {
        const palette = new Palette({
            name: 'Grayscale',
            interpolation: INTERPOLATION.LINEAR,
            colorSpace: COLOR_SPACE.RGB
        });
        
        palette.addStop(0, { r: 0, g: 0, b: 0 });
        palette.addStop(1, { r: 1, g: 1, b: 1 });
        
        return palette;
    }
    
    /**
     * Generate high-contrast gradient
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generateHighContrast(options = {}) {
        const stops = options.stops || 5;
        const baseHue = options.baseHue ?? this.rng.range(0, 360);
        
        const palette = new Palette({
            name: 'High Contrast',
            interpolation: INTERPOLATION.STEP,
            colorSpace: COLOR_SPACE.HSV
        });
        
        for (let i = 0; i < stops; i++) {
            const t = i / (stops - 1);
            const hue = (baseHue + i * 72) % 360; // 360/5 = 72
            
            const rgb = hsvToRgb(hue, 1, i % 2 === 0 ? 1 : 0.5);
            palette.addStop(t, rgb);
        }
        
        return palette;
    }
    
    /**
     * Generate palette by name/type
     * @param {string} type - Generator type name
     * @param {Object} options - Generation options
     * @returns {Palette}
     */
    generate(type, options = {}) {
        const generators = {
            'complementary': this.generateComplementary,
            'triadic': this.generateTriadic,
            'analogous': this.generateAnalogous,
            'split-complementary': this.generateSplitComplementary,
            'tetradic': this.generateTetradic,
            'golden-ratio': this.generateGoldenRatio,
            'fibonacci': this.generateFibonacci,
            'noise': this.generateNoiseGradient,
            'random-walk': this.generateRandomWalk,
            'mathematical': this.generateMathematical,
            'mandelbrot': this.generateMandelbrotInspired,
            'self-similar': this.generateSelfSimilar,
            'sunset': this.generateSunset,
            'ocean': this.generateOceanDepth,
            'fire': this.generateFire,
            'aurora': this.generateAurora,
            'forest': this.generateForest,
            'monochromatic': this.generateMonochromatic,
            'rainbow': this.generateRainbow,
            'grayscale': this.generateGrayscale,
            'high-contrast': this.generateHighContrast
        };
        
        const generator = generators[type];
        if (generator) {
            return generator.call(this, options);
        }
        
        console.warn(`[GradientGenerator] Unknown type: ${type}`);
        return this.generateRainbow(options);
    }
    
    /**
     * Get list of available generator types
     * @returns {string[]}
     */
    static getGeneratorTypes() {
        return [
            'complementary', 'triadic', 'analogous', 'split-complementary',
            'tetradic', 'golden-ratio', 'fibonacci', 'noise', 'random-walk',
            'mathematical', 'mandelbrot', 'self-similar', 'sunset', 'ocean',
            'fire', 'aurora', 'forest', 'monochromatic', 'rainbow',
            'grayscale', 'high-contrast'
        ];
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default GradientGenerator;
