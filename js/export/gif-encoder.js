/**
 * ============================================================================
 * ABYSS EXPLORER - GIF ENCODER
 * ============================================================================
 * 
 * High-quality GIF encoding with palette optimization, dithering options,
 * and loop control. Designed for fractal animations with smooth gradients.
 * 
 * Features:
 * - Custom palette extraction (256 colors)
 * - Multiple dithering algorithms
 * - Global/local color tables
 * - Loop/no-loop options
 * - Frame delay control
 * - Worker-based encoding (optional)
 * 
 * GIF Specification:
 * - Max 256 colors per frame
 * - LZW compression
 * - Global/local color tables
 * - Graphic control extension for timing
 * 
 * @module export/gif-encoder
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Dithering methods */
export const DITHER_METHOD = {
    NONE: 'none',
    FLOYD_STEINBERG: 'floyd-steinberg',
    ORDERED: 'ordered',
    ATKINSON: 'atkinson'
};

/** Palette extraction methods */
export const PALETTE_METHOD = {
    MEDIAN_CUT: 'median-cut',
    OCTREE: 'octree',
    UNIFORM: 'uniform'
};

/** GIF header signature */
const GIF_SIGNATURE = 'GIF89a';

// ============================================================================
// COLOR QUANTIZER
// ============================================================================

/**
 * Median-cut color quantization for optimal palette
 */
class ColorQuantizer {
    /**
     * Quantize colors to palette
     * @param {Uint8ClampedArray} pixels - RGBA pixel data
     * @param {number} colorCount - Target color count (max 256)
     * @returns {Array} Palette of RGB colors
     */
    static quantize(pixels, colorCount = 256) {
        // Build histogram of unique colors
        const colorMap = new Map();
        
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const key = (r << 16) | (g << 8) | b;
            
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }
        
        // Convert to array of color objects
        const colors = [];
        for (const [key, count] of colorMap) {
            colors.push({
                r: (key >> 16) & 0xff,
                g: (key >> 8) & 0xff,
                b: key & 0xff,
                count
            });
        }
        
        // If we have fewer colors than target, return all
        if (colors.length <= colorCount) {
            return colors.map(c => [c.r, c.g, c.b]);
        }
        
        // Median cut algorithm
        return this._medianCut(colors, colorCount);
    }
    
    /**
     * Median cut color reduction
     * @private
     */
    static _medianCut(colors, targetCount) {
        const boxes = [{ colors, volume: this._boxVolume(colors) }];
        
        // Split boxes until we have enough
        while (boxes.length < targetCount) {
            // Find box with largest volume
            let maxIdx = 0;
            let maxVolume = boxes[0].volume;
            
            for (let i = 1; i < boxes.length; i++) {
                if (boxes[i].volume > maxVolume && boxes[i].colors.length > 1) {
                    maxVolume = boxes[i].volume;
                    maxIdx = i;
                }
            }
            
            const box = boxes[maxIdx];
            
            if (box.colors.length <= 1) break;
            
            // Find longest dimension
            const ranges = this._colorRanges(box.colors);
            const dimension = ranges.r >= ranges.g && ranges.r >= ranges.b ? 'r' :
                             ranges.g >= ranges.b ? 'g' : 'b';
            
            // Sort by that dimension
            box.colors.sort((a, b) => a[dimension] - b[dimension]);
            
            // Split in half
            const mid = Math.floor(box.colors.length / 2);
            const colors1 = box.colors.slice(0, mid);
            const colors2 = box.colors.slice(mid);
            
            boxes.splice(maxIdx, 1, 
                { colors: colors1, volume: this._boxVolume(colors1) },
                { colors: colors2, volume: this._boxVolume(colors2) }
            );
        }
        
        // Average colors in each box
        return boxes.map(box => {
            let r = 0, g = 0, b = 0, total = 0;
            for (const c of box.colors) {
                r += c.r * c.count;
                g += c.g * c.count;
                b += c.b * c.count;
                total += c.count;
            }
            return [
                Math.round(r / total),
                Math.round(g / total),
                Math.round(b / total)
            ];
        });
    }
    
    static _boxVolume(colors) {
        const ranges = this._colorRanges(colors);
        return ranges.r * ranges.g * ranges.b;
    }
    
    static _colorRanges(colors) {
        let minR = 255, maxR = 0;
        let minG = 255, maxG = 0;
        let minB = 255, maxB = 0;
        
        for (const c of colors) {
            if (c.r < minR) minR = c.r;
            if (c.r > maxR) maxR = c.r;
            if (c.g < minG) minG = c.g;
            if (c.g > maxG) maxG = c.g;
            if (c.b < minB) minB = c.b;
            if (c.b > maxB) maxB = c.b;
        }
        
        return {
            r: maxR - minR,
            g: maxG - minG,
            b: maxB - minB
        };
    }
}

// ============================================================================
// DITHERING
// ============================================================================

/**
 * Apply dithering to image
 */
class Ditherer {
    /**
     * Apply Floyd-Steinberg dithering
     * @param {ImageData} imageData
     * @param {Array} palette
     * @returns {Uint8Array} Indexed pixels
     */
    static floydSteinberg(imageData, palette) {
        const { width, height, data } = imageData;
        const pixels = new Float32Array(data.length);
        
        // Copy to float array for error diffusion
        for (let i = 0; i < data.length; i++) {
            pixels[i] = data[i];
        }
        
        const indexed = new Uint8Array(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                
                const r = Math.max(0, Math.min(255, Math.round(pixels[idx])));
                const g = Math.max(0, Math.min(255, Math.round(pixels[idx + 1])));
                const b = Math.max(0, Math.min(255, Math.round(pixels[idx + 2])));
                
                // Find closest palette color
                const colorIdx = this._findClosestColor(r, g, b, palette);
                indexed[y * width + x] = colorIdx;
                
                const newColor = palette[colorIdx];
                
                // Calculate error
                const errR = r - newColor[0];
                const errG = g - newColor[1];
                const errB = b - newColor[2];
                
                // Distribute error to neighbors
                // Right: 7/16
                if (x + 1 < width) {
                    const nIdx = idx + 4;
                    pixels[nIdx] += errR * 7 / 16;
                    pixels[nIdx + 1] += errG * 7 / 16;
                    pixels[nIdx + 2] += errB * 7 / 16;
                }
                
                // Bottom-left: 3/16
                if (y + 1 < height && x > 0) {
                    const nIdx = idx + width * 4 - 4;
                    pixels[nIdx] += errR * 3 / 16;
                    pixels[nIdx + 1] += errG * 3 / 16;
                    pixels[nIdx + 2] += errB * 3 / 16;
                }
                
                // Bottom: 5/16
                if (y + 1 < height) {
                    const nIdx = idx + width * 4;
                    pixels[nIdx] += errR * 5 / 16;
                    pixels[nIdx + 1] += errG * 5 / 16;
                    pixels[nIdx + 2] += errB * 5 / 16;
                }
                
                // Bottom-right: 1/16
                if (y + 1 < height && x + 1 < width) {
                    const nIdx = idx + width * 4 + 4;
                    pixels[nIdx] += errR * 1 / 16;
                    pixels[nIdx + 1] += errG * 1 / 16;
                    pixels[nIdx + 2] += errB * 1 / 16;
                }
            }
        }
        
        return indexed;
    }
    
    /**
     * No dithering - simple nearest color
     */
    static none(imageData, palette) {
        const { width, height, data } = imageData;
        const indexed = new Uint8Array(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const colorIdx = this._findClosestColor(
                    data[idx], data[idx + 1], data[idx + 2], palette
                );
                indexed[y * width + x] = colorIdx;
            }
        }
        
        return indexed;
    }
    
    /**
     * Ordered (Bayer) dithering
     */
    static ordered(imageData, palette) {
        const { width, height, data } = imageData;
        const indexed = new Uint8Array(width * height);
        
        // 4x4 Bayer matrix
        const bayer = [
            [0, 8, 2, 10],
            [12, 4, 14, 6],
            [3, 11, 1, 9],
            [15, 7, 13, 5]
        ];
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const threshold = (bayer[y % 4][x % 4] / 16 - 0.5) * 64;
                
                const r = Math.max(0, Math.min(255, data[idx] + threshold));
                const g = Math.max(0, Math.min(255, data[idx + 1] + threshold));
                const b = Math.max(0, Math.min(255, data[idx + 2] + threshold));
                
                indexed[y * width + x] = this._findClosestColor(r, g, b, palette);
            }
        }
        
        return indexed;
    }
    
    /**
     * Find closest palette color
     * @private
     */
    static _findClosestColor(r, g, b, palette) {
        let minDist = Infinity;
        let minIdx = 0;
        
        for (let i = 0; i < palette.length; i++) {
            const [pr, pg, pb] = palette[i];
            const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
            
            if (dist < minDist) {
                minDist = dist;
                minIdx = i;
            }
        }
        
        return minIdx;
    }
}

// ============================================================================
// LZW ENCODER
// ============================================================================

/**
 * LZW compression for GIF
 */
class LZWEncoder {
    /**
     * Encode data using LZW
     * @param {Uint8Array} data - Indexed pixel data
     * @param {number} minCodeSize - Minimum code size (usually palette bits)
     * @returns {Uint8Array} Compressed data
     */
    static encode(data, minCodeSize) {
        const clearCode = 1 << minCodeSize;
        const endCode = clearCode + 1;
        
        const output = [];
        let codeSize = minCodeSize + 1;
        let nextCode = endCode + 1;
        const codeLimit = 1 << 12; // Max 12-bit codes
        
        // Initialize dictionary
        const dictionary = new Map();
        for (let i = 0; i < clearCode; i++) {
            dictionary.set(String.fromCharCode(i), i);
        }
        
        // Bit packing
        let buffer = 0;
        let bufferBits = 0;
        
        const writeBits = (code, bits) => {
            buffer |= code << bufferBits;
            bufferBits += bits;
            
            while (bufferBits >= 8) {
                output.push(buffer & 0xff);
                buffer >>= 8;
                bufferBits -= 8;
            }
        };
        
        // Output clear code
        writeBits(clearCode, codeSize);
        
        let prefix = '';
        
        for (let i = 0; i < data.length; i++) {
            const char = String.fromCharCode(data[i]);
            const combined = prefix + char;
            
            if (dictionary.has(combined)) {
                prefix = combined;
            } else {
                // Output code for prefix
                writeBits(dictionary.get(prefix), codeSize);
                
                // Add new code to dictionary
                if (nextCode < codeLimit) {
                    dictionary.set(combined, nextCode++);
                    
                    // Increase code size if needed
                    if (nextCode > (1 << codeSize) && codeSize < 12) {
                        codeSize++;
                    }
                } else {
                    // Clear dictionary
                    writeBits(clearCode, codeSize);
                    dictionary.clear();
                    for (let j = 0; j < clearCode; j++) {
                        dictionary.set(String.fromCharCode(j), j);
                    }
                    codeSize = minCodeSize + 1;
                    nextCode = endCode + 1;
                }
                
                prefix = char;
            }
        }
        
        // Output remaining prefix
        if (prefix) {
            writeBits(dictionary.get(prefix), codeSize);
        }
        
        // Output end code
        writeBits(endCode, codeSize);
        
        // Flush remaining bits
        if (bufferBits > 0) {
            output.push(buffer & 0xff);
        }
        
        return new Uint8Array(output);
    }
}

// ============================================================================
// GIF ENCODER CLASS
// ============================================================================

export class GIFEncoder {
    /**
     * Create GIF encoder
     * @param {Object} options
     */
    constructor(options = {}) {
        this.width = options.width || 320;
        this.height = options.height || 240;
        this.delay = options.delay || 100; // ms between frames
        this.loop = options.loop ?? 0; // 0 = infinite, -1 = no loop
        this.dither = options.dither || DITHER_METHOD.FLOYD_STEINBERG;
        this.quality = options.quality || 10; // 1-30, lower = better
        
        // State
        this.frames = [];
        this.globalPalette = null;
        
        // Output buffer
        this.output = [];
        
        // Callbacks
        this.onProgress = options.onProgress || null;
    }
    
    /**
     * Add frame to GIF
     * @param {ImageData|HTMLCanvasElement} frame
     */
    addFrame(frame) {
        // Convert canvas to ImageData if needed
        let imageData;
        if (frame instanceof ImageData) {
            imageData = frame;
        } else if (frame.getContext) {
            const ctx = frame.getContext('2d');
            imageData = ctx.getImageData(0, 0, frame.width, frame.height);
        } else {
            throw new Error('Invalid frame format');
        }
        
        this.frames.push(imageData);
    }
    
    /**
     * Encode all frames to GIF
     * @returns {Blob}
     */
    encode() {
        if (this.frames.length === 0) {
            throw new Error('No frames to encode');
        }
        
        this.output = [];
        
        // Update dimensions from first frame
        this.width = this.frames[0].width;
        this.height = this.frames[0].height;
        
        this._reportProgress(0, 'Building palette...');
        
        // Build global palette from all frames
        this.globalPalette = this._buildGlobalPalette();
        
        // Write header
        this._writeHeader();
        
        // Write logical screen descriptor
        this._writeLogicalScreenDescriptor();
        
        // Write global color table
        this._writeColorTable(this.globalPalette);
        
        // Write application extension (for looping)
        if (this.loop >= 0) {
            this._writeNetscapeExtension();
        }
        
        // Encode each frame
        for (let i = 0; i < this.frames.length; i++) {
            this._reportProgress(
                (i + 1) / this.frames.length,
                `Encoding frame ${i + 1}/${this.frames.length}...`
            );
            
            this._writeFrame(this.frames[i], i);
        }
        
        // Write trailer
        this.output.push(0x3B);
        
        this._reportProgress(1, 'Complete');
        
        return new Blob([new Uint8Array(this.output)], { type: 'image/gif' });
    }
    
    /**
     * Build global palette from all frames
     * @private
     */
    _buildGlobalPalette() {
        // Sample pixels from all frames
        const sampleSize = Math.min(10000, this.width * this.height);
        const samples = new Uint8ClampedArray(sampleSize * this.frames.length * 4);
        
        let sampleIdx = 0;
        for (const frame of this.frames) {
            const step = Math.ceil(frame.data.length / 4 / sampleSize) * 4;
            for (let i = 0; i < frame.data.length && sampleIdx < samples.length; i += step) {
                samples[sampleIdx++] = frame.data[i];
                samples[sampleIdx++] = frame.data[i + 1];
                samples[sampleIdx++] = frame.data[i + 2];
                samples[sampleIdx++] = 255;
            }
        }
        
        return ColorQuantizer.quantize(samples, 256);
    }
    
    /**
     * Write GIF header
     * @private
     */
    _writeHeader() {
        for (const char of GIF_SIGNATURE) {
            this.output.push(char.charCodeAt(0));
        }
    }
    
    /**
     * Write logical screen descriptor
     * @private
     */
    _writeLogicalScreenDescriptor() {
        // Width (little-endian)
        this.output.push(this.width & 0xff);
        this.output.push((this.width >> 8) & 0xff);
        
        // Height (little-endian)
        this.output.push(this.height & 0xff);
        this.output.push((this.height >> 8) & 0xff);
        
        // Packed field:
        // Global color table flag: 1
        // Color resolution: 7 (8 bits)
        // Sort flag: 0
        // Size of global color table: 7 (256 colors)
        this.output.push(0xf7);
        
        // Background color index
        this.output.push(0);
        
        // Pixel aspect ratio
        this.output.push(0);
    }
    
    /**
     * Write color table
     * @private
     */
    _writeColorTable(palette) {
        for (let i = 0; i < 256; i++) {
            if (i < palette.length) {
                this.output.push(palette[i][0]);
                this.output.push(palette[i][1]);
                this.output.push(palette[i][2]);
            } else {
                this.output.push(0, 0, 0);
            }
        }
    }
    
    /**
     * Write NETSCAPE extension for looping
     * @private
     */
    _writeNetscapeExtension() {
        this.output.push(0x21); // Extension introducer
        this.output.push(0xff); // Application extension
        this.output.push(11);   // Block size
        
        // "NETSCAPE2.0"
        for (const char of 'NETSCAPE2.0') {
            this.output.push(char.charCodeAt(0));
        }
        
        this.output.push(3);    // Sub-block size
        this.output.push(1);    // Loop indicator
        
        // Loop count (little-endian, 0 = infinite)
        const loops = this.loop === 0 ? 0 : this.loop;
        this.output.push(loops & 0xff);
        this.output.push((loops >> 8) & 0xff);
        
        this.output.push(0);    // Block terminator
    }
    
    /**
     * Write single frame
     * @private
     */
    _writeFrame(imageData, index) {
        // Graphic control extension
        this._writeGraphicControlExtension();
        
        // Apply dithering and convert to indexed
        let indexed;
        switch (this.dither) {
            case DITHER_METHOD.FLOYD_STEINBERG:
                indexed = Ditherer.floydSteinberg(imageData, this.globalPalette);
                break;
            case DITHER_METHOD.ORDERED:
                indexed = Ditherer.ordered(imageData, this.globalPalette);
                break;
            default:
                indexed = Ditherer.none(imageData, this.globalPalette);
        }
        
        // Image descriptor
        this._writeImageDescriptor();
        
        // Image data (LZW compressed)
        this._writeImageData(indexed);
    }
    
    /**
     * Write graphic control extension
     * @private
     */
    _writeGraphicControlExtension() {
        this.output.push(0x21); // Extension introducer
        this.output.push(0xf9); // Graphic control label
        this.output.push(4);    // Block size
        
        // Packed field: disposal method 1 (do not dispose)
        this.output.push(0x04);
        
        // Delay time (hundredths of second)
        const delay = Math.round(this.delay / 10);
        this.output.push(delay & 0xff);
        this.output.push((delay >> 8) & 0xff);
        
        // Transparent color index (none)
        this.output.push(0);
        
        // Block terminator
        this.output.push(0);
    }
    
    /**
     * Write image descriptor
     * @private
     */
    _writeImageDescriptor() {
        this.output.push(0x2c); // Image separator
        
        // Left position
        this.output.push(0, 0);
        
        // Top position
        this.output.push(0, 0);
        
        // Width
        this.output.push(this.width & 0xff);
        this.output.push((this.width >> 8) & 0xff);
        
        // Height
        this.output.push(this.height & 0xff);
        this.output.push((this.height >> 8) & 0xff);
        
        // Packed field (no local color table)
        this.output.push(0);
    }
    
    /**
     * Write LZW compressed image data
     * @private
     */
    _writeImageData(indexed) {
        const minCodeSize = 8; // For 256 color palette
        this.output.push(minCodeSize);
        
        // LZW encode
        const compressed = LZWEncoder.encode(indexed, minCodeSize);
        
        // Write in sub-blocks (max 255 bytes each)
        let offset = 0;
        while (offset < compressed.length) {
            const blockSize = Math.min(255, compressed.length - offset);
            this.output.push(blockSize);
            
            for (let i = 0; i < blockSize; i++) {
                this.output.push(compressed[offset + i]);
            }
            
            offset += blockSize;
        }
        
        // Block terminator
        this.output.push(0);
    }
    
    /**
     * Report progress
     * @private
     */
    _reportProgress(progress, message) {
        if (this.onProgress) {
            this.onProgress({ progress, message });
        }
    }
    
    /**
     * Clear all frames
     */
    clear() {
        this.frames = [];
        this.globalPalette = null;
        this.output = [];
    }
    
    /**
     * Get frame count
     */
    get frameCount() {
        return this.frames.length;
    }
}

// ============================================================================
// CONVENIENCE FUNCTION
// ============================================================================

/**
 * Create GIF from array of frames
 * @param {Array} frames - Array of ImageData or canvas
 * @param {Object} options - Encoding options
 * @returns {Promise<Blob>}
 */
export async function createGIF(frames, options = {}) {
    const encoder = new GIFEncoder(options);
    
    for (const frame of frames) {
        encoder.addFrame(frame);
    }
    
    return encoder.encode();
}

// ============================================================================
// EXPORTS
// ============================================================================

export { DITHER_METHOD, PALETTE_METHOD, ColorQuantizer, Ditherer, LZWEncoder };
export default GIFEncoder;
