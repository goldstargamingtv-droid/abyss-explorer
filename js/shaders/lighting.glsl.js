/**
 * ============================================================================
 * ABYSS EXPLORER - ADVANCED LIGHTING SHADER
 * ============================================================================
 * 
 * Comprehensive lighting system for 3D fractal rendering.
 * Includes multiple lighting models, soft shadows, and material properties.
 * 
 * Lighting Models:
 * 1. Phong/Blinn-Phong - Classic specular highlights
 * 2. PBR (Physically Based Rendering) - Cook-Torrance BRDF approximation
 * 3. Oren-Nayar - Rough diffuse surfaces
 * 4. Subsurface Scattering - Translucent materials
 * 
 * Shadow Techniques:
 * - Hard shadows (single ray)
 * - Soft shadows (penumbra estimation)
 * - Ambient occlusion integration
 * 
 * References:
 * - Inigo Quilez - https://iquilezles.org/articles/rmshadows/
 * - LearnOpenGL - PBR Theory
 * - SIGGRAPH courses on real-time rendering
 * - Schlick approximation for Fresnel
 * 
 * @module shaders/lighting.glsl
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// LIGHTING UNIFORMS
// ============================================================================

export const LIGHTING_UNIFORMS = /* glsl */`
// Main light
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uLightIntensity;

// Secondary lights (up to 4)
uniform vec3 uLight2Dir;
uniform vec3 uLight2Color;
uniform float uLight2Intensity;
uniform vec3 uLight3Dir;
uniform vec3 uLight3Color;
uniform float uLight3Intensity;
uniform vec3 uLight4Dir;
uniform vec3 uLight4Color;
uniform float uLight4Intensity;
uniform int uLightCount;

// Material properties
uniform float uAmbient;
uniform float uDiffuse;
uniform float uSpecular;
uniform float uShininess;
uniform float uRoughness;           // PBR roughness (0-1)
uniform float uMetallic;            // PBR metallic (0-1)
uniform vec3 uAlbedo;               // Base color for PBR

// Shadow settings
uniform bool uShadowsEnabled;
uniform float uShadowSoftness;      // Penumbra factor (higher = softer)
uniform float uShadowBias;          // Bias to prevent shadow acne
uniform int uShadowSteps;           // Max shadow ray steps

// Environment
uniform vec3 uAmbientColor;         // Ambient/sky color
uniform float uAmbientIntensity;
uniform vec3 uGroundColor;          // Ground reflection color
uniform bool uHemisphereLight;      // Use hemisphere lighting

// Advanced effects
uniform bool uFresnelEnabled;
uniform float uFresnelPower;
uniform bool uSubsurfaceEnabled;
uniform float uSubsurfaceRadius;
uniform vec3 uSubsurfaceColor;

// Lighting model selection
uniform int uLightingModel;         // 0=Phong, 1=BlinnPhong, 2=PBR, 3=OrenNayar
`;

// ============================================================================
// LIGHTING FUNCTIONS
// ============================================================================

export const LIGHTING_GLSL = /* glsl */`
/**
 * ============================================================================
 * LIGHTING IMPLEMENTATION
 * ============================================================================
 */

${LIGHTING_UNIFORMS}

// Constants
#define PI 3.14159265359
#define INV_PI 0.31830988618

// ============================================================================
// SOFT SHADOWS
// ============================================================================

/**
 * Calculate soft shadows using sphere tracing
 * Reference: Inigo Quilez - https://iquilezles.org/articles/rmshadows/
 * 
 * The key insight is that we can estimate the penumbra width from
 * the ratio of distance to surface vs distance traveled.
 * 
 * @param ro Ray origin (point on surface)
 * @param rd Ray direction (toward light)
 * @param mint Minimum t (start offset to avoid self-intersection)
 * @param maxt Maximum t (light distance or cutoff)
 * @param k Softness factor (higher = softer shadows)
 * @return Shadow factor 0 (full shadow) to 1 (no shadow)
 */
float calcSoftShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
    float res = 1.0;
    float t = mint;
    float ph = 1e10;  // Previous height (for improved penumbra)
    
    for (int i = 0; i < 128; i++) {
        if (i >= uShadowSteps) break;
        if (t > maxt) break;
        
        float h = map(ro + rd * t).x;
        
        // Improved soft shadow using previous height
        // This produces more natural penumbras
        float y = h * h / (2.0 * ph);
        float d = sqrt(h * h - y * y);
        res = min(res, k * d / max(0.0, t - y));
        
        ph = h;
        
        // Early exit if in full shadow
        if (res < 0.001) break;
        
        t += clamp(h, 0.01, 0.5);
    }
    
    return clamp(res, 0.0, 1.0);
}

/**
 * Simple hard shadow (faster, for lower quality)
 */
float calcHardShadow(vec3 ro, vec3 rd, float mint, float maxt) {
    float t = mint;
    
    for (int i = 0; i < 64; i++) {
        float h = map(ro + rd * t).x;
        
        if (h < 0.001) return 0.0;  // In shadow
        if (t > maxt) break;
        
        t += h;
    }
    
    return 1.0;
}

// ============================================================================
// FRESNEL EFFECT
// ============================================================================

/**
 * Schlick's Fresnel approximation
 * F(θ) ≈ F0 + (1 - F0)(1 - cos(θ))^5
 * 
 * @param cosTheta Cosine of angle between view and half vector
 * @param F0 Reflectance at normal incidence
 */
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

/**
 * Fresnel with roughness (for IBL)
 */
vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// ============================================================================
// PHONG LIGHTING MODEL
// ============================================================================

/**
 * Classic Phong reflection model
 * I = ka * Ia + kd * (L · N) * Id + ks * (R · V)^n * Is
 */
vec3 phongLighting(
    vec3 normal,
    vec3 viewDir,
    vec3 lightDir,
    vec3 lightColor,
    vec3 baseColor
) {
    // Ambient
    vec3 ambient = uAmbient * uAmbientColor * baseColor;
    
    // Diffuse
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = uDiffuse * diff * lightColor * baseColor;
    
    // Specular (Phong)
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
    vec3 specular = uSpecular * spec * lightColor;
    
    return ambient + diffuse + specular;
}

/**
 * Blinn-Phong (improved Phong using half vector)
 * More physically accurate and faster
 */
vec3 blinnPhongLighting(
    vec3 normal,
    vec3 viewDir,
    vec3 lightDir,
    vec3 lightColor,
    vec3 baseColor
) {
    // Ambient
    vec3 ambient = uAmbient * uAmbientColor * baseColor;
    
    // Diffuse
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = uDiffuse * diff * lightColor * baseColor;
    
    // Specular (Blinn-Phong using half vector)
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), uShininess * 4.0);
    vec3 specular = uSpecular * spec * lightColor;
    
    // Fresnel enhancement
    if (uFresnelEnabled) {
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uFresnelPower);
        specular *= (1.0 + fresnel * 0.5);
    }
    
    return ambient + diffuse + specular;
}

// ============================================================================
// PBR (PHYSICALLY BASED RENDERING)
// ============================================================================

/**
 * GGX/Trowbridge-Reitz Normal Distribution Function
 * D(h) = α² / (π * ((n·h)² * (α² - 1) + 1)²)
 */
float distributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;
    
    float num = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;
    
    return num / denom;
}

/**
 * Schlick-GGX Geometry Function
 * G_SchlickGGX(n, v, k) = (n·v) / ((n·v)(1-k) + k)
 */
float geometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;  // Disney remapping
    
    float num = NdotV;
    float denom = NdotV * (1.0 - k) + k;
    
    return num / denom;
}

/**
 * Smith's method for geometry shadowing/masking
 * G(n, v, l) = G_sub(n, v) * G_sub(n, l)
 */
float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = geometrySchlickGGX(NdotV, roughness);
    float ggx1 = geometrySchlickGGX(NdotL, roughness);
    
    return ggx1 * ggx2;
}

/**
 * Cook-Torrance BRDF for PBR
 * 
 * f_r = kd * f_lambert + ks * f_cook-torrance
 * 
 * f_cook-torrance = DFG / (4 * (ω_o · n) * (ω_i · n))
 */
vec3 pbrLighting(
    vec3 normal,
    vec3 viewDir,
    vec3 lightDir,
    vec3 lightColor,
    vec3 albedo,
    float metallic,
    float roughness
) {
    vec3 H = normalize(viewDir + lightDir);
    
    // Base reflectivity (F0)
    // Dielectrics have F0 ≈ 0.04, metals use albedo
    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);
    
    // Cook-Torrance BRDF
    float NDF = distributionGGX(normal, H, roughness);
    float G = geometrySmith(normal, viewDir, lightDir, roughness);
    vec3 F = fresnelSchlick(max(dot(H, viewDir), 0.0), F0);
    
    // Specular contribution
    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(normal, viewDir), 0.0) * max(dot(normal, lightDir), 0.0) + 0.0001;
    vec3 specular = numerator / denominator;
    
    // Energy conservation
    // kS is the specular contribution (Fresnel)
    // kD is 1 - kS (what's not reflected is refracted)
    // Metals have no diffuse
    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - metallic;
    
    // Diffuse uses Lambert
    float NdotL = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = kD * albedo * INV_PI;
    
    return (diffuse + specular) * lightColor * NdotL;
}

// ============================================================================
// OREN-NAYAR DIFFUSE MODEL
// ============================================================================

/**
 * Oren-Nayar model for rough diffuse surfaces
 * More accurate than Lambert for rough materials
 * 
 * @param roughness Surface roughness (0 = Lambert, 1 = very rough)
 */
float orenNayar(vec3 normal, vec3 viewDir, vec3 lightDir, float roughness) {
    float NdotL = dot(normal, lightDir);
    float NdotV = dot(normal, viewDir);
    
    float angleVN = acos(NdotV);
    float angleLN = acos(NdotL);
    
    float alpha = max(angleVN, angleLN);
    float beta = min(angleVN, angleLN);
    float gamma = dot(viewDir - normal * NdotV, lightDir - normal * NdotL);
    
    float roughnessSq = roughness * roughness;
    
    float A = 1.0 - 0.5 * (roughnessSq / (roughnessSq + 0.57));
    float B = 0.45 * (roughnessSq / (roughnessSq + 0.09));
    
    float L = max(0.0, NdotL) * (A + B * max(0.0, gamma) * sin(alpha) * tan(beta));
    
    return L;
}

// ============================================================================
// SUBSURFACE SCATTERING (APPROXIMATION)
// ============================================================================

/**
 * Simple subsurface scattering approximation
 * For translucent materials like wax, skin, leaves
 */
vec3 subsurfaceScattering(vec3 pos, vec3 normal, vec3 lightDir, vec3 baseColor) {
    // Sample depth into the surface
    float thickness = 0.0;
    
    for (int i = 0; i < 5; i++) {
        float h = float(i) * uSubsurfaceRadius / 5.0;
        vec3 samplePos = pos - normal * h;
        float d = map(samplePos).x;
        thickness += max(0.0, -d);
    }
    
    thickness /= 5.0;
    
    // Light transmission based on thickness
    float transmission = exp(-thickness / uSubsurfaceRadius);
    
    // Color shift (longer wavelengths penetrate deeper)
    vec3 sss = uSubsurfaceColor * transmission;
    
    // Combine with back-lighting
    float backLight = max(0.0, dot(normal, -lightDir));
    
    return sss * backLight * 0.5;
}

// ============================================================================
// HEMISPHERE LIGHTING
// ============================================================================

/**
 * Hemisphere/sky lighting
 * Interpolates between sky and ground color based on normal
 */
vec3 hemisphereLighting(vec3 normal) {
    float blend = 0.5 + 0.5 * normal.y;
    return mix(uGroundColor, uAmbientColor, blend) * uAmbientIntensity;
}

// ============================================================================
// MAIN LIGHTING FUNCTION
// ============================================================================

/**
 * Calculate complete lighting for a surface point
 * 
 * @param pos Surface position
 * @param normal Surface normal
 * @param viewDir View direction (toward camera)
 * @param baseColor Material base color
 * @return Final lit color
 */
vec3 calculateLighting(vec3 pos, vec3 normal, vec3 viewDir, vec3 baseColor) {
    vec3 result = vec3(0.0);
    
    // Hemisphere ambient
    if (uHemisphereLight) {
        result += hemisphereLighting(normal) * baseColor;
    } else {
        result += uAmbient * uAmbientColor * baseColor;
    }
    
    // Main light
    vec3 lightDir = normalize(uLightDir);
    
    // Shadow
    float shadow = 1.0;
    if (uShadowsEnabled) {
        shadow = calcSoftShadow(
            pos + normal * uShadowBias,
            lightDir,
            0.01,
            20.0,
            uShadowSoftness
        );
    }
    
    // Apply selected lighting model
    vec3 lightContrib;
    
    if (uLightingModel == 2) {
        // PBR
        lightContrib = pbrLighting(
            normal, viewDir, lightDir,
            uLightColor * uLightIntensity,
            uAlbedo.x > 0.0 ? uAlbedo : baseColor,
            uMetallic, uRoughness
        );
    } else if (uLightingModel == 3) {
        // Oren-Nayar
        float on = orenNayar(normal, viewDir, lightDir, uRoughness);
        vec3 spec = vec3(pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), uShininess));
        lightContrib = (on * baseColor + uSpecular * spec) * uLightColor * uLightIntensity;
    } else if (uLightingModel == 1) {
        // Blinn-Phong
        lightContrib = blinnPhongLighting(normal, viewDir, lightDir, uLightColor * uLightIntensity, baseColor);
        lightContrib -= uAmbient * uAmbientColor * baseColor; // Remove ambient (already added)
    } else {
        // Phong
        lightContrib = phongLighting(normal, viewDir, lightDir, uLightColor * uLightIntensity, baseColor);
        lightContrib -= uAmbient * uAmbientColor * baseColor;
    }
    
    result += lightContrib * shadow;
    
    // Additional lights (no shadows for performance)
    if (uLightCount >= 2 && uLight2Intensity > 0.0) {
        vec3 l2Dir = normalize(uLight2Dir);
        float l2Diff = max(dot(normal, l2Dir), 0.0);
        result += l2Diff * uLight2Color * uLight2Intensity * baseColor * uDiffuse;
    }
    
    if (uLightCount >= 3 && uLight3Intensity > 0.0) {
        vec3 l3Dir = normalize(uLight3Dir);
        float l3Diff = max(dot(normal, l3Dir), 0.0);
        result += l3Diff * uLight3Color * uLight3Intensity * baseColor * uDiffuse;
    }
    
    if (uLightCount >= 4 && uLight4Intensity > 0.0) {
        vec3 l4Dir = normalize(uLight4Dir);
        float l4Diff = max(dot(normal, l4Dir), 0.0);
        result += l4Diff * uLight4Color * uLight4Intensity * baseColor * uDiffuse;
    }
    
    // Subsurface scattering
    if (uSubsurfaceEnabled) {
        result += subsurfaceScattering(pos, normal, lightDir, baseColor);
    }
    
    // Rim lighting (Fresnel at grazing angles)
    if (uFresnelEnabled) {
        float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), uFresnelPower);
        result += rim * uLightColor * 0.2;
    }
    
    return result;
}
`;

// ============================================================================
// JAVASCRIPT WRAPPER
// ============================================================================

/**
 * Create lighting uniforms
 */
export function createLightingUniforms(options = {}) {
    return {
        // Main light
        uLightDir: { value: options.lightDir || [1, 1, 1] },
        uLightColor: { value: options.lightColor || [1, 0.98, 0.95] },
        uLightIntensity: { value: options.lightIntensity || 1.0 },
        
        // Secondary lights
        uLight2Dir: { value: options.light2Dir || [-1, 0.5, 0] },
        uLight2Color: { value: options.light2Color || [0.3, 0.4, 0.6] },
        uLight2Intensity: { value: options.light2Intensity || 0.3 },
        uLight3Dir: { value: options.light3Dir || [0, -1, 0.5] },
        uLight3Color: { value: options.light3Color || [0.2, 0.15, 0.1] },
        uLight3Intensity: { value: options.light3Intensity || 0.2 },
        uLight4Dir: { value: options.light4Dir || [0, 0, -1] },
        uLight4Color: { value: options.light4Color || [0.1, 0.1, 0.2] },
        uLight4Intensity: { value: options.light4Intensity || 0.1 },
        uLightCount: { value: options.lightCount || 1 },
        
        // Material
        uAmbient: { value: options.ambient || 0.15 },
        uDiffuse: { value: options.diffuse || 0.8 },
        uSpecular: { value: options.specular || 0.5 },
        uShininess: { value: options.shininess || 32 },
        uRoughness: { value: options.roughness || 0.5 },
        uMetallic: { value: options.metallic || 0.0 },
        uAlbedo: { value: options.albedo || [0, 0, 0] },
        
        // Shadows
        uShadowsEnabled: { value: options.shadows !== false },
        uShadowSoftness: { value: options.shadowSoftness || 16.0 },
        uShadowBias: { value: options.shadowBias || 0.002 },
        uShadowSteps: { value: options.shadowSteps || 64 },
        
        // Environment
        uAmbientColor: { value: options.ambientColor || [0.4, 0.5, 0.7] },
        uAmbientIntensity: { value: options.ambientIntensity || 0.3 },
        uGroundColor: { value: options.groundColor || [0.3, 0.25, 0.2] },
        uHemisphereLight: { value: options.hemisphereLight || true },
        
        // Effects
        uFresnelEnabled: { value: options.fresnel !== false },
        uFresnelPower: { value: options.fresnelPower || 3.0 },
        uSubsurfaceEnabled: { value: options.subsurface || false },
        uSubsurfaceRadius: { value: options.subsurfaceRadius || 0.1 },
        uSubsurfaceColor: { value: options.subsurfaceColor || [1, 0.4, 0.2] },
        
        // Model
        uLightingModel: { value: options.lightingModel || 1 } // BlinnPhong default
    };
}

/**
 * Lighting model constants
 */
export const LIGHTING_MODELS = {
    PHONG: 0,
    BLINN_PHONG: 1,
    PBR: 2,
    OREN_NAYAR: 3
};

/**
 * Get lighting shader code
 */
export function getLightingShader() {
    return {
        uniforms: LIGHTING_UNIFORMS,
        functions: LIGHTING_GLSL
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    uniforms: LIGHTING_UNIFORMS,
    glsl: LIGHTING_GLSL,
    createUniforms: createLightingUniforms,
    getShader: getLightingShader,
    models: LIGHTING_MODELS
};
