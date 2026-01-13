/**
 * ============================================================================
 * ABYSS EXPLORER - PALETTE ENGINE
 * ============================================================================
 * 
 * Core engine for applying color palettes to fractal coloring output.
 * Transforms normalized values (0-1) from the coloring algorithms into
 * stunning RGB colors through gradient interpolation.
 * 
 * Color Theory Fundamentals:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  RGB Color Space:                                                      │
 * │    - Additive color model (light emission)                            │
 * │    - Linear interpolation can produce muddy colors                    │
 * │    - Best for final output                                            │
 * │                                                                        │
 * │  HSV/HSL Color Space:                                                  │
 * │    - Perceptually intuitive (Hue, Saturation, Value/Lightness)        │
 * │    - Better for interpolation (smoother transitions)                  │
 * │    - Hue is circular (0° = 360°)                                      │
 * │                                                                        │
 * │  LAB/OKLAB Color Space:                                                │
 * │    - Perceptually uniform                                             │
 * │    - Best for professional color work                                 │
 * │    - Computational overhead                                           │
 * │                                                                        │
 * │  Interpolation Methods:                                                │
 * │    - Linear: Simple, fast, but can be harsh                          │
 * │    - Smooth: Using smoothstep for softer transitions                  │
 * │    - Cubic: Catmull-Rom splines for natural curves                   │
 * │    - Bezier: Maximum control over gradient shape                      │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * @module palettes/palette-engine
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Interpolation methods
 */
export const INTERPOLATION = {
    LINEAR: 'linear',
    SMOOTH: 'smooth',
    SMOOTHER: 'smoother',
    CUBIC: 'cubic',
    BEZIER: 'bezier',
    STEP: 'step',
    COSINE: 'cosine'
};

/**
 * Color spaces for interpolation
 */
export const COLOR_SPACE = {
    RGB: 'rgb',
    HSV: 'hsv',
    HSL: 'hsl',
    LAB: 'lab',
    OKLAB: 'oklab'
};

/**
 * Gradient repeat modes
 */
export const REPEAT_MODE = {
    CLAMP: 'clamp',      // Stop at edges
    REPEAT: 'repeat',    // Tile
    MIRROR: 'mirror',    // Ping-pong
    NONE: 'none'         // No repeat (values outside 0-1 undefined)
};

// ============================================================================
// COLOR CONVERSION UTILITIES
// ============================================================================

/**
 * Convert RGB to HSV
 * @param {number} r - Red (0-1)
 * @param {number} g - Green (0-1)
 * @param {number} b - Blue (0-1)
 * @returns {Object} { h, s, v } (h: 0-360, s: 0-1, v: 0-1)
 */
export function rgbToHsv(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    
    if (d !== 0) {
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
            case g: h = ((b - r) / d + 2) * 60; break;
            case b: h = ((r - g) / d + 4) * 60; break;
        }
    }
    
    return { h, s, v };
}

/**
 * Convert HSV to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-1)
 * @param {number} v - Value (0-1)
 * @returns {Object} { r, g, b } (all 0-1)
 */
export function hsvToRgb(h, s, v) {
    h = ((h % 360) + 360) % 360; // Normalize hue
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    
    let r, g, b;
    
    if (h < 60)       { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else              { r = c; g = 0; b = x; }
    
    return {
        r: r + m,
        g: g + m,
        b: b + m
    };
}

/**
 * Convert RGB to HSL
 * @param {number} r - Red (0-1)
 * @param {number} g - Green (0-1)
 * @param {number} b - Blue (0-1)
 * @returns {Object} { h, s, l }
 */
export function rgbToHsl(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    
    if (max === min) {
        return { h: 0, s: 0, l };
    }
    
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    let h;
    switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
        case g: h = ((b - r) / d + 2) * 60; break;
        case b: h = ((r - g) / d + 4) * 60; break;
    }
    
    return { h, s, l };
}

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @returns {Object} { r, g, b }
 */
export function hslToRgb(h, s, l) {
    if (s === 0) {
        return { r: l, g: l, b: l };
    }
    
    h = ((h % 360) + 360) % 360 / 360;
    
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
    
    return {
        r: hue2rgb(p, q, h + 1/3),
        g: hue2rgb(p, q, h),
        b: hue2rgb(p, q, h - 1/3)
    };
}

/**
 * Convert RGB to OKLAB (perceptually uniform)
 * @param {number} r - Red (0-1)
 * @param {number} g - Green (0-1)
 * @param {number} b - Blue (0-1)
 * @returns {Object} { L, a, b }
 */
export function rgbToOklab(r, g, b) {
    // Convert to linear RGB
    const toLinear = (c) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const lr = toLinear(r);
    const lg = toLinear(g);
    const lb = toLinear(b);
    
    // RGB to LMS
    const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
    const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
    const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
    
    return {
        L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    };
}

/**
 * Convert OKLAB to RGB
 * @param {number} L - Lightness
 * @param {number} a - Green-red axis
 * @param {number} b - Blue-yellow axis
 * @returns {Object} { r, g, b }
 */
export function oklabToRgb(L, a, b) {
    // OKLAB to LMS
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
    
    // LMS to linear RGB
    let lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    let lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    let lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
    
    // Linear to sRGB
    const toSrgb = (c) => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1/2.4) - 0.055;
    
    return {
        r: Math.max(0, Math.min(1, toSrgb(lr))),
        g: Math.max(0, Math.min(1, toSrgb(lg))),
        b: Math.max(0, Math.min(1, toSrgb(lb)))
    };
}

/**
 * Parse hex color string
 * @param {string} hex - Hex color (#RGB, #RRGGBB, or #RRGGBBAA)
 * @returns {Object} { r, g, b, a } (all 0-1)
 */
export function parseHex(hex) {
    hex = hex.replace('#', '');
    
    let r, g, b, a = 1;
    
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16) / 255;
        g = parseInt(hex[1] + hex[1], 16) / 255;
        b = parseInt(hex[2] + hex[2], 16) / 255;
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16) / 255;
        g = parseInt(hex.substring(2, 4), 16) / 255;
        b = parseInt(hex.substring(4, 6), 16) / 255;
    } else if (hex.length === 8) {
        r = parseInt(hex.substring(0, 2), 16) / 255;
        g = parseInt(hex.substring(2, 4), 16) / 255;
        b = parseInt(hex.substring(4, 6), 16) / 255;
        a = parseInt(hex.substring(6, 8), 16) / 255;
    }
    
    return { r, g, b, a };
}

/**
 * Convert RGB to hex string
 * @param {number} r - Red (0-1)
 * @param {number} g - Green (0-1)
 * @param {number} b - Blue (0-1)
 * @returns {string} Hex color string
 */
export function toHex(r, g, b) {
    const toHexByte = (v) => {
        const hex = Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHexByte(r) + toHexByte(g) + toHexByte(b);
}

// ============================================================================
// INTERPOLATION FUNCTIONS
// ============================================================================

/**
 * Linear interpolation
 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Smoothstep interpolation (S-curve)
 */
function smoothstep(t) {
    return t * t * (3 - 2 * t);
}

/**
 * Smootherstep interpolation (even smoother S-curve)
 */
function smootherstep(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Cosine interpolation
 */
function cosineInterp(t) {
    return (1 - Math.cos(t * Math.PI)) / 2;
}

/**
 * Apply interpolation function based on method
 */
function applyInterpolation(t, method) {
    switch (method) {
        case INTERPOLATION.LINEAR:
            return t;
        case INTERPOLATION.SMOOTH:
            return smoothstep(t);
        case INTERPOLATION.SMOOTHER:
            return smootherstep(t);
        case INTERPOLATION.COSINE:
            return cosineInterp(t);
        case INTERPOLATION.STEP:
            return t < 0.5 ? 0 : 1;
        default:
            return t;
    }
}

// ============================================================================
// COLOR STOP CLASS
// ============================================================================

/**
 * Represents a single color stop in a gradient
 */
export class ColorStop {
    /**
     * Create a color stop
     * @param {number} position - Position (0-1)
     * @param {Object|string} color - Color as {r,g,b} or hex string
     */
    constructor(position, color) {
        this.position = position;
        
        if (typeof color === 'string') {
            const parsed = parseHex(color);
            this.r = parsed.r;
            this.g = parsed.g;
            this.b = parsed.b;
            this.a = parsed.a;
        } else {
            this.r = color.r ?? 0;
            this.g = color.g ?? 0;
            this.b = color.b ?? 0;
            this.a = color.a ?? 1;
        }
    }
    
    /**
     * Clone this color stop
     */
    clone() {
        return new ColorStop(this.position, {
            r: this.r, g: this.g, b: this.b, a: this.a
        });
    }
    
    /**
     * Get as hex string
     */
    toHex() {
        return toHex(this.r, this.g, this.b);
    }
    
    /**
     * Get as HSV
     */
    toHsv() {
        return rgbToHsv(this.r, this.g, this.b);
    }
    
    /**
     * Set from HSV
     */
    setFromHsv(h, s, v) {
        const rgb = hsvToRgb(h, s, v);
        this.r = rgb.r;
        this.g = rgb.g;
        this.b = rgb.b;
    }
}

// ============================================================================
// PALETTE CLASS
// ============================================================================

/**
 * Represents a complete color palette with multiple stops
 */
export class Palette {
    /**
     * Create a palette
     * @param {Object} options - Palette options
     */
    constructor(options = {}) {
        this.id = options.id || `palette_${Date.now()}`;
        this.name = options.name || 'Unnamed Palette';
        this.author = options.author || 'Unknown';
        this.category = options.category || 'custom';
        this.tags = options.tags || [];
        
        // Color stops (sorted by position)
        this.stops = [];
        
        // Interpolation settings
        this.interpolation = options.interpolation || INTERPOLATION.LINEAR;
        this.colorSpace = options.colorSpace || COLOR_SPACE.RGB;
        this.repeatMode = options.repeatMode || REPEAT_MODE.REPEAT;
        
        // Post-processing
        this.gamma = options.gamma ?? 1.0;
        this.contrast = options.contrast ?? 1.0;
        this.brightness = options.brightness ?? 0;
        this.saturation = options.saturation ?? 1.0;
        this.hueShift = options.hueShift ?? 0;
        this.invert = options.invert ?? false;
        
        // Initialize with provided stops
        if (options.stops) {
            for (const stop of options.stops) {
                this.addStop(stop.position, stop);
            }
        } else if (options.colors) {
            // Create evenly spaced stops from color array
            const colors = options.colors;
            for (let i = 0; i < colors.length; i++) {
                const position = i / (colors.length - 1);
                this.addStop(position, colors[i]);
            }
        }
        
        // Cache for lookup table
        this._lut = null;
        this._lutSize = 0;
    }
    
    /**
     * Add a color stop
     * @param {number} position - Position (0-1)
     * @param {Object|string} color - Color
     * @returns {ColorStop} The added stop
     */
    addStop(position, color) {
        const stop = new ColorStop(position, color);
        this.stops.push(stop);
        this._sortStops();
        this._invalidateLUT();
        return stop;
    }
    
    /**
     * Remove a color stop by index
     * @param {number} index - Stop index
     */
    removeStop(index) {
        if (index >= 0 && index < this.stops.length && this.stops.length > 2) {
            this.stops.splice(index, 1);
            this._invalidateLUT();
        }
    }
    
    /**
     * Update a color stop
     * @param {number} index - Stop index
     * @param {Object} updates - Updates to apply
     */
    updateStop(index, updates) {
        if (index >= 0 && index < this.stops.length) {
            const stop = this.stops[index];
            if (updates.position !== undefined) stop.position = updates.position;
            if (updates.r !== undefined) stop.r = updates.r;
            if (updates.g !== undefined) stop.g = updates.g;
            if (updates.b !== undefined) stop.b = updates.b;
            if (updates.a !== undefined) stop.a = updates.a;
            if (updates.color !== undefined) {
                const parsed = typeof updates.color === 'string' 
                    ? parseHex(updates.color) 
                    : updates.color;
                stop.r = parsed.r;
                stop.g = parsed.g;
                stop.b = parsed.b;
            }
            this._sortStops();
            this._invalidateLUT();
        }
    }
    
    /**
     * Sort stops by position
     * @private
     */
    _sortStops() {
        this.stops.sort((a, b) => a.position - b.position);
    }
    
    /**
     * Invalidate cached LUT
     * @private
     */
    _invalidateLUT() {
        this._lut = null;
    }
    
    /**
     * Get color at position (0-1)
     * @param {number} t - Position (0-1)
     * @returns {Object} { r, g, b, a }
     */
    getColor(t) {
        if (this.stops.length === 0) {
            return { r: 0, g: 0, b: 0, a: 1 };
        }
        
        if (this.stops.length === 1) {
            const s = this.stops[0];
            return this._postProcess(s.r, s.g, s.b, s.a);
        }
        
        // Apply repeat mode
        t = this._applyRepeatMode(t);
        
        // Find surrounding stops
        let i = 0;
        while (i < this.stops.length - 1 && this.stops[i + 1].position < t) {
            i++;
        }
        
        const stop1 = this.stops[i];
        const stop2 = this.stops[Math.min(i + 1, this.stops.length - 1)];
        
        // Calculate local t
        const range = stop2.position - stop1.position;
        const localT = range > 0 ? (t - stop1.position) / range : 0;
        
        // Apply interpolation curve
        const interpT = applyInterpolation(localT, this.interpolation);
        
        // Interpolate color
        const color = this._interpolateColor(stop1, stop2, interpT);
        
        // Apply post-processing
        return this._postProcess(color.r, color.g, color.b, color.a);
    }
    
    /**
     * Apply repeat mode to position
     * @private
     */
    _applyRepeatMode(t) {
        switch (this.repeatMode) {
            case REPEAT_MODE.CLAMP:
                return Math.max(0, Math.min(1, t));
            case REPEAT_MODE.REPEAT:
                return ((t % 1) + 1) % 1;
            case REPEAT_MODE.MIRROR:
                const cycle = Math.floor(t);
                const frac = t - cycle;
                return cycle % 2 === 0 ? frac : 1 - frac;
            default:
                return t;
        }
    }
    
    /**
     * Interpolate between two color stops
     * @private
     */
    _interpolateColor(stop1, stop2, t) {
        switch (this.colorSpace) {
            case COLOR_SPACE.HSV:
                return this._interpolateHsv(stop1, stop2, t);
            case COLOR_SPACE.HSL:
                return this._interpolateHsl(stop1, stop2, t);
            case COLOR_SPACE.OKLAB:
                return this._interpolateOklab(stop1, stop2, t);
            case COLOR_SPACE.RGB:
            default:
                return this._interpolateRgb(stop1, stop2, t);
        }
    }
    
    /**
     * RGB interpolation
     * @private
     */
    _interpolateRgb(stop1, stop2, t) {
        return {
            r: lerp(stop1.r, stop2.r, t),
            g: lerp(stop1.g, stop2.g, t),
            b: lerp(stop1.b, stop2.b, t),
            a: lerp(stop1.a, stop2.a, t)
        };
    }
    
    /**
     * HSV interpolation (handles hue wraparound)
     * @private
     */
    _interpolateHsv(stop1, stop2, t) {
        const hsv1 = rgbToHsv(stop1.r, stop1.g, stop1.b);
        const hsv2 = rgbToHsv(stop2.r, stop2.g, stop2.b);
        
        // Handle hue wraparound (take shortest path)
        let hDiff = hsv2.h - hsv1.h;
        if (hDiff > 180) hDiff -= 360;
        if (hDiff < -180) hDiff += 360;
        
        const h = hsv1.h + hDiff * t;
        const s = lerp(hsv1.s, hsv2.s, t);
        const v = lerp(hsv1.v, hsv2.v, t);
        
        const rgb = hsvToRgb(h, s, v);
        rgb.a = lerp(stop1.a, stop2.a, t);
        return rgb;
    }
    
    /**
     * HSL interpolation
     * @private
     */
    _interpolateHsl(stop1, stop2, t) {
        const hsl1 = rgbToHsl(stop1.r, stop1.g, stop1.b);
        const hsl2 = rgbToHsl(stop2.r, stop2.g, stop2.b);
        
        let hDiff = hsl2.h - hsl1.h;
        if (hDiff > 180) hDiff -= 360;
        if (hDiff < -180) hDiff += 360;
        
        const h = hsl1.h + hDiff * t;
        const s = lerp(hsl1.s, hsl2.s, t);
        const l = lerp(hsl1.l, hsl2.l, t);
        
        const rgb = hslToRgb(h, s, l);
        rgb.a = lerp(stop1.a, stop2.a, t);
        return rgb;
    }
    
    /**
     * OKLAB interpolation (perceptually uniform)
     * @private
     */
    _interpolateOklab(stop1, stop2, t) {
        const lab1 = rgbToOklab(stop1.r, stop1.g, stop1.b);
        const lab2 = rgbToOklab(stop2.r, stop2.g, stop2.b);
        
        const L = lerp(lab1.L, lab2.L, t);
        const a = lerp(lab1.a, lab2.a, t);
        const b = lerp(lab1.b, lab2.b, t);
        
        const rgb = oklabToRgb(L, a, b);
        rgb.a = lerp(stop1.a, stop2.a, t);
        return rgb;
    }
    
    /**
     * Apply post-processing to color
     * @private
     */
    _postProcess(r, g, b, a) {
        // Invert
        if (this.invert) {
            r = 1 - r;
            g = 1 - g;
            b = 1 - b;
        }
        
        // Hue shift
        if (this.hueShift !== 0) {
            const hsv = rgbToHsv(r, g, b);
            hsv.h = (hsv.h + this.hueShift) % 360;
            const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
            r = rgb.r;
            g = rgb.g;
            b = rgb.b;
        }
        
        // Saturation
        if (this.saturation !== 1) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = gray + (r - gray) * this.saturation;
            g = gray + (g - gray) * this.saturation;
            b = gray + (b - gray) * this.saturation;
        }
        
        // Contrast
        if (this.contrast !== 1) {
            r = (r - 0.5) * this.contrast + 0.5;
            g = (g - 0.5) * this.contrast + 0.5;
            b = (b - 0.5) * this.contrast + 0.5;
        }
        
        // Brightness
        if (this.brightness !== 0) {
            r += this.brightness;
            g += this.brightness;
            b += this.brightness;
        }
        
        // Gamma
        if (this.gamma !== 1) {
            const invGamma = 1 / this.gamma;
            r = Math.pow(Math.max(0, r), invGamma);
            g = Math.pow(Math.max(0, g), invGamma);
            b = Math.pow(Math.max(0, b), invGamma);
        }
        
        // Clamp
        return {
            r: Math.max(0, Math.min(1, r)),
            g: Math.max(0, Math.min(1, g)),
            b: Math.max(0, Math.min(1, b)),
            a: Math.max(0, Math.min(1, a))
        };
    }
    
    /**
     * Generate lookup table for fast color sampling
     * @param {number} size - LUT size (default 256)
     * @returns {Uint8ClampedArray} RGBA lookup table
     */
    generateLUT(size = 256) {
        if (this._lut && this._lutSize === size) {
            return this._lut;
        }
        
        const lut = new Uint8ClampedArray(size * 4);
        
        for (let i = 0; i < size; i++) {
            const t = i / (size - 1);
            const color = this.getColor(t);
            
            const idx = i * 4;
            lut[idx] = Math.round(color.r * 255);
            lut[idx + 1] = Math.round(color.g * 255);
            lut[idx + 2] = Math.round(color.b * 255);
            lut[idx + 3] = Math.round(color.a * 255);
        }
        
        this._lut = lut;
        this._lutSize = size;
        
        return lut;
    }
    
    /**
     * Get color from LUT (fast)
     * @param {number} t - Position (0-1)
     * @param {Uint8ClampedArray} lut - Lookup table
     * @returns {Object} { r, g, b, a } (0-255)
     */
    getColorFromLUT(t, lut) {
        const size = lut.length / 4;
        t = this._applyRepeatMode(t);
        const idx = Math.floor(t * (size - 1)) * 4;
        
        return {
            r: lut[idx],
            g: lut[idx + 1],
            b: lut[idx + 2],
            a: lut[idx + 3]
        };
    }
    
    /**
     * Clone this palette
     * @returns {Palette}
     */
    clone() {
        const cloned = new Palette({
            id: `${this.id}_copy`,
            name: `${this.name} (Copy)`,
            author: this.author,
            category: this.category,
            tags: [...this.tags],
            interpolation: this.interpolation,
            colorSpace: this.colorSpace,
            repeatMode: this.repeatMode,
            gamma: this.gamma,
            contrast: this.contrast,
            brightness: this.brightness,
            saturation: this.saturation,
            hueShift: this.hueShift,
            invert: this.invert
        });
        
        for (const stop of this.stops) {
            cloned.stops.push(stop.clone());
        }
        
        return cloned;
    }
    
    /**
     * Export to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            author: this.author,
            category: this.category,
            tags: this.tags,
            stops: this.stops.map(s => ({
                position: s.position,
                r: s.r,
                g: s.g,
                b: s.b,
                a: s.a
            })),
            interpolation: this.interpolation,
            colorSpace: this.colorSpace,
            repeatMode: this.repeatMode,
            gamma: this.gamma,
            contrast: this.contrast,
            brightness: this.brightness,
            saturation: this.saturation,
            hueShift: this.hueShift,
            invert: this.invert
        };
    }
    
    /**
     * Create palette from JSON
     * @param {Object} json - JSON object
     * @returns {Palette}
     */
    static fromJSON(json) {
        return new Palette(json);
    }
    
    /**
     * Reverse the palette
     */
    reverse() {
        for (const stop of this.stops) {
            stop.position = 1 - stop.position;
        }
        this._sortStops();
        this._invalidateLUT();
    }
    
    /**
     * Shift all colors by amount
     * @param {number} amount - Shift amount (0-1)
     */
    shift(amount) {
        for (const stop of this.stops) {
            stop.position = (stop.position + amount) % 1;
        }
        this._sortStops();
        this._invalidateLUT();
    }
}

// ============================================================================
// PALETTE ENGINE CLASS
// ============================================================================

/**
 * Main engine for applying palettes to fractal data
 */
export class PaletteEngine {
    constructor() {
        this.currentPalette = null;
        this.lut = null;
        this.lutSize = 4096; // High precision LUT
        
        // Density mapping
        this.densityFunction = 'linear'; // linear, log, sqrt, exp
        this.densityScale = 1;
        this.densityOffset = 0;
        
        // Animation
        this.animationOffset = 0;
        this.animationSpeed = 0;
    }
    
    /**
     * Set the active palette
     * @param {Palette} palette - Palette to use
     */
    setPalette(palette) {
        this.currentPalette = palette;
        this._regenerateLUT();
    }
    
    /**
     * Regenerate the lookup table
     * @private
     */
    _regenerateLUT() {
        if (this.currentPalette) {
            this.lut = this.currentPalette.generateLUT(this.lutSize);
        }
    }
    
    /**
     * Apply density function to value
     * @param {number} value - Input value (0-1)
     * @returns {number} Transformed value
     */
    applyDensity(value) {
        switch (this.densityFunction) {
            case 'log':
                value = Math.log(value * 9 + 1) / Math.log(10);
                break;
            case 'sqrt':
                value = Math.sqrt(value);
                break;
            case 'exp':
                value = (Math.exp(value) - 1) / (Math.E - 1);
                break;
            case 'pow2':
                value = value * value;
                break;
            case 'pow3':
                value = value * value * value;
                break;
        }
        
        return (value + this.densityOffset) * this.densityScale;
    }
    
    /**
     * Get color for a value
     * @param {number} value - Normalized value (0-1)
     * @returns {Object} { r, g, b, a } (0-255)
     */
    getColor(value) {
        if (!this.currentPalette || !this.lut) {
            return { r: 0, g: 0, b: 0, a: 255 };
        }
        
        // Apply density mapping
        value = this.applyDensity(value);
        
        // Apply animation offset
        value = (value + this.animationOffset) % 1;
        
        // Sample from LUT
        return this.currentPalette.getColorFromLUT(value, this.lut);
    }
    
    /**
     * Apply palette to entire pixel buffer
     * @param {Float32Array} values - Normalized values (one per pixel)
     * @param {Uint8ClampedArray} output - Output RGBA buffer
     * @param {number} pixelCount - Number of pixels
     */
    applyToBuffer(values, output, pixelCount) {
        if (!this.lut) return;
        
        for (let i = 0; i < pixelCount; i++) {
            let value = values[i];
            value = this.applyDensity(value);
            value = (value + this.animationOffset) % 1;
            
            const lutIdx = Math.floor(value * (this.lutSize - 1)) * 4;
            const outIdx = i * 4;
            
            output[outIdx] = this.lut[lutIdx];
            output[outIdx + 1] = this.lut[lutIdx + 1];
            output[outIdx + 2] = this.lut[lutIdx + 2];
            output[outIdx + 3] = 255;
        }
    }
    
    /**
     * Update animation
     * @param {number} deltaTime - Time since last update (ms)
     */
    updateAnimation(deltaTime) {
        if (this.animationSpeed !== 0) {
            this.animationOffset += this.animationSpeed * deltaTime / 1000;
            this.animationOffset = ((this.animationOffset % 1) + 1) % 1;
        }
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    Palette,
    PaletteEngine,
    ColorStop,
    INTERPOLATION,
    COLOR_SPACE,
    REPEAT_MODE,
    rgbToHsv,
    hsvToRgb,
    rgbToHsl,
    hslToRgb,
    rgbToOklab,
    oklabToRgb,
    parseHex,
    toHex
};
