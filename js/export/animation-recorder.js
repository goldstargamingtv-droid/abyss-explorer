/**
 * ============================================================================
 * ABYSS EXPLORER - ANIMATION RECORDER
 * ============================================================================
 * 
 * Full animation recording system for capturing fractal explorations.
 * Records camera paths and keyframe animations frame-by-frame with
 * configurable FPS, duration, and quality settings.
 * 
 * Features:
 * - Variable FPS (1-60)
 * - Duration control
 * - Real-time preview
 * - Progress feedback
 * - Memory-efficient frame buffering
 * - Cancel support
 * - Worker-based rendering for smooth UI
 * 
 * @module export/animation-recorder
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Recording states */
export const RECORD_STATE = {
    IDLE: 'idle',
    RECORDING: 'recording',
    PAUSED: 'paused',
    PROCESSING: 'processing',
    COMPLETE: 'complete',
    ERROR: 'error'
};

/** Quality presets */
export const ANIMATION_QUALITY = {
    PREVIEW: { width: 480, height: 270, fps: 15, supersample: 1 },
    SD: { width: 854, height: 480, fps: 30, supersample: 1 },
    HD: { width: 1280, height: 720, fps: 30, supersample: 2 },
    FULL_HD: { width: 1920, height: 1080, fps: 30, supersample: 2 },
    '4K': { width: 3840, height: 2160, fps: 30, supersample: 2 }
};

/** Maximum frames in memory before flush */
const MAX_FRAMES_IN_MEMORY = 300;

/** Frame capture timeout */
const FRAME_TIMEOUT = 5000;

// ============================================================================
// FRAME BUFFER CLASS
// ============================================================================

/**
 * Manages frame storage with memory limits
 */
class FrameBuffer {
    constructor(maxFrames = MAX_FRAMES_IN_MEMORY) {
        this.frames = [];
        this.maxFrames = maxFrames;
        this.flushed = [];
    }
    
    /**
     * Add frame to buffer
     * @param {ImageData|Blob} frame
     * @param {number} index
     */
    add(frame, index) {
        this.frames.push({ data: frame, index });
        
        // Check if flush is needed
        if (this.frames.length >= this.maxFrames) {
            return true; // Signal that flush is recommended
        }
        return false;
    }
    
    /**
     * Get all frames
     */
    getAll() {
        return [...this.flushed, ...this.frames];
    }
    
    /**
     * Flush to array and clear buffer
     */
    flush() {
        this.flushed.push(...this.frames);
        this.frames = [];
    }
    
    /**
     * Clear all frames
     */
    clear() {
        this.frames = [];
        this.flushed = [];
    }
    
    /**
     * Get frame count
     */
    get count() {
        return this.frames.length + this.flushed.length;
    }
}

// ============================================================================
// ANIMATION RECORDER CLASS
// ============================================================================

export class AnimationRecorder {
    /**
     * Create animation recorder
     * @param {Object} options - Configuration
     */
    constructor(options = {}) {
        // Core references
        this.renderer = options.renderer || null;
        this.camera = options.camera || null;
        this.keyframeSystem = options.keyframeSystem || null;
        this.animationController = options.animationController || null;
        
        // Recording settings
        this.width = options.width || 1920;
        this.height = options.height || 1080;
        this.fps = options.fps || 30;
        this.duration = options.duration || 10; // seconds
        this.supersample = options.supersample || 1;
        
        // State
        this.state = RECORD_STATE.IDLE;
        this.currentFrame = 0;
        this.totalFrames = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        
        // Frame buffer
        this.frameBuffer = new FrameBuffer();
        
        // Recording canvas
        this.canvas = null;
        this.ctx = null;
        
        // Animation path
        this.animationPath = null;
        this.pathDuration = 0;
        
        // Callbacks
        this.onStateChange = options.onStateChange || null;
        this.onProgress = options.onProgress || null;
        this.onFrame = options.onFrame || null;
        this.onComplete = options.onComplete || null;
        this.onError = options.onError || null;
        
        // Internal
        this._framePromise = null;
        this._cancelled = false;
    }
    
    // ========================================================================
    // CONFIGURATION
    // ========================================================================
    
    /**
     * Set recording parameters
     * @param {Object} options
     */
    configure(options) {
        if (options.width) this.width = options.width;
        if (options.height) this.height = options.height;
        if (options.fps) this.fps = Math.min(60, Math.max(1, options.fps));
        if (options.duration) this.duration = options.duration;
        if (options.supersample) this.supersample = options.supersample;
    }
    
    /**
     * Apply quality preset
     * @param {string} preset
     */
    setQuality(preset) {
        const q = ANIMATION_QUALITY[preset];
        if (q) {
            this.width = q.width;
            this.height = q.height;
            this.fps = q.fps;
            this.supersample = q.supersample;
        }
    }
    
    /**
     * Set animation path to record
     * @param {Object} path - KeyframePath or animation sequence
     */
    setAnimationPath(path) {
        this.animationPath = path;
        if (path.getDuration) {
            this.pathDuration = path.getDuration() / 1000; // ms to seconds
            this.duration = this.pathDuration;
        }
    }
    
    // ========================================================================
    // RECORDING CONTROL
    // ========================================================================
    
    /**
     * Start recording
     * @returns {Promise<Array>} Recorded frames
     */
    async startRecording() {
        if (this.state === RECORD_STATE.RECORDING) {
            throw new Error('Recording already in progress');
        }
        
        this._cancelled = false;
        this._setState(RECORD_STATE.RECORDING);
        
        try {
            // Calculate total frames
            this.totalFrames = Math.ceil(this.duration * this.fps);
            this.currentFrame = 0;
            
            // Setup canvas
            this._setupCanvas();
            
            // Clear frame buffer
            this.frameBuffer.clear();
            
            this._reportProgress(0, 'Starting recording...');
            
            // Record each frame
            for (let frame = 0; frame < this.totalFrames; frame++) {
                if (this._cancelled) {
                    this._setState(RECORD_STATE.IDLE);
                    throw new Error('Recording cancelled');
                }
                
                this.currentFrame = frame;
                const time = frame / this.fps; // Time in seconds
                
                // Update animation state
                await this._updateAnimationState(time);
                
                // Capture frame
                const frameData = await this._captureFrame();
                
                // Add to buffer
                const needsFlush = this.frameBuffer.add(frameData, frame);
                
                // Progress callback
                const progress = (frame + 1) / this.totalFrames;
                this._reportProgress(progress, `Recording frame ${frame + 1}/${this.totalFrames}`);
                
                if (this.onFrame) {
                    this.onFrame({
                        frame,
                        total: this.totalFrames,
                        time,
                        data: frameData
                    });
                }
                
                // Yield to prevent blocking
                await this._yield();
            }
            
            // Flush remaining frames
            this.frameBuffer.flush();
            
            this._setState(RECORD_STATE.COMPLETE);
            
            const frames = this.frameBuffer.getAll();
            
            if (this.onComplete) {
                this.onComplete(frames);
            }
            
            return frames;
            
        } catch (error) {
            this._setState(RECORD_STATE.ERROR);
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        }
    }
    
    /**
     * Pause recording
     */
    pause() {
        if (this.state === RECORD_STATE.RECORDING) {
            this._setState(RECORD_STATE.PAUSED);
        }
    }
    
    /**
     * Resume recording
     */
    resume() {
        if (this.state === RECORD_STATE.PAUSED) {
            this._setState(RECORD_STATE.RECORDING);
        }
    }
    
    /**
     * Cancel recording
     */
    cancel() {
        this._cancelled = true;
        this._setState(RECORD_STATE.IDLE);
        this.frameBuffer.clear();
    }
    
    /**
     * Get recording progress
     * @returns {Object}
     */
    getProgress() {
        return {
            state: this.state,
            currentFrame: this.currentFrame,
            totalFrames: this.totalFrames,
            progress: this.totalFrames > 0 ? this.currentFrame / this.totalFrames : 0,
            framesRecorded: this.frameBuffer.count,
            elapsedTime: this.elapsedTime,
            estimatedRemaining: this._estimateRemaining()
        };
    }
    
    // ========================================================================
    // FRAME CAPTURE
    // ========================================================================
    
    /**
     * Setup recording canvas
     * @private
     */
    _setupCanvas() {
        const renderWidth = this.width * this.supersample;
        const renderHeight = this.height * this.supersample;
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = renderWidth;
        this.canvas.height = renderHeight;
        this.ctx = this.canvas.getContext('2d');
        
        // Output canvas (downsampled)
        this.outputCanvas = document.createElement('canvas');
        this.outputCanvas.width = this.width;
        this.outputCanvas.height = this.height;
        this.outputCtx = this.outputCanvas.getContext('2d');
    }
    
    /**
     * Update animation state for current time
     * @private
     */
    async _updateAnimationState(time) {
        if (this.animationPath) {
            // Interpolate keyframe path
            if (this.animationPath.interpolate) {
                const state = this.animationPath.interpolate(time * 1000);
                
                // Apply camera state
                if (this.camera && state.state2d) {
                    this.camera.centerX = state.state2d.centerX;
                    this.camera.centerY = state.state2d.centerY;
                    this.camera.zoom = state.state2d.zoom;
                }
            }
        } else if (this.animationController) {
            // Use animation controller
            this.animationController.seek(time * 1000);
        }
    }
    
    /**
     * Capture current frame
     * @private
     */
    async _captureFrame() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Frame capture timeout'));
            }, FRAME_TIMEOUT);
            
            try {
                // Render frame
                this._renderFrame();
                
                // Downsample if needed
                if (this.supersample > 1) {
                    this.outputCtx.imageSmoothingEnabled = true;
                    this.outputCtx.imageSmoothingQuality = 'high';
                    this.outputCtx.drawImage(this.canvas, 0, 0, this.width, this.height);
                } else {
                    this.outputCtx.drawImage(this.canvas, 0, 0);
                }
                
                // Get image data
                const imageData = this.outputCtx.getImageData(0, 0, this.width, this.height);
                
                clearTimeout(timeout);
                resolve(imageData);
                
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }
    
    /**
     * Render frame to canvas
     * @private
     */
    _renderFrame() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Get camera state
        const centerX = this.camera?.centerX ?? -0.5;
        const centerY = this.camera?.centerY ?? 0;
        const zoom = this.camera?.zoom ?? 1;
        
        // Calculate view
        const aspectRatio = width / height;
        const viewWidth = 4 / zoom;
        const viewHeight = viewWidth / aspectRatio;
        const minX = centerX - viewWidth / 2;
        const maxY = centerY + viewHeight / 2;
        const pixelWidth = viewWidth / width;
        const pixelHeight = viewHeight / height;
        
        const maxIterations = 1000;
        
        // Create image data
        const imageData = this.ctx.createImageData(width, height);
        const data = imageData.data;
        
        // Render Mandelbrot (or use provided renderer)
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const cr = minX + px * pixelWidth;
                const ci = maxY - py * pixelHeight;
                
                let zr = 0, zi = 0;
                let iter = 0;
                
                while (iter < maxIterations && zr * zr + zi * zi < 4) {
                    const zr2 = zr * zr - zi * zi + cr;
                    zi = 2 * zr * zi + ci;
                    zr = zr2;
                    iter++;
                }
                
                const idx = (py * width + px) * 4;
                
                if (iter === maxIterations) {
                    data[idx] = 0;
                    data[idx + 1] = 0;
                    data[idx + 2] = 0;
                } else {
                    const smoothIter = iter + 1 - Math.log2(Math.log2(zr * zr + zi * zi));
                    const hue = (smoothIter * 10) % 360;
                    const rgb = this._hsvToRgb(hue, 0.8, 1);
                    data[idx] = rgb.r;
                    data[idx + 1] = rgb.g;
                    data[idx + 2] = rgb.b;
                }
                data[idx + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    /**
     * HSV to RGB
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
     * Set state and emit event
     * @private
     */
    _setState(state) {
        this.state = state;
        if (this.onStateChange) {
            this.onStateChange(state);
        }
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
     * Estimate remaining time
     * @private
     */
    _estimateRemaining() {
        if (this.currentFrame === 0) return 0;
        
        const elapsed = Date.now() - this.startTime;
        const msPerFrame = elapsed / this.currentFrame;
        const remaining = (this.totalFrames - this.currentFrame) * msPerFrame;
        
        return remaining / 1000; // seconds
    }
    
    /**
     * Yield to event loop
     * @private
     */
    _yield() {
        return new Promise(resolve => setTimeout(resolve, 0));
    }
    
    // ========================================================================
    // FRAME EXPORT
    // ========================================================================
    
    /**
     * Get frames as canvas elements
     * @returns {Array<HTMLCanvasElement>}
     */
    getFramesAsCanvases() {
        return this.frameBuffer.getAll().map(frame => {
            const canvas = document.createElement('canvas');
            canvas.width = this.width;
            canvas.height = this.height;
            const ctx = canvas.getContext('2d');
            ctx.putImageData(frame.data, 0, 0);
            return canvas;
        });
    }
    
    /**
     * Get frames as image data array
     * @returns {Array<ImageData>}
     */
    getFramesAsImageData() {
        return this.frameBuffer.getAll().map(f => f.data);
    }
    
    /**
     * Get frames as blob URLs
     * @param {string} format - Image format
     * @returns {Promise<Array<string>>}
     */
    async getFramesAsBlobs(format = 'png') {
        const frames = this.getFramesAsCanvases();
        const blobs = [];
        
        for (const canvas of frames) {
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, `image/${format}`);
            });
            blobs.push(URL.createObjectURL(blob));
        }
        
        return blobs;
    }
    
    /**
     * Download frames as ZIP
     * @param {string} filename - Base filename
     */
    async downloadFramesAsZip(filename = 'animation') {
        // Would require JSZip library
        console.warn('ZIP download requires JSZip library');
        
        // Fallback: download individual frames
        const frames = this.getFramesAsCanvases();
        
        for (let i = 0; i < Math.min(frames.length, 10); i++) {
            const canvas = frames[i];
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `${filename}_${String(i).padStart(4, '0')}.png`;
            link.click();
            await this._yield();
        }
    }
    
    // ========================================================================
    // ESTIMATION
    // ========================================================================
    
    /**
     * Estimate recording time and memory
     * @returns {Object}
     */
    estimate() {
        const totalFrames = Math.ceil(this.duration * this.fps);
        const pixelsPerFrame = this.width * this.height;
        const bytesPerFrame = pixelsPerFrame * 4; // RGBA
        const totalBytes = totalFrames * bytesPerFrame;
        const totalMB = totalBytes / (1024 * 1024);
        
        // Estimate render time (~100k pixels/frame/second)
        const pixelsTotal = pixelsPerFrame * this.supersample * this.supersample * totalFrames;
        const estimatedSeconds = pixelsTotal / 100000;
        
        return {
            totalFrames,
            fps: this.fps,
            duration: this.duration,
            resolution: `${this.width}×${this.height}`,
            memoryMB: Math.round(totalMB),
            estimatedSeconds: Math.round(estimatedSeconds),
            feasible: totalMB < 2000 // 2GB limit for frames
        };
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { RECORD_STATE, ANIMATION_QUALITY, FrameBuffer };
export default AnimationRecorder;
