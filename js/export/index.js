/**
 * ============================================================================
 * ABYSS EXPLORER - EXPORT MODULE
 * ============================================================================
 * 
 * Central export for all export and sharing functionality.
 * Provides high-resolution image export, animation recording,
 * video encoding, and location sharing.
 * 
 * Module Overview:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  IMAGE EXPORT                                                          │
 * │  ├── Resolution up to 16K+                                            │
 * │  ├── Supersampling (1x-16x)                                           │
 * │  ├── Formats: PNG, JPEG, WebP                                         │
 * │  └── Tile-based for memory efficiency                                 │
 * │                                                                        │
 * │  ANIMATION RECORDER                                                    │
 * │  ├── Frame-by-frame capture                                           │
 * │  ├── Variable FPS (1-60)                                              │
 * │  ├── Duration control                                                 │
 * │  └── Progress feedback                                                │
 * │                                                                        │
 * │  GIF ENCODER                                                           │
 * │  ├── Custom palette extraction                                        │
 * │  ├── Multiple dithering modes                                         │
 * │  ├── LZW compression                                                  │
 * │  └── Loop control                                                     │
 * │                                                                        │
 * │  WEBM ENCODER                                                          │
 * │  ├── VP8/VP9/H.264 codecs                                             │
 * │  ├── High bitrate (up to 50 Mbps)                                     │
 * │  ├── Optional audio                                                   │
 * │  └── Real-time & frame-based modes                                    │
 * │                                                                        │
 * │  LOCATION SHARE                                                        │
 * │  ├── URL hash encoding                                                │
 * │  ├── Compact Base64 encoding                                          │
 * │  ├── Social sharing                                                   │
 * │  └── QR code generation                                               │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * Quick Start:
 * ```javascript
 * import { 
 *     ImageExporter, 
 *     AnimationRecorder, 
 *     GIFEncoder, 
 *     WebMEncoder,
 *     LocationShare 
 * } from './export/index.js';
 * 
 * // Export high-res image
 * const exporter = new ImageExporter({
 *     width: 3840,
 *     height: 2160,
 *     supersample: 4,
 *     format: 'png'
 * });
 * await exporter.exportAndDownload('fractal-4k');
 * 
 * // Record animation
 * const recorder = new AnimationRecorder({
 *     fps: 30,
 *     duration: 10
 * });
 * const frames = await recorder.startRecording();
 * 
 * // Create GIF
 * const gif = new GIFEncoder({ delay: 100, loop: 0 });
 * frames.forEach(f => gif.addFrame(f.data));
 * const gifBlob = gif.encode();
 * 
 * // Share location
 * const share = new LocationShare({ camera, state });
 * await share.copyToClipboard();
 * ```
 * 
 * @module export
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// IMAGE EXPORT
// ============================================================================

export {
    ImageExporter,
    QUALITY_PRESETS,
    RESOLUTION_PRESETS,
    EXPORT_FORMAT
} from './image-export.js';

// ============================================================================
// ANIMATION RECORDER
// ============================================================================

export {
    AnimationRecorder,
    RECORD_STATE,
    ANIMATION_QUALITY,
    FrameBuffer
} from './animation-recorder.js';

// ============================================================================
// GIF ENCODER
// ============================================================================

export {
    GIFEncoder,
    createGIF,
    DITHER_METHOD,
    PALETTE_METHOD,
    ColorQuantizer,
    Ditherer,
    LZWEncoder
} from './gif-encoder.js';

// ============================================================================
// WEBM ENCODER
// ============================================================================

export {
    WebMEncoder,
    createVideo,
    detectCodecSupport,
    VIDEO_CODEC,
    CONTAINER_FORMAT,
    VIDEO_QUALITY
} from './webm-encoder.js';

// ============================================================================
// LOCATION SHARE
// ============================================================================

export {
    LocationShare,
    shareLocation,
    parseLocationUrl,
    PARAM_ABBREV,
    PARAM_EXPAND,
    URL_VERSION
} from './location-share.js';

// ============================================================================
// MODULE INFO
// ============================================================================

export const MODULE_INFO = {
    name: 'Abyss Explorer Export System',
    version: '1.0.0',
    components: [
        'ImageExporter - High-resolution image export up to 16K+',
        'AnimationRecorder - Frame-by-frame animation capture',
        'GIFEncoder - Animated GIF with palette optimization',
        'WebMEncoder - WebM/MP4 video with MediaRecorder',
        'LocationShare - URL encoding and social sharing'
    ],
    features: {
        imageExport: [
            'Resolution up to 16384×16384 (or higher with tiling)',
            'Supersampling: 1x, 2x, 4x, 8x, 16x',
            'Formats: PNG, JPEG, WebP',
            'Progressive tile-based rendering',
            'Memory-efficient large exports',
            'Quality presets: Draft, Normal, High, Ultra, Extreme'
        ],
        animationRecording: [
            'Variable FPS (1-60)',
            'Duration control',
            'Quality presets: Preview, SD, HD, Full HD, 4K',
            'Progress callbacks',
            'Cancel support'
        ],
        gifEncoding: [
            '256 color palette optimization',
            'Dithering: None, Floyd-Steinberg, Ordered, Atkinson',
            'LZW compression',
            'Loop/no-loop control',
            'Frame delay control'
        ],
        videoEncoding: [
            'WebM VP8/VP9 encoding',
            'MP4 H.264 (browser-dependent)',
            'Bitrate: 2-50 Mbps',
            'Optional audio track',
            'Real-time and frame-based modes'
        ],
        locationSharing: [
            'Compact URL encoding (Base64)',
            'Human-readable parameters',
            'Social sharing (Twitter, Facebook, Reddit)',
            'QR code generation',
            'Clipboard operations',
            'Deep linking support'
        ]
    }
};

// ============================================================================
// CONVENIENCE FACTORY
// ============================================================================

/**
 * Create complete export system
 * @param {Object} options
 * @returns {Object}
 */
export function createExportSystem(options = {}) {
    const {
        renderer = null,
        camera = null,
        state = null,
        fractal = null,
        coloring = null,
        palette = null,
        keyframeSystem = null,
        animationController = null
    } = options;
    
    // Create components
    const imageExporter = new (require('./image-export.js').ImageExporter)({
        renderer,
        camera,
        fractal,
        coloring,
        palette
    });
    
    const animationRecorder = new (require('./animation-recorder.js').AnimationRecorder)({
        renderer,
        camera,
        keyframeSystem,
        animationController
    });
    
    const gifEncoder = new (require('./gif-encoder.js').GIFEncoder)();
    
    const webmEncoder = new (require('./webm-encoder.js').WebMEncoder)();
    
    const locationShare = new (require('./location-share.js').LocationShare)({
        state,
        camera
    });
    
    return {
        imageExporter,
        animationRecorder,
        gifEncoder,
        webmEncoder,
        locationShare,
        
        // Convenience methods
        
        /**
         * Export current view as image
         */
        async exportImage(filename = 'fractal', options = {}) {
            return imageExporter.exportAndDownload(filename, options);
        },
        
        /**
         * Record and export as GIF
         */
        async exportGIF(filename = 'animation', options = {}) {
            animationRecorder.configure(options);
            const frames = await animationRecorder.startRecording();
            
            gifEncoder.delay = options.delay || Math.round(1000 / animationRecorder.fps);
            for (const frame of frames) {
                gifEncoder.addFrame(frame.data);
            }
            
            const blob = gifEncoder.encode();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.gif`;
            a.click();
            URL.revokeObjectURL(url);
            
            return blob;
        },
        
        /**
         * Record and export as WebM
         */
        async exportVideo(filename = 'animation', options = {}) {
            animationRecorder.configure(options);
            const frames = await animationRecorder.startRecording();
            
            webmEncoder.width = animationRecorder.width;
            webmEncoder.height = animationRecorder.height;
            webmEncoder.fps = animationRecorder.fps;
            
            for (const frame of frames) {
                webmEncoder.addFrame(frame.data);
            }
            
            const blob = await webmEncoder.encode();
            (require('./webm-encoder.js').WebMEncoder).download(blob, filename);
            
            return blob;
        },
        
        /**
         * Share current location
         */
        async share() {
            const success = await locationShare.shareNative();
            if (!success) {
                await locationShare.copyToClipboard();
            }
        },
        
        /**
         * Get share URL
         */
        getShareUrl() {
            return locationShare.getShareUrl();
        }
    };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import ImageExporterDefault from './image-export.js';
import AnimationRecorderDefault from './animation-recorder.js';
import GIFEncoderDefault from './gif-encoder.js';
import WebMEncoderDefault from './webm-encoder.js';
import LocationShareDefault from './location-share.js';

export default {
    ImageExporter: ImageExporterDefault,
    AnimationRecorder: AnimationRecorderDefault,
    GIFEncoder: GIFEncoderDefault,
    WebMEncoder: WebMEncoderDefault,
    LocationShare: LocationShareDefault,
    MODULE_INFO,
    createExportSystem
};
