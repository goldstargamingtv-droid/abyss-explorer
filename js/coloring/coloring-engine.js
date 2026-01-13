/**
 * ============================================================================
 * ABYSS EXPLORER - COLORING ENGINE
 * ============================================================================
 * 
 * Central coordinator for the fractal coloring system. This is the artistic
 * heart of the application, transforming raw mathematical data into stunning
 * visual experiences.
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                         COLORING ENGINE                                 │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
 * │  │   Layer 1   │  │   Layer 2   │  │   Layer 3   │  │   Layer N   │   │
 * │  │  Algorithm  │  │  Algorithm  │  │  Algorithm  │  │  Algorithm  │   │
 * │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
 * │         │                │                │                │          │
 * │         └────────────────┴────────────────┴────────────────┘          │
 * │                                   │                                    │
 * │                          ┌────────▼────────┐                          │
 * │                          │  BLEND MODES    │                          │
 * │                          │  Normal/Add/    │                          │
 * │                          │  Multiply/...   │                          │
 * │                          └────────┬────────┘                          │
 * │                                   │                                    │
 * │                          ┌────────▼────────┐                          │
 * │                          │  POST PROCESS   │                          │
 * │                          │  Gamma/Contrast │                          │
 * │                          └────────┬────────┘                          │
 * │                                   │                                    │
 * │                          ┌────────▼────────┐                          │
 * │                          │   RGB OUTPUT    │                          │
 * │                          └─────────────────┘                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * Input Data (from renderer):
 * - Iteration count (smoothed)
 * - Final Z coordinates (zx, zy)
 * - Escape status
 * - Distance estimate
 * - Potential (continuous)
 * - Orbit data (if collected)
 * - Angle/phase
 * 
 * @module coloring/coloring-engine
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Available blending modes
 * Based on Photoshop/GIMP blend modes
 */
export const BLEND_MODE = {
    NORMAL: 'normal',
    ADD: 'add',
    SUBTRACT: 'subtract',
    MULTIPLY: 'multiply',
    SCREEN: 'screen',
    OVERLAY: 'overlay',
    SOFT_LIGHT: 'soft-light',
    HARD_LIGHT: 'hard-light',
    COLOR_DODGE: 'color-dodge',
    COLOR_BURN: 'color-burn',
    DIFFERENCE: 'difference',
    EXCLUSION: 'exclusion',
    HUE: 'hue',
    SATURATION: 'saturation',
    COLOR: 'color',
    LUMINOSITY: 'luminosity',
    LIGHTEN: 'lighten',
    DARKEN: 'darken',
    LINEAR_LIGHT: 'linear-light',
    PIN_LIGHT: 'pin-light',
    VIVID_LIGHT: 'vivid-light'
};

/**
 * Color space options
 */
export const COLOR_SPACE = {
    RGB: 'rgb',
    HSL: 'hsl',
    HSV: 'hsv',
    LAB: 'lab',
    LCH: 'lch',
    OKLAB: 'oklab'
};

/**
 * Interior coloring modes
 */
export const INTERIOR_MODE = {
    BLACK: 'black',
    GRADIENT: 'gradient',
    ORBIT: 'orbit',
    DISTANCE: 'distance',
    PERIOD: 'period'
};

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Color manipulation utilities
 */
export const ColorUtils = {
    /**
     * Clamp value to [0, 1]
     */
    clamp: (v) => Math.max(0, Math.min(1, v)),
    
    /**
     * Linear interpolation
     */
    lerp: (a, b, t) => a + (b - a) * t,
    
    /**
     * RGB to HSL conversion
     */
    rgbToHsl(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s;
        const l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        
        return { h, s, l };
    },
    
    /**
     * HSL to RGB conversion
     */
    hslToRgb(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return { r, g, b };
    },
    
    /**
     * HSV to RGB conversion
     */
    hsvToRgb(h, s, v) {
        let r, g, b;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        
        return { r, g, b };
    },
    
    /**
     * RGB to OKLAB conversion
     * OKLAB is a perceptually uniform color space
     */
    rgbToOklab(r, g, b) {
        // Convert to linear RGB
        const toLinear = (c) => c <= 0.04045 
            ? c / 12.92 
            : Math.pow((c + 0.055) / 1.055, 2.4);
        
        const lr = toLinear(r);
        const lg = toLinear(g);
        const lb = toLinear(b);
        
        // RGB to LMS
        const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
        const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
        const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
        
        // LMS to OKLAB
        const l_ = Math.cbrt(l);
        const m_ = Math.cbrt(m);
        const s_ = Math.cbrt(s);
        
        return {
            L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
            a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
            b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
        };
    },
    
    /**
     * OKLAB to RGB conversion
     */
    oklabToRgb(L, a, b) {
        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
        
        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;
        
        const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
        
        // Linear to sRGB
        const toSrgb = (c) => c <= 0.0031308 
            ? 12.92 * c 
            : 1.055 * Math.pow(c, 1/2.4) - 0.055;
        
        return {
            r: ColorUtils.clamp(toSrgb(lr)),
            g: ColorUtils.clamp(toSrgb(lg)),
            b: ColorUtils.clamp(toSrgb(lb))
        };
    }
};

// ============================================================================
// GRADIENT SYSTEM
// ============================================================================

/**
 * Color gradient with multiple stops
 */
export class ColorGradient {
    /**
     * Create a gradient
     * @param {Array} stops - Array of {position, color} where color is {r, g, b}
     */
    constructor(stops = []) {
        this.stops = stops.sort((a, b) => a.position - b.position);
        this.colorSpace = COLOR_SPACE.RGB;
        this.interpolation = 'linear'; // 'linear', 'smooth', 'step'
    }
    
    /**
     * Add a color stop
     */
    addStop(position, color) {
        this.stops.push({ position, color });
        this.stops.sort((a, b) => a.position - b.position);
    }
    
    /**
     * Sample the gradient at position t (0-1)
     */
    sample(t) {
        if (this.stops.length === 0) {
            return { r: 0, g: 0, b: 0 };
        }
        
        if (this.stops.length === 1) {
            return { ...this.stops[0].color };
        }
        
        // Handle wraparound for cyclic gradients
        t = t - Math.floor(t);
        
        // Find surrounding stops
        let lower = this.stops[0];
        let upper = this.stops[this.stops.length - 1];
        
        for (let i = 0; i < this.stops.length - 1; i++) {
            if (t >= this.stops[i].position && t <= this.stops[i + 1].position) {
                lower = this.stops[i];
                upper = this.stops[i + 1];
                break;
            }
        }
        
        // Calculate interpolation factor
        const range = upper.position - lower.position;
        let factor = range > 0 ? (t - lower.position) / range : 0;
        
        // Apply interpolation curve
        if (this.interpolation === 'smooth') {
            factor = factor * factor * (3 - 2 * factor); // Smoothstep
        } else if (this.interpolation === 'step') {
            factor = factor < 0.5 ? 0 : 1;
        }
        
        // Interpolate based on color space
        return this._interpolate(lower.color, upper.color, factor);
    }
    
    /**
     * Interpolate between two colors
     * @private
     */
    _interpolate(c1, c2, t) {
        if (this.colorSpace === COLOR_SPACE.OKLAB) {
            // Perceptually uniform interpolation
            const lab1 = ColorUtils.rgbToOklab(c1.r, c1.g, c1.b);
            const lab2 = ColorUtils.rgbToOklab(c2.r, c2.g, c2.b);
            
            return ColorUtils.oklabToRgb(
                ColorUtils.lerp(lab1.L, lab2.L, t),
                ColorUtils.lerp(lab1.a, lab2.a, t),
                ColorUtils.lerp(lab1.b, lab2.b, t)
            );
        } else if (this.colorSpace === COLOR_SPACE.HSL) {
            const hsl1 = ColorUtils.rgbToHsl(c1.r, c1.g, c1.b);
            const hsl2 = ColorUtils.rgbToHsl(c2.r, c2.g, c2.b);
            
            // Handle hue wraparound
            let hDiff = hsl2.h - hsl1.h;
            if (hDiff > 0.5) hDiff -= 1;
            if (hDiff < -0.5) hDiff += 1;
            
            return ColorUtils.hslToRgb(
                (hsl1.h + hDiff * t + 1) % 1,
                ColorUtils.lerp(hsl1.s, hsl2.s, t),
                ColorUtils.lerp(hsl1.l, hsl2.l, t)
            );
        } else {
            // Default RGB interpolation
            return {
                r: ColorUtils.lerp(c1.r, c2.r, t),
                g: ColorUtils.lerp(c1.g, c2.g, t),
                b: ColorUtils.lerp(c1.b, c2.b, t)
            };
        }
    }
    
    /**
     * Generate a lookup table
     * @param {number} size - LUT size (typically 256 or 1024)
     * @returns {Uint8ClampedArray} RGBA LUT
     */
    generateLUT(size = 256) {
        const lut = new Uint8ClampedArray(size * 4);
        
        for (let i = 0; i < size; i++) {
            const t = i / (size - 1);
            const color = this.sample(t);
            
            lut[i * 4] = Math.round(color.r * 255);
            lut[i * 4 + 1] = Math.round(color.g * 255);
            lut[i * 4 + 2] = Math.round(color.b * 255);
            lut[i * 4 + 3] = 255;
        }
        
        return lut;
    }
    
    /**
     * Create from preset
     */
    static fromPreset(name) {
        const presets = {
            'rainbow': [
                { position: 0.0, color: { r: 1, g: 0, b: 0 } },
                { position: 0.17, color: { r: 1, g: 0.5, b: 0 } },
                { position: 0.33, color: { r: 1, g: 1, b: 0 } },
                { position: 0.5, color: { r: 0, g: 1, b: 0 } },
                { position: 0.67, color: { r: 0, g: 0.5, b: 1 } },
                { position: 0.83, color: { r: 0.5, g: 0, b: 1 } },
                { position: 1.0, color: { r: 1, g: 0, b: 0 } }
            ],
            'fire': [
                { position: 0.0, color: { r: 0, g: 0, b: 0 } },
                { position: 0.25, color: { r: 0.5, g: 0, b: 0 } },
                { position: 0.5, color: { r: 1, g: 0.3, b: 0 } },
                { position: 0.75, color: { r: 1, g: 0.7, b: 0 } },
                { position: 1.0, color: { r: 1, g: 1, b: 0.5 } }
            ],
            'ice': [
                { position: 0.0, color: { r: 0, g: 0, b: 0.2 } },
                { position: 0.3, color: { r: 0, g: 0.3, b: 0.6 } },
                { position: 0.6, color: { r: 0.3, g: 0.7, b: 1 } },
                { position: 1.0, color: { r: 0.9, g: 1, b: 1 } }
            ],
            'electric': [
                { position: 0.0, color: { r: 0, g: 0, b: 0.1 } },
                { position: 0.2, color: { r: 0.1, g: 0, b: 0.5 } },
                { position: 0.4, color: { r: 0.5, g: 0, b: 1 } },
                { position: 0.6, color: { r: 0, g: 0.5, b: 1 } },
                { position: 0.8, color: { r: 0, g: 1, b: 1 } },
                { position: 1.0, color: { r: 1, g: 1, b: 1 } }
            ],
            'grayscale': [
                { position: 0.0, color: { r: 0, g: 0, b: 0 } },
                { position: 1.0, color: { r: 1, g: 1, b: 1 } }
            ],
            'psychedelic': [
                { position: 0.0, color: { r: 1, g: 0, b: 0.5 } },
                { position: 0.2, color: { r: 1, g: 0.5, b: 0 } },
                { position: 0.4, color: { r: 0.5, g: 1, b: 0 } },
                { position: 0.6, color: { r: 0, g: 1, b: 0.5 } },
                { position: 0.8, color: { r: 0, g: 0.5, b: 1 } },
                { position: 1.0, color: { r: 1, g: 0, b: 0.5 } }
            ],
            'sunset': [
                { position: 0.0, color: { r: 0.1, g: 0, b: 0.2 } },
                { position: 0.3, color: { r: 0.5, g: 0.1, b: 0.3 } },
                { position: 0.5, color: { r: 0.9, g: 0.3, b: 0.2 } },
                { position: 0.7, color: { r: 1, g: 0.6, b: 0.2 } },
                { position: 1.0, color: { r: 1, g: 0.9, b: 0.5 } }
            ],
            'ocean': [
                { position: 0.0, color: { r: 0, g: 0.05, b: 0.1 } },
                { position: 0.3, color: { r: 0, g: 0.2, b: 0.4 } },
                { position: 0.6, color: { r: 0, g: 0.5, b: 0.6 } },
                { position: 0.8, color: { r: 0.2, g: 0.8, b: 0.8 } },
                { position: 1.0, color: { r: 0.8, g: 1, b: 1 } }
            ]
        };
        
        const stops = presets[name] || presets['rainbow'];
        return new ColorGradient(stops);
    }
}

// ============================================================================
// COLORING LAYER
// ============================================================================

/**
 * Single coloring layer with algorithm and parameters
 */
export class ColoringLayer {
    /**
     * Create a coloring layer
     * @param {Object} options - Layer options
     */
    constructor(options = {}) {
        this.name = options.name || 'Layer';
        this.algorithm = options.algorithm || 'smooth-iteration';
        this.enabled = options.enabled !== false;
        this.opacity = options.opacity ?? 1.0;
        this.blendMode = options.blendMode || BLEND_MODE.NORMAL;
        
        // Algorithm-specific parameters
        this.params = options.params || {};
        
        // Transform parameters
        this.transform = {
            intensity: options.intensity ?? 1.0,
            offset: options.offset ?? 0.0,
            scale: options.scale ?? 1.0,
            invert: options.invert ?? false,
            gamma: options.gamma ?? 1.0
        };
        
        // Gradient
        this.gradient = options.gradient || ColorGradient.fromPreset('rainbow');
        
        // Mask (optional)
        this.mask = null;
        this.maskInvert = false;
    }
    
    /**
     * Apply transform to a value
     */
    applyTransform(value) {
        // Apply scale and offset
        value = value * this.transform.scale + this.transform.offset;
        
        // Apply intensity (power curve)
        if (this.transform.intensity !== 1.0) {
            value = Math.pow(Math.abs(value), this.transform.intensity) * Math.sign(value);
        }
        
        // Apply gamma
        if (this.transform.gamma !== 1.0) {
            value = Math.pow(Math.abs(value), this.transform.gamma) * Math.sign(value);
        }
        
        // Invert if needed
        if (this.transform.invert) {
            value = 1 - value;
        }
        
        return value;
    }
}

// ============================================================================
// BLEND FUNCTIONS
// ============================================================================

/**
 * Blend mode implementations
 */
const BlendFunctions = {
    normal: (base, blend) => blend,
    
    add: (base, blend) => Math.min(1, base + blend),
    
    subtract: (base, blend) => Math.max(0, base - blend),
    
    multiply: (base, blend) => base * blend,
    
    screen: (base, blend) => 1 - (1 - base) * (1 - blend),
    
    overlay: (base, blend) => 
        base < 0.5 
            ? 2 * base * blend 
            : 1 - 2 * (1 - base) * (1 - blend),
    
    softLight: (base, blend) => {
        if (blend < 0.5) {
            return base - (1 - 2 * blend) * base * (1 - base);
        }
        const d = base < 0.25 
            ? ((16 * base - 12) * base + 4) * base 
            : Math.sqrt(base);
        return base + (2 * blend - 1) * (d - base);
    },
    
    hardLight: (base, blend) =>
        blend < 0.5 
            ? 2 * base * blend 
            : 1 - 2 * (1 - base) * (1 - blend),
    
    colorDodge: (base, blend) =>
        blend >= 1 ? 1 : Math.min(1, base / (1 - blend)),
    
    colorBurn: (base, blend) =>
        blend <= 0 ? 0 : Math.max(0, 1 - (1 - base) / blend),
    
    difference: (base, blend) => Math.abs(base - blend),
    
    exclusion: (base, blend) => base + blend - 2 * base * blend,
    
    lighten: (base, blend) => Math.max(base, blend),
    
    darken: (base, blend) => Math.min(base, blend),
    
    linearLight: (base, blend) =>
        blend < 0.5 
            ? Math.max(0, base + 2 * blend - 1) 
            : Math.min(1, base + 2 * (blend - 0.5)),
    
    pinLight: (base, blend) =>
        blend < 0.5 
            ? Math.min(base, 2 * blend) 
            : Math.max(base, 2 * blend - 1),
    
    vividLight: (base, blend) =>
        blend < 0.5 
            ? BlendFunctions.colorBurn(base, 2 * blend)
            : BlendFunctions.colorDodge(base, 2 * (blend - 0.5))
};

// ============================================================================
// COLORING ENGINE CLASS
// ============================================================================

export class ColoringEngine {
    /**
     * Create a new coloring engine
     */
    constructor() {
        // Layers stack
        this.layers = [];
        
        // Global settings
        this.interiorMode = INTERIOR_MODE.BLACK;
        this.interiorColor = { r: 0, g: 0, b: 0 };
        this.backgroundColor = { r: 0, g: 0, b: 0 };
        
        // Post-processing
        this.postProcess = {
            gamma: 1.0,
            contrast: 1.0,
            saturation: 1.0,
            brightness: 0.0
        };
        
        // Algorithm registry reference
        this.algorithms = new Map();
        
        // Cache
        this.lutCache = new Map();
        
        // Statistics
        this.stats = {
            pixelsColored: 0,
            coloringTime: 0
        };
    }
    
    /**
     * Register a coloring algorithm
     * @param {string} name - Algorithm name
     * @param {Function} fn - Algorithm function
     * @param {Object} meta - Algorithm metadata
     */
    registerAlgorithm(name, fn, meta = {}) {
        this.algorithms.set(name, { fn, meta });
    }
    
    /**
     * Add a coloring layer
     * @param {ColoringLayer} layer - Layer to add
     * @returns {number} Layer index
     */
    addLayer(layer) {
        this.layers.push(layer);
        return this.layers.length - 1;
    }
    
    /**
     * Remove a layer
     * @param {number} index - Layer index
     */
    removeLayer(index) {
        if (index >= 0 && index < this.layers.length) {
            this.layers.splice(index, 1);
        }
    }
    
    /**
     * Move layer
     * @param {number} from - Source index
     * @param {number} to - Destination index
     */
    moveLayer(from, to) {
        if (from >= 0 && from < this.layers.length && 
            to >= 0 && to < this.layers.length) {
            const [layer] = this.layers.splice(from, 1);
            this.layers.splice(to, 0, layer);
        }
    }
    
    /**
     * Apply coloring to pixel data
     * @param {Object} pixelData - Pixel data from renderer
     * @param {Object} config - Renderer configuration
     * @param {ImageData} outputImageData - Output image data
     */
    apply(pixelData, config, outputImageData) {
        const startTime = performance.now();
        const { width, height } = config;
        const pixelCount = width * height;
        const output = outputImageData.data;
        
        // Process each pixel
        for (let i = 0; i < pixelCount; i++) {
            const idx = i * 4;
            
            // Get pixel info
            const iterations = pixelData.iterations[i];
            const escaped = pixelData.escaped[i];
            const distance = pixelData.distances?.[i] || 0;
            const potential = pixelData.potential?.[i] || 0;
            const angle = pixelData.angle?.[i] || 0;
            const orbitX = pixelData.orbitX?.[i] || 0;
            const orbitY = pixelData.orbitY?.[i] || 0;
            
            // Create pixel context
            const ctx = {
                iterations,
                escaped: escaped === 1,
                distance,
                potential,
                angle,
                orbitX,
                orbitY,
                maxIterations: config.maxIterations,
                escapeRadius: config.escapeRadius || 2,
                x: i % width,
                y: Math.floor(i / width),
                width,
                height
            };
            
            // Get final color
            const color = this._computePixelColor(ctx);
            
            // Apply post-processing
            const processed = this._postProcess(color);
            
            // Write to output
            output[idx] = Math.round(processed.r * 255);
            output[idx + 1] = Math.round(processed.g * 255);
            output[idx + 2] = Math.round(processed.b * 255);
            output[idx + 3] = 255;
        }
        
        this.stats.pixelsColored += pixelCount;
        this.stats.coloringTime = performance.now() - startTime;
    }
    
    /**
     * Compute color for a single pixel
     * @private
     */
    _computePixelColor(ctx) {
        // Handle interior (non-escaped) pixels
        if (!ctx.escaped) {
            return this._getInteriorColor(ctx);
        }
        
        // No layers - return default
        if (this.layers.length === 0) {
            return this._getDefaultColor(ctx);
        }
        
        // Start with background
        let result = { ...this.backgroundColor };
        
        // Apply each layer
        for (const layer of this.layers) {
            if (!layer.enabled) continue;
            
            // Get algorithm
            const algo = this.algorithms.get(layer.algorithm);
            if (!algo) continue;
            
            // Compute algorithm value
            let value = algo.fn(ctx, layer.params);
            
            // Apply layer transform
            value = layer.applyTransform(value);
            
            // Get color from gradient
            const layerColor = layer.gradient.sample(value);
            
            // Apply mask if present
            let opacity = layer.opacity;
            if (layer.mask) {
                const maskValue = layer.mask(ctx);
                opacity *= layer.maskInvert ? (1 - maskValue) : maskValue;
            }
            
            // Blend with result
            result = this._blendColors(result, layerColor, layer.blendMode, opacity);
        }
        
        return result;
    }
    
    /**
     * Get interior color
     * @private
     */
    _getInteriorColor(ctx) {
        switch (this.interiorMode) {
            case INTERIOR_MODE.BLACK:
                return { r: 0, g: 0, b: 0 };
                
            case INTERIOR_MODE.GRADIENT:
                // Use distance from origin or some other metric
                const dist = Math.sqrt(ctx.orbitX * ctx.orbitX + ctx.orbitY * ctx.orbitY);
                const t = 1 - Math.exp(-dist);
                return this.layers[0]?.gradient.sample(t) || this.interiorColor;
                
            case INTERIOR_MODE.ORBIT:
                // Color based on final orbit position
                const angle = Math.atan2(ctx.orbitY, ctx.orbitX) / (2 * Math.PI) + 0.5;
                return this.layers[0]?.gradient.sample(angle) || this.interiorColor;
                
            case INTERIOR_MODE.DISTANCE:
                // Color based on distance estimate
                const de = Math.log(ctx.distance + 1) / 10;
                return this.layers[0]?.gradient.sample(de) || this.interiorColor;
                
            default:
                return this.interiorColor;
        }
    }
    
    /**
     * Get default color (no layers)
     * @private
     */
    _getDefaultColor(ctx) {
        // Simple iteration-based coloring
        const hue = (ctx.iterations * 3.5) % 360;
        return ColorUtils.hslToRgb(hue / 360, 0.8, 0.5);
    }
    
    /**
     * Blend two colors
     * @private
     */
    _blendColors(base, blend, mode, opacity) {
        const blendFn = BlendFunctions[mode.replace('-', '')] || BlendFunctions.normal;
        
        // Blend each channel
        let r = blendFn(base.r, blend.r);
        let g = blendFn(base.g, blend.g);
        let b = blendFn(base.b, blend.b);
        
        // Apply opacity
        if (opacity < 1) {
            r = ColorUtils.lerp(base.r, r, opacity);
            g = ColorUtils.lerp(base.g, g, opacity);
            b = ColorUtils.lerp(base.b, b, opacity);
        }
        
        return { r, g, b };
    }
    
    /**
     * Apply post-processing
     * @private
     */
    _postProcess(color) {
        let { r, g, b } = color;
        
        // Brightness
        if (this.postProcess.brightness !== 0) {
            r += this.postProcess.brightness;
            g += this.postProcess.brightness;
            b += this.postProcess.brightness;
        }
        
        // Contrast
        if (this.postProcess.contrast !== 1) {
            r = (r - 0.5) * this.postProcess.contrast + 0.5;
            g = (g - 0.5) * this.postProcess.contrast + 0.5;
            b = (b - 0.5) * this.postProcess.contrast + 0.5;
        }
        
        // Saturation
        if (this.postProcess.saturation !== 1) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = ColorUtils.lerp(gray, r, this.postProcess.saturation);
            g = ColorUtils.lerp(gray, g, this.postProcess.saturation);
            b = ColorUtils.lerp(gray, b, this.postProcess.saturation);
        }
        
        // Gamma
        if (this.postProcess.gamma !== 1) {
            r = Math.pow(Math.max(0, r), this.postProcess.gamma);
            g = Math.pow(Math.max(0, g), this.postProcess.gamma);
            b = Math.pow(Math.max(0, b), this.postProcess.gamma);
        }
        
        // Clamp
        return {
            r: ColorUtils.clamp(r),
            g: ColorUtils.clamp(g),
            b: ColorUtils.clamp(b)
        };
    }
    
    /**
     * Generate a lookup table for fast coloring
     * @param {number} size - LUT size
     * @returns {Uint8ClampedArray} RGBA LUT
     */
    generateLUT(size = 4096) {
        if (this.layers.length === 0) {
            return ColorGradient.fromPreset('rainbow').generateLUT(size);
        }
        
        const lut = new Uint8ClampedArray(size * 4);
        
        for (let i = 0; i < size; i++) {
            // Simulate a pixel context
            const t = i / (size - 1);
            const ctx = {
                iterations: t * 1000,
                escaped: true,
                distance: t,
                potential: t,
                angle: t * Math.PI * 2,
                orbitX: Math.cos(t * Math.PI * 2),
                orbitY: Math.sin(t * Math.PI * 2),
                maxIterations: 1000
            };
            
            const color = this._computePixelColor(ctx);
            const processed = this._postProcess(color);
            
            lut[i * 4] = Math.round(processed.r * 255);
            lut[i * 4 + 1] = Math.round(processed.g * 255);
            lut[i * 4 + 2] = Math.round(processed.b * 255);
            lut[i * 4 + 3] = 255;
        }
        
        return lut;
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return { ...this.stats };
    }
    
    /**
     * Export configuration
     */
    exportConfig() {
        return {
            layers: this.layers.map(l => ({
                name: l.name,
                algorithm: l.algorithm,
                enabled: l.enabled,
                opacity: l.opacity,
                blendMode: l.blendMode,
                params: { ...l.params },
                transform: { ...l.transform }
            })),
            interiorMode: this.interiorMode,
            interiorColor: { ...this.interiorColor },
            postProcess: { ...this.postProcess }
        };
    }
    
    /**
     * Import configuration
     */
    importConfig(config) {
        this.layers = config.layers?.map(l => new ColoringLayer(l)) || [];
        this.interiorMode = config.interiorMode || INTERIOR_MODE.BLACK;
        this.interiorColor = config.interiorColor || { r: 0, g: 0, b: 0 };
        this.postProcess = config.postProcess || {
            gamma: 1.0,
            contrast: 1.0,
            saturation: 1.0,
            brightness: 0.0
        };
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ColoringEngine;
