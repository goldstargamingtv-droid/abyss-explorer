/**
 * ============================================================================
 * ABYSS EXPLORER - COLOR UTILITIES
 * ============================================================================
 * 
 * Comprehensive color manipulation library for fractal visualization.
 * Handles color space conversions, palette interpolation, and perceptual
 * color operations.
 * 
 * Features:
 * - RGB/HSV/HSL/LAB/LCH conversions
 * - Linear and cubic palette interpolation
 * - Perceptual brightness calculations
 * - Contrast checking (WCAG compliance)
 * - Color blending modes
 * - Gradient generation
 * 
 * @module utils/color-utils
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

// sRGB to XYZ conversion matrix
const RGB_TO_XYZ_MATRIX = [
    [0.4124564, 0.3575761, 0.1804375],
    [0.2126729, 0.7151522, 0.0721750],
    [0.0193339, 0.1191920, 0.9503041]
];

// XYZ to sRGB conversion matrix
const XYZ_TO_RGB_MATRIX = [
    [3.2404542, -1.5371385, -0.4985314],
    [-0.9692660, 1.8760108, 0.0415560],
    [0.0556434, -0.2040259, 1.0572252]
];

// D65 reference white
const REF_WHITE = { x: 95.047, y: 100.000, z: 108.883 };

// ============================================================================
// RGB OPERATIONS
// ============================================================================

/**
 * Clamp RGB values to valid range
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {Object} Clamped { r, g, b }
 */
export function clampRGB(r, g, b) {
    return {
        r: Math.max(0, Math.min(255, Math.round(r))),
        g: Math.max(0, Math.min(255, Math.round(g))),
        b: Math.max(0, Math.min(255, Math.round(b)))
    };
}

/**
 * Parse color string to RGB
 * Supports: #RGB, #RRGGBB, rgb(), rgba(), named colors
 * @param {string} str - Color string
 * @returns {Object} { r, g, b, a }
 */
export function parseColor(str) {
    str = str.trim().toLowerCase();
    
    // Hex format
    if (str.startsWith('#')) {
        str = str.slice(1);
        if (str.length === 3) {
            str = str[0] + str[0] + str[1] + str[1] + str[2] + str[2];
        }
        const num = parseInt(str, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255,
            a: 1
        };
    }
    
    // rgb() or rgba() format
    const rgbMatch = str.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1], 10),
            g: parseInt(rgbMatch[2], 10),
            b: parseInt(rgbMatch[3], 10),
            a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
        };
    }
    
    // Named colors (common ones)
    const namedColors = {
        black: { r: 0, g: 0, b: 0 },
        white: { r: 255, g: 255, b: 255 },
        red: { r: 255, g: 0, b: 0 },
        green: { r: 0, g: 128, b: 0 },
        blue: { r: 0, g: 0, b: 255 },
        yellow: { r: 255, g: 255, b: 0 },
        cyan: { r: 0, g: 255, b: 255 },
        magenta: { r: 255, g: 0, b: 255 },
        orange: { r: 255, g: 165, b: 0 },
        purple: { r: 128, g: 0, b: 128 }
    };
    
    if (namedColors[str]) {
        return { ...namedColors[str], a: 1 };
    }
    
    // Default fallback
    return { r: 0, g: 0, b: 0, a: 1 };
}

/**
 * Convert RGB to hex string
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {string} #RRGGBB
 */
export function rgbToHex(r, g, b) {
    const toHex = (n) => {
        const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
}

/**
 * Convert RGB to CSS string
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} a - Alpha (optional)
 * @returns {string}
 */
export function rgbToCSS(r, g, b, a = 1) {
    r = Math.round(r);
    g = Math.round(g);
    b = Math.round(b);
    
    if (a === 1) {
        return `rgb(${r}, ${g}, ${b})`;
    }
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ============================================================================
// HSV CONVERSIONS
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

// ============================================================================
// HSL CONVERSIONS
// ============================================================================

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

// ============================================================================
// LAB/LCH CONVERSIONS (Perceptually Uniform)
// ============================================================================

/**
 * Convert RGB to XYZ color space
 */
export function rgbToXyz(r, g, b) {
    // Normalize and apply sRGB gamma correction
    let rr = r / 255;
    let gg = g / 255;
    let bb = b / 255;
    
    rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
    gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
    bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;
    
    rr *= 100;
    gg *= 100;
    bb *= 100;
    
    return {
        x: rr * RGB_TO_XYZ_MATRIX[0][0] + gg * RGB_TO_XYZ_MATRIX[0][1] + bb * RGB_TO_XYZ_MATRIX[0][2],
        y: rr * RGB_TO_XYZ_MATRIX[1][0] + gg * RGB_TO_XYZ_MATRIX[1][1] + bb * RGB_TO_XYZ_MATRIX[1][2],
        z: rr * RGB_TO_XYZ_MATRIX[2][0] + gg * RGB_TO_XYZ_MATRIX[2][1] + bb * RGB_TO_XYZ_MATRIX[2][2]
    };
}

/**
 * Convert XYZ to RGB color space
 */
export function xyzToRgb(x, y, z) {
    x /= 100;
    y /= 100;
    z /= 100;
    
    let r = x * XYZ_TO_RGB_MATRIX[0][0] + y * XYZ_TO_RGB_MATRIX[0][1] + z * XYZ_TO_RGB_MATRIX[0][2];
    let g = x * XYZ_TO_RGB_MATRIX[1][0] + y * XYZ_TO_RGB_MATRIX[1][1] + z * XYZ_TO_RGB_MATRIX[1][2];
    let b = x * XYZ_TO_RGB_MATRIX[2][0] + y * XYZ_TO_RGB_MATRIX[2][1] + z * XYZ_TO_RGB_MATRIX[2][2];
    
    // Apply sRGB gamma correction
    r = r > 0.0031308 ? 1.055 * Math.pow(r, 1/2.4) - 0.055 : 12.92 * r;
    g = g > 0.0031308 ? 1.055 * Math.pow(g, 1/2.4) - 0.055 : 12.92 * g;
    b = b > 0.0031308 ? 1.055 * Math.pow(b, 1/2.4) - 0.055 : 12.92 * b;
    
    return clampRGB(r * 255, g * 255, b * 255);
}

/**
 * Convert XYZ to LAB color space
 */
export function xyzToLab(x, y, z) {
    x /= REF_WHITE.x;
    y /= REF_WHITE.y;
    z /= REF_WHITE.z;
    
    const f = (t) => t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t) + 16/116;
    
    const fx = f(x);
    const fy = f(y);
    const fz = f(z);
    
    return {
        l: (116 * fy) - 16,
        a: 500 * (fx - fy),
        b: 200 * (fy - fz)
    };
}

/**
 * Convert LAB to XYZ color space
 */
export function labToXyz(l, a, b) {
    const fy = (l + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;
    
    const f = (t) => {
        const t3 = t * t * t;
        return t3 > 0.008856 ? t3 : (t - 16/116) / 7.787;
    };
    
    return {
        x: f(fx) * REF_WHITE.x,
        y: f(fy) * REF_WHITE.y,
        z: f(fz) * REF_WHITE.z
    };
}

/**
 * Convert RGB to LAB
 */
export function rgbToLab(r, g, b) {
    const xyz = rgbToXyz(r, g, b);
    return xyzToLab(xyz.x, xyz.y, xyz.z);
}

/**
 * Convert LAB to RGB
 */
export function labToRgb(l, a, b) {
    const xyz = labToXyz(l, a, b);
    return xyzToRgb(xyz.x, xyz.y, xyz.z);
}

/**
 * Convert LAB to LCH (cylindrical representation)
 */
export function labToLch(l, a, b) {
    const c = Math.sqrt(a * a + b * b);
    let h = Math.atan2(b, a) * (180 / Math.PI);
    if (h < 0) h += 360;
    
    return { l, c, h };
}

/**
 * Convert LCH to LAB
 */
export function lchToLab(l, c, h) {
    const hRad = h * (Math.PI / 180);
    return {
        l,
        a: c * Math.cos(hRad),
        b: c * Math.sin(hRad)
    };
}

/**
 * Convert RGB to LCH
 */
export function rgbToLch(r, g, b) {
    const lab = rgbToLab(r, g, b);
    return labToLch(lab.l, lab.a, lab.b);
}

/**
 * Convert LCH to RGB
 */
export function lchToRgb(l, c, h) {
    const lab = lchToLab(l, c, h);
    return labToRgb(lab.l, lab.a, lab.b);
}

// ============================================================================
// PERCEPTUAL OPERATIONS
// ============================================================================

/**
 * Calculate relative luminance (for contrast calculations)
 * Per WCAG 2.0 specification
 */
export function relativeLuminance(r, g, b) {
    const toLinear = (c) => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculate contrast ratio between two colors
 * Per WCAG 2.0 specification
 * @returns {number} Contrast ratio (1 to 21)
 */
export function contrastRatio(r1, g1, b1, r2, g2, b2) {
    const l1 = relativeLuminance(r1, g1, b1);
    const l2 = relativeLuminance(r2, g2, b2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA standard
 * @returns {boolean}
 */
export function meetsContrastAA(r1, g1, b1, r2, g2, b2, largeText = false) {
    const ratio = contrastRatio(r1, g1, b1, r2, g2, b2);
    return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast meets WCAG AAA standard
 * @returns {boolean}
 */
export function meetsContrastAAA(r1, g1, b1, r2, g2, b2, largeText = false) {
    const ratio = contrastRatio(r1, g1, b1, r2, g2, b2);
    return largeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Calculate perceptual brightness (0-1)
 */
export function brightness(r, g, b) {
    // ITU-R BT.601 standard
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Determine if color is considered "light"
 */
export function isLight(r, g, b) {
    return brightness(r, g, b) > 0.5;
}

/**
 * Get contrasting text color (black or white)
 */
export function getContrastingText(r, g, b) {
    return isLight(r, g, b) ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
}

// ============================================================================
// PALETTE INTERPOLATION
// ============================================================================

/**
 * Linear interpolation between two colors in RGB space
 */
export function lerpRgb(c1, c2, t) {
    return {
        r: Math.round(c1.r + (c2.r - c1.r) * t),
        g: Math.round(c1.g + (c2.g - c1.g) * t),
        b: Math.round(c1.b + (c2.b - c1.b) * t)
    };
}

/**
 * Linear interpolation in HSV space (better for hue transitions)
 */
export function lerpHsv(c1, c2, t) {
    const hsv1 = rgbToHsv(c1.r, c1.g, c1.b);
    const hsv2 = rgbToHsv(c2.r, c2.g, c2.b);
    
    // Handle hue wrapping
    let h1 = hsv1.h;
    let h2 = hsv2.h;
    
    if (Math.abs(h2 - h1) > 180) {
        if (h2 > h1) h1 += 360;
        else h2 += 360;
    }
    
    return hsvToRgb(
        (h1 + (h2 - h1) * t) % 360,
        hsv1.s + (hsv2.s - hsv1.s) * t,
        hsv1.v + (hsv2.v - hsv1.v) * t
    );
}

/**
 * Linear interpolation in LAB space (perceptually uniform)
 */
export function lerpLab(c1, c2, t) {
    const lab1 = rgbToLab(c1.r, c1.g, c1.b);
    const lab2 = rgbToLab(c2.r, c2.g, c2.b);
    
    return labToRgb(
        lab1.l + (lab2.l - lab1.l) * t,
        lab1.a + (lab2.a - lab1.a) * t,
        lab1.b + (lab2.b - lab1.b) * t
    );
}

/**
 * Cubic interpolation for smooth gradients
 */
export function cubicInterpolate(colors, t) {
    const n = colors.length;
    if (n < 2) return colors[0];
    
    const scaledT = t * (n - 1);
    const i = Math.min(Math.floor(scaledT), n - 2);
    const localT = scaledT - i;
    
    // Catmull-Rom spline
    const p0 = colors[Math.max(0, i - 1)];
    const p1 = colors[i];
    const p2 = colors[i + 1];
    const p3 = colors[Math.min(n - 1, i + 2)];
    
    const t2 = localT * localT;
    const t3 = t2 * localT;
    
    const catmullRom = (a, b, c, d) => {
        return 0.5 * (
            (2 * b) +
            (-a + c) * localT +
            (2*a - 5*b + 4*c - d) * t2 +
            (-a + 3*b - 3*c + d) * t3
        );
    };
    
    return clampRGB(
        catmullRom(p0.r, p1.r, p2.r, p3.r),
        catmullRom(p0.g, p1.g, p2.g, p3.g),
        catmullRom(p0.b, p1.b, p2.b, p3.b)
    );
}

/**
 * Sample palette at position t [0-1]
 */
export function samplePalette(colors, t, interpolation = 'linear') {
    t = Math.max(0, Math.min(1, t));
    const n = colors.length;
    
    if (n === 0) return { r: 0, g: 0, b: 0 };
    if (n === 1) return { ...colors[0] };
    
    if (interpolation === 'cubic') {
        return cubicInterpolate(colors, t);
    }
    
    const scaledT = t * (n - 1);
    const i = Math.min(Math.floor(scaledT), n - 2);
    const localT = scaledT - i;
    
    if (interpolation === 'hsv') {
        return lerpHsv(colors[i], colors[i + 1], localT);
    }
    
    if (interpolation === 'lab') {
        return lerpLab(colors[i], colors[i + 1], localT);
    }
    
    // Default: linear RGB
    return lerpRgb(colors[i], colors[i + 1], localT);
}

// ============================================================================
// COLOR BLENDING
// ============================================================================

/**
 * Blend two colors using specified mode
 */
export function blend(base, overlay, mode = 'normal', opacity = 1) {
    let result;
    
    switch (mode) {
        case 'multiply':
            result = {
                r: (base.r * overlay.r) / 255,
                g: (base.g * overlay.g) / 255,
                b: (base.b * overlay.b) / 255
            };
            break;
            
        case 'screen':
            result = {
                r: 255 - ((255 - base.r) * (255 - overlay.r)) / 255,
                g: 255 - ((255 - base.g) * (255 - overlay.g)) / 255,
                b: 255 - ((255 - base.b) * (255 - overlay.b)) / 255
            };
            break;
            
        case 'overlay':
            const overlayChannel = (b, o) => {
                return b < 128
                    ? (2 * b * o) / 255
                    : 255 - (2 * (255 - b) * (255 - o)) / 255;
            };
            result = {
                r: overlayChannel(base.r, overlay.r),
                g: overlayChannel(base.g, overlay.g),
                b: overlayChannel(base.b, overlay.b)
            };
            break;
            
        case 'add':
            result = clampRGB(
                base.r + overlay.r,
                base.g + overlay.g,
                base.b + overlay.b
            );
            break;
            
        case 'subtract':
            result = clampRGB(
                base.r - overlay.r,
                base.g - overlay.g,
                base.b - overlay.b
            );
            break;
            
        default: // normal
            result = { ...overlay };
    }
    
    // Apply opacity
    if (opacity < 1) {
        result = lerpRgb(base, result, opacity);
    }
    
    return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    // Parsing
    parseColor,
    rgbToHex,
    rgbToCSS,
    clampRGB,
    
    // HSV
    rgbToHsv,
    hsvToRgb,
    
    // HSL
    rgbToHsl,
    hslToRgb,
    
    // LAB/LCH
    rgbToLab,
    labToRgb,
    rgbToLch,
    lchToRgb,
    rgbToXyz,
    xyzToRgb,
    xyzToLab,
    labToXyz,
    labToLch,
    lchToLab,
    
    // Perceptual
    relativeLuminance,
    contrastRatio,
    meetsContrastAA,
    meetsContrastAAA,
    brightness,
    isLight,
    getContrastingText,
    
    // Interpolation
    lerpRgb,
    lerpHsv,
    lerpLab,
    cubicInterpolate,
    samplePalette,
    
    // Blending
    blend
};
