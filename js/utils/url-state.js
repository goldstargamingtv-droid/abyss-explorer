/**
 * ============================================================================
 * ABYSS EXPLORER - URL STATE UTILITIES
 * ============================================================================
 * 
 * URL hash encoding/decoding for shareable app state.
 * Compresses fractal parameters, camera position, palette, and settings
 * into a URL-safe string for easy sharing.
 * 
 * Features:
 * - Compact binary encoding for numbers
 * - LZ-string style compression
 * - Base64url encoding
 * - Backward compatibility versioning
 * - Graceful error handling
 * 
 * URL Format:
 * #v1/[base64url-encoded-compressed-state]
 * 
 * @module utils/url-state
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const VERSION = 1;
const HASH_PREFIX = '#v';

// Field IDs for compact encoding
const FIELD_IDS = {
    fractalType: 0,
    centerX: 1,
    centerY: 2,
    zoom: 3,
    maxIterations: 4,
    bailout: 5,
    power: 6,
    juliaReal: 7,
    juliaImag: 8,
    paletteId: 9,
    coloringMode: 10,
    rotation: 11,
    is3D: 12,
    cameraX: 13,
    cameraY: 14,
    cameraZ: 15,
    targetX: 16,
    targetY: 17,
    targetZ: 18
};

// Fractal type mapping
const FRACTAL_TYPES = {
    'mandelbrot': 0,
    'julia': 1,
    'burning-ship': 2,
    'tricorn': 3,
    'newton': 4,
    'phoenix': 5,
    'custom': 6,
    'mandelbulb': 10,
    'mandelbox': 11,
    'kleinian': 12,
    'menger': 13,
    'julia-quat': 14
};

const FRACTAL_NAMES = Object.fromEntries(
    Object.entries(FRACTAL_TYPES).map(([k, v]) => [v, k])
);

// ============================================================================
// LZ-STRING STYLE COMPRESSION
// ============================================================================

/**
 * Simple LZ-based compression for strings
 * Based on LZ-string algorithm (MIT License, by Pieroxy)
 */
const LZString = {
    keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
    
    /**
     * Compress string to URI-safe Base64
     */
    compressToBase64(input) {
        if (input == null) return '';
        
        const compressed = this._compress(input, 6, (a) => this.keyStr.charAt(a));
        
        switch (compressed.length % 4) {
            case 0: return compressed;
            case 1: return compressed + '===';
            case 2: return compressed + '==';
            case 3: return compressed + '=';
        }
        return compressed;
    },
    
    /**
     * Decompress from URI-safe Base64
     */
    decompressFromBase64(input) {
        if (input == null) return '';
        if (input === '') return null;
        
        input = input.replace(/[=]+$/, '');
        
        return this._decompress(input.length, 32, (index) => {
            return this._getBaseValue(this.keyStr, input.charAt(index));
        });
    },
    
    /**
     * Get base value for character
     */
    _getBaseValue(alphabet, char) {
        const index = alphabet.indexOf(char);
        return index === -1 ? -1 : index;
    },
    
    /**
     * Core compression
     */
    _compress(uncompressed, bitsPerChar, getCharFromInt) {
        if (uncompressed == null) return '';
        
        const context_dictionary = {};
        const context_dictionaryToCreate = {};
        let context_c = '';
        let context_wc = '';
        let context_w = '';
        let context_enlargeIn = 2;
        let context_dictSize = 3;
        let context_numBits = 2;
        let context_data = [];
        let context_data_val = 0;
        let context_data_position = 0;
        
        for (let ii = 0; ii < uncompressed.length; ii++) {
            context_c = uncompressed.charAt(ii);
            
            if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
                context_dictionary[context_c] = context_dictSize++;
                context_dictionaryToCreate[context_c] = true;
            }
            
            context_wc = context_w + context_c;
            
            if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
                context_w = context_wc;
            } else {
                if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                    if (context_w.charCodeAt(0) < 256) {
                        for (let i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1);
                            if (context_data_position === bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                        }
                        let value = context_w.charCodeAt(0);
                        for (let i = 0; i < 8; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position === bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    } else {
                        let value = 1;
                        for (let i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1) | value;
                            if (context_data_position === bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = 0;
                        }
                        value = context_w.charCodeAt(0);
                        for (let i = 0; i < 16; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position === bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn === 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    delete context_dictionaryToCreate[context_w];
                } else {
                    let value = context_dictionary[context_w];
                    for (let i = 0; i < context_numBits; i++) {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position === bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }
                }
                context_enlargeIn--;
                if (context_enlargeIn === 0) {
                    context_enlargeIn = Math.pow(2, context_numBits);
                    context_numBits++;
                }
                context_dictionary[context_wc] = context_dictSize++;
                context_w = String(context_c);
            }
        }
        
        if (context_w !== '') {
            if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                if (context_w.charCodeAt(0) < 256) {
                    for (let i = 0; i < context_numBits; i++) {
                        context_data_val = (context_data_val << 1);
                        if (context_data_position === bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                    }
                    let value = context_w.charCodeAt(0);
                    for (let i = 0; i < 8; i++) {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position === bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }
                } else {
                    let value = 1;
                    for (let i = 0; i < context_numBits; i++) {
                        context_data_val = (context_data_val << 1) | value;
                        if (context_data_position === bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = 0;
                    }
                    value = context_w.charCodeAt(0);
                    for (let i = 0; i < 16; i++) {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position === bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }
                }
                context_enlargeIn--;
                if (context_enlargeIn === 0) {
                    context_enlargeIn = Math.pow(2, context_numBits);
                    context_numBits++;
                }
                delete context_dictionaryToCreate[context_w];
            } else {
                let value = context_dictionary[context_w];
                for (let i = 0; i < context_numBits; i++) {
                    context_data_val = (context_data_val << 1) | (value & 1);
                    if (context_data_position === bitsPerChar - 1) {
                        context_data_position = 0;
                        context_data.push(getCharFromInt(context_data_val));
                        context_data_val = 0;
                    } else {
                        context_data_position++;
                    }
                    value = value >> 1;
                }
            }
            context_enlargeIn--;
            if (context_enlargeIn === 0) {
                context_numBits++;
            }
        }
        
        // Mark end of stream
        let value = 2;
        for (let i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position === bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
            } else {
                context_data_position++;
            }
            value = value >> 1;
        }
        
        while (true) {
            context_data_val = (context_data_val << 1);
            if (context_data_position === bitsPerChar - 1) {
                context_data.push(getCharFromInt(context_data_val));
                break;
            } else {
                context_data_position++;
            }
        }
        
        return context_data.join('');
    },
    
    /**
     * Core decompression
     */
    _decompress(length, resetValue, getNextValue) {
        const dictionary = [];
        let enlargeIn = 4;
        let dictSize = 4;
        let numBits = 3;
        let entry = '';
        let result = [];
        let w = '';
        let bits = 0;
        let resb = 0;
        let maxpower = 0;
        let power = 0;
        let c = '';
        let data = { val: getNextValue(0), position: resetValue, index: 1 };
        
        for (let i = 0; i < 3; i++) {
            dictionary[i] = i;
        }
        
        bits = 0;
        maxpower = Math.pow(2, 2);
        power = 1;
        
        while (power !== maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position === 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
        }
        
        const next = bits;
        switch (next) {
            case 0:
                bits = 0;
                maxpower = Math.pow(2, 8);
                power = 1;
                while (power !== maxpower) {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position === 0) {
                        data.position = resetValue;
                        data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                }
                c = String.fromCharCode(bits);
                break;
            case 1:
                bits = 0;
                maxpower = Math.pow(2, 16);
                power = 1;
                while (power !== maxpower) {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position === 0) {
                        data.position = resetValue;
                        data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                }
                c = String.fromCharCode(bits);
                break;
            case 2:
                return '';
        }
        
        dictionary[3] = c;
        w = c;
        result.push(c);
        
        while (true) {
            if (data.index > length) {
                return '';
            }
            
            bits = 0;
            maxpower = Math.pow(2, numBits);
            power = 1;
            
            while (power !== maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position === 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
            }
            
            let c = bits;
            switch (c) {
                case 0:
                    bits = 0;
                    maxpower = Math.pow(2, 8);
                    power = 1;
                    while (power !== maxpower) {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position === 0) {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    dictionary[dictSize++] = String.fromCharCode(bits);
                    c = dictSize - 1;
                    enlargeIn--;
                    break;
                case 1:
                    bits = 0;
                    maxpower = Math.pow(2, 16);
                    power = 1;
                    while (power !== maxpower) {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position === 0) {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    dictionary[dictSize++] = String.fromCharCode(bits);
                    c = dictSize - 1;
                    enlargeIn--;
                    break;
                case 2:
                    return result.join('');
            }
            
            if (enlargeIn === 0) {
                enlargeIn = Math.pow(2, numBits);
                numBits++;
            }
            
            if (dictionary[c]) {
                entry = dictionary[c];
            } else {
                if (c === dictSize) {
                    entry = w + w.charAt(0);
                } else {
                    return null;
                }
            }
            result.push(entry);
            
            dictionary[dictSize++] = w + entry.charAt(0);
            enlargeIn--;
            
            if (enlargeIn === 0) {
                enlargeIn = Math.pow(2, numBits);
                numBits++;
            }
            
            w = entry;
        }
    }
};

// ============================================================================
// STATE ENCODER/DECODER
// ============================================================================

/**
 * Encode state object to compact string
 * @param {Object} state - Application state
 * @returns {string} Encoded state
 */
export function encodeState(state) {
    // Build compact representation
    const compact = {};
    
    // Fractal type
    if (state.fractalType) {
        compact.t = FRACTAL_TYPES[state.fractalType] ?? state.fractalType;
    }
    
    // Center coordinates (use scientific notation for precision)
    if (state.centerX !== undefined) {
        compact.x = encodeNumber(state.centerX);
    }
    if (state.centerY !== undefined) {
        compact.y = encodeNumber(state.centerY);
    }
    
    // Zoom (logarithmic encoding for large values)
    if (state.zoom !== undefined) {
        compact.z = encodeNumber(state.zoom);
    }
    
    // Iterations
    if (state.maxIterations !== undefined) {
        compact.i = state.maxIterations;
    }
    
    // Bailout
    if (state.bailout !== undefined && state.bailout !== 4) {
        compact.b = state.bailout;
    }
    
    // Power
    if (state.power !== undefined && state.power !== 2) {
        compact.p = state.power;
    }
    
    // Julia constant
    if (state.juliaC) {
        compact.jr = encodeNumber(state.juliaC[0]);
        compact.ji = encodeNumber(state.juliaC[1]);
    }
    
    // Palette
    if (state.paletteId) {
        compact.pl = state.paletteId;
    }
    
    // Coloring mode
    if (state.coloringMode) {
        compact.cm = state.coloringMode;
    }
    
    // Rotation
    if (state.rotation && state.rotation !== 0) {
        compact.r = state.rotation;
    }
    
    // 3D mode
    if (state.is3D) {
        compact['3d'] = 1;
        
        if (state.cameraPosition) {
            compact.cx = encodeNumber(state.cameraPosition[0]);
            compact.cy = encodeNumber(state.cameraPosition[1]);
            compact.cz = encodeNumber(state.cameraPosition[2]);
        }
        
        if (state.cameraTarget) {
            compact.tx = encodeNumber(state.cameraTarget[0]);
            compact.ty = encodeNumber(state.cameraTarget[1]);
            compact.tz = encodeNumber(state.cameraTarget[2]);
        }
    }
    
    // Serialize to JSON
    const json = JSON.stringify(compact);
    
    // Compress
    const compressed = LZString.compressToBase64(json);
    
    return `${HASH_PREFIX}${VERSION}/${compressed}`;
}

/**
 * Decode state from URL hash
 * @param {string} hash - URL hash string
 * @returns {Object|null} Decoded state or null if invalid
 */
export function decodeState(hash) {
    try {
        // Remove leading #
        if (hash.startsWith('#')) {
            hash = hash.slice(1);
        }
        
        // Check version prefix
        if (!hash.startsWith('v')) {
            return decodeStateLegacy(hash);
        }
        
        // Parse version
        const slashIndex = hash.indexOf('/');
        if (slashIndex === -1) return null;
        
        const version = parseInt(hash.slice(1, slashIndex), 10);
        const data = hash.slice(slashIndex + 1);
        
        // Decompress
        const json = LZString.decompressFromBase64(data);
        if (!json) return null;
        
        // Parse JSON
        const compact = JSON.parse(json);
        
        // Expand to full state
        const state = {};
        
        // Fractal type
        if (compact.t !== undefined) {
            state.fractalType = FRACTAL_NAMES[compact.t] ?? compact.t;
        }
        
        // Center
        if (compact.x !== undefined) {
            state.centerX = decodeNumber(compact.x);
        }
        if (compact.y !== undefined) {
            state.centerY = decodeNumber(compact.y);
        }
        
        // Zoom
        if (compact.z !== undefined) {
            state.zoom = decodeNumber(compact.z);
        }
        
        // Iterations
        if (compact.i !== undefined) {
            state.maxIterations = compact.i;
        }
        
        // Bailout
        if (compact.b !== undefined) {
            state.bailout = compact.b;
        }
        
        // Power
        if (compact.p !== undefined) {
            state.power = compact.p;
        }
        
        // Julia constant
        if (compact.jr !== undefined && compact.ji !== undefined) {
            state.juliaC = [decodeNumber(compact.jr), decodeNumber(compact.ji)];
        }
        
        // Palette
        if (compact.pl !== undefined) {
            state.paletteId = compact.pl;
        }
        
        // Coloring mode
        if (compact.cm !== undefined) {
            state.coloringMode = compact.cm;
        }
        
        // Rotation
        if (compact.r !== undefined) {
            state.rotation = compact.r;
        }
        
        // 3D mode
        if (compact['3d']) {
            state.is3D = true;
            
            if (compact.cx !== undefined) {
                state.cameraPosition = [
                    decodeNumber(compact.cx),
                    decodeNumber(compact.cy),
                    decodeNumber(compact.cz)
                ];
            }
            
            if (compact.tx !== undefined) {
                state.cameraTarget = [
                    decodeNumber(compact.tx),
                    decodeNumber(compact.ty),
                    decodeNumber(compact.tz)
                ];
            }
        }
        
        return state;
        
    } catch (e) {
        console.warn('Failed to decode state:', e);
        return null;
    }
}

/**
 * Encode number to compact string
 */
function encodeNumber(num) {
    if (typeof num === 'string') {
        // Already a string (for arbitrary precision)
        return num;
    }
    
    // Use scientific notation for very large/small numbers
    if (Math.abs(num) > 1e10 || (Math.abs(num) < 1e-10 && num !== 0)) {
        return num.toExponential(15);
    }
    
    // Use fixed notation otherwise
    return num;
}

/**
 * Decode number from string
 */
function decodeNumber(val) {
    if (typeof val === 'number') return val;
    return parseFloat(val);
}

/**
 * Decode legacy format (pre-compression)
 */
function decodeStateLegacy(hash) {
    try {
        // Try simple key=value format
        const params = new URLSearchParams(hash);
        const state = {};
        
        if (params.has('x')) state.centerX = parseFloat(params.get('x'));
        if (params.has('y')) state.centerY = parseFloat(params.get('y'));
        if (params.has('z')) state.zoom = parseFloat(params.get('z'));
        if (params.has('i')) state.maxIterations = parseInt(params.get('i'), 10);
        if (params.has('t')) state.fractalType = params.get('t');
        
        return Object.keys(state).length > 0 ? state : null;
        
    } catch (e) {
        return null;
    }
}

// ============================================================================
// URL MANAGEMENT
// ============================================================================

/**
 * Update URL hash with current state
 * @param {Object} state - State to encode
 * @param {boolean} replaceState - Use replaceState instead of pushState
 */
export function updateURLHash(state, replaceState = true) {
    const hash = encodeState(state);
    
    if (replaceState) {
        history.replaceState(null, '', hash);
    } else {
        history.pushState(null, '', hash);
    }
}

/**
 * Get state from current URL hash
 * @returns {Object|null}
 */
export function getStateFromURL() {
    const hash = window.location.hash;
    if (!hash || hash === '#') return null;
    
    return decodeState(hash);
}

/**
 * Generate shareable URL for state
 * @param {Object} state - State to encode
 * @returns {string} Full URL
 */
export function generateShareURL(state) {
    const hash = encodeState(state);
    return `${window.location.origin}${window.location.pathname}${hash}`;
}

/**
 * Copy share URL to clipboard
 * @param {Object} state - State to share
 * @returns {Promise<boolean>} Success
 */
export async function copyShareURL(state) {
    const url = generateShareURL(state);
    
    try {
        await navigator.clipboard.writeText(url);
        return true;
    } catch (e) {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
    }
}

/**
 * Listen for URL hash changes
 * @param {Function} callback - Called with decoded state
 * @returns {Function} Cleanup function
 */
export function onHashChange(callback) {
    const handler = () => {
        const state = getStateFromURL();
        if (state) {
            callback(state);
        }
    };
    
    window.addEventListener('hashchange', handler);
    
    return () => window.removeEventListener('hashchange', handler);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { LZString };

export default {
    encodeState,
    decodeState,
    updateURLHash,
    getStateFromURL,
    generateShareURL,
    copyShareURL,
    onHashChange,
    LZString
};
