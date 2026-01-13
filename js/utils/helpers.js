/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                      ABYSS EXPLORER - HELPERS                                 ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Common utility helper functions                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════
// NUMBER UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number}
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number}
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Map a value from one range to another
 * @param {number} value - Value to map
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number}
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
    return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
}

/**
 * Round to a specific number of decimal places
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number}
 */
export function roundTo(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * Format a number with SI prefix (K, M, B, etc.)
 * @param {number} value - Value to format
 * @param {number} [decimals=1] - Decimal places
 * @returns {string}
 */
export function formatSI(value, decimals = 1) {
    const prefixes = ['', 'K', 'M', 'B', 'T'];
    let prefixIndex = 0;
    
    while (Math.abs(value) >= 1000 && prefixIndex < prefixes.length - 1) {
        value /= 1000;
        prefixIndex++;
    }
    
    return roundTo(value, decimals) + prefixes[prefixIndex];
}

/**
 * Format a zoom level as human readable
 * @param {number} zoom - Zoom factor
 * @returns {string}
 */
export function formatZoom(zoom) {
    const exp = Math.log10(zoom);
    if (exp >= 3) {
        return `10^${roundTo(exp, 1)}`;
    }
    return `${roundTo(zoom, 2)}x`;
}

// ═══════════════════════════════════════════════════════════════════════════
// STRING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a unique ID
 * @param {string} [prefix=''] - Optional prefix
 * @returns {string}
 */
export function uniqueId(prefix = '') {
    return prefix + Math.random().toString(36).substr(2, 9);
}

/**
 * Truncate a string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string}
 */
export function truncate(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substr(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string}
 */
export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert kebab-case to Title Case
 * @param {string} str - kebab-case string
 * @returns {string}
 */
export function kebabToTitle(str) {
    return str.split('-').map(capitalize).join(' ');
}

// ═══════════════════════════════════════════════════════════════════════════
// OBJECT UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object}
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    
    const clone = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            clone[key] = deepClone(obj[key]);
        }
    }
    return clone;
}

/**
 * Deep merge objects
 * @param {Object} target - Target object
 * @param {...Object} sources - Source objects
 * @returns {Object}
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
 * Check if value is a plain object
 * @param {*} item - Value to check
 * @returns {boolean}
 */
export function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Pick specific keys from an object
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to pick
 * @returns {Object}
 */
export function pick(obj, keys) {
    return keys.reduce((result, key) => {
        if (key in obj) {
            result[key] = obj[key];
        }
        return result;
    }, {});
}

/**
 * Omit specific keys from an object
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to omit
 * @returns {Object}
 */
export function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCTION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Debounce a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function}
 */
export function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Throttle a function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function}
 */
export function throttle(fn, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Memoize a function
 * @param {Function} fn - Function to memoize
 * @returns {Function}
 */
export function memoize(fn) {
    const cache = new Map();
    return function(...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// DOM UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Query selector shorthand
 * @param {string} selector - CSS selector
 * @param {Element} [parent=document] - Parent element
 * @returns {Element|null}
 */
export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Query selector all shorthand
 * @param {string} selector - CSS selector
 * @param {Element} [parent=document] - Parent element
 * @returns {NodeList}
 */
export function $$(selector, parent = document) {
    return parent.querySelectorAll(selector);
}

/**
 * Create an element with attributes
 * @param {string} tag - Tag name
 * @param {Object} [attrs={}] - Attributes
 * @param {string|Element[]} [children] - Children
 * @returns {Element}
 */
export function createElement(tag, attrs = {}, children = null) {
    const el = document.createElement(tag);
    
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'class') {
            el.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key === 'data' && typeof value === 'object') {
            for (const [dataKey, dataValue] of Object.entries(value)) {
                el.dataset[dataKey] = dataValue;
            }
        } else {
            el.setAttribute(key, value);
        }
    }
    
    if (children) {
        if (typeof children === 'string') {
            el.textContent = children;
        } else if (Array.isArray(children)) {
            children.forEach(child => el.appendChild(child));
        }
    }
    
    return el;
}

/**
 * Add event listener with automatic cleanup
 * @param {Element} element - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} [options] - Event options
 * @returns {Function} Cleanup function
 */
export function addEvent(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    return () => element.removeEventListener(event, handler, options);
}

// ═══════════════════════════════════════════════════════════════════════════
// ASYNC UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for next animation frame
 * @returns {Promise<number>}
 */
export function nextFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
}

/**
 * Wait for element to exist in DOM
 * @param {string} selector - CSS selector
 * @param {number} [timeout=5000] - Timeout in ms
 * @returns {Promise<Element>}
 */
export function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }
        
        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// COORDINATE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert screen coordinates to canvas coordinates
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} screenX - Screen X
 * @param {number} screenY - Screen Y
 * @returns {{x: number, y: number}}
 */
export function screenToCanvas(canvas, screenX, screenY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (screenX - rect.left) * (canvas.width / rect.width),
        y: (screenY - rect.top) * (canvas.height / rect.height)
    };
}

/**
 * Convert canvas coordinates to fractal coordinates
 * @param {number} canvasX - Canvas X
 * @param {number} canvasY - Canvas Y
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} centerX - Fractal center X
 * @param {number} centerY - Fractal center Y
 * @param {number} zoom - Current zoom level
 * @returns {{re: number, im: number}}
 */
export function canvasToFractal(canvasX, canvasY, canvasWidth, canvasHeight, centerX, centerY, zoom) {
    const scale = 4 / zoom;
    const aspectRatio = canvasWidth / canvasHeight;
    
    return {
        re: centerX + (canvasX / canvasWidth - 0.5) * scale * aspectRatio,
        im: centerY + (canvasY / canvasHeight - 0.5) * scale
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════

export default {
    // Numbers
    clamp,
    lerp,
    mapRange,
    roundTo,
    formatSI,
    formatZoom,
    
    // Strings
    uniqueId,
    truncate,
    capitalize,
    kebabToTitle,
    
    // Objects
    deepClone,
    deepMerge,
    isObject,
    pick,
    omit,
    
    // Functions
    debounce,
    throttle,
    memoize,
    
    // DOM
    $,
    $$,
    createElement,
    addEvent,
    
    // Async
    sleep,
    nextFrame,
    waitForElement,
    
    // Coordinates
    screenToCanvas,
    canvasToFractal
};
