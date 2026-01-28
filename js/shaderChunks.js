'use strict';

/**
 * Registers custom shadow-related shader chunks with Three.js.
 * These chunks can then be included in materials using #include <chunk_name>
 */
function registerShadowChunks(shadowCommonGLSL) {
    // Fragment shader: shadow uniforms and functions
    THREE.ShaderChunk.point_shadow_pars_fragment = `
        varying vec3 vWorldPos;

        uniform samplerCube shadowCube;
        uniform vec3 lightPos;
        uniform float shadowNear;
        uniform float shadowFar;
        uniform float shadowBias;
        uniform float pcfRadius;
        uniform int poissonSamples;
        uniform int shadowType;
        uniform float lightRadius;
        uniform int pcssBlockerSamples;
        uniform float ESMK;
        uniform float lightBleedReduction;

        ${shadowCommonGLSL}
    `;

    // Vertex shader: declare the varying
    THREE.ShaderChunk.point_shadow_pars_vertex = `
        varying vec3 vWorldPos;
    `;

    // Vertex shader: compute world position
    THREE.ShaderChunk.point_shadow_vertex = `
        vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
        vWorldPos = worldPos.xyz;
    `;

    // Fragment shader: shadow factor calculation
    // Uses preprocessor to select technique at compile time
    THREE.ShaderChunk.point_shadow_fragment = `
        #ifndef SHADOW_TYPE
        #define SHADOW_TYPE 1
        #endif

        float shadow = 1.0;

        #if SHADOW_TYPE == 1
            shadow = shadowFactorHard(shadowCube, lightPos, shadowNear, shadowFar, shadowBias, vWorldPos);
        #elif SHADOW_TYPE == 2
            shadow = shadowFactorPCF(shadowCube, lightPos, shadowNear, shadowFar, shadowBias, vWorldPos, pcfRadius, poissonSamples);
        #elif SHADOW_TYPE == 3
            shadow = shadowFactorVariance(shadowCube, lightPos, shadowNear, shadowFar, shadowBias, vWorldPos);
        #elif SHADOW_TYPE == 4
            shadow = shadowFactorESM(shadowCube, lightPos, shadowNear, shadowFar, shadowBias, vWorldPos, ESMK);
        #elif SHADOW_TYPE == 5
            shadow = shadowFactorPCSS(shadowCube, lightPos, shadowNear, shadowFar, shadowBias, vWorldPos, lightRadius, pcssBlockerSamples, poissonSamples);
        #elif SHADOW_TYPE == 6
            shadow = shadowFactorMSM(shadowCube, lightPos, shadowNear, shadowFar, shadowBias, vWorldPos);
        #else
            shadow = 1.0;
        #endif

        reflectedLight.directDiffuse *= shadow;
        reflectedLight.directSpecular *= shadow;
    `;
}

/**
 * Helper to inject code after a specific #include directive.
 * More resilient than exact string matching.
 */
function injectAfterInclude(shaderSource, includeName, code) {
    const pattern = new RegExp(`(#include\\s*<${includeName}>)`);
    return shaderSource.replace(pattern, `$1\n${code}`);
}

/**
 * Helper to inject code before a specific #include directive.
 */
function injectBeforeInclude(shaderSource, includeName, code) {
    const pattern = new RegExp(`(#include\\s*<${includeName}>)`);
    return shaderSource.replace(pattern, `${code}\n$1`);
}

/**
 * Injects point shadow support into a MeshStandardMaterial.
 * Uses global uniform references from setup.js directly.
 * Call this after registerShadowChunks() has been called.
 */
function injectPointShadowsIntoMaterial(mat) {
    mat.onBeforeCompile = (shader) => {
        // assign js side uniforms to the shader
        shader.uniforms.shadowCube = uShadowCube;
        shader.uniforms.shadowNear = uShadowNear;
        shader.uniforms.shadowFar = uShadowFar;
        shader.uniforms.shadowBias = uShadowBias;
        shader.uniforms.lightPos = uLightPosition;
        shader.uniforms.pcfRadius = uPCFRadius;
        shader.uniforms.poissonSamples = uPoissonSamples;
        shader.uniforms.shadowType = uShadowType;
        shader.uniforms.lightRadius = uLightRadius;
        shader.uniforms.pcssBlockerSamples = uBlockerSamples;
        shader.uniforms.ESMK = uESMK;
        shader.uniforms.lightBleedReduction = uBleedReduction;
        
        mat.userData.shadowShader = shader;

        // Vertex shader injections
        shader.vertexShader = injectAfterInclude(
            shader.vertexShader,
            'common',
            '#include <point_shadow_pars_vertex>' // varying declaration
        );
        shader.vertexShader = injectAfterInclude(
            shader.vertexShader,
            'worldpos_vertex',
            '#include <point_shadow_vertex>' // vWorldPos calculation
        );

        // Fragment shader injections
        shader.fragmentShader = injectAfterInclude(
            shader.fragmentShader,
            'common',
            '#include <point_shadow_pars_fragment>' // uniforms + shadow functions
        );
        shader.fragmentShader = injectAfterInclude(
            shader.fragmentShader,             // shader source to inject into
            'lights_fragment_begin',           // inject AFTER this include
            '#include <point_shadow_fragment>' // shadow factor calculation
        );
    };

    mat.needsUpdate = true;
}
