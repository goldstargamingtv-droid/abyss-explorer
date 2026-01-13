/**
 * ============================================================================
 * ABYSS EXPLORER - IMAGE EXPORT
 * ============================================================================
 * 
 * High-resolution image export system supporting up to 16K+ resolution.
 * Uses progressive tile-based rendering to handle memory limits and
 * supersampling for anti-aliased output.
 * 
 * Features:
 * - Resolution up to 16384x16384 (or higher with tiling)
 * - Supersampling: 1x, 2x, 4x, 8x, 16x
 * - Formats: PNG, JPEG, WebP
 * - Progressive rendering with progress feedback
 * - Memory-efficient tile-based approach
 * - Cancel support for long renders
 * 
 * Browser Limits:
 * - Canvas max size varies: ~16384px (Chrome), ~32767px (Firefox)
 * - Memory: ~4GB limit for single canvas
 * - Use tiling for larger exports
 * 
 * @module export/image-export
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum canvas size before tiling is required */
const MAX_CANVAS_SIZE = 16384;

/** Tile size for progressive rendering */
const DEFAULT_TILE_SIZE = 1024;

/** Quality presets */
export const QUALITY_PRESETS = {
    DRAFT: { supersample: 1, iterations: 500 },
    NORMAL: { supersample: 2, iterations: 1000 },
    HIGH: { supersample: 4, iterations: 2000 },
    ULTRA: { supersample: 8, iterations: 4000 },
    EXTREME: { supersample: 16, iterations: 8000 }
};

/** Resolution presets */
export const RESOLUTION_PRESETS = {
    HD: { width: 1920, height: 1080, label: 'HD (1920×1080)' },
    '2K': { width: 2560, height: 1440, label: '2K (2560×1440)' },
    '4K': { width: 3840, height: 2160, label: '4K (3840×2160)' },
    '5K': { width: 5120, height: 2880, label: '5K (5120×2880)' },
    '8K': { width: 7680, height: 4320, label: '8K (7680×4320)' },
    '16K': { width: 15360, height: 8640, label: '16K (15360×8640)' },
    SQUARE_4K: { width: 4096, height: 4096, label: 'Square 4K' },
    SQUARE_8K: { width: 8192, height: 8192, label: 'Square 8K' },
    POSTER: { width: 4096, height: 6144, label: 'Poster (2:3)' },
    ULTRAWIDE: { width: 5120, height: 1440, label: 'Ultrawide (32:9)' }
};

/** Export formats */
export const EXPORT_FORMAT = {
    PNG: 'png',
    JPEG: 'jpeg',
    WEBP: 'webp'
};

// ============================================================================
// IMAGE EXPORTER CLASS
// ============================================================================

export class ImageExporter {
    /**
     * Create image exporter
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Core references
        this.renderer = options.renderer || null;
        this.camera = options.camera || null;
        this.fractal = options.fractal || null;
        this.coloring = options.coloring || null;
        this.palette = options.palette || null;
        
        // Export settings
        this.width = options.width || 1920;
        this.height = options.height || 1080;
        this.supersample = options.supersample || 2;
        this.format = options.format || EXPORT_FORMAT.PNG;
        this.quality = options.quality || 0.95; // For JPEG/WebP
        this.tileSize = options.tileSize || DEFAULT_TILE_SIZE;
        
        // State
        this.isExporting = false;
        this.cancelled = false;
        this.progress = 0;
        
        // Callbacks
        this.onProgress = options.onProgress || null;
        this.onComplete = options.onComplete || null;
        this.onError = options.onError || null;
        
        // Canvas elements
        this.exportCanvas = null;
        this.exportCtx = null;
        this.tileCanvas = null;
        this.tileCtx = null;
    }
    
    // ========================================================================
    // CONFIGURATION
    // ========================================================================
    
    /**
     * Set export resolution
     * @param {number} width
     * @param {number} height
     */
    setResolution(width, height) {
        this.width = Math.min(width, MAX_CANVAS_SIZE * 4); // Allow tiling up to 4x max
        this.height = Math.min(height, MAX_CANVAS_SIZE * 4);
    }
    
    /**
     * Set resolution from preset
     * @param {string} preset - Preset name
     */
    setResolutionPreset(preset) {
        const p = RESOLUTION_PRESETS[preset];
        if (p) {
            this.width = p.width;
            this.height = p.height;
        }
    }
    
    /**
     * Set quality preset
     * @param {string} preset - Preset name
     */
    setQualityPreset(preset) {
        const p = QUALITY_PRESETS[preset];
        if (p) {
            this.supersample = p.supersample;
        }
    }
    
    /**
     * Set export format
     * @param {string} format - png, jpeg, or webp
     */
    setFormat(format) {
        this.format = format;
    }
    
    // ========================================================================
    // EXPORT METHODS
    // ========================================================================
    
    /**
     * Start export process
     * @param {Object} options - Override options
     * @returns {Promise<Blob>}
     */
    async export(options = {}) {
        if (this.isExporting) {
            throw new Error('Export already in progress');
        }
        
        // Apply options
        const config = {
            width: options.width || this.width,
            height: options.height || this.height,
            supersample: options.supersample || this.supersample,
            format: options.format || this.format,
            quality: options.quality || this.quality,
            camera: options.camera || this.camera,
            fractal: options.fractal || this.fractal,
            coloring: options.coloring || this.coloring,
            palette: options.palette || this.palette
        };
        
        this.isExporting = true;
        this.cancelled = false;
        this.progress = 0;
        
        try {
            // Determine if tiling is needed
            const needsTiling = config.width > MAX_CANVAS_SIZE || 
                               config.height > MAX_CANVAS_SIZE;
            
            let imageData;
            
            if (needsTiling) {
                imageData = await this._exportWithTiling(config);
            } else {
                imageData = await this._exportDirect(config);
            }
            
            if (this.cancelled) {
                throw new Error('Export cancelled');
            }
            
            // Convert to blob
            const blob = await this._canvasToBlob(
                this.exportCanvas, 
                config.format, 
                config.quality
            );
            
            this._reportProgress(1, 'Complete');
            
            if (this.onComplete) {
                this.onComplete(blob);
            }
            
            return blob;
            
        } catch (error) {
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        } finally {
            this.isExporting = false;
            this._cleanup();
        }
    }
    
    /**
     * Export directly without tiling
     * @private
     */
    async _exportDirect(config) {
        const { width, height, supersample } = config;
        
        // Calculate render size with supersampling
        const renderWidth = width * supersample;
        const renderHeight = height * supersample;
        
        this._reportProgress(0.05, 'Creating canvas...');
        
        // Create render canvas
        this.exportCanvas = document.createElement('canvas');
        this.exportCanvas.width = width;
        this.exportCanvas.height = height;
        this.exportCtx = this.exportCanvas.getContext('2d');
        
        // Create supersample canvas
        const ssCanvas = document.createElement('canvas');
        ssCanvas.width = renderWidth;
        ssCanvas.height = renderHeight;
        const ssCtx = ssCanvas.getContext('2d');
        
        this._reportProgress(0.1, 'Rendering...');
        
        // Render at full resolution
        await this._renderToCanvas(ssCanvas, ssCtx, config);
        
        if (this.cancelled) return null;
        
        this._reportProgress(0.9, 'Downsampling...');
        
        // Downsample to final size
        this.exportCtx.imageSmoothingEnabled = true;
        this.exportCtx.imageSmoothingQuality = 'high';
        this.exportCtx.drawImage(ssCanvas, 0, 0, width, height);
        
        return this.exportCanvas;
    }
    
    /**
     * Export with tile-based rendering for large images
     * @private
     */
    async _exportWithTiling(config) {
        const { width, height, supersample } = config;
        
        this._reportProgress(0.02, 'Initializing tiled export...');
        
        // Create final canvas
        this.exportCanvas = document.createElement('canvas');
        this.exportCanvas.width = width;
        this.exportCanvas.height = height;
        this.exportCtx = this.exportCanvas.getContext('2d');
        
        // Create tile canvas (limited size)
        const tileWidth = Math.min(this.tileSize, width);
        const tileHeight = Math.min(this.tileSize, height);
        
        this.tileCanvas = document.createElement('canvas');
        this.tileCanvas.width = tileWidth * supersample;
        this.tileCanvas.height = tileHeight * supersample;
        this.tileCtx = this.tileCanvas.getContext('2d');
        
        // Temp canvas for downsampled tile
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = tileWidth;
        tempCanvas.height = tileHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Calculate tiles
        const tilesX = Math.ceil(width / tileWidth);
        const tilesY = Math.ceil(height / tileHeight);
        const totalTiles = tilesX * tilesY;
        let completedTiles = 0;
        
        // Get camera state
        const camera = config.camera;
        const originalCenterX = camera?.centerX || -0.5;
        const originalCenterY = camera?.centerY || 0;
        const originalZoom = camera?.zoom || 1;
        
        // Calculate view bounds
        const aspectRatio = width / height;
        const viewWidth = 4 / originalZoom;
        const viewHeight = viewWidth / aspectRatio;
        
        // Render each tile
        for (let ty = 0; ty < tilesY; ty++) {
            for (let tx = 0; tx < tilesX; tx++) {
                if (this.cancelled) return null;
                
                // Calculate tile bounds
                const tileX = tx * tileWidth;
                const tileY = ty * tileHeight;
                const currentTileWidth = Math.min(tileWidth, width - tileX);
                const currentTileHeight = Math.min(tileHeight, height - tileY);
                
                // Calculate tile center in complex plane
                const tileCenterX = originalCenterX + 
                    ((tileX + currentTileWidth / 2) / width - 0.5) * viewWidth;
                const tileCenterY = originalCenterY - 
                    ((tileY + currentTileHeight / 2) / height - 0.5) * viewHeight;
                
                // Calculate tile zoom (adjusted for tile size)
                const tileZoom = originalZoom * (width / currentTileWidth);
                
                // Create tile config
                const tileConfig = {
                    ...config,
                    width: currentTileWidth,
                    height: currentTileHeight,
                    camera: {
                        centerX: tileCenterX,
                        centerY: tileCenterY,
                        zoom: tileZoom
                    }
                };
                
                // Resize tile canvas if needed
                if (this.tileCanvas.width !== currentTileWidth * supersample ||
                    this.tileCanvas.height !== currentTileHeight * supersample) {
                    this.tileCanvas.width = currentTileWidth * supersample;
                    this.tileCanvas.height = currentTileHeight * supersample;
                }
                
                // Render tile
                await this._renderToCanvas(this.tileCanvas, this.tileCtx, tileConfig);
                
                // Downsample tile
                tempCanvas.width = currentTileWidth;
                tempCanvas.height = currentTileHeight;
                tempCtx.imageSmoothingEnabled = true;
                tempCtx.imageSmoothingQuality = 'high';
                tempCtx.drawImage(this.tileCanvas, 0, 0, currentTileWidth, currentTileHeight);
                
                // Draw to final canvas
                this.exportCtx.drawImage(tempCanvas, tileX, tileY);
                
                completedTiles++;
                const progress = 0.1 + (completedTiles / totalTiles) * 0.85;
                this._reportProgress(progress, 
                    `Rendering tile ${completedTiles}/${totalTiles}...`);
                
                // Yield to prevent blocking
                await this._yield();
            }
        }
        
        return this.exportCanvas;
    }
    
    /**
     * Render fractal to canvas
     * @private
     */
    async _renderToCanvas(canvas, ctx, config) {
        const { width, height, supersample, camera, fractal, coloring, palette } = config;
        
        const renderWidth = canvas.width;
        const renderHeight = canvas.height;
        
        // Get fractal function (from config or use default mandelbrot)
        const fractalFunc = fractal?.iterate || this._defaultMandelbrot;
        const maxIterations = coloring?.maxIterations || 1000;
        
        // Get camera parameters
        const centerX = camera?.centerX ?? -0.5;
        const centerY = camera?.centerY ?? 0;
        const zoom = camera?.zoom ?? 1;
        
        // Calculate view bounds
        const aspectRatio = renderWidth / renderHeight;
        const viewWidth = 4 / zoom;
        const viewHeight = viewWidth / aspectRatio;
        const minX = centerX - viewWidth / 2;
        const maxY = centerY + viewHeight / 2;
        const pixelWidth = viewWidth / renderWidth;
        const pixelHeight = viewHeight / renderHeight;
        
        // Create image data
        const imageData = ctx.createImageData(renderWidth, renderHeight);
        const data = imageData.data;
        
        // Get palette function
        const getColor = palette?.getColor || this._defaultPalette;
        
        // Render pixels
        const chunkSize = 10000; // Process in chunks to allow cancellation
        let pixelIndex = 0;
        
        for (let py = 0; py < renderHeight; py++) {
            for (let px = 0; px < renderWidth; px++) {
                // Map pixel to complex plane
                const cr = minX + px * pixelWidth;
                const ci = maxY - py * pixelHeight;
                
                // Iterate
                let zr = 0, zi = 0;
                let iter = 0;
                
                while (iter < maxIterations && zr * zr + zi * zi < 4) {
                    const zr2 = zr * zr - zi * zi + cr;
                    zi = 2 * zr * zi + ci;
                    zr = zr2;
                    iter++;
                }
                
                // Color the pixel
                const idx = (py * renderWidth + px) * 4;
                
                if (iter === maxIterations) {
                    // In set - black
                    data[idx] = 0;
                    data[idx + 1] = 0;
                    data[idx + 2] = 0;
                } else {
                    // Smooth coloring
                    const smoothIter = iter + 1 - Math.log2(Math.log2(zr * zr + zi * zi));
                    const t = smoothIter / maxIterations;
                    
                    // Get color from palette
                    const color = getColor(t);
                    data[idx] = color.r;
                    data[idx + 1] = color.g;
                    data[idx + 2] = color.b;
                }
                data[idx + 3] = 255;
                
                pixelIndex++;
                
                // Check for cancellation periodically
                if (pixelIndex % chunkSize === 0) {
                    if (this.cancelled) return;
                    await this._yield();
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    /**
     * Default Mandelbrot iteration
     * @private
     */
    _defaultMandelbrot(cr, ci, maxIter) {
        let zr = 0, zi = 0;
        let iter = 0;
        
        while (iter < maxIter && zr * zr + zi * zi < 4) {
            const zr2 = zr * zr - zi * zi + cr;
            zi = 2 * zr * zi + ci;
            zr = zr2;
            iter++;
        }
        
        return { iter, zr, zi };
    }
    
    /**
     * Default palette (rainbow)
     * @private
     */
    _defaultPalette(t) {
        const hue = t * 360;
        return this._hsvToRgb(hue, 0.8, 1);
    }
    
    /**
     * HSV to RGB conversion
     * @private
     */
    _hsvToRgb(h, s, v) {
        h = h % 360;
        const c = v * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;
        
        let r, g, b;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        
        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }
    
    // ========================================================================
    // UTILITIES
    // ========================================================================
    
    /**
     * Convert canvas to blob
     * @private
     */
    _canvasToBlob(canvas, format, quality) {
        return new Promise((resolve, reject) => {
            const mimeType = `image/${format}`;
            
            if (canvas.toBlob) {
                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                }, mimeType, quality);
            } else {
                // Fallback for older browsers
                try {
                    const dataUrl = canvas.toDataURL(mimeType, quality);
                    const binary = atob(dataUrl.split(',')[1]);
                    const array = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                        array[i] = binary.charCodeAt(i);
                    }
                    resolve(new Blob([array], { type: mimeType }));
                } catch (e) {
                    reject(e);
                }
            }
        });
    }
    
    /**
     * Report progress
     * @private
     */
    _reportProgress(progress, message = '') {
        this.progress = progress;
        if (this.onProgress) {
            this.onProgress({ progress, message });
        }
    }
    
    /**
     * Yield to event loop
     * @private
     */
    _yield() {
        return new Promise(resolve => setTimeout(resolve, 0));
    }
    
    /**
     * Cleanup resources
     * @private
     */
    _cleanup() {
        // Clear canvas references to free memory
        this.exportCanvas = null;
        this.exportCtx = null;
        this.tileCanvas = null;
        this.tileCtx = null;
    }
    
    /**
     * Cancel export
     */
    cancel() {
        this.cancelled = true;
    }
    
    // ========================================================================
    // DOWNLOAD
    // ========================================================================
    
    /**
     * Export and download image
     * @param {string} filename - Base filename
     * @param {Object} options - Export options
     */
    async exportAndDownload(filename = 'fractal', options = {}) {
        const format = options.format || this.format;
        const blob = await this.export(options);
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${format}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        return blob;
    }
    
    /**
     * Export to data URL
     * @param {Object} options - Export options
     * @returns {Promise<string>}
     */
    async exportToDataURL(options = {}) {
        const blob = await this.export(options);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    // ========================================================================
    // ESTIMATION
    // ========================================================================
    
    /**
     * Estimate export time
     * @param {Object} options - Export options
     * @returns {Object} Estimate with time and memory
     */
    estimateExport(options = {}) {
        const width = options.width || this.width;
        const height = options.height || this.height;
        const supersample = options.supersample || this.supersample;
        
        const totalPixels = width * height * supersample * supersample;
        const memoryMB = (totalPixels * 4) / (1024 * 1024); // RGBA
        
        // Rough estimate: ~1M pixels/second on modern hardware
        const estimatedSeconds = totalPixels / 1000000;
        
        const needsTiling = width > MAX_CANVAS_SIZE || height > MAX_CANVAS_SIZE;
        const tiles = needsTiling ? 
            Math.ceil(width / this.tileSize) * Math.ceil(height / this.tileSize) : 1;
        
        return {
            pixels: totalPixels,
            memoryMB: Math.round(memoryMB),
            estimatedSeconds: Math.round(estimatedSeconds),
            needsTiling,
            tiles,
            feasible: memoryMB < 4000 // 4GB limit
        };
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { QUALITY_PRESETS, RESOLUTION_PRESETS, EXPORT_FORMAT };
export default ImageExporter;
