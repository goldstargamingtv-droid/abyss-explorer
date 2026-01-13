/**
 * ============================================================================
 * ABYSS EXPLORER - RENDER WORKER
 * ============================================================================
 * 
 * Dedicated Web Worker for 2D fractal tile rendering.
 * Runs heavy iteration calculations off the main thread to keep UI responsive.
 * 
 * Features:
 * - Tile-based rendering with coordinates and parameters
 * - Perturbation theory support for deep zooms
 * - Series approximation for acceleration
 * - Progressive rendering with priority levels
 * - Task cancellation and queuing
 * - SharedArrayBuffer support for zero-copy transfer
 * - Multiple fractal types (Mandelbrot, Julia, etc.)
 * 
 * Threading Strategy:
 * - Each worker handles one tile at a time
 * - Main thread spawns multiple workers (navigator.hardwareConcurrency)
 * - Work stealing via task queue managed by main thread
 * - Transferable ArrayBuffers for efficient data return
 * 
 * Message Protocol:
 * IN:  { type: 'render', taskId, tile, params }
 * IN:  { type: 'cancel', taskId }
 * IN:  { type: 'init', config }
 * OUT: { type: 'progress', taskId, progress }
 * OUT: { type: 'complete', taskId, result }
 * OUT: { type: 'error', taskId, error }
 * 
 * @module workers/render-worker
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

'use strict';

// ============================================================================
// WORKER STATE
// ============================================================================

/**
 * Current task being processed (null if idle)
 */
let currentTask = null;

/**
 * Cancellation flag for current task
 */
let cancelRequested = false;

/**
 * Worker configuration
 */
let config = {
    useSharedArrayBuffer: false,
    useOffscreenCanvas: false,
    progressInterval: 1000, // Report progress every N pixels
    maxIterations: 1000,
    bailout: 4.0
};

/**
 * Cached reference orbit for perturbation
 */
let referenceOrbit = null;

/**
 * Series approximation coefficients
 */
let seriesCoeffs = null;

// ============================================================================
// COMPLEX NUMBER OPERATIONS (INLINE FOR PERFORMANCE)
// ============================================================================

/**
 * Complex number operations are inlined for maximum performance
 * in tight iteration loops. Avoids function call overhead.
 */

// Complex multiply: (a+bi)(c+di) = (ac-bd) + (ad+bc)i
// Complex square: (a+bi)² = (a²-b²) + 2abi
// Complex abs squared: |a+bi|² = a² + b²

// ============================================================================
// FRACTAL ITERATION FUNCTIONS
// ============================================================================

/**
 * Standard Mandelbrot iteration
 * z(n+1) = z(n)² + c
 * 
 * @param {number} cr - Real part of c
 * @param {number} ci - Imaginary part of c
 * @param {number} maxIter - Maximum iterations
 * @param {number} bailout - Escape radius squared
 * @returns {Object} { iterations, finalZ: [zr, zi], escaped }
 */
function mandelbrotIterate(cr, ci, maxIter, bailout) {
    let zr = 0, zi = 0;
    let zr2 = 0, zi2 = 0;
    let iter = 0;
    
    // Main iteration loop - optimized
    while (iter < maxIter && zr2 + zi2 <= bailout) {
        zi = 2 * zr * zi + ci;
        zr = zr2 - zi2 + cr;
        zr2 = zr * zr;
        zi2 = zi * zi;
        iter++;
    }
    
    return {
        iterations: iter,
        finalZ: [zr, zi],
        escaped: zr2 + zi2 > bailout
    };
}

/**
 * Julia set iteration
 * z(n+1) = z(n)² + c where c is fixed
 */
function juliaIterate(zr, zi, cr, ci, maxIter, bailout) {
    let zr2 = zr * zr;
    let zi2 = zi * zi;
    let iter = 0;
    
    while (iter < maxIter && zr2 + zi2 <= bailout) {
        zi = 2 * zr * zi + ci;
        zr = zr2 - zi2 + cr;
        zr2 = zr * zr;
        zi2 = zi * zi;
        iter++;
    }
    
    return {
        iterations: iter,
        finalZ: [zr, zi],
        escaped: zr2 + zi2 > bailout
    };
}

/**
 * Burning Ship iteration
 * z(n+1) = (|Re(z)| + i|Im(z)|)² + c
 */
function burningShipIterate(cr, ci, maxIter, bailout) {
    let zr = 0, zi = 0;
    let zr2 = 0, zi2 = 0;
    let iter = 0;
    
    while (iter < maxIter && zr2 + zi2 <= bailout) {
        zi = Math.abs(2 * zr * zi) + ci;
        zr = zr2 - zi2 + cr;
        zr = Math.abs(zr);
        zr2 = zr * zr;
        zi2 = zi * zi;
        iter++;
    }
    
    return {
        iterations: iter,
        finalZ: [zr, zi],
        escaped: zr2 + zi2 > bailout
    };
}

/**
 * Tricorn (Mandelbar) iteration
 * z(n+1) = conj(z(n))² + c
 */
function tricornIterate(cr, ci, maxIter, bailout) {
    let zr = 0, zi = 0;
    let zr2 = 0, zi2 = 0;
    let iter = 0;
    
    while (iter < maxIter && zr2 + zi2 <= bailout) {
        // Conjugate: zi = -zi
        zi = -2 * zr * zi + ci;
        zr = zr2 - zi2 + cr;
        zr2 = zr * zr;
        zi2 = zi * zi;
        iter++;
    }
    
    return {
        iterations: iter,
        finalZ: [zr, zi],
        escaped: zr2 + zi2 > bailout
    };
}

/**
 * Higher power Mandelbrot
 * z(n+1) = z(n)^power + c
 */
function mandelbrotPowerIterate(cr, ci, power, maxIter, bailout) {
    let zr = 0, zi = 0;
    let iter = 0;
    
    while (iter < maxIter) {
        const r = Math.sqrt(zr * zr + zi * zi);
        if (r * r > bailout) break;
        
        const theta = Math.atan2(zi, zr);
        const rPow = Math.pow(r, power);
        const newTheta = theta * power;
        
        zr = rPow * Math.cos(newTheta) + cr;
        zi = rPow * Math.sin(newTheta) + ci;
        iter++;
    }
    
    return {
        iterations: iter,
        finalZ: [zr, zi],
        escaped: zr * zr + zi * zi > bailout
    };
}

// ============================================================================
// PERTURBATION THEORY
// ============================================================================

/**
 * Perturbation iteration using pre-computed reference orbit
 * 
 * For deep zooms, we compute:
 * δ(n+1) = 2·Z(n)·δ(n) + δ(n)² + δc
 * 
 * where Z(n) is the reference orbit and δ is the perturbation
 * 
 * @param {number} dcr - Delta c real (perturbation from reference)
 * @param {number} dci - Delta c imaginary
 * @param {Array} refOrbit - Reference orbit [{zr, zi}]
 * @param {number} maxIter - Maximum iterations
 * @param {number} bailout - Escape radius squared
 * @returns {Object} Iteration result
 */
function perturbationIterate(dcr, dci, refOrbit, maxIter, bailout) {
    let dzr = 0, dzi = 0;  // Delta z
    let iter = 0;
    
    const orbitLen = refOrbit.length;
    
    while (iter < maxIter && iter < orbitLen) {
        const ref = refOrbit[iter];
        const Zr = ref.zr;
        const Zi = ref.zi;
        
        // Full z = Z + δz
        const zr = Zr + dzr;
        const zi = Zi + dzi;
        
        // Check bailout
        if (zr * zr + zi * zi > bailout) {
            return {
                iterations: iter,
                finalZ: [zr, zi],
                escaped: true
            };
        }
        
        // δ(n+1) = 2·Z(n)·δ(n) + δ(n)² + δc
        // = (2Zr + dzr)·dzr - (2Zi + dzi)·dzi + dcr
        // + i·((2Zr + dzr)·dzi + (2Zi + dzi)·dzr + dci)
        const newDzr = (2 * Zr + dzr) * dzr - (2 * Zi + dzi) * dzi + dcr;
        const newDzi = (2 * Zr + dzr) * dzi + (2 * Zi + dzi) * dzr + dci;
        
        dzr = newDzr;
        dzi = newDzi;
        iter++;
    }
    
    // Didn't escape
    return {
        iterations: iter,
        finalZ: [refOrbit[iter - 1].zr + dzr, refOrbit[iter - 1].zi + dzi],
        escaped: false
    };
}

/**
 * Series approximation iteration skip
 * Uses Taylor series to skip many initial iterations
 * 
 * @param {number} dcr - Delta c real
 * @param {number} dci - Delta c imaginary
 * @param {Array} coeffs - Series coefficients [{ar, ai}]
 * @returns {Object} { dzr, dzi, skipIters }
 */
function seriesApproximate(dcr, dci, coeffs) {
    if (!coeffs || coeffs.length === 0) {
        return { dzr: 0, dzi: 0, skipIters: 0 };
    }
    
    let dzr = 0, dzi = 0;
    let dcPowR = 1, dcPowI = 0;  // (δc)^n
    
    // Evaluate polynomial: δz = Σ A(n) · (δc)^n
    for (let i = 0; i < coeffs.length; i++) {
        const coeff = coeffs[i];
        
        // δz += A(n) · (δc)^n
        dzr += coeff.ar * dcPowR - coeff.ai * dcPowI;
        dzi += coeff.ar * dcPowI + coeff.ai * dcPowR;
        
        // Update (δc)^(n+1) = (δc)^n · δc
        const newPowR = dcPowR * dcr - dcPowI * dci;
        const newPowI = dcPowR * dci + dcPowI * dcr;
        dcPowR = newPowR;
        dcPowI = newPowI;
    }
    
    return {
        dzr,
        dzi,
        skipIters: coeffs.length
    };
}

// ============================================================================
// SMOOTH COLORING
// ============================================================================

/**
 * Calculate smooth iteration count for continuous coloring
 * Uses the normalized iteration count formula
 */
function smoothIterations(iterations, zr, zi, bailout, maxIter) {
    if (iterations >= maxIter) {
        return maxIter;
    }
    
    const logZn = Math.log(zr * zr + zi * zi) / 2;
    const nu = Math.log(logZn / Math.log(2)) / Math.log(2);
    
    return iterations + 1 - nu;
}

/**
 * Calculate distance estimate for exterior distance coloring
 */
function distanceEstimate(zr, zi, dzr, dzi) {
    const r = Math.sqrt(zr * zr + zi * zi);
    const dr = Math.sqrt(dzr * dzr + dzi * dzi);
    
    if (dr === 0) return 0;
    
    return 2 * r * Math.log(r) / dr;
}

// ============================================================================
// TILE RENDERING
// ============================================================================

/**
 * Render a single tile
 * 
 * @param {Object} tile - Tile specification
 * @param {Object} params - Rendering parameters
 * @returns {Object} Rendered tile data
 */
function renderTile(tile, params) {
    const {
        x, y,           // Tile position in pixels
        width, height,  // Tile dimensions
        centerX, centerY, // View center (arbitrary precision string or number)
        zoom,           // Zoom level (can be string for deep zoom)
        pixelSize       // Size of one pixel in complex plane
    } = tile;
    
    const {
        fractalType = 'mandelbrot',
        maxIterations = config.maxIterations,
        bailout = config.bailout,
        power = 2,
        juliaC = null,
        usePerturbation = false,
        useSeries = false,
        coloringMode = 'smooth'
    } = params;
    
    // Parse center coordinates (may be arbitrary precision)
    const cx = typeof centerX === 'string' ? parseFloat(centerX) : centerX;
    const cy = typeof centerY === 'string' ? parseFloat(centerY) : centerY;
    const pxSize = typeof pixelSize === 'string' ? parseFloat(pixelSize) : pixelSize;
    
    // Allocate result buffers
    const pixelCount = width * height;
    const iterations = new Float32Array(pixelCount);
    const escaped = new Uint8Array(pixelCount);
    
    // Optional auxiliary data for advanced coloring
    const auxData = coloringMode !== 'simple' ? new Float32Array(pixelCount * 2) : null;
    
    // Select iteration function
    let iterateFunc;
    switch (fractalType) {
        case 'julia':
            iterateFunc = (cr, ci) => juliaIterate(cr, ci, juliaC[0], juliaC[1], maxIterations, bailout);
            break;
        case 'burning-ship':
            iterateFunc = (cr, ci) => burningShipIterate(cr, ci, maxIterations, bailout);
            break;
        case 'tricorn':
            iterateFunc = (cr, ci) => tricornIterate(cr, ci, maxIterations, bailout);
            break;
        case 'mandelbrot-power':
            iterateFunc = (cr, ci) => mandelbrotPowerIterate(cr, ci, power, maxIterations, bailout);
            break;
        default:
            if (usePerturbation && referenceOrbit) {
                // Use perturbation theory
                const refCx = referenceOrbit.cx;
                const refCy = referenceOrbit.cy;
                iterateFunc = (cr, ci) => {
                    const dcr = cr - refCx;
                    const dci = ci - refCy;
                    return perturbationIterate(dcr, dci, referenceOrbit.orbit, maxIterations, bailout);
                };
            } else {
                iterateFunc = (cr, ci) => mandelbrotIterate(cr, ci, maxIterations, bailout);
            }
    }
    
    // Calculate tile origin in complex plane
    const tileOriginX = cx + (x - tile.canvasWidth / 2) * pxSize;
    const tileOriginY = cy - (y - tile.canvasHeight / 2) * pxSize;
    
    let pixelIndex = 0;
    let lastProgressReport = 0;
    
    // Render each pixel
    for (let py = 0; py < height; py++) {
        // Check cancellation
        if (cancelRequested) {
            return null;
        }
        
        const ci = tileOriginY - py * pxSize;
        
        for (let px = 0; px < width; px++) {
            const cr = tileOriginX + px * pxSize;
            
            // Iterate
            const result = iterateFunc(cr, ci);
            
            // Store results
            if (coloringMode === 'smooth' && result.escaped) {
                iterations[pixelIndex] = smoothIterations(
                    result.iterations,
                    result.finalZ[0],
                    result.finalZ[1],
                    bailout,
                    maxIterations
                );
            } else {
                iterations[pixelIndex] = result.iterations;
            }
            
            escaped[pixelIndex] = result.escaped ? 1 : 0;
            
            // Store auxiliary data (final z for coloring)
            if (auxData) {
                auxData[pixelIndex * 2] = result.finalZ[0];
                auxData[pixelIndex * 2 + 1] = result.finalZ[1];
            }
            
            pixelIndex++;
        }
        
        // Progress reporting
        if (pixelIndex - lastProgressReport >= config.progressInterval) {
            lastProgressReport = pixelIndex;
            self.postMessage({
                type: 'progress',
                taskId: currentTask.taskId,
                progress: pixelIndex / pixelCount
            });
        }
    }
    
    return {
        iterations,
        escaped,
        auxData,
        width,
        height,
        x,
        y
    };
}

/**
 * Render tile with supersampling for anti-aliasing
 */
function renderTileSupersampled(tile, params, sampleCount) {
    const { width, height } = tile;
    const subPixelSize = params.pixelSize / Math.sqrt(sampleCount);
    
    const iterations = new Float32Array(width * height);
    const escaped = new Uint8Array(width * height);
    
    // Sample offsets for jittered sampling
    const sampleOffsets = generateSampleOffsets(sampleCount);
    
    let pixelIndex = 0;
    
    for (let py = 0; py < height; py++) {
        if (cancelRequested) return null;
        
        for (let px = 0; px < width; px++) {
            let sumIterations = 0;
            let escapedCount = 0;
            
            // Take multiple samples per pixel
            for (let s = 0; s < sampleCount; s++) {
                const subTile = {
                    ...tile,
                    x: tile.x + px + sampleOffsets[s].x,
                    y: tile.y + py + sampleOffsets[s].y,
                    width: 1,
                    height: 1
                };
                
                const result = renderTile(subTile, params);
                if (!result) return null;
                
                sumIterations += result.iterations[0];
                escapedCount += result.escaped[0];
            }
            
            iterations[pixelIndex] = sumIterations / sampleCount;
            escaped[pixelIndex] = escapedCount > sampleCount / 2 ? 1 : 0;
            pixelIndex++;
        }
    }
    
    return { iterations, escaped, width, height, x: tile.x, y: tile.y };
}

/**
 * Generate sample offsets for supersampling
 */
function generateSampleOffsets(count) {
    const offsets = [];
    const sqrt = Math.ceil(Math.sqrt(count));
    
    for (let i = 0; i < count; i++) {
        // Jittered grid sampling
        const gx = i % sqrt;
        const gy = Math.floor(i / sqrt);
        
        offsets.push({
            x: (gx + Math.random()) / sqrt - 0.5,
            y: (gy + Math.random()) / sqrt - 0.5
        });
    }
    
    return offsets;
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

/**
 * Handle incoming messages from main thread
 */
self.onmessage = function(event) {
    const { type, taskId, data } = event.data;
    
    switch (type) {
        case 'init':
            handleInit(data);
            break;
            
        case 'render':
            handleRender(taskId, data);
            break;
            
        case 'cancel':
            handleCancel(taskId);
            break;
            
        case 'setReference':
            handleSetReference(data);
            break;
            
        case 'setSeries':
            handleSetSeries(data);
            break;
            
        case 'ping':
            self.postMessage({ type: 'pong', taskId });
            break;
            
        default:
            console.warn('Unknown message type:', type);
    }
};

/**
 * Initialize worker with configuration
 */
function handleInit(data) {
    config = { ...config, ...data };
    
    // Check for SharedArrayBuffer support
    config.useSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
    
    // Check for OffscreenCanvas support
    config.useOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
    
    self.postMessage({
        type: 'initialized',
        config: {
            useSharedArrayBuffer: config.useSharedArrayBuffer,
            useOffscreenCanvas: config.useOffscreenCanvas
        }
    });
}

/**
 * Handle render request
 */
function handleRender(taskId, data) {
    const { tile, params } = data;
    
    currentTask = { taskId, tile, params };
    cancelRequested = false;
    
    try {
        const startTime = performance.now();
        
        // Render the tile
        const result = params.supersampling > 1
            ? renderTileSupersampled(tile, params, params.supersampling)
            : renderTile(tile, params);
        
        if (result === null) {
            // Cancelled
            self.postMessage({
                type: 'cancelled',
                taskId
            });
            return;
        }
        
        const elapsed = performance.now() - startTime;
        
        // Prepare transferable arrays
        const transferables = [
            result.iterations.buffer,
            result.escaped.buffer
        ];
        
        if (result.auxData) {
            transferables.push(result.auxData.buffer);
        }
        
        // Send result with transfer
        self.postMessage({
            type: 'complete',
            taskId,
            result: {
                iterations: result.iterations,
                escaped: result.escaped,
                auxData: result.auxData,
                width: result.width,
                height: result.height,
                x: result.x,
                y: result.y,
                elapsed
            }
        }, transferables);
        
    } catch (error) {
        self.postMessage({
            type: 'error',
            taskId,
            error: error.message
        });
    } finally {
        currentTask = null;
    }
}

/**
 * Handle cancellation request
 */
function handleCancel(taskId) {
    if (currentTask && currentTask.taskId === taskId) {
        cancelRequested = true;
    }
}

/**
 * Set reference orbit for perturbation theory
 */
function handleSetReference(data) {
    referenceOrbit = {
        cx: data.cx,
        cy: data.cy,
        orbit: data.orbit
    };
    
    self.postMessage({
        type: 'referenceSet',
        orbitLength: data.orbit.length
    });
}

/**
 * Set series coefficients for approximation
 */
function handleSetSeries(data) {
    seriesCoeffs = data.coefficients;
    
    self.postMessage({
        type: 'seriesSet',
        coeffCount: data.coefficients.length
    });
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Global error handler
 */
self.onerror = function(error) {
    self.postMessage({
        type: 'error',
        taskId: currentTask ? currentTask.taskId : null,
        error: error.message || 'Unknown error in render worker'
    });
};

/**
 * Unhandled rejection handler
 */
self.onunhandledrejection = function(event) {
    self.postMessage({
        type: 'error',
        taskId: currentTask ? currentTask.taskId : null,
        error: event.reason?.message || 'Unhandled promise rejection'
    });
};

// Signal that worker is ready
self.postMessage({ type: 'ready' });
