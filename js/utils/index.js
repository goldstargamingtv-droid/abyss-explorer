/**
 * ============================================================================
 * ABYSS EXPLORER - UTILITIES MODULE INDEX
 * ============================================================================
 * 
 * Central module for all utility functions used throughout the application.
 * Provides timing, color, math, storage, URL state, and browser utilities.
 * 
 * @module utils
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// IMPORTS
// ============================================================================

// General utilities
import utils, {
    debounce as utilsDebounce,
    throttle as utilsThrottle,
    raf,
    cancelRaf,
    sleep,
    nextFrame,
    Easing,
    rgbToHsv as utilsRgbToHsv,
    hsvToRgb as utilsHsvToRgb,
    rgbToHsl as utilsRgbToHsl,
    hslToRgb as utilsHslToRgb,
    hexToRgb,
    rgbToHex as utilsRgbToHex,
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
    formatNumber,
    formatBytes,
    formatDuration,
    uuid,
    hashString,
    Features,
    isWebWorker,
    isMobile,
    getDevicePixelRatio,
    deepClone,
    deepMerge,
    isObject,
    range,
    chunk,
    shuffle
} from './utils.js';

// Storage
import storage, {
    Storage,
    PreferencesStorage,
    PresetStorage,
    AnimationStorage,
    HistoryStorage,
    getStorage,
    getPreferences,
    getPresetStorage,
    getAnimationStorage,
    getHistoryStorage,
    LocalStorageWrapper,
    IndexedDBWrapper
} from './storage.js';

// URL state
import urlState, {
    encodeState,
    decodeState,
    updateURLHash,
    getStateFromURL,
    generateShareURL,
    copyShareURL,
    onHashChange,
    LZString
} from './url-state.js';

// Debounce/throttle
import debounceUtils, {
    debounce,
    throttle,
    rafThrottle,
    leadingDebounce,
    trailingDebounce,
    immediateDebounce,
    windowedThrottle,
    debouncePromise,
    batch
} from './debounce.js';

// Color utilities
import colorUtils, {
    parseColor,
    rgbToHex,
    rgbToCSS,
    clampRGB,
    rgbToHsv,
    hsvToRgb,
    rgbToHsl,
    hslToRgb,
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
    relativeLuminance,
    contrastRatio,
    meetsContrastAA,
    meetsContrastAAA,
    brightness,
    isLight,
    getContrastingText,
    lerpRgb,
    lerpHsv,
    lerpLab,
    cubicInterpolate,
    samplePalette,
    blend
} from './color-utils.js';

// Math utilities
import mathUtils, {
    PI,
    TAU,
    E,
    PHI,
    SQRT2,
    SQRT3,
    LN2,
    LN10,
    LOG2E,
    LOG10E,
    EPSILON,
    FLOAT_EPSILON,
    DOUBLE_EPSILON,
    mod,
    fract,
    sign,
    step,
    safeLog,
    safePow,
    intPow,
    Complex,
    mat4Identity,
    mat4Multiply,
    mat4Translate,
    mat4Scale,
    mat4RotateX,
    mat4RotateY,
    mat4RotateZ,
    mat4Perspective,
    mat4LookAt,
    vec3Add,
    vec3Sub,
    vec3Scale,
    vec3Dot,
    vec3Cross,
    vec3Length,
    vec3Normalize,
    vec3Lerp,
    approxEqual,
    isZero,
    isValidNumber,
    sanitize,
    flushDenormals,
    parseArbitraryPrecision,
    formatArbitraryPrecision,
    addStrings,
    multiplyStrings,
    createSeededRandom,
    randomFloat,
    randomInt,
    randomGaussian
} from './math-utils.js';

// ============================================================================
// MODULE INFO
// ============================================================================

export const MODULE_INFO = {
    name: 'Abyss Explorer Utilities',
    version: '1.0.0',
    description: 'Core utility functions for the fractal explorer',
    modules: {
        utils: 'General utility functions',
        storage: 'LocalStorage/IndexedDB wrapper',
        urlState: 'URL hash state encoding',
        debounce: 'Debounce and throttle utilities',
        colorUtils: 'Color space conversions and operations',
        mathUtils: 'Extended math functions'
    }
};

// ============================================================================
// RE-EXPORTS
// ============================================================================

// General utilities
export {
    utils,
    raf,
    cancelRaf,
    sleep,
    nextFrame,
    Easing,
    hexToRgb,
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
    formatNumber,
    formatBytes,
    formatDuration,
    uuid,
    hashString,
    Features,
    isWebWorker,
    isMobile,
    getDevicePixelRatio,
    deepClone,
    deepMerge,
    isObject,
    range,
    chunk,
    shuffle
};

// Storage
export {
    storage,
    Storage,
    PreferencesStorage,
    PresetStorage,
    AnimationStorage,
    HistoryStorage,
    getStorage,
    getPreferences,
    getPresetStorage,
    getAnimationStorage,
    getHistoryStorage,
    LocalStorageWrapper,
    IndexedDBWrapper
};

// URL state
export {
    urlState,
    encodeState,
    decodeState,
    updateURLHash,
    getStateFromURL,
    generateShareURL,
    copyShareURL,
    onHashChange,
    LZString
};

// Debounce/throttle
export {
    debounceUtils,
    debounce,
    throttle,
    rafThrottle,
    leadingDebounce,
    trailingDebounce,
    immediateDebounce,
    windowedThrottle,
    debouncePromise,
    batch
};

// Color utilities
export {
    colorUtils,
    parseColor,
    rgbToHex,
    rgbToCSS,
    clampRGB,
    rgbToHsv,
    hsvToRgb,
    rgbToHsl,
    hslToRgb,
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
    relativeLuminance,
    contrastRatio,
    meetsContrastAA,
    meetsContrastAAA,
    brightness,
    isLight,
    getContrastingText,
    lerpRgb,
    lerpHsv,
    lerpLab,
    cubicInterpolate,
    samplePalette,
    blend
};

// Math utilities
export {
    mathUtils,
    PI,
    TAU,
    E,
    PHI,
    SQRT2,
    SQRT3,
    LN2,
    LN10,
    LOG2E,
    LOG10E,
    EPSILON,
    FLOAT_EPSILON,
    DOUBLE_EPSILON,
    mod,
    fract,
    sign,
    step,
    safeLog,
    safePow,
    intPow,
    Complex,
    mat4Identity,
    mat4Multiply,
    mat4Translate,
    mat4Scale,
    mat4RotateX,
    mat4RotateY,
    mat4RotateZ,
    mat4Perspective,
    mat4LookAt,
    vec3Add,
    vec3Sub,
    vec3Scale,
    vec3Dot,
    vec3Cross,
    vec3Length,
    vec3Normalize,
    vec3Lerp,
    approxEqual,
    isZero,
    isValidNumber,
    sanitize,
    flushDenormals,
    parseArbitraryPrecision,
    formatArbitraryPrecision,
    addStrings,
    multiplyStrings,
    createSeededRandom,
    randomFloat,
    randomInt,
    randomGaussian
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    MODULE_INFO,
    
    // Modules
    utils,
    storage,
    urlState,
    debounceUtils,
    colorUtils,
    mathUtils,
    
    // Timing
    debounce,
    throttle,
    rafThrottle,
    raf,
    cancelRaf,
    sleep,
    nextFrame,
    batch,
    
    // Easing
    Easing,
    
    // Color
    parseColor,
    rgbToHex,
    rgbToCSS,
    clampRGB,
    rgbToHsv,
    hsvToRgb,
    rgbToHsl,
    hslToRgb,
    rgbToLab,
    labToRgb,
    rgbToLch,
    lchToRgb,
    hexToRgb,
    lerpRgb,
    lerpHsv,
    lerpLab,
    samplePalette,
    blend,
    brightness,
    isLight,
    contrastRatio,
    
    // Math
    clamp,
    lerp,
    inverseLerp,
    remap,
    smoothstep,
    smootherstep,
    mod,
    fract,
    sign,
    step,
    log2Int,
    log2Fast,
    hypot,
    roundTo,
    isPowerOfTwo,
    nextPowerOfTwo,
    Complex,
    approxEqual,
    isValidNumber,
    sanitize,
    
    // Matrix/Vector
    mat4Identity,
    mat4Multiply,
    mat4Translate,
    mat4Scale,
    mat4RotateX,
    mat4RotateY,
    mat4RotateZ,
    mat4Perspective,
    mat4LookAt,
    vec3Add,
    vec3Sub,
    vec3Scale,
    vec3Dot,
    vec3Cross,
    vec3Length,
    vec3Normalize,
    vec3Lerp,
    
    // Random
    createSeededRandom,
    randomFloat,
    randomInt,
    randomGaussian,
    
    // String
    formatNumber,
    formatBytes,
    formatDuration,
    uuid,
    hashString,
    
    // Storage
    Storage,
    getStorage,
    getPreferences,
    getPresetStorage,
    getAnimationStorage,
    getHistoryStorage,
    
    // URL
    encodeState,
    decodeState,
    updateURLHash,
    getStateFromURL,
    generateShareURL,
    copyShareURL,
    onHashChange,
    LZString,
    
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
