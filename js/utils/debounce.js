/**
 * ============================================================================
 * ABYSS EXPLORER - DEBOUNCE UTILITIES
 * ============================================================================
 * 
 * Optimized debounce and throttle implementations for high-frequency events.
 * These are critical for performance when handling resize, mousemove, scroll,
 * and other events that can fire dozens of times per second.
 * 
 * Features:
 * - Leading/trailing edge control
 * - Maximum wait option
 * - Cancel and flush methods
 * - RAF-based throttling
 * - Memory-efficient implementation
 * 
 * @module utils/debounce
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// DEBOUNCE
// ============================================================================

/**
 * Creates a debounced function that delays invoking func until after wait
 * milliseconds have elapsed since the last time the debounced function was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Invoke on leading edge (default: false)
 * @param {boolean} options.trailing - Invoke on trailing edge (default: true)
 * @param {number} options.maxWait - Maximum time to wait before forced invoke
 * @returns {Function} The debounced function
 * 
 * @example
 * // Basic usage
 * const debouncedSave = debounce(save, 300);
 * 
 * // With options
 * const debouncedSearch = debounce(search, 300, { leading: true });
 * 
 * // Cancel pending invocation
 * debouncedSave.cancel();
 * 
 * // Flush pending invocation immediately
 * debouncedSave.flush();
 */
export function debounce(func, wait, options = {}) {
    const {
        leading = false,
        trailing = true,
        maxWait
    } = options;
    
    let timeoutId = null;
    let lastArgs = null;
    let lastThis = null;
    let lastCallTime = 0;
    let lastInvokeTime = 0;
    let result;
    
    // Use maxWait if specified
    const maxing = maxWait !== undefined;
    const maxWaitMs = maxing ? Math.max(maxWait, wait) : 0;
    
    /**
     * Invoke the function with stored arguments
     */
    function invokeFunc(time) {
        const args = lastArgs;
        const thisArg = lastThis;
        
        lastArgs = lastThis = null;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
    }
    
    /**
     * Check if we should invoke on the leading edge
     */
    function leadingEdge(time) {
        lastInvokeTime = time;
        
        // Start timer for trailing edge
        timeoutId = setTimeout(timerExpired, wait);
        
        // Invoke on leading edge
        return leading ? invokeFunc(time) : result;
    }
    
    /**
     * Calculate remaining wait time
     */
    function remainingWait(time) {
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;
        const timeWaiting = wait - timeSinceLastCall;
        
        return maxing
            ? Math.min(timeWaiting, maxWaitMs - timeSinceLastInvoke)
            : timeWaiting;
    }
    
    /**
     * Check if we should invoke now
     */
    function shouldInvoke(time) {
        const timeSinceLastCall = time - lastCallTime;
        const timeSinceLastInvoke = time - lastInvokeTime;
        
        // Either this is the first call, activity has stopped and we're at the
        // trailing edge, the system time has gone backwards and we're treating
        // it as the trailing edge, or we've hit the `maxWait` limit.
        return (
            lastCallTime === 0 ||
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0 ||
            (maxing && timeSinceLastInvoke >= maxWaitMs)
        );
    }
    
    /**
     * Handle timer expiration
     */
    function timerExpired() {
        const time = Date.now();
        
        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }
        
        // Restart timer
        timeoutId = setTimeout(timerExpired, remainingWait(time));
    }
    
    /**
     * Invoke on trailing edge
     */
    function trailingEdge(time) {
        timeoutId = null;
        
        // Only invoke if we have lastArgs (func has been called)
        if (trailing && lastArgs) {
            return invokeFunc(time);
        }
        
        lastArgs = lastThis = null;
        return result;
    }
    
    /**
     * Cancel pending invocation
     */
    function cancel() {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        lastCallTime = 0;
        lastInvokeTime = 0;
        lastArgs = lastThis = timeoutId = null;
    }
    
    /**
     * Immediately invoke pending function
     */
    function flush() {
        if (timeoutId === null) {
            return result;
        }
        return trailingEdge(Date.now());
    }
    
    /**
     * Check if there's a pending invocation
     */
    function pending() {
        return timeoutId !== null;
    }
    
    /**
     * The debounced function
     */
    function debounced(...args) {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);
        
        lastArgs = args;
        lastThis = this;
        lastCallTime = time;
        
        if (isInvoking) {
            if (timeoutId === null) {
                return leadingEdge(time);
            }
            
            if (maxing) {
                // Handle invocations in a tight loop
                timeoutId = setTimeout(timerExpired, wait);
                return invokeFunc(time);
            }
        }
        
        if (timeoutId === null) {
            timeoutId = setTimeout(timerExpired, wait);
        }
        
        return result;
    }
    
    // Attach control methods
    debounced.cancel = cancel;
    debounced.flush = flush;
    debounced.pending = pending;
    
    return debounced;
}

// ============================================================================
// THROTTLE
// ============================================================================

/**
 * Creates a throttled function that only invokes func at most once per every
 * wait milliseconds.
 * 
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Invoke on leading edge (default: true)
 * @param {boolean} options.trailing - Invoke on trailing edge (default: true)
 * @returns {Function} The throttled function
 * 
 * @example
 * // Basic usage
 * const throttledScroll = throttle(onScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 * 
 * // Leading edge only
 * const throttledClick = throttle(onClick, 500, { trailing: false });
 */
export function throttle(func, wait, options = {}) {
    const {
        leading = true,
        trailing = true
    } = options;
    
    return debounce(func, wait, {
        leading,
        trailing,
        maxWait: wait
    });
}

// ============================================================================
// RAF THROTTLE
// ============================================================================

/**
 * Creates a function that is throttled to run at most once per animation frame.
 * Useful for expensive operations that should sync with display refresh.
 * 
 * @param {Function} func - The function to throttle
 * @returns {Function} The RAF-throttled function
 * 
 * @example
 * const updatePosition = rafThrottle((x, y) => {
 *     element.style.transform = `translate(${x}px, ${y}px)`;
 * });
 * 
 * document.addEventListener('mousemove', (e) => {
 *     updatePosition(e.clientX, e.clientY);
 * });
 */
export function rafThrottle(func) {
    let rafId = null;
    let lastArgs = null;
    let lastThis = null;
    
    function invoke() {
        rafId = null;
        func.apply(lastThis, lastArgs);
        lastArgs = lastThis = null;
    }
    
    function throttled(...args) {
        lastArgs = args;
        lastThis = this;
        
        if (rafId === null) {
            rafId = requestAnimationFrame(invoke);
        }
    }
    
    throttled.cancel = function() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        lastArgs = lastThis = null;
    };
    
    throttled.pending = function() {
        return rafId !== null;
    };
    
    return throttled;
}

// ============================================================================
// LEADING DEBOUNCE
// ============================================================================

/**
 * Creates a debounced function that invokes immediately on the first call,
 * then ignores subsequent calls until wait milliseconds have passed.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The wait time in milliseconds
 * @returns {Function} The debounced function
 * 
 * @example
 * const submitOnce = leadingDebounce(submitForm, 1000);
 */
export function leadingDebounce(func, wait) {
    return debounce(func, wait, { leading: true, trailing: false });
}

// ============================================================================
// TRAILING DEBOUNCE
// ============================================================================

/**
 * Creates a debounced function that only invokes after wait milliseconds
 * have elapsed since the last call.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The wait time in milliseconds
 * @returns {Function} The debounced function
 * 
 * @example
 * const saveAfterTyping = trailingDebounce(save, 500);
 */
export function trailingDebounce(func, wait) {
    return debounce(func, wait, { leading: false, trailing: true });
}

// ============================================================================
// IMMEDIATE DEBOUNCE
// ============================================================================

/**
 * Simple immediate debounce - invokes immediately, then blocks for wait ms.
 * Simpler and slightly faster than full debounce when you don't need options.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The wait time in milliseconds
 * @returns {Function} The debounced function
 */
export function immediateDebounce(func, wait) {
    let timeoutId = null;
    
    return function(...args) {
        if (timeoutId === null) {
            func.apply(this, args);
        }
        
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            timeoutId = null;
        }, wait);
    };
}

// ============================================================================
// WINDOWED THROTTLE
// ============================================================================

/**
 * Creates a function that executes at most N times within a time window.
 * 
 * @param {Function} func - The function to throttle
 * @param {number} limit - Maximum number of calls per window
 * @param {number} window - Time window in milliseconds
 * @returns {Function} The throttled function
 * 
 * @example
 * // Allow at most 5 API calls per second
 * const rateLimitedFetch = windowedThrottle(fetch, 5, 1000);
 */
export function windowedThrottle(func, limit, window) {
    const calls = [];
    
    return function(...args) {
        const now = Date.now();
        
        // Remove calls outside the window
        while (calls.length > 0 && calls[0] <= now - window) {
            calls.shift();
        }
        
        // Check if we can make another call
        if (calls.length < limit) {
            calls.push(now);
            return func.apply(this, args);
        }
        
        // Optionally return a rejected promise or undefined
        return undefined;
    };
}

// ============================================================================
// DEBOUNCE PROMISE
// ============================================================================

/**
 * Creates a debounced async function that returns a promise.
 * All calls during the debounce period receive the same promise.
 * 
 * @param {Function} func - The async function to debounce
 * @param {number} wait - The wait time in milliseconds
 * @returns {Function} The debounced function
 * 
 * @example
 * const debouncedSearch = debouncePromise(async (query) => {
 *     const results = await api.search(query);
 *     return results;
 * }, 300);
 * 
 * // Multiple rapid calls all get the same result
 * const results = await debouncedSearch('test');
 */
export function debouncePromise(func, wait) {
    let timeoutId = null;
    let pendingPromise = null;
    let resolvers = [];
    
    return function(...args) {
        return new Promise((resolve, reject) => {
            // Add resolver to list
            resolvers.push({ resolve, reject });
            
            // Clear existing timeout
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
            
            // Set new timeout
            timeoutId = setTimeout(async () => {
                timeoutId = null;
                const currentResolvers = resolvers;
                resolvers = [];
                
                try {
                    const result = await func.apply(this, args);
                    currentResolvers.forEach(r => r.resolve(result));
                } catch (error) {
                    currentResolvers.forEach(r => r.reject(error));
                }
            }, wait);
        });
    };
}

// ============================================================================
// BATCH
// ============================================================================

/**
 * Creates a function that batches multiple calls and invokes the callback
 * once with all arguments collected during the wait period.
 * 
 * @param {Function} func - The function to call with batched arguments
 * @param {number} wait - The wait time in milliseconds
 * @returns {Function} The batching function
 * 
 * @example
 * const batchedLog = batch((items) => {
 *     console.log('Received items:', items);
 * }, 100);
 * 
 * batchedLog('a'); // Queued
 * batchedLog('b'); // Queued
 * batchedLog('c'); // Queued
 * // After 100ms: "Received items: ['a', 'b', 'c']"
 */
export function batch(func, wait) {
    let timeoutId = null;
    let batchedArgs = [];
    
    function flush() {
        if (batchedArgs.length > 0) {
            const args = batchedArgs;
            batchedArgs = [];
            func(args);
        }
    }
    
    function batched(arg) {
        batchedArgs.push(arg);
        
        if (timeoutId === null) {
            timeoutId = setTimeout(() => {
                timeoutId = null;
                flush();
            }, wait);
        }
    }
    
    batched.flush = function() {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        flush();
    };
    
    batched.cancel = function() {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        batchedArgs = [];
    };
    
    return batched;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
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
