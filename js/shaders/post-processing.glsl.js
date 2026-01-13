/**
 * ============================================================================
 * ABYSS EXPLORER - POST-PROCESSING SHADER
 * ============================================================================
 * 
 * Comprehensive post-processing effects for stunning fractal renders.
 * Transforms raw ray-marched output into cinematic, polished images.
 * 
 * Effects:
 * 1. Bloom - Bright area glow
 * 2. Tone Mapping - HDR to LDR conversion (Reinhard, ACES, Filmic)
 * 3. Color Grading - LUT-based color manipulation
 * 4. Vignette - Edge darkening
 * 5. Film Grain - Cinematic noise
 * 6. Depth of Field - Bokeh blur based on depth
 * 7. Chromatic Aberration - Color fringing
 * 8. Lens Distortion - Barrel/pincushion
 * 9. Glow - Fractal edge glow
 * 10. Fog/Atmosphere - Distance-based haze
 * 
 * All effects are designed to be combined in a single pass or
 * separated for multi-pass rendering when needed.
 * 
 * References:
 * - John Hable - Filmic Tone Mapping
 * - Stephen Hill - ACES Filmic Curve
 * - GPU Gems - Real-time Glow
 * - Inigo Quilez - Shader techniques
 * 
 * @module shaders/post-processing.glsl
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// POST-PROCESSING UNIFORMS
// ============================================================================

export const POST_UNIFORMS = /* glsl */`
// Input textures
uniform sampler2D uColorTexture;    // Main render
uniform sampler2D uDepthTexture;    // Depth buffer
uniform sampler2D uBloomTexture;    // Pre-blurred bloom
uniform sampler2D uLUTTexture;      // Color grading LUT

uniform vec2 uResolution;
uniform float uTime;

// Bloom
uniform bool uBloomEnabled;
uniform float uBloomIntensity;
uniform float uBloomThreshold;
uniform float uBloomRadius;

// Tone mapping
uniform int uTonemapMode;           // 0=none, 1=reinhard, 2=aces, 3=filmic, 4=uncharted
uniform float uExposure;
uniform float uGamma;
uniform float uContrast;
uniform float uSaturation;
uniform float uBrightness;

// Color grading
uniform bool uColorGradingEnabled;
uniform vec3 uColorLift;            // Shadows
uniform vec3 uColorGamma;           // Midtones
uniform vec3 uColorGain;            // Highlights
uniform float uTemperature;         // Color temperature shift
uniform float uTint;                // Green-magenta shift

// Vignette
uniform bool uVignetteEnabled;
uniform float uVignetteIntensity;
uniform float uVignetteSoftness;
uniform vec2 uVignetteCenter;
uniform vec3 uVignetteColor;

// Film grain
uniform bool uGrainEnabled;
uniform float uGrainIntensity;
uniform float uGrainSize;

// Depth of field
uniform bool uDOFEnabled;
uniform float uDOFFocalDistance;
uniform float uDOFFocalRange;
uniform float uDOFMaxBlur;
uniform float uDOFBokehSize;

// Chromatic aberration
uniform bool uChromaticEnabled;
uniform float uChromaticIntensity;

// Lens distortion
uniform bool uDistortionEnabled;
uniform float uDistortionAmount;

// Glow
uniform bool uGlowEnabled;
uniform float uGlowIntensity;
uniform vec3 uGlowColor;

// Fog
uniform bool uFogEnabled;
uniform float uFogDensity;
uniform vec3 uFogColor;
uniform float uFogStart;
uniform float uFogEnd;

// Sharpening
uniform bool uSharpenEnabled;
uniform float uSharpenAmount;
`;

// ============================================================================
// POST-PROCESSING FUNCTIONS
// ============================================================================

export const POST_GLSL = /* glsl */`
/**
 * ============================================================================
 * POST-PROCESSING IMPLEMENTATION
 * ============================================================================
 */

${POST_UNIFORMS}

// ============================================================================
// TONE MAPPING
// ============================================================================

/**
 * Simple Reinhard tone mapping
 * Maps HDR values to [0,1] using: x / (1 + x)
 */
vec3 tonemapReinhard(vec3 color) {
    return color / (1.0 + color);
}

/**
 * Extended Reinhard with white point
 */
vec3 tonemapReinhardExtended(vec3 color, float whitePoint) {
    vec3 numerator = color * (1.0 + (color / (whitePoint * whitePoint)));
    return numerator / (1.0 + color);
}

/**
 * ACES Filmic Tone Mapping
 * Industry standard for cinematic look
 * Reference: Stephen Hill, Narkowicz approximation
 */
vec3 tonemapACES(vec3 color) {
    // ACES coefficients
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    
    return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
}

/**
 * Uncharted 2 Filmic Tone Mapping
 * By John Hable
 */
vec3 uncharted2Tonemap(vec3 x) {
    const float A = 0.15;  // Shoulder strength
    const float B = 0.50;  // Linear strength
    const float C = 0.10;  // Linear angle
    const float D = 0.20;  // Toe strength
    const float E = 0.02;  // Toe numerator
    const float F = 0.30;  // Toe denominator
    
    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

vec3 tonemapUncharted(vec3 color) {
    const float W = 11.2;  // Linear white point
    const float exposureBias = 2.0;
    
    vec3 curr = uncharted2Tonemap(exposureBias * color);
    vec3 whiteScale = 1.0 / uncharted2Tonemap(vec3(W));
    
    return curr * whiteScale;
}

/**
 * Lottes 2016 tone mapping
 * Good for vivid colors
 */
vec3 tonemapLottes(vec3 color) {
    const vec3 a = vec3(1.6);
    const vec3 d = vec3(0.977);
    const vec3 hdrMax = vec3(8.0);
    const vec3 midIn = vec3(0.18);
    const vec3 midOut = vec3(0.267);
    
    vec3 b = (-pow(midIn, a) + pow(hdrMax, a) * midOut) /
             ((pow(hdrMax, a * d) - pow(midIn, a * d)) * midOut);
    vec3 c = (pow(hdrMax, a * d) * pow(midIn, a) - pow(hdrMax, a) * pow(midIn, a * d) * midOut) /
             ((pow(hdrMax, a * d) - pow(midIn, a * d)) * midOut);
    
    return pow(color, a) / (pow(color, a * d) * b + c);
}

/**
 * Apply selected tone mapping
 */
vec3 applyTonemap(vec3 color) {
    if (uTonemapMode == 1) {
        return tonemapReinhard(color);
    } else if (uTonemapMode == 2) {
        return tonemapACES(color);
    } else if (uTonemapMode == 3) {
        return tonemapLottes(color);
    } else if (uTonemapMode == 4) {
        return tonemapUncharted(color);
    }
    return color;
}

// ============================================================================
// BLOOM
// ============================================================================

/**
 * Extract bright pixels for bloom
 */
vec3 bloomThreshold(vec3 color, float threshold) {
    float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float soft = brightness - threshold + 0.5;
    soft = clamp(soft, 0.0, 1.0);
    soft = soft * soft * (3.0 - 2.0 * soft);
    return color * soft;
}

/**
 * Gaussian blur for bloom (single direction)
 */
vec3 gaussianBlur(sampler2D tex, vec2 uv, vec2 direction) {
    vec3 result = vec3(0.0);
    vec2 texelSize = 1.0 / uResolution;
    
    // 9-tap Gaussian
    const float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
    
    result += texture2D(tex, uv).rgb * weights[0];
    
    for (int i = 1; i < 5; i++) {
        vec2 offset = direction * texelSize * float(i) * uBloomRadius;
        result += texture2D(tex, uv + offset).rgb * weights[i];
        result += texture2D(tex, uv - offset).rgb * weights[i];
    }
    
    return result;
}

// ============================================================================
// COLOR GRADING
// ============================================================================

/**
 * Color temperature adjustment
 * Approximation of blackbody radiation shift
 */
vec3 colorTemperature(vec3 color, float temp) {
    // Warm (positive) shifts toward orange
    // Cool (negative) shifts toward blue
    mat3 tempMat = mat3(
        1.0 + temp * 0.1, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0 - temp * 0.1
    );
    return tempMat * color;
}

/**
 * Lift-Gamma-Gain color grading
 * Standard color correction workflow
 */
vec3 liftGammaGain(vec3 color, vec3 lift, vec3 gamma, vec3 gain) {
    // Lift: affects shadows
    vec3 liftedColor = color * (1.0 - lift) + lift;
    
    // Gamma: affects midtones (inverse for standard gamma control)
    vec3 gammaColor = pow(liftedColor, 1.0 / gamma);
    
    // Gain: affects highlights
    return gammaColor * gain;
}

/**
 * Apply saturation adjustment
 */
vec3 applySaturation(vec3 color, float saturation) {
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    return mix(vec3(luminance), color, saturation);
}

/**
 * Apply contrast adjustment
 */
vec3 applyContrast(vec3 color, float contrast) {
    return (color - 0.5) * contrast + 0.5;
}

// ============================================================================
// VIGNETTE
// ============================================================================

/**
 * Smooth vignette effect
 */
vec3 applyVignette(vec3 color, vec2 uv) {
    if (!uVignetteEnabled) return color;
    
    vec2 centered = uv - uVignetteCenter;
    float dist = length(centered);
    
    // Smooth falloff
    float vignette = smoothstep(uVignetteSoftness, uVignetteSoftness - uVignetteIntensity, dist);
    
    return mix(color * uVignetteColor, color, vignette);
}

// ============================================================================
// FILM GRAIN
// ============================================================================

/**
 * Generate film grain noise
 */
float grainNoise(vec2 uv) {
    vec2 scaled = uv * uResolution / uGrainSize;
    return fract(sin(dot(scaled + uTime * 0.1, vec2(12.9898, 78.233))) * 43758.5453);
}

/**
 * Apply film grain
 */
vec3 applyGrain(vec3 color, vec2 uv) {
    if (!uGrainEnabled) return color;
    
    float noise = grainNoise(uv);
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    
    // More grain in midtones
    float grainAmount = uGrainIntensity * (1.0 - abs(luminance - 0.5) * 2.0);
    
    return color + (noise - 0.5) * grainAmount;
}

// ============================================================================
// DEPTH OF FIELD
// ============================================================================

/**
 * Circle of Confusion calculation
 */
float calcCoC(float depth) {
    float diff = abs(depth - uDOFFocalDistance);
    return clamp(diff / uDOFFocalRange, 0.0, 1.0) * uDOFMaxBlur;
}

/**
 * Bokeh blur for DOF
 * Uses spiral pattern for natural look
 */
vec3 bokehBlur(sampler2D tex, vec2 uv, float coc) {
    if (coc < 0.001) return texture2D(tex, uv).rgb;
    
    vec3 result = vec3(0.0);
    float totalWeight = 0.0;
    
    // Spiral bokeh pattern
    const float GOLDEN_ANGLE = 2.39996;
    const int SAMPLES = 32;
    
    for (int i = 0; i < SAMPLES; i++) {
        float theta = float(i) * GOLDEN_ANGLE;
        float r = sqrt(float(i) / float(SAMPLES)) * coc;
        
        vec2 offset = vec2(cos(theta), sin(theta)) * r / uResolution;
        
        vec3 sampleColor = texture2D(tex, uv + offset).rgb;
        float sampleWeight = 1.0;
        
        // Brighter samples contribute more (bokeh highlight)
        sampleWeight *= 1.0 + dot(sampleColor, vec3(0.2126, 0.7152, 0.0722)) * uDOFBokehSize;
        
        result += sampleColor * sampleWeight;
        totalWeight += sampleWeight;
    }
    
    return result / totalWeight;
}

/**
 * Apply depth of field
 */
vec3 applyDOF(sampler2D colorTex, sampler2D depthTex, vec2 uv) {
    if (!uDOFEnabled) return texture2D(colorTex, uv).rgb;
    
    float depth = texture2D(depthTex, uv).r;
    float coc = calcCoC(depth);
    
    return bokehBlur(colorTex, uv, coc);
}

// ============================================================================
// CHROMATIC ABERRATION
// ============================================================================

/**
 * Chromatic aberration (color fringing)
 */
vec3 applyChromaticAberration(sampler2D tex, vec2 uv) {
    if (!uChromaticEnabled) return texture2D(tex, uv).rgb;
    
    vec2 direction = (uv - 0.5) * uChromaticIntensity;
    
    float r = texture2D(tex, uv + direction).r;
    float g = texture2D(tex, uv).g;
    float b = texture2D(tex, uv - direction).b;
    
    return vec3(r, g, b);
}

// ============================================================================
// LENS DISTORTION
// ============================================================================

/**
 * Barrel/Pincushion lens distortion
 */
vec2 applyDistortion(vec2 uv) {
    if (!uDistortionEnabled) return uv;
    
    vec2 centered = uv * 2.0 - 1.0;
    float r2 = dot(centered, centered);
    float distortion = 1.0 + uDistortionAmount * r2;
    
    return (centered * distortion) * 0.5 + 0.5;
}

// ============================================================================
// FOG / ATMOSPHERE
// ============================================================================

/**
 * Apply exponential fog
 */
vec3 applyFog(vec3 color, float depth) {
    if (!uFogEnabled) return color;
    
    float fogFactor = 1.0 - exp(-depth * uFogDensity);
    fogFactor = clamp(fogFactor, 0.0, 1.0);
    
    // Distance-based fade
    if (uFogStart > 0.0 || uFogEnd > 0.0) {
        fogFactor *= smoothstep(uFogStart, uFogEnd, depth);
    }
    
    return mix(color, uFogColor, fogFactor);
}

// ============================================================================
// SHARPENING
// ============================================================================

/**
 * Unsharp mask sharpening
 */
vec3 applySharpen(sampler2D tex, vec2 uv) {
    if (!uSharpenEnabled) return texture2D(tex, uv).rgb;
    
    vec2 texelSize = 1.0 / uResolution;
    
    vec3 center = texture2D(tex, uv).rgb;
    vec3 up = texture2D(tex, uv + vec2(0.0, texelSize.y)).rgb;
    vec3 down = texture2D(tex, uv - vec2(0.0, texelSize.y)).rgb;
    vec3 left = texture2D(tex, uv - vec2(texelSize.x, 0.0)).rgb;
    vec3 right = texture2D(tex, uv + vec2(texelSize.x, 0.0)).rgb;
    
    vec3 blurred = (up + down + left + right) * 0.25;
    vec3 sharpened = center + (center - blurred) * uSharpenAmount;
    
    return clamp(sharpened, 0.0, 1.0);
}

// ============================================================================
// GLOW (FRACTAL EDGE GLOW)
// ============================================================================

/**
 * Add glow to bright areas
 */
vec3 applyGlow(vec3 color, vec3 bloom) {
    if (!uGlowEnabled) return color;
    
    float brightness = dot(bloom, vec3(0.2126, 0.7152, 0.0722));
    vec3 glow = uGlowColor * brightness * uGlowIntensity;
    
    return color + glow;
}

// ============================================================================
// DITHERING (REDUCE BANDING)
// ============================================================================

/**
 * Apply dithering to reduce color banding
 */
vec3 applyDithering(vec3 color, vec2 uv) {
    // Simple ordered dithering
    float dither = fract(sin(dot(uv * uResolution, vec2(12.9898, 78.233))) * 43758.5453);
    return color + (dither - 0.5) / 255.0;
}
`;

// ============================================================================
// MAIN POST-PROCESSING SHADER
// ============================================================================

export const POST_FRAGMENT = /* glsl */`
precision highp float;

varying vec2 vUv;

${POST_GLSL}

void main() {
    // Apply lens distortion first
    vec2 distortedUV = applyDistortion(vUv);
    
    // Get color (with optional chromatic aberration)
    vec3 color;
    if (uChromaticEnabled) {
        color = applyChromaticAberration(uColorTexture, distortedUV);
    } else {
        color = texture2D(uColorTexture, distortedUV).rgb;
    }
    
    // Get depth
    float depth = texture2D(uDepthTexture, distortedUV).r;
    
    // Apply DOF
    if (uDOFEnabled) {
        float coc = calcCoC(depth);
        color = bokehBlur(uColorTexture, distortedUV, coc);
    }
    
    // Apply sharpening
    if (uSharpenEnabled) {
        color = applySharpen(uColorTexture, distortedUV);
    }
    
    // Apply fog
    color = applyFog(color, depth);
    
    // Apply bloom
    if (uBloomEnabled) {
        vec3 bloom = texture2D(uBloomTexture, distortedUV).rgb;
        color += bloom * uBloomIntensity;
        
        // Add glow
        color = applyGlow(color, bloom);
    }
    
    // Exposure
    color *= uExposure;
    
    // Tone mapping
    color = applyTonemap(color);
    
    // Color grading
    if (uColorGradingEnabled) {
        // Temperature and tint
        color = colorTemperature(color, uTemperature);
        
        // Lift-Gamma-Gain
        color = liftGammaGain(color, uColorLift, uColorGamma, uColorGain);
    }
    
    // Brightness
    color += uBrightness;
    
    // Contrast
    color = applyContrast(color, uContrast);
    
    // Saturation
    color = applySaturation(color, uSaturation);
    
    // Vignette
    color = applyVignette(color, vUv);
    
    // Film grain
    color = applyGrain(color, vUv);
    
    // Gamma correction
    color = pow(color, vec3(1.0 / uGamma));
    
    // Dithering to prevent banding
    color = applyDithering(color, vUv);
    
    // Clamp final output
    color = clamp(color, 0.0, 1.0);
    
    gl_FragColor = vec4(color, 1.0);
}
`;

// ============================================================================
// BLOOM EXTRACTION SHADER
// ============================================================================

export const BLOOM_EXTRACT_FRAGMENT = /* glsl */`
precision highp float;

uniform sampler2D uColorTexture;
uniform float uBloomThreshold;

varying vec2 vUv;

void main() {
    vec3 color = texture2D(uColorTexture, vUv).rgb;
    
    float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
    
    if (brightness > uBloomThreshold) {
        float soft = brightness - uBloomThreshold + 0.5;
        soft = clamp(soft, 0.0, 1.0);
        soft = soft * soft * (3.0 - 2.0 * soft);
        gl_FragColor = vec4(color * soft, 1.0);
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
`;

// ============================================================================
// BLOOM BLUR SHADER
// ============================================================================

export const BLOOM_BLUR_FRAGMENT = /* glsl */`
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uDirection;
uniform float uBloomRadius;

varying vec2 vUv;

void main() {
    vec3 result = vec3(0.0);
    vec2 texelSize = 1.0 / uResolution;
    
    // 9-tap Gaussian
    float weights[5];
    weights[0] = 0.227027;
    weights[1] = 0.1945946;
    weights[2] = 0.1216216;
    weights[3] = 0.054054;
    weights[4] = 0.016216;
    
    result += texture2D(uTexture, vUv).rgb * weights[0];
    
    for (int i = 1; i < 5; i++) {
        vec2 offset = uDirection * texelSize * float(i) * uBloomRadius;
        result += texture2D(uTexture, vUv + offset).rgb * weights[i];
        result += texture2D(uTexture, vUv - offset).rgb * weights[i];
    }
    
    gl_FragColor = vec4(result, 1.0);
}
`;

// ============================================================================
// VERTEX SHADER (FULLSCREEN QUAD)
// ============================================================================

export const POST_VERTEX = /* glsl */`
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ============================================================================
// JAVASCRIPT WRAPPER
// ============================================================================

/**
 * Create post-processing uniforms
 */
export function createPostUniforms(options = {}) {
    return {
        // Textures
        uColorTexture: { value: options.colorTexture || null },
        uDepthTexture: { value: options.depthTexture || null },
        uBloomTexture: { value: options.bloomTexture || null },
        uLUTTexture: { value: options.lutTexture || null },
        
        uResolution: { value: options.resolution || [1920, 1080] },
        uTime: { value: 0 },
        
        // Bloom
        uBloomEnabled: { value: options.bloom !== false },
        uBloomIntensity: { value: options.bloomIntensity || 0.5 },
        uBloomThreshold: { value: options.bloomThreshold || 0.8 },
        uBloomRadius: { value: options.bloomRadius || 1.0 },
        
        // Tone mapping
        uTonemapMode: { value: options.tonemapMode || 2 }, // ACES default
        uExposure: { value: options.exposure || 1.0 },
        uGamma: { value: options.gamma || 2.2 },
        uContrast: { value: options.contrast || 1.0 },
        uSaturation: { value: options.saturation || 1.0 },
        uBrightness: { value: options.brightness || 0.0 },
        
        // Color grading
        uColorGradingEnabled: { value: options.colorGrading || false },
        uColorLift: { value: options.colorLift || [0, 0, 0] },
        uColorGamma: { value: options.colorGamma || [1, 1, 1] },
        uColorGain: { value: options.colorGain || [1, 1, 1] },
        uTemperature: { value: options.temperature || 0 },
        uTint: { value: options.tint || 0 },
        
        // Vignette
        uVignetteEnabled: { value: options.vignette !== false },
        uVignetteIntensity: { value: options.vignetteIntensity || 0.4 },
        uVignetteSoftness: { value: options.vignetteSoftness || 0.5 },
        uVignetteCenter: { value: options.vignetteCenter || [0.5, 0.5] },
        uVignetteColor: { value: options.vignetteColor || [0, 0, 0] },
        
        // Film grain
        uGrainEnabled: { value: options.grain || false },
        uGrainIntensity: { value: options.grainIntensity || 0.05 },
        uGrainSize: { value: options.grainSize || 1.5 },
        
        // DOF
        uDOFEnabled: { value: options.dof || false },
        uDOFFocalDistance: { value: options.dofFocalDistance || 5.0 },
        uDOFFocalRange: { value: options.dofFocalRange || 3.0 },
        uDOFMaxBlur: { value: options.dofMaxBlur || 10.0 },
        uDOFBokehSize: { value: options.dofBokehSize || 1.0 },
        
        // Chromatic aberration
        uChromaticEnabled: { value: options.chromatic || false },
        uChromaticIntensity: { value: options.chromaticIntensity || 0.005 },
        
        // Lens distortion
        uDistortionEnabled: { value: options.distortion || false },
        uDistortionAmount: { value: options.distortionAmount || 0.1 },
        
        // Glow
        uGlowEnabled: { value: options.glow || false },
        uGlowIntensity: { value: options.glowIntensity || 0.5 },
        uGlowColor: { value: options.glowColor || [1, 0.5, 0.2] },
        
        // Fog
        uFogEnabled: { value: options.fog || false },
        uFogDensity: { value: options.fogDensity || 0.1 },
        uFogColor: { value: options.fogColor || [0.5, 0.6, 0.7] },
        uFogStart: { value: options.fogStart || 0 },
        uFogEnd: { value: options.fogEnd || 100 },
        
        // Sharpening
        uSharpenEnabled: { value: options.sharpen || false },
        uSharpenAmount: { value: options.sharpenAmount || 0.3 }
    };
}

/**
 * Tone mapping mode constants
 */
export const TONEMAP_MODES = {
    NONE: 0,
    REINHARD: 1,
    ACES: 2,
    LOTTES: 3,
    UNCHARTED: 4
};

/**
 * Get post-processing shader
 */
export function getPostShader() {
    return {
        vertex: POST_VERTEX,
        fragment: POST_FRAGMENT,
        bloomExtract: BLOOM_EXTRACT_FRAGMENT,
        bloomBlur: BLOOM_BLUR_FRAGMENT
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    uniforms: POST_UNIFORMS,
    glsl: POST_GLSL,
    vertex: POST_VERTEX,
    fragment: POST_FRAGMENT,
    bloomExtract: BLOOM_EXTRACT_FRAGMENT,
    bloomBlur: BLOOM_BLUR_FRAGMENT,
    createUniforms: createPostUniforms,
    getShader: getPostShader,
    tonemapModes: TONEMAP_MODES
};
