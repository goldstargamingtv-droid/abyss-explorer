/**
 * ============================================================================
 * ABYSS EXPLORER - AMBIENT OCCLUSION SHADER
 * ============================================================================
 * 
 * Advanced ambient occlusion implementations for 3D fractal rendering.
 * Provides depth and realism through local shadowing effects.
 * 
 * Techniques:
 * 1. Raymarched AO - Sample along normal direction
 * 2. SSAO (Screen-Space AO) - Post-process depth-based AO
 * 3. Volumetric AO - Considers volume, not just surfaces
 * 4. Bent Normal AO - Provides directional occlusion
 * 
 * The core idea:
 * At each surface point, estimate how much of the hemisphere is blocked
 * by nearby geometry. More blockage = darker (less ambient light).
 * 
 * For raymarching, we step along the normal and check if we hit
 * geometry unexpectedly early.
 * 
 * References:
 * - Crytek SSAO paper (2007)
 * - Inigo Quilez - https://iquilezles.org/articles/
 * - NVIDIA HBAO (Horizon-Based AO)
 * - Alchemy AO
 * 
 * @module shaders/ambient-occlusion.glsl
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// AO UNIFORMS
// ============================================================================

export const AO_UNIFORMS = /* glsl */`
// Ambient Occlusion settings
uniform bool uAOEnabled;
uniform float uAOIntensity;         // AO strength (0-2)
uniform float uAORadius;            // Sample radius
uniform int uAOSamples;             // Number of samples (quality)
uniform float uAOBias;              // Bias to prevent self-occlusion
uniform float uAOFalloff;           // Distance falloff rate

// SSAO specific
uniform sampler2D uDepthTexture;    // Depth buffer
uniform sampler2D uNormalTexture;   // Normal buffer (optional)
uniform vec2 uSSAONoiseScale;       // Noise texture scale
uniform sampler2D uSSAONoise;       // Random rotation noise

// Advanced settings
uniform int uAOMethod;              // 0=raymarch, 1=ssao, 2=hbao
uniform bool uAOMultiBounce;        // Approximate multi-bounce
uniform vec3 uAOColor;              // AO color tint (usually dark)
uniform bool uAODirectional;        // Use bent normal
`;

// ============================================================================
// AMBIENT OCCLUSION FUNCTIONS
// ============================================================================

export const AO_GLSL = /* glsl */`
/**
 * ============================================================================
 * AMBIENT OCCLUSION IMPLEMENTATION
 * ============================================================================
 * 
 * AO approximates the integral:
 * AO(p) = (1/π) ∫_Ω V(p, ω) * (n·ω) dω
 * 
 * Where V is visibility (0 or 1) and the integral is over the hemisphere.
 * 
 * For raymarching fractals, we use:
 * - Step along normal direction
 * - If DE < expected distance, we're occluded
 * - Accumulate occlusion with distance falloff
 */

${AO_UNIFORMS}

// ============================================================================
// RAYMARCHED AO (For fractal distance fields)
// ============================================================================

/**
 * Simple raymarched ambient occlusion
 * Steps along normal, checking for occlusion
 * 
 * @param pos Surface position
 * @param nor Surface normal
 * @return AO factor 0 (occluded) to 1 (open)
 */
float calcAO(vec3 pos, vec3 nor) {
    float occ = 0.0;
    float sca = 1.0;
    
    // Sample along normal direction
    for (int i = 0; i < 8; i++) {
        if (i >= uAOSamples) break;
        
        // Distance to sample (increases with i)
        float h = uAOBias + uAORadius * float(i + 1) / float(uAOSamples);
        
        // Sample point along normal
        vec3 samplePos = pos + h * nor;
        
        // Get distance at sample point
        float d = map(samplePos).x;
        
        // If d < h, there's geometry between pos and sample
        // The difference (h - d) is the "occlusion amount"
        occ += (h - d) * sca;
        
        // Falloff: further samples contribute less
        sca *= uAOFalloff;
    }
    
    // Convert accumulated occlusion to AO factor
    return clamp(1.0 - uAOIntensity * occ, 0.0, 1.0);
}

/**
 * High-quality AO with multiple sample directions
 * More accurate but slower
 */
float calcAOHQ(vec3 pos, vec3 nor) {
    float occ = 0.0;
    
    // Create tangent space
    vec3 tangent = normalize(cross(nor, vec3(0.0, 1.0, 0.0)));
    if (length(tangent) < 0.1) {
        tangent = normalize(cross(nor, vec3(1.0, 0.0, 0.0)));
    }
    vec3 bitangent = cross(nor, tangent);
    
    // Sample in a hemisphere pattern
    for (int i = 0; i < 16; i++) {
        if (i >= uAOSamples * 2) break;
        
        // Fibonacci spiral for even distribution
        float fi = float(i);
        float phi = fi * 2.4; // Golden angle
        float cosTheta = 1.0 - (fi + 0.5) / float(uAOSamples * 2);
        float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
        
        // Direction in hemisphere
        vec3 sampleDir = tangent * (sinTheta * cos(phi)) +
                         bitangent * (sinTheta * sin(phi)) +
                         nor * cosTheta;
        
        // Step along direction
        float stepDist = uAORadius;
        vec3 samplePos = pos + sampleDir * stepDist;
        
        float d = map(samplePos).x;
        
        // Occlusion if we hit something
        occ += step(d, stepDist * 0.5) * cosTheta;
    }
    
    occ /= float(uAOSamples * 2);
    
    return clamp(1.0 - uAOIntensity * occ * 2.0, 0.0, 1.0);
}

/**
 * Bent normal calculation
 * Returns the average unoccluded direction
 * Useful for more accurate ambient lighting
 */
vec3 calcBentNormal(vec3 pos, vec3 nor) {
    vec3 bentNormal = vec3(0.0);
    float totalWeight = 0.0;
    
    vec3 tangent = normalize(cross(nor, vec3(0.0, 1.0, 0.0)));
    if (length(tangent) < 0.1) {
        tangent = normalize(cross(nor, vec3(1.0, 0.0, 0.0)));
    }
    vec3 bitangent = cross(nor, tangent);
    
    for (int i = 0; i < 16; i++) {
        float fi = float(i);
        float phi = fi * 2.4;
        float cosTheta = 1.0 - (fi + 0.5) / 16.0;
        float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
        
        vec3 sampleDir = tangent * (sinTheta * cos(phi)) +
                         bitangent * (sinTheta * sin(phi)) +
                         nor * cosTheta;
        
        vec3 samplePos = pos + sampleDir * uAORadius;
        float d = map(samplePos).x;
        
        // Weight by openness and cosine
        float weight = smoothstep(0.0, uAORadius, d) * cosTheta;
        bentNormal += sampleDir * weight;
        totalWeight += weight;
    }
    
    return normalize(bentNormal / max(totalWeight, 0.001));
}

// ============================================================================
// SCREEN-SPACE AMBIENT OCCLUSION (SSAO)
// ============================================================================

/**
 * SSAO using depth buffer
 * For post-processing pass
 */
float calcSSAO(vec2 uv, vec3 fragPos, vec3 normal) {
    // Noise for randomization
    vec3 randomVec = texture2D(uSSAONoise, uv * uSSAONoiseScale).xyz * 2.0 - 1.0;
    
    // TBN matrix
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);
    
    float occlusion = 0.0;
    
    // Sample kernel (hemisphere around normal)
    for (int i = 0; i < 32; i++) {
        if (i >= uAOSamples * 4) break;
        
        // Random sample in hemisphere
        float fi = float(i);
        vec3 sample = vec3(
            fract(sin(fi * 12.9898) * 43758.5453) * 2.0 - 1.0,
            fract(sin(fi * 78.233) * 43758.5453) * 2.0 - 1.0,
            fract(sin(fi * 37.719) * 43758.5453)
        );
        sample = normalize(sample);
        sample *= fract(sin(fi * 93.913) * 43758.5453);
        
        // Scale samples to be closer to origin
        float scale = fi / float(uAOSamples * 4);
        scale = mix(0.1, 1.0, scale * scale);
        sample *= scale;
        
        // Transform to world space
        sample = TBN * sample;
        
        // Sample position
        vec3 samplePos = fragPos + sample * uAORadius;
        
        // Project to screen space
        // (This requires projection matrix - simplified here)
        vec2 sampleUV = uv + sample.xy * 0.1;
        
        // Get depth at sample
        float sampleDepth = texture2D(uDepthTexture, sampleUV).r;
        
        // Compare depths
        float rangeCheck = smoothstep(0.0, 1.0, uAORadius / abs(fragPos.z - sampleDepth));
        occlusion += step(samplePos.z, sampleDepth) * rangeCheck;
    }
    
    occlusion = 1.0 - (occlusion / float(uAOSamples * 4));
    
    return pow(occlusion, uAOIntensity);
}

// ============================================================================
// HORIZON-BASED AMBIENT OCCLUSION (HBAO)
// ============================================================================

/**
 * HBAO - traces along tangent plane
 * More accurate horizon detection
 */
float calcHBAO(vec3 pos, vec3 nor) {
    float occlusion = 0.0;
    
    // Create tangent basis
    vec3 tangent = normalize(cross(nor, vec3(0.0, 1.0, 0.0)));
    if (length(tangent) < 0.1) {
        tangent = normalize(cross(nor, vec3(1.0, 0.0, 0.0)));
    }
    vec3 bitangent = cross(nor, tangent);
    
    // Number of directions
    int numDirs = uAOSamples;
    
    for (int i = 0; i < 16; i++) {
        if (i >= numDirs) break;
        
        // Direction in tangent plane
        float angle = float(i) / float(numDirs) * 6.28318;
        vec3 dir = tangent * cos(angle) + bitangent * sin(angle);
        
        // Find horizon angle in this direction
        float maxAngle = 0.0;
        
        for (int j = 1; j <= 8; j++) {
            float t = float(j) / 8.0 * uAORadius;
            vec3 samplePos = pos + dir * t + nor * 0.001;
            
            float d = map(samplePos).x;
            
            // Horizon angle
            float horizonAngle = atan((d - uAOBias) / t);
            maxAngle = max(maxAngle, horizonAngle);
        }
        
        // Contribution: 1 - sin(horizon angle)
        // Higher horizon = more occlusion
        occlusion += 1.0 - sin(clamp(maxAngle, 0.0, 1.57));
    }
    
    occlusion /= float(numDirs);
    
    return 1.0 - occlusion * uAOIntensity;
}

// ============================================================================
// VOLUMETRIC AMBIENT OCCLUSION
// ============================================================================

/**
 * Volumetric AO - considers volume, not just surfaces
 * Better for semi-transparent or volumetric effects
 */
float calcVolumetricAO(vec3 pos, vec3 nor) {
    float accumDensity = 0.0;
    
    // Sample in a cone around the normal
    for (int i = 0; i < 16; i++) {
        if (i >= uAOSamples * 2) break;
        
        float fi = float(i);
        
        // Cone angle increases with distance
        float coneAngle = 0.5 * fi / float(uAOSamples * 2);
        float dist = uAORadius * (fi + 1.0) / float(uAOSamples * 2);
        
        // Offset direction
        vec3 offset = nor;
        offset += vec3(
            sin(fi * 1.1) * coneAngle,
            cos(fi * 1.3) * coneAngle,
            sin(fi * 1.7) * coneAngle
        );
        offset = normalize(offset);
        
        vec3 samplePos = pos + offset * dist;
        float d = map(samplePos).x;
        
        // Accumulate "density" (inverse of distance)
        float density = max(0.0, 1.0 - d / dist);
        accumDensity += density * (1.0 - fi / float(uAOSamples * 2));
    }
    
    accumDensity /= float(uAOSamples * 2);
    
    return exp(-accumDensity * uAOIntensity * 3.0);
}

// ============================================================================
// MULTI-BOUNCE APPROXIMATION
// ============================================================================

/**
 * Multi-bounce color bleeding approximation
 * Occluded areas receive tinted bounce light
 */
vec3 multiBounceAO(float ao, vec3 albedo) {
    // GTR AO multi-bounce approximation
    // Based on: Jimenez et al., "Practical Real-Time Strategies for Accurate Indirect Occlusion"
    
    vec3 a = 2.0404 * albedo - 0.3324;
    vec3 b = -4.7951 * albedo + 0.6417;
    vec3 c = 2.7552 * albedo + 0.6903;
    
    float x = ao;
    return max(vec3(ao), ((x * a + b) * x + c) * x);
}

// ============================================================================
// MAIN AO FUNCTION
// ============================================================================

/**
 * Calculate ambient occlusion using selected method
 */
float calculateAO(vec3 pos, vec3 normal) {
    if (!uAOEnabled) return 1.0;
    
    float ao;
    
    if (uAOMethod == 0) {
        ao = calcAO(pos, normal);
    } else if (uAOMethod == 1) {
        ao = calcAOHQ(pos, normal);
    } else if (uAOMethod == 2) {
        ao = calcHBAO(pos, normal);
    } else {
        ao = calcVolumetricAO(pos, normal);
    }
    
    return ao;
}

/**
 * Calculate AO with color (for multi-bounce)
 */
vec3 calculateAOColor(vec3 pos, vec3 normal, vec3 albedo) {
    float ao = calculateAO(pos, normal);
    
    if (uAOMultiBounce) {
        return multiBounceAO(ao, albedo);
    } else {
        return vec3(ao);
    }
}
`;

// ============================================================================
// SSAO FRAGMENT SHADER (FOR POST-PROCESS)
// ============================================================================

export const SSAO_FRAGMENT = /* glsl */`
precision highp float;

uniform sampler2D uDepthTexture;
uniform sampler2D uNormalTexture;
uniform sampler2D uSSAONoise;
uniform vec2 uResolution;
uniform vec2 uSSAONoiseScale;
uniform float uAORadius;
uniform float uAOIntensity;
uniform int uAOSamples;

varying vec2 vUv;

// Reconstruct position from depth
vec3 getViewPos(vec2 uv, float depth) {
    vec3 ndc = vec3(uv * 2.0 - 1.0, depth * 2.0 - 1.0);
    // Simplified - would need inverse projection matrix
    return vec3(ndc.xy * depth, depth);
}

void main() {
    float depth = texture2D(uDepthTexture, vUv).r;
    
    if (depth >= 1.0) {
        gl_FragColor = vec4(1.0);
        return;
    }
    
    vec3 fragPos = getViewPos(vUv, depth);
    vec3 normal = texture2D(uNormalTexture, vUv).xyz * 2.0 - 1.0;
    
    // Noise for randomization
    vec3 randomVec = texture2D(uSSAONoise, vUv * uSSAONoiseScale).xyz;
    
    // TBN
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);
    
    float occlusion = 0.0;
    
    for (int i = 0; i < 64; i++) {
        if (i >= uAOSamples) break;
        
        float fi = float(i);
        
        // Sample kernel
        vec3 sample;
        sample.x = fract(sin(fi * 12.9898 + vUv.x * 100.0) * 43758.5453) * 2.0 - 1.0;
        sample.y = fract(sin(fi * 78.233 + vUv.y * 100.0) * 43758.5453) * 2.0 - 1.0;
        sample.z = fract(sin(fi * 37.719) * 43758.5453);
        sample = normalize(sample);
        
        float scale = fi / float(uAOSamples);
        scale = mix(0.1, 1.0, scale * scale);
        sample *= scale * uAORadius;
        
        vec3 samplePos = fragPos + TBN * sample;
        
        // Project
        vec2 sampleUV = vUv + sample.xy * 0.01;
        sampleUV = clamp(sampleUV, 0.0, 1.0);
        
        float sampleDepth = texture2D(uDepthTexture, sampleUV).r;
        
        float rangeCheck = smoothstep(0.0, 1.0, uAORadius / abs(depth - sampleDepth));
        occlusion += step(sampleDepth, depth - 0.001) * rangeCheck;
    }
    
    occlusion = 1.0 - (occlusion / float(uAOSamples));
    occlusion = pow(occlusion, uAOIntensity);
    
    gl_FragColor = vec4(vec3(occlusion), 1.0);
}
`;

// ============================================================================
// SSAO BLUR SHADER
// ============================================================================

export const SSAO_BLUR_FRAGMENT = /* glsl */`
precision highp float;

uniform sampler2D uSSAOTexture;
uniform vec2 uResolution;
uniform int uBlurSize;

varying vec2 vUv;

void main() {
    vec2 texelSize = 1.0 / uResolution;
    float result = 0.0;
    
    // Box blur
    for (int x = -4; x <= 4; x++) {
        for (int y = -4; y <= 4; y++) {
            if (abs(x) > uBlurSize || abs(y) > uBlurSize) continue;
            
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            result += texture2D(uSSAOTexture, vUv + offset).r;
        }
    }
    
    int size = (2 * uBlurSize + 1);
    result /= float(size * size);
    
    gl_FragColor = vec4(vec3(result), 1.0);
}
`;

// ============================================================================
// JAVASCRIPT WRAPPER
// ============================================================================

/**
 * Create AO uniforms
 */
export function createAOUniforms(options = {}) {
    return {
        uAOEnabled: { value: options.enabled !== false },
        uAOIntensity: { value: options.intensity || 1.0 },
        uAORadius: { value: options.radius || 0.5 },
        uAOSamples: { value: options.samples || 5 },
        uAOBias: { value: options.bias || 0.025 },
        uAOFalloff: { value: options.falloff || 0.95 },
        uAOMethod: { value: options.method || 0 },
        uAOMultiBounce: { value: options.multiBounce || false },
        uAOColor: { value: options.color || [0, 0, 0] },
        uAODirectional: { value: options.directional || false },
        
        // SSAO specific
        uDepthTexture: { value: options.depthTexture || null },
        uNormalTexture: { value: options.normalTexture || null },
        uSSAONoiseScale: { value: options.noiseScale || [4, 4] },
        uSSAONoise: { value: options.noiseTexture || null }
    };
}

/**
 * AO method constants
 */
export const AO_METHODS = {
    RAYMARCH: 0,
    RAYMARCH_HQ: 1,
    HBAO: 2,
    VOLUMETRIC: 3
};

/**
 * Generate noise texture for SSAO
 * Returns array of random values
 */
export function generateSSAONoise(size = 4) {
    const noise = new Float32Array(size * size * 3);
    
    for (let i = 0; i < size * size; i++) {
        // Random rotation vector (tangent space)
        const angle = Math.random() * Math.PI * 2;
        noise[i * 3] = Math.cos(angle);
        noise[i * 3 + 1] = Math.sin(angle);
        noise[i * 3 + 2] = 0;
    }
    
    return noise;
}

/**
 * Get AO shader code
 */
export function getAOShader() {
    return {
        uniforms: AO_UNIFORMS,
        functions: AO_GLSL,
        ssao: SSAO_FRAGMENT,
        blur: SSAO_BLUR_FRAGMENT
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    uniforms: AO_UNIFORMS,
    glsl: AO_GLSL,
    ssaoFragment: SSAO_FRAGMENT,
    blurFragment: SSAO_BLUR_FRAGMENT,
    createUniforms: createAOUniforms,
    getShader: getAOShader,
    methods: AO_METHODS,
    generateNoise: generateSSAONoise
};
