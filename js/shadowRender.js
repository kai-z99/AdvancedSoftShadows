'use strict';

let shadowCams = [];
let tempBlurRight = new THREE.Vector3();

function createShadowRenderTarget(res) {
    return new THREE.WebGLCubeRenderTarget(res, {
        generateMipmaps: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthBuffer: true,
        stencilBuffer: false,
    });
}

function recreateShadowPassRenderTargets() {
    if (shadowCubeRT) shadowCubeRT.dispose();
    if (shadowCubeBlurRT) shadowCubeBlurRT.dispose();

    shadowCubeRT = createShadowRenderTarget(currentShadowRes);
    shadowCubeBlurRT = createShadowRenderTarget(currentShadowRes);
    uShadowCube.value = shadowCubeRT.texture;

    if (blurMaterial) {
        blurMaterial.uniforms.sourceCube.value = shadowCubeRT.texture;
        blurMaterial.uniforms.texelStep.value = 2.0 / currentShadowRes;
    }
    if (shadowDebugMaterial) {
        shadowDebugMaterial.uniforms.shadowCube.value = shadowCubeRT.texture;
    }
}

function makeShadowCam() {
    return new THREE.PerspectiveCamera(90, 1, uShadowNear.value, uShadowFar.value);
}

function updateShadowCamerasNearFar() {
    for (let i = 0; i < shadowCams.length; ++i) {
        const cam = shadowCams[i];
        cam.near = uShadowNear.value;
        cam.far = uShadowFar.value;
        cam.updateProjectionMatrix();
    }
}

function setBlurFaceUniforms(face) {
    if (!blurMaterial) return;
    const forward = faceDirs[face];
    const up = faceUps[face];
    tempBlurRight.copy(forward).cross(up).normalize();
    blurMaterial.uniforms.faceForward.value.copy(forward);
    blurMaterial.uniforms.faceUp.value.copy(up);
    blurMaterial.uniforms.faceRight.value.copy(tempBlurRight);
}

function blurShadowMap() {
    if (!blurMaterial) return;
    const passes = [
        { dir: blurDirections[0], source: shadowCubeRT, target: shadowCubeBlurRT },
        { dir: blurDirections[1], source: shadowCubeBlurRT, target: shadowCubeRT },
    ];

    //2 pass seperable gaussian blur
    for (let p = 0; p < passes.length; ++p) {
        blurMaterial.uniforms.direction.value.copy(passes[p].dir);
        blurMaterial.uniforms.sourceCube.value = passes[p].source.texture;

        for (let face = 0; face < 6; ++face) {
            setBlurFaceUniforms(face);
            renderer.setRenderTarget(passes[p].target, face);
            renderer.clear();
            renderer.render(blurScene, blurCamera);
        }
    }

    renderer.setRenderTarget(null);
}

function setupShadows() {

    recreateShadowPassRenderTargets();

    shadowCams = [
    makeShadowCam(),
    makeShadowCam(),
    makeShadowCam(),
    makeShadowCam(),
    makeShadowCam(),
    makeShadowCam(),
    ];

    updateShadowCamerasNearFar();
}

function renderShadowMap() {
    const lp = uOrbPosition.value;
    pointShadowMaterial.uniforms.lightPos.value = lp;

    const oldSphereVisible = sphere.visible;
    sphere.visible = false;

    const oldOverride = scene.overrideMaterial;
    scene.overrideMaterial = pointShadowMaterial;

    for (let face = 0; face < 6; face++) {
        const cam = shadowCams[face];

        cam.position.copy(lp);
        cam.up.copy(faceUps[face]);
        cam.lookAt(lp.clone().add(faceDirs[face]));
        cam.updateMatrixWorld(true);
        cam.updateProjectionMatrix();

        renderer.setRenderTarget(shadowCubeRT, face);
        renderer.clear(true, true, true);
        renderer.render(scene, cam);
    }

    renderer.setRenderTarget(null);
    scene.overrideMaterial = oldOverride;
    sphere.visible = oldSphereVisible;

    if (uShadowType.value === 3) {
        blurShadowMap();
    }
}


