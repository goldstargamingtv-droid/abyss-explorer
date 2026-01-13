/**
 * ============================================================================
 * ABYSS EXPLORER - EXTERNAL LIBRARIES MODULE
 * ============================================================================
 * 
 * Embedded third-party libraries for offline use.
 * All libraries are MIT licensed and bundled for convenience.
 * 
 * Libraries:
 * - Big.js: Arbitrary precision decimal arithmetic
 * - GIF Encoder: GIF animation encoding
 * 
 * @module libs
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Big.js for arbitrary precision arithmetic
import Big from './big.min.js';

// GIF encoder for animation exports
import gifenc, {
    GIFEncoder,
    quantize,
    applyPalette,
    encodeGIF,
    encodeImage
} from './gifenc.min.js';

// ============================================================================
// MODULE INFO
// ============================================================================

export const MODULE_INFO = {
    name: 'Abyss Explorer External Libraries',
    version: '1.0.0',
    libraries: {
        big: {
            name: 'big.js',
            version: '6.2.1',
            license: 'MIT',
            author: 'Michael Mclaughlin',
            url: 'https://github.com/MikeMcl/big.js',
            description: 'Arbitrary-precision decimal arithmetic'
        },
        gifenc: {
            name: 'gifenc',
            version: '1.0.0',
            license: 'MIT',
            description: 'Lightweight GIF encoder for animations'
        }
    }
};

// ============================================================================
// CONVENIENCE WRAPPERS
// ============================================================================

/**
 * Create a Big number from various inputs
 * @param {number|string|Big} value - Input value
 * @param {number} precision - Decimal places for operations
 * @returns {Big}
 */
export function createBig(value, precision) {
    if (precision !== undefined) {
        const prevDP = Big.DP;
        Big.DP = precision;
        const result = new Big(value);
        Big.DP = prevDP;
        return result;
    }
    return new Big(value);
}

/**
 * Set Big.js configuration
 * @param {Object} config - Configuration options
 */
export function configureBig(config = {}) {
    if (config.decimalPlaces !== undefined) {
        Big.DP = config.decimalPlaces;
    }
    if (config.roundingMode !== undefined) {
        Big.RM = config.roundingMode;
    }
    if (config.negativeExponent !== undefined) {
        Big.NE = config.negativeExponent;
    }
    if (config.positiveExponent !== undefined) {
        Big.PE = config.positiveExponent;
    }
    if (config.strict !== undefined) {
        Big.strict = config.strict;
    }
}

/**
 * Encode frames to GIF with automatic quantization
 * @param {Array} frames - Array of RGBA Uint8Arrays
 * @param {number} width - Frame width
 * @param {number} height - Frame height
 * @param {Object} options - Encoding options
 * @returns {Uint8Array|Blob|string} GIF data
 */
export function createGIF(frames, width, height, options = {}) {
    const {
        delay = 100,
        repeat = 0,
        maxColors = 256,
        output = 'bytes' // 'bytes', 'blob', or 'dataurl'
    } = options;
    
    const encoder = new GIFEncoder();
    encoder.setSize(width, height);
    encoder.setDelay(delay);
    encoder.setRepeat(repeat);
    
    for (let i = 0; i < frames.length; i++) {
        const palette = quantize(frames[i], maxColors);
        const indexed = applyPalette(frames[i], palette);
        
        if (i === 0) {
            encoder.setGlobalPalette(palette);
        }
        
        encoder.addFrame(indexed, palette);
    }
    
    switch (output) {
        case 'blob':
            return encoder.getBlob();
        case 'dataurl':
            return encoder.getDataURL();
        default:
            return encoder.getBytes();
    }
}

/**
 * Big number arithmetic helpers
 */
export const BigArithmetic = {
    /**
     * Add multiple Big numbers
     */
    sum(...values) {
        return values.reduce((acc, val) => acc.plus(new Big(val)), new Big(0));
    },
    
    /**
     * Multiply multiple Big numbers
     */
    product(...values) {
        return values.reduce((acc, val) => acc.times(new Big(val)), new Big(1));
    },
    
    /**
     * Calculate average
     */
    average(...values) {
        if (values.length === 0) return new Big(0);
        return this.sum(...values).div(values.length);
    },
    
    /**
     * Find minimum
     */
    min(...values) {
        if (values.length === 0) return null;
        return values.reduce((min, val) => {
            const big = new Big(val);
            return big.lt(min) ? big : min;
        }, new Big(values[0]));
    },
    
    /**
     * Find maximum
     */
    max(...values) {
        if (values.length === 0) return null;
        return values.reduce((max, val) => {
            const big = new Big(val);
            return big.gt(max) ? big : max;
        }, new Big(values[0]));
    },
    
    /**
     * Clamp value between min and max
     */
    clamp(value, min, max) {
        const v = new Big(value);
        const lo = new Big(min);
        const hi = new Big(max);
        
        if (v.lt(lo)) return lo;
        if (v.gt(hi)) return hi;
        return v;
    },
    
    /**
     * Linear interpolation
     */
    lerp(a, b, t) {
        const bigA = new Big(a);
        const bigB = new Big(b);
        const bigT = new Big(t);
        
        return bigA.plus(bigB.minus(bigA).times(bigT));
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
    // Big.js
    Big,
    
    // GIF encoder
    GIFEncoder,
    quantize,
    applyPalette,
    encodeGIF,
    encodeImage,
    gifenc
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    MODULE_INFO,
    
    // Big.js
    Big,
    createBig,
    configureBig,
    BigArithmetic,
    
    // GIF encoder
    GIFEncoder,
    quantize,
    applyPalette,
    encodeGIF,
    encodeImage,
    createGIF,
    gifenc
};
