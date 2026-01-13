/**
 * ============================================================================
 * ABYSS EXPLORER - GENERAL UTILITIES
 * ============================================================================
 * 
 * Core utility functions used throughout the application.
 * Provides helpers for timing, colors, math, strings, and browser detection.
 * 
 * All functions are pure (no side effects) and optimized for performance.
 * 
 * @module utils/utils
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// TIMING UTILITIES
// ============================================================================

/**
 * Debounce function - delays execution until after wait milliseconds
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute on leading edge
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, immediate = false) {
    let timeout;
    
    return function executedFunction(...args) {
        const context = this;
        
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        
        const callNow = immediate && !timeout;
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        
        if (callNow) func.apply(context, args);
    };
}

/**
 * Throttle function - limits execution to once per wait period
 * @param {Function} func - Function to throttle
 * @param {number} wait - Minimum time between calls
 * @returns {Function} Throttled function
 */
export function throttle(func, wait) {
    let lastTime = 0;
    let timeout = null;
    
    return function executedFunction(...args) {
        const context = this;
        const now = Date.now();
        const remaining = wait - (now - lastTime);
        
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            lastTime = now;
            func.apply(context, args);
        } else if (!timeout) {
            timeout = setTimeout(() => {
                lastTime = Date.now();
                timeout = null;
                func.apply(context, args);
            }, remaining);
        }
    };
}

/**
 * Request Animation Frame with fallback
 */
export const raf = (function() {
    return typeof requestAnimationFrame !== 'undefined'
        ? requestAnimationFrame.bind(window)
        : (callback) => setTimeout(callback, 16);
})();

/**
 * Cancel Animation Frame with fallback
 */
export const cancelRaf = (function() {
    return typeof cancelAnimationFrame !== 'undefined'
        ? cancelAnimationFrame.bind(window)
        : clearTimeout;
})();

/**
 * Wait for specified milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for next animation frame
 * @returns {Promise<number>} Timestamp
 */
export function nextFrame() {
    return new Promise(resolve => raf(resolve));
}

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

/**
 * Common easing functions for animations
 * All take t in [0, 1] and return value in [0, 1]
 */
export const Easing = {
    // Linear
    linear: t => t,
    
    // Quadratic
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    
    // Cubic
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    
    // Quartic
    easeInQuart: t => t * t * t * t,
    easeOutQuart: t => 1 - (--t) * t * t * t,
    easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    
    // Quintic
    easeInQuint: t => t * t * t * t * t,
    easeOutQuint: t => 1 + (--t) * t * t * t * t,
    easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
    
    // Sine
    easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
    easeOutSine: t => Math.sin(t * Math.PI / 2),
    easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
    
    // Exponential
    easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: t => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
        return (2 - Math.pow(2, -20 * t + 10)) / 2;
    },
    
    // Circular
    easeInCirc: t => 1 - Math.sqrt(1 - t * t),
    easeOutCirc: t => Math.sqrt(1 - (--t) * t),
    easeInOutCirc: t => t < 0.5
        ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
        : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
    
    // Elastic
    easeInElastic: t => {
        if (t === 0 || t === 1) return t;
        return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI) / 3);
    },
    easeOutElastic: t => {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
    },
    easeInOutElastic: t => {
        if (t === 0 || t === 1) return t;
        if (t < 0.5) {
            return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / 4.5)) / 2;
        }
        return (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / 4.5)) / 2 + 1;
    },
    
    // Back
    easeInBack: t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    },
    easeOutBack: t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeInOutBack: t => {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
            ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
            : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    },
    
    // Bounce
    easeOutBounce: t => {
        const n1 = 7.5625;
        const d1 = 2.75;
        
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    },
    easeInBounce: t => 1 - Easing.easeOutBounce(1 - t),
    easeInOutBounce: t => t < 0.5
        ? (1 - Easing.easeOutBounce(1 - 2 * t)) / 2
        : (1 + Easing.easeOutBounce(2 * t - 1)) / 2
};

// ============================================================================
// COLOR CONVERSIONS
// ============================================================================

/**
 * Convert RGB to HSV
 * @param {number} r - Red [0-255]
 * @param {number} g - Green [0-255]
 * @param {number} b - Blue [0-255]
 * @returns {Object} { h: [0-360], s: [0-1], v: [0-1] }
 */
export function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    
    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    return { h: h * 360, s, v };
}

/**
 * Convert HSV to RGB
 * @param {number} h - Hue [0-360]
 * @param {number} s - Saturation [0-1]
 * @param {number} v - Value [0-1]
 * @returns {Object} { r, g, b } [0-255]
 */
export function hsvToRgb(h, s, v) {
    h = ((h % 360) + 360) % 360;
    h /= 360;
    
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    let r, g, b;
    
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

/**
 * Convert RGB to HSL
 * @param {number} r - Red [0-255]
 * @param {number} g - Green [0-255]
 * @param {number} b - Blue [0-255]
 * @returns {Object} { h: [0-360], s: [0-1], l: [0-1] }
 */
export function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    
    let h = 0, s = 0;
    
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    
    return { h: h * 360, s, l };
}

/**
 * Convert HSL to RGB
 * @param {number} h - Hue [0-360]
 * @param {number} s - Saturation [0-1]
 * @param {number} l - Lightness [0-1]
 * @returns {Object} { r, g, b } [0-255]
 */
export function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    h /= 360;
    
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
    
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color (#RGB or #RRGGBB)
 * @returns {Object} { r, g, b }
 */
export function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    const num = parseInt(hex, 16);
    
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

/**
 * Convert RGB to hex
 * @param {number} r - Red [0-255]
 * @param {number} g - Green [0-255]
 * @param {number} b - Blue [0-255]
 * @returns {string} Hex color #RRGGBB
 */
export function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// ============================================================================
// MATH HELPERS
// ============================================================================

/**
 * Clamp value between min and max
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Inverse lerp - find t such that lerp(a, b, t) = value
 */
export function inverseLerp(a, b, value) {
    if (a === b) return 0;
    return (value - a) / (b - a);
}

/**
 * Remap value from one range to another
 */
export function remap(value, inMin, inMax, outMin, outMax) {
    return lerp(outMin, outMax, inverseLerp(inMin, inMax, value));
}

/**
 * Smoothstep interpolation (cubic Hermite)
 */
export function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

/**
 * Smoother smoothstep (quintic)
 */
export function smootherstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Fast integer log2
 */
export function log2Int(n) {
    if (n <= 0) return -Infinity;
    return 31 - Math.clz32(n);
}

/**
 * Fast approximate log2
 */
export function log2Fast(x) {
    // Uses the identity: log2(x) = log2(m * 2^e) = log2(m) + e
    // where m is mantissa in [1, 2)
    const buf = new ArrayBuffer(8);
    const f64 = new Float64Array(buf);
    const u32 = new Uint32Array(buf);
    
    f64[0] = x;
    const exp = ((u32[1] >>> 20) & 0x7FF) - 1023;
    
    // Extract mantissa and approximate log2(mantissa)
    u32[1] = (u32[1] & 0x000FFFFF) | 0x3FF00000;
    const mantissa = f64[0];
    
    // Polynomial approximation for log2(m) where m in [1, 2]
    const m = mantissa - 1;
    const logM = m * (1.4426950408889634 - 0.7213475204444817 * m);
    
    return exp + logM;
}

/**
 * Hypot with overflow protection
 */
export function hypot(...values) {
    // Use built-in if available
    if (typeof Math.hypot === 'function') {
        return Math.hypot(...values);
    }
    
    // Manual implementation with scaling
    let sum = 0;
    let max = 0;
    
    for (const v of values) {
        const abs = Math.abs(v);
        if (abs > max) {
            sum *= (max / abs) * (max / abs);
            max = abs;
        }
        if (max !== 0) {
            sum += (abs / max) * (abs / max);
        }
    }
    
    return max * Math.sqrt(sum);
}

/**
 * Round to specified decimal places
 */
export function roundTo(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * Check if number is power of two
 */
export function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Next power of two
 */
export function nextPowerOfTwo(n) {
    if (n <= 0) return 1;
    n--;
    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;
    return n + 1;
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Format number with thousands separator
 */
export function formatNumber(num, decimals = 0) {
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Generate UUID v4
 */
export function uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    
    // Fallback implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Simple hash function for strings
 */
export function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

// ============================================================================
// BROWSER FEATURE DETECTION
// ============================================================================

/**
 * Detect browser features
 */
export const Features = {
    // Check for OffscreenCanvas support
    offscreenCanvas: (function() {
        try {
            return typeof OffscreenCanvas !== 'undefined';
        } catch (e) {
            return false;
        }
    })(),
    
    // Check for BigInt support
    bigInt: typeof BigInt !== 'undefined',
    
    // Check for SharedArrayBuffer support
    sharedArrayBuffer: (function() {
        try {
            return typeof SharedArrayBuffer !== 'undefined';
        } catch (e) {
            return false;
        }
    })(),
    
    // Check for WebGL2 support
    webGL2: (function() {
        try {
            const canvas = document.createElement('canvas');
            return !!canvas.getContext('webgl2');
        } catch (e) {
            return false;
        }
    })(),
    
    // Check for WebGPU support
    webGPU: typeof navigator !== 'undefined' && 'gpu' in navigator,
    
    // Check for Web Workers
    webWorkers: typeof Worker !== 'undefined',
    
    // Check for IndexedDB
    indexedDB: typeof indexedDB !== 'undefined',
    
    // Check for localStorage
    localStorage: (function() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    })(),
    
    // Check for touch support
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    
    // Check for pointer events
    pointerEvents: 'onpointerdown' in window,
    
    // Check for ResizeObserver
    resizeObserver: typeof ResizeObserver !== 'undefined',
    
    // Check for IntersectionObserver
    intersectionObserver: typeof IntersectionObserver !== 'undefined',
    
    // Check for requestIdleCallback
    requestIdleCallback: typeof requestIdleCallback !== 'undefined',
    
    // Get hardware concurrency
    hardwareConcurrency: navigator.hardwareConcurrency || 4,
    
    // Check for SIMD (deprecated but check anyway)
    simd: typeof WebAssembly !== 'undefined' && 
          typeof WebAssembly.validate === 'function'
};

/**
 * Check if running in Web Worker
 */
export function isWebWorker() {
    return typeof WorkerGlobalScope !== 'undefined' && 
           self instanceof WorkerGlobalScope;
}

/**
 * Check if running on mobile device
 */
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
}

/**
 * Get device pixel ratio
 */
export function getDevicePixelRatio() {
    return window.devicePixelRatio || 1;
}

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

/**
 * Deep clone object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Float32Array) return new Float32Array(obj);
    if (obj instanceof Float64Array) return new Float64Array(obj);
    if (obj instanceof Uint8Array) return new Uint8Array(obj);
    if (obj instanceof Int32Array) return new Int32Array(obj);
    
    const cloned = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}

/**
 * Deep merge objects
 */
export function deepMerge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
    
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                deepMerge(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
    
    return deepMerge(target, ...sources);
}

/**
 * Check if value is plain object
 */
export function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Create array of numbers from start to end
 */
export function range(start, end, step = 1) {
    const result = [];
    for (let i = start; i < end; i += step) {
        result.push(i);
    }
    return result;
}

/**
 * Chunk array into smaller arrays
 */
export function chunk(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

/**
 * Shuffle array in place
 */
export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    // Timing
    debounce,
    throttle,
    raf,
    cancelRaf,
    sleep,
    nextFrame,
    
    // Easing
    Easing,
    
    // Color
    rgbToHsv,
    hsvToRgb,
    rgbToHsl,
    hslToRgb,
    hexToRgb,
    rgbToHex,
    
    // Math
    clamp,
    lerp,
    inverseLerp,
    remap,
    smoothstep,
    smootherstep,
    log2Int,
    log2Fast,
    hypot,
    roundTo,
    isPowerOfTwo,
    nextPowerOfTwo,
    
    // String
    formatNumber,
    formatBytes,
    formatDuration,
    uuid,
    hashString,
    
    // Features
    Features,
    isWebWorker,
    isMobile,
    getDevicePixelRatio,
    
    // Objects
    deepClone,
    deepMerge,
    isObject,
    
    // Arrays
    range,
    chunk,
    shuffle
};
