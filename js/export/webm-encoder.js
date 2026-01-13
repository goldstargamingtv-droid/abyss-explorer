/**
 * ============================================================================
 * ABYSS EXPLORER - WEBM ENCODER
 * ============================================================================
 * 
 * WebM/MP4 video encoding using MediaRecorder API with fallback options.
 * Supports high-bitrate output, optional audio, and browser-compatible formats.
 * 
 * Features:
 * - WebM (VP8/VP9) encoding via MediaRecorder
 * - High bitrate options (up to 50 Mbps)
 * - Frame-by-frame rendering with canvas capture
 * - Optional synthesized audio
 * - Progress callbacks
 * - Browser compatibility detection
 * 
 * Browser Support:
 * - Chrome: WebM VP8/VP9, experimental MP4
 * - Firefox: WebM VP8
 * - Safari: MP4 H.264 (limited MediaRecorder support)
 * 
 * @module export/webm-encoder
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Video codecs */
export const VIDEO_CODEC = {
    VP8: 'vp8',
    VP9: 'vp9',
    H264: 'h264',
    AV1: 'av1'
};

/** Container formats */
export const CONTAINER_FORMAT = {
    WEBM: 'webm',
    MP4: 'mp4'
};

/** Quality presets */
export const VIDEO_QUALITY = {
    LOW: { bitrate: 2_000_000, label: 'Low (2 Mbps)' },
    MEDIUM: { bitrate: 8_000_000, label: 'Medium (8 Mbps)' },
    HIGH: { bitrate: 16_000_000, label: 'High (16 Mbps)' },
    VERY_HIGH: { bitrate: 32_000_000, label: 'Very High (32 Mbps)' },
    ULTRA: { bitrate: 50_000_000, label: 'Ultra (50 Mbps)' }
};

/** MIME types for different codec combinations */
const MIME_TYPES = {
    'webm-vp8': 'video/webm;codecs=vp8',
    'webm-vp9': 'video/webm;codecs=vp9',
    'webm-av1': 'video/webm;codecs=av1',
    'mp4-h264': 'video/mp4;codecs=avc1.42E01E',
    'mp4-av1': 'video/mp4;codecs=av1'
};

// ============================================================================
// CODEC SUPPORT DETECTION
// ============================================================================

/**
 * Check which codecs are supported
 * @returns {Object} Supported codec info
 */
export function detectCodecSupport() {
    const support = {
        mediaRecorder: typeof MediaRecorder !== 'undefined',
        codecs: {}
    };
    
    if (!support.mediaRecorder) return support;
    
    // Test each MIME type
    for (const [key, mimeType] of Object.entries(MIME_TYPES)) {
        try {
            support.codecs[key] = MediaRecorder.isTypeSupported(mimeType);
        } catch {
            support.codecs[key] = false;
        }
    }
    
    // Determine best available codec
    if (support.codecs['webm-vp9']) {
        support.recommended = { format: 'webm', codec: 'vp9' };
    } else if (support.codecs['webm-vp8']) {
        support.recommended = { format: 'webm', codec: 'vp8' };
    } else if (support.codecs['mp4-h264']) {
        support.recommended = { format: 'mp4', codec: 'h264' };
    } else {
        support.recommended = null;
    }
    
    return support;
}

// ============================================================================
// WEBM ENCODER CLASS
// ============================================================================

export class WebMEncoder {
    /**
     * Create WebM encoder
     * @param {Object} options
     */
    constructor(options = {}) {
        // Video settings
        this.width = options.width || 1920;
        this.height = options.height || 1080;
        this.fps = options.fps || 30;
        this.bitrate = options.bitrate || VIDEO_QUALITY.HIGH.bitrate;
        this.codec = options.codec || VIDEO_CODEC.VP9;
        this.format = options.format || CONTAINER_FORMAT.WEBM;
        
        // Audio settings
        this.includeAudio = options.includeAudio || false;
        this.audioContext = null;
        this.audioDestination = null;
        
        // State
        this.isEncoding = false;
        this.frames = [];
        this.chunks = [];
        
        // MediaRecorder
        this.mediaRecorder = null;
        this.stream = null;
        this.canvas = null;
        this.ctx = null;
        
        // Callbacks
        this.onProgress = options.onProgress || null;
        this.onComplete = options.onComplete || null;
        this.onError = options.onError || null;
    }
    
    // ========================================================================
    // SETUP
    // ========================================================================
    
    /**
     * Initialize encoder with canvas
     * @param {HTMLCanvasElement} sourceCanvas - Optional source canvas
     */
    init(sourceCanvas = null) {
        // Create or use canvas
        if (sourceCanvas) {
            this.canvas = sourceCanvas;
        } else {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        }
        this.ctx = this.canvas.getContext('2d');
        
        // Update dimensions from canvas
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    
    /**
     * Get MIME type for current settings
     * @private
     */
    _getMimeType() {
        const key = `${this.format}-${this.codec}`;
        return MIME_TYPES[key] || 'video/webm';
    }
    
    // ========================================================================
    // FRAME-BASED ENCODING
    // ========================================================================
    
    /**
     * Add frame to encoder
     * @param {ImageData|HTMLCanvasElement|Uint8ClampedArray} frame
     */
    addFrame(frame) {
        if (frame instanceof ImageData) {
            this.frames.push(frame);
        } else if (frame instanceof HTMLCanvasElement) {
            const ctx = frame.getContext('2d');
            const imageData = ctx.getImageData(0, 0, frame.width, frame.height);
            this.frames.push(imageData);
        } else if (frame instanceof Uint8ClampedArray) {
            const imageData = new ImageData(frame, this.width, this.height);
            this.frames.push(imageData);
        } else {
            throw new Error('Invalid frame format');
        }
    }
    
    /**
     * Encode all frames to video
     * @returns {Promise<Blob>}
     */
    async encode() {
        if (this.frames.length === 0) {
            throw new Error('No frames to encode');
        }
        
        this.isEncoding = true;
        this.chunks = [];
        
        try {
            // Detect support and get best codec
            const support = detectCodecSupport();
            if (!support.mediaRecorder) {
                throw new Error('MediaRecorder not supported');
            }
            
            // Use recommended codec if current not supported
            const mimeType = this._getMimeType();
            if (!MediaRecorder.isTypeSupported(mimeType) && support.recommended) {
                this.format = support.recommended.format;
                this.codec = support.recommended.codec;
            }
            
            return await this._encodeWithMediaRecorder();
            
        } catch (error) {
            if (this.onError) this.onError(error);
            throw error;
        } finally {
            this.isEncoding = false;
        }
    }
    
    /**
     * Encode using MediaRecorder
     * @private
     */
    async _encodeWithMediaRecorder() {
        return new Promise((resolve, reject) => {
            // Create canvas stream
            this.init();
            this.stream = this.canvas.captureStream(0); // 0 fps = manual frames
            
            // Add audio track if requested
            if (this.includeAudio) {
                this._setupAudio();
            }
            
            // Create MediaRecorder
            const options = {
                mimeType: this._getMimeType(),
                videoBitsPerSecond: this.bitrate
            };
            
            try {
                this.mediaRecorder = new MediaRecorder(this.stream, options);
            } catch (e) {
                // Fallback to default options
                this.mediaRecorder = new MediaRecorder(this.stream);
            }
            
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.chunks.push(e.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.chunks, { 
                    type: this._getMimeType() 
                });
                
                if (this.onComplete) this.onComplete(blob);
                resolve(blob);
            };
            
            this.mediaRecorder.onerror = (e) => {
                reject(e.error || new Error('MediaRecorder error'));
            };
            
            // Start recording
            this.mediaRecorder.start();
            
            // Render frames
            this._renderFrames()
                .then(() => {
                    this.mediaRecorder.stop();
                })
                .catch(reject);
        });
    }
    
    /**
     * Render frames sequentially
     * @private
     */
    async _renderFrames() {
        const frameInterval = 1000 / this.fps;
        const track = this.stream.getVideoTracks()[0];
        
        for (let i = 0; i < this.frames.length; i++) {
            const frame = this.frames[i];
            
            // Draw frame to canvas
            this.ctx.putImageData(frame, 0, 0);
            
            // Request frame capture
            if (track.requestFrame) {
                track.requestFrame();
            }
            
            // Report progress
            const progress = (i + 1) / this.frames.length;
            this._reportProgress(progress, `Encoding frame ${i + 1}/${this.frames.length}`);
            
            // Wait for frame interval
            await this._wait(frameInterval);
        }
    }
    
    // ========================================================================
    // REAL-TIME RECORDING
    // ========================================================================
    
    /**
     * Start real-time recording
     * @param {HTMLCanvasElement} sourceCanvas
     * @returns {Promise<void>}
     */
    startRealTimeRecording(sourceCanvas) {
        return new Promise((resolve, reject) => {
            try {
                this.canvas = sourceCanvas;
                this.stream = sourceCanvas.captureStream(this.fps);
                
                if (this.includeAudio) {
                    this._setupAudio();
                }
                
                const options = {
                    mimeType: this._getMimeType(),
                    videoBitsPerSecond: this.bitrate
                };
                
                this.mediaRecorder = new MediaRecorder(this.stream, options);
                this.chunks = [];
                
                this.mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        this.chunks.push(e.data);
                    }
                };
                
                this.mediaRecorder.start(100); // Collect data every 100ms
                this.isEncoding = true;
                
                resolve();
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Stop real-time recording
     * @returns {Promise<Blob>}
     */
    stopRealTimeRecording() {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                reject(new Error('Not recording'));
                return;
            }
            
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.chunks, { 
                    type: this._getMimeType() 
                });
                
                this.isEncoding = false;
                this.chunks = [];
                
                if (this.onComplete) this.onComplete(blob);
                resolve(blob);
            };
            
            this.mediaRecorder.stop();
        });
    }
    
    // ========================================================================
    // AUDIO
    // ========================================================================
    
    /**
     * Setup audio for recording
     * @private
     */
    _setupAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioDestination = this.audioContext.createMediaStreamDestination();
        
        // Create silent audio (or could add synth tones)
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        gainNode.gain.value = 0; // Silent
        oscillator.connect(gainNode);
        gainNode.connect(this.audioDestination);
        oscillator.start();
        
        // Add audio track to stream
        const audioTrack = this.audioDestination.stream.getAudioTracks()[0];
        this.stream.addTrack(audioTrack);
    }
    
    /**
     * Add synthesized audio tone
     * @param {number} frequency - Frequency in Hz
     * @param {number} volume - Volume 0-1
     */
    addAudioTone(frequency = 440, volume = 0.1) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.frequency.value = frequency;
        gainNode.gain.value = volume;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioDestination);
        oscillator.start();
        
        return {
            stop: () => oscillator.stop(),
            setFrequency: (f) => oscillator.frequency.value = f,
            setVolume: (v) => gainNode.gain.value = v
        };
    }
    
    // ========================================================================
    // UTILITIES
    // ========================================================================
    
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
     * Wait for specified time
     * @private
     */
    _wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Clear frames
     */
    clear() {
        this.frames = [];
        this.chunks = [];
    }
    
    /**
     * Download encoded video
     * @param {Blob} blob
     * @param {string} filename
     */
    static download(blob, filename = 'animation') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${blob.type.includes('webm') ? 'webm' : 'mp4'}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    // ========================================================================
    // ESTIMATION
    // ========================================================================
    
    /**
     * Estimate file size
     * @param {number} duration - Duration in seconds
     * @returns {Object}
     */
    estimateFileSize(duration) {
        const videoBits = this.bitrate * duration;
        const audioBits = this.includeAudio ? 128000 * duration : 0;
        const totalBits = videoBits + audioBits;
        const totalBytes = totalBits / 8;
        
        return {
            bytes: totalBytes,
            megabytes: totalBytes / (1024 * 1024),
            formatted: this._formatBytes(totalBytes)
        };
    }
    
    /**
     * Format bytes to human readable
     * @private
     */
    _formatBytes(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
        return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
    }
}

// ============================================================================
// CONVENIENCE FUNCTION
// ============================================================================

/**
 * Create video from frames
 * @param {Array} frames - Array of ImageData
 * @param {Object} options - Encoder options
 * @returns {Promise<Blob>}
 */
export async function createVideo(frames, options = {}) {
    const encoder = new WebMEncoder(options);
    
    for (const frame of frames) {
        encoder.addFrame(frame);
    }
    
    return encoder.encode();
}

// ============================================================================
// EXPORTS
// ============================================================================

export { VIDEO_CODEC, CONTAINER_FORMAT, VIDEO_QUALITY };
export default WebMEncoder;
