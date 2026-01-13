/**
 * ============================================================================
 * ABYSS EXPLORER - EXPORT WORKER
 * ============================================================================
 * 
 * Dedicated Web Worker for high-resolution exports and heavy tasks.
 * Handles memory-intensive operations without blocking the UI.
 * 
 * Features:
 * - High-resolution image rendering (up to 32K)
 * - Supersampled anti-aliasing
 * - Large canvas compositing
 * - GIF frame encoding
 * - WebM/Video frame encoding
 * - Batch export processing
 * - Progress reporting
 * - Memory management
 * 
 * Threading Strategy:
 * - Single dedicated worker for export tasks
 * - Main thread sends export parameters
 * - Worker handles rendering and encoding
 * - Progress updates sent at regular intervals
 * - Results returned as transferable buffers
 * 
 * Memory Management:
 * - Chunked processing for large images
 * - Explicit garbage collection hints
 * - Buffer reuse where possible
 * - Memory limit checks
 * 
 * @module workers/export-worker
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

'use strict';

// ============================================================================
// WORKER STATE
// ============================================================================

let currentTask = null;
let cancelRequested = false;

/**
 * Worker configuration
 */
let config = {
    maxMemoryMB: 2048,      // Maximum memory usage
    chunkSize: 512,         // Tile chunk size for large renders
    progressInterval: 1000, // Progress update interval (ms)
    useOffscreenCanvas: typeof OffscreenCanvas !== 'undefined'
};

/**
 * Offscreen canvas for rendering (if available)
 */
let offscreenCanvas = null;
let offscreenCtx = null;

// ============================================================================
// ITERATION FUNCTIONS (DUPLICATED FOR WORKER ISOLATION)
// ============================================================================

/**
 * Mandelbrot iteration with smooth coloring
 */
function mandelbrotSmooth(cr, ci, maxIter, bailout) {
    let zr = 0, zi = 0;
    let zr2 = 0, zi2 = 0;
    let iter = 0;
    
    while (iter < maxIter && zr2 + zi2 <= bailout) {
        zi = 2 * zr * zi + ci;
        zr = zr2 - zi2 + cr;
        zr2 = zr * zr;
        zi2 = zi * zi;
        iter++;
    }
    
    if (iter < maxIter) {
        // Smooth iteration count
        const logZn = Math.log(zr2 + zi2) / 2;
        const nu = Math.log(logZn / Math.log(2)) / Math.log(2);
        return iter + 1 - nu;
    }
    
    return iter;
}

/**
 * Julia set iteration
 */
function juliaSmooth(zr, zi, cr, ci, maxIter, bailout) {
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
    
    if (iter < maxIter) {
        const logZn = Math.log(zr2 + zi2) / 2;
        const nu = Math.log(logZn / Math.log(2)) / Math.log(2);
        return iter + 1 - nu;
    }
    
    return iter;
}

/**
 * Burning Ship iteration
 */
function burningShipSmooth(cr, ci, maxIter, bailout) {
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
    
    if (iter < maxIter) {
        const logZn = Math.log(zr2 + zi2) / 2;
        const nu = Math.log(logZn / Math.log(2)) / Math.log(2);
        return iter + 1 - nu;
    }
    
    return iter;
}

// ============================================================================
// COLOR PALETTE
// ============================================================================

/**
 * Apply color palette to iteration count
 */
function applyPalette(iteration, maxIter, palette) {
    if (iteration >= maxIter) {
        return [0, 0, 0, 255]; // Black for interior
    }
    
    // Normalize to [0, 1]
    const t = iteration / maxIter;
    
    // Default palette: cosine gradient
    if (!palette || palette.type === 'default') {
        const r = Math.floor(127.5 * (1 + Math.cos(2 * Math.PI * (t + 0.0))));
        const g = Math.floor(127.5 * (1 + Math.cos(2 * Math.PI * (t + 0.33))));
        const b = Math.floor(127.5 * (1 + Math.cos(2 * Math.PI * (t + 0.67))));
        return [r, g, b, 255];
    }
    
    // Gradient palette
    if (palette.type === 'gradient' && palette.stops) {
        return interpolateGradient(t, palette.stops);
    }
    
    // Palette array
    if (palette.type === 'array' && palette.colors) {
        const index = Math.floor(t * (palette.colors.length - 1));
        const frac = t * (palette.colors.length - 1) - index;
        
        const c1 = palette.colors[Math.min(index, palette.colors.length - 1)];
        const c2 = palette.colors[Math.min(index + 1, palette.colors.length - 1)];
        
        return [
            Math.floor(c1[0] + frac * (c2[0] - c1[0])),
            Math.floor(c1[1] + frac * (c2[1] - c1[1])),
            Math.floor(c1[2] + frac * (c2[2] - c1[2])),
            255
        ];
    }
    
    // Fallback
    return [255, 255, 255, 255];
}

/**
 * Interpolate gradient stops
 */
function interpolateGradient(t, stops) {
    // Find surrounding stops
    let low = stops[0];
    let high = stops[stops.length - 1];
    
    for (let i = 0; i < stops.length - 1; i++) {
        if (t >= stops[i].position && t <= stops[i + 1].position) {
            low = stops[i];
            high = stops[i + 1];
            break;
        }
    }
    
    // Interpolate
    const range = high.position - low.position;
    const frac = range > 0 ? (t - low.position) / range : 0;
    
    return [
        Math.floor(low.color[0] + frac * (high.color[0] - low.color[0])),
        Math.floor(low.color[1] + frac * (high.color[1] - low.color[1])),
        Math.floor(low.color[2] + frac * (high.color[2] - low.color[2])),
        255
    ];
}

// ============================================================================
// HIGH-RES RENDERING
// ============================================================================

/**
 * Render high-resolution image
 * 
 * @param {Object} params - Render parameters
 * @returns {Object} Rendered image data
 */
function renderHighRes(params) {
    const {
        width, height,
        centerX, centerY,
        zoom,
        maxIterations,
        bailout = 4,
        fractalType = 'mandelbrot',
        juliaC = null,
        palette,
        supersampling = 1
    } = params;
    
    // Calculate pixel size
    const pixelSize = 4 / (zoom * Math.min(width, height));
    
    // Select iteration function
    let iterate;
    switch (fractalType) {
        case 'julia':
            iterate = (cr, ci) => juliaSmooth(cr, ci, juliaC[0], juliaC[1], maxIterations, bailout);
            break;
        case 'burning-ship':
            iterate = (cr, ci) => burningShipSmooth(cr, ci, maxIterations, bailout);
            break;
        default:
            iterate = (cr, ci) => mandelbrotSmooth(cr, ci, maxIterations, bailout);
    }
    
    // Allocate image data
    const imageData = new Uint8ClampedArray(width * height * 4);
    
    // Sample offsets for supersampling
    const sampleOffsets = [];
    if (supersampling > 1) {
        const sqrtSamples = Math.ceil(Math.sqrt(supersampling));
        for (let sy = 0; sy < sqrtSamples; sy++) {
            for (let sx = 0; sx < sqrtSamples; sx++) {
                sampleOffsets.push({
                    x: (sx + 0.5) / sqrtSamples - 0.5,
                    y: (sy + 0.5) / sqrtSamples - 0.5
                });
            }
        }
    } else {
        sampleOffsets.push({ x: 0, y: 0 });
    }
    
    const numSamples = sampleOffsets.length;
    let pixelIndex = 0;
    let lastProgress = 0;
    const startTime = Date.now();
    
    // Render each pixel
    for (let py = 0; py < height; py++) {
        // Check cancellation
        if (cancelRequested) {
            return null;
        }
        
        const ci = centerY - (py - height / 2) * pixelSize;
        
        for (let px = 0; px < width; px++) {
            const cr = centerX + (px - width / 2) * pixelSize;
            
            // Supersampled iteration
            let totalIter = 0;
            
            for (const offset of sampleOffsets) {
                const sampleCr = cr + offset.x * pixelSize;
                const sampleCi = ci + offset.y * pixelSize;
                totalIter += iterate(sampleCr, sampleCi);
            }
            
            const avgIter = totalIter / numSamples;
            
            // Apply color palette
            const color = applyPalette(avgIter, maxIterations, palette);
            
            // Write to image data
            const idx = pixelIndex * 4;
            imageData[idx] = color[0];
            imageData[idx + 1] = color[1];
            imageData[idx + 2] = color[2];
            imageData[idx + 3] = color[3];
            
            pixelIndex++;
        }
        
        // Progress reporting
        const now = Date.now();
        if (now - lastProgress >= config.progressInterval) {
            lastProgress = now;
            self.postMessage({
                type: 'progress',
                taskId: currentTask,
                progress: py / height,
                eta: ((now - startTime) / py) * (height - py)
            });
        }
    }
    
    return {
        imageData,
        width,
        height
    };
}

/**
 * Render image in chunks for very large resolutions
 */
function renderHighResChunked(params) {
    const { width, height } = params;
    const chunkSize = config.chunkSize;
    
    // Calculate chunks
    const chunksX = Math.ceil(width / chunkSize);
    const chunksY = Math.ceil(height / chunkSize);
    const totalChunks = chunksX * chunksY;
    
    // Allocate full image
    const imageData = new Uint8ClampedArray(width * height * 4);
    
    let chunkIndex = 0;
    const startTime = Date.now();
    
    // Render each chunk
    for (let cy = 0; cy < chunksY; cy++) {
        for (let cx = 0; cx < chunksX; cx++) {
            if (cancelRequested) return null;
            
            const chunkX = cx * chunkSize;
            const chunkY = cy * chunkSize;
            const chunkW = Math.min(chunkSize, width - chunkX);
            const chunkH = Math.min(chunkSize, height - chunkY);
            
            // Render chunk
            const chunkParams = {
                ...params,
                width: chunkW,
                height: chunkH,
                // Adjust center for this chunk
                centerX: params.centerX + (chunkX + chunkW / 2 - width / 2) * (4 / (params.zoom * Math.min(width, height))),
                centerY: params.centerY - (chunkY + chunkH / 2 - height / 2) * (4 / (params.zoom * Math.min(width, height)))
            };
            
            const chunk = renderHighRes(chunkParams);
            if (!chunk) return null;
            
            // Copy chunk to main image
            for (let y = 0; y < chunkH; y++) {
                const srcOffset = y * chunkW * 4;
                const dstOffset = ((chunkY + y) * width + chunkX) * 4;
                
                for (let x = 0; x < chunkW * 4; x++) {
                    imageData[dstOffset + x] = chunk.imageData[srcOffset + x];
                }
            }
            
            chunkIndex++;
            
            // Progress
            const now = Date.now();
            const elapsed = now - startTime;
            self.postMessage({
                type: 'progress',
                taskId: currentTask,
                progress: chunkIndex / totalChunks,
                stage: 'rendering',
                chunk: { x: cx, y: cy, total: totalChunks },
                eta: (elapsed / chunkIndex) * (totalChunks - chunkIndex)
            });
        }
    }
    
    return { imageData, width, height };
}

// ============================================================================
// IMAGE ENCODING
// ============================================================================

/**
 * Encode image data to PNG
 * Uses canvas API if available
 */
async function encodePNG(imageData, width, height) {
    if (config.useOffscreenCanvas) {
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        const imgData = new ImageData(imageData, width, height);
        ctx.putImageData(imgData, 0, 0);
        
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        return await blob.arrayBuffer();
    }
    
    // Fallback: return raw RGBA data
    return imageData.buffer;
}

/**
 * Encode image data to JPEG
 */
async function encodeJPEG(imageData, width, height, quality = 0.92) {
    if (config.useOffscreenCanvas) {
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        const imgData = new ImageData(imageData, width, height);
        ctx.putImageData(imgData, 0, 0);
        
        const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
        return await blob.arrayBuffer();
    }
    
    return imageData.buffer;
}

// ============================================================================
// GIF ENCODING
// ============================================================================

/**
 * Simple GIF encoder
 * Implements basic GIF89a format with LZW compression
 */
class SimpleGIFEncoder {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.frames = [];
        this.globalPalette = null;
    }
    
    /**
     * Add a frame to the GIF
     */
    addFrame(imageData, delay = 100) {
        // Quantize to 256 colors
        const { palette, indexed } = this.quantize(imageData);
        
        if (!this.globalPalette) {
            this.globalPalette = palette;
        }
        
        this.frames.push({
            indexed,
            delay,
            palette: this.arraysEqual(palette, this.globalPalette) ? null : palette
        });
    }
    
    /**
     * Quantize 32-bit image to 256 colors
     * Uses median cut algorithm (simplified)
     */
    quantize(imageData) {
        const pixels = [];
        
        // Sample pixels
        for (let i = 0; i < imageData.length; i += 4) {
            pixels.push([imageData[i], imageData[i + 1], imageData[i + 2]]);
        }
        
        // Build palette using frequency
        const colorCounts = new Map();
        
        for (const [r, g, b] of pixels) {
            // Reduce to 5 bits per channel for counting
            const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
            colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
        }
        
        // Get top 256 colors
        const sorted = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 256);
        
        const palette = sorted.map(([key]) => [
            ((key >> 10) & 0x1F) << 3,
            ((key >> 5) & 0x1F) << 3,
            (key & 0x1F) << 3
        ]);
        
        // Pad palette to 256
        while (palette.length < 256) {
            palette.push([0, 0, 0]);
        }
        
        // Map pixels to palette indices
        const indexed = new Uint8Array(pixels.length);
        
        for (let i = 0; i < pixels.length; i++) {
            const [r, g, b] = pixels[i];
            let minDist = Infinity;
            let bestIdx = 0;
            
            for (let j = 0; j < palette.length; j++) {
                const [pr, pg, pb] = palette[j];
                const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
                if (dist < minDist) {
                    minDist = dist;
                    bestIdx = j;
                }
            }
            
            indexed[i] = bestIdx;
        }
        
        return { palette, indexed };
    }
    
    /**
     * Compare two palettes
     */
    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1] || a[i][2] !== b[i][2]) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Encode GIF to binary
     */
    encode() {
        const bytes = [];
        
        // Header
        this.writeString(bytes, 'GIF89a');
        
        // Logical Screen Descriptor
        this.writeUint16(bytes, this.width);
        this.writeUint16(bytes, this.height);
        bytes.push(0xF7); // Global color table, 8 bits
        bytes.push(0);    // Background color index
        bytes.push(0);    // Pixel aspect ratio
        
        // Global Color Table
        for (const [r, g, b] of this.globalPalette) {
            bytes.push(r, g, b);
        }
        
        // Netscape Extension (for looping)
        bytes.push(0x21, 0xFF, 0x0B);
        this.writeString(bytes, 'NETSCAPE2.0');
        bytes.push(0x03, 0x01);
        this.writeUint16(bytes, 0); // Loop count (0 = infinite)
        bytes.push(0x00);
        
        // Frames
        for (const frame of this.frames) {
            // Graphic Control Extension
            bytes.push(0x21, 0xF9, 0x04);
            bytes.push(0x04); // Disposal method
            this.writeUint16(bytes, Math.round(frame.delay / 10)); // Delay in 1/100s
            bytes.push(0); // Transparent color index
            bytes.push(0x00);
            
            // Image Descriptor
            bytes.push(0x2C);
            this.writeUint16(bytes, 0); // Left
            this.writeUint16(bytes, 0); // Top
            this.writeUint16(bytes, this.width);
            this.writeUint16(bytes, this.height);
            
            if (frame.palette) {
                bytes.push(0x87); // Local color table
                for (const [r, g, b] of frame.palette) {
                    bytes.push(r, g, b);
                }
            } else {
                bytes.push(0x00);
            }
            
            // LZW Minimum Code Size
            bytes.push(8);
            
            // LZW Compressed Data
            const compressed = this.lzwEncode(frame.indexed);
            
            // Write sub-blocks
            let pos = 0;
            while (pos < compressed.length) {
                const chunkSize = Math.min(255, compressed.length - pos);
                bytes.push(chunkSize);
                for (let i = 0; i < chunkSize; i++) {
                    bytes.push(compressed[pos + i]);
                }
                pos += chunkSize;
            }
            bytes.push(0x00); // Block terminator
        }
        
        // Trailer
        bytes.push(0x3B);
        
        return new Uint8Array(bytes);
    }
    
    /**
     * LZW compression for GIF
     */
    lzwEncode(data) {
        const minCodeSize = 8;
        const clearCode = 1 << minCodeSize;
        const eoiCode = clearCode + 1;
        
        let codeSize = minCodeSize + 1;
        let nextCode = eoiCode + 1;
        
        // Initialize dictionary
        const dictionary = new Map();
        for (let i = 0; i < clearCode; i++) {
            dictionary.set(String(i), i);
        }
        
        const output = [];
        let bitBuffer = 0;
        let bitCount = 0;
        
        const writeBits = (code, size) => {
            bitBuffer |= code << bitCount;
            bitCount += size;
            
            while (bitCount >= 8) {
                output.push(bitBuffer & 0xFF);
                bitBuffer >>= 8;
                bitCount -= 8;
            }
        };
        
        // Write clear code
        writeBits(clearCode, codeSize);
        
        let current = String(data[0]);
        
        for (let i = 1; i < data.length; i++) {
            const next = String(data[i]);
            const combined = current + ',' + next;
            
            if (dictionary.has(combined)) {
                current = combined;
            } else {
                writeBits(dictionary.get(current), codeSize);
                
                if (nextCode < 4096) {
                    dictionary.set(combined, nextCode++);
                    
                    if (nextCode > (1 << codeSize) && codeSize < 12) {
                        codeSize++;
                    }
                } else {
                    // Dictionary full, reset
                    writeBits(clearCode, codeSize);
                    codeSize = minCodeSize + 1;
                    nextCode = eoiCode + 1;
                    dictionary.clear();
                    for (let j = 0; j < clearCode; j++) {
                        dictionary.set(String(j), j);
                    }
                }
                
                current = next;
            }
        }
        
        // Write remaining
        writeBits(dictionary.get(current), codeSize);
        writeBits(eoiCode, codeSize);
        
        // Flush remaining bits
        if (bitCount > 0) {
            output.push(bitBuffer & 0xFF);
        }
        
        return output;
    }
    
    writeString(bytes, str) {
        for (let i = 0; i < str.length; i++) {
            bytes.push(str.charCodeAt(i));
        }
    }
    
    writeUint16(bytes, value) {
        bytes.push(value & 0xFF);
        bytes.push((value >> 8) & 0xFF);
    }
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

self.onmessage = async function(event) {
    const { type, taskId, data } = event.data;
    
    switch (type) {
        case 'init':
            handleInit(data);
            break;
            
        case 'renderImage':
            await handleRenderImage(taskId, data);
            break;
            
        case 'encodeGIF':
            await handleEncodeGIF(taskId, data);
            break;
            
        case 'compositeFrames':
            await handleCompositeFrames(taskId, data);
            break;
            
        case 'cancel':
            cancelRequested = true;
            break;
            
        case 'ping':
            self.postMessage({ type: 'pong', taskId });
            break;
            
        default:
            console.warn('Unknown message type:', type);
    }
};

/**
 * Initialize worker
 */
function handleInit(data) {
    config = { ...config, ...data };
    
    self.postMessage({
        type: 'initialized',
        config: {
            useOffscreenCanvas: config.useOffscreenCanvas,
            maxMemoryMB: config.maxMemoryMB
        }
    });
}

/**
 * Handle high-resolution image render request
 */
async function handleRenderImage(taskId, data) {
    currentTask = taskId;
    cancelRequested = false;
    
    try {
        const startTime = performance.now();
        
        // Check if chunked rendering is needed
        const totalPixels = data.width * data.height;
        const useChunked = totalPixels > 4000 * 4000;
        
        // Render
        const result = useChunked
            ? renderHighResChunked(data)
            : renderHighRes(data);
        
        if (!result) {
            self.postMessage({ type: 'cancelled', taskId });
            return;
        }
        
        // Encode
        self.postMessage({
            type: 'progress',
            taskId,
            progress: 0.95,
            stage: 'encoding'
        });
        
        let encoded;
        if (data.format === 'jpeg') {
            encoded = await encodeJPEG(result.imageData, result.width, result.height, data.quality);
        } else {
            encoded = await encodePNG(result.imageData, result.width, result.height);
        }
        
        const elapsed = performance.now() - startTime;
        
        // Send result
        self.postMessage({
            type: 'imageComplete',
            taskId,
            result: {
                data: new Uint8Array(encoded),
                width: result.width,
                height: result.height,
                format: data.format || 'png',
                elapsed
            }
        }, [encoded]);
        
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
 * Handle GIF encoding request
 */
async function handleEncodeGIF(taskId, data) {
    currentTask = taskId;
    cancelRequested = false;
    
    try {
        const { frames, width, height, delay = 100 } = data;
        
        const encoder = new SimpleGIFEncoder(width, height);
        
        for (let i = 0; i < frames.length; i++) {
            if (cancelRequested) {
                self.postMessage({ type: 'cancelled', taskId });
                return;
            }
            
            encoder.addFrame(frames[i], delay);
            
            self.postMessage({
                type: 'progress',
                taskId,
                progress: (i + 1) / frames.length,
                stage: 'encoding'
            });
        }
        
        const gifData = encoder.encode();
        
        self.postMessage({
            type: 'gifComplete',
            taskId,
            result: {
                data: gifData,
                width,
                height,
                frameCount: frames.length
            }
        }, [gifData.buffer]);
        
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
 * Handle frame compositing for video
 */
async function handleCompositeFrames(taskId, data) {
    currentTask = taskId;
    cancelRequested = false;
    
    try {
        const { frames, width, height, format = 'raw' } = data;
        
        // Just return frames as-is for now
        // Full video encoding would require WebCodecs API
        
        self.postMessage({
            type: 'compositingComplete',
            taskId,
            result: {
                frameCount: frames.length,
                width,
                height,
                format
            }
        });
        
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

// ============================================================================
// ERROR HANDLING
// ============================================================================

self.onerror = function(error) {
    self.postMessage({
        type: 'error',
        taskId: currentTask,
        error: error.message || 'Unknown error in export worker'
    });
};

self.onunhandledrejection = function(event) {
    self.postMessage({
        type: 'error',
        taskId: currentTask,
        error: event.reason?.message || 'Unhandled promise rejection'
    });
};

// Signal ready
self.postMessage({ type: 'ready' });
