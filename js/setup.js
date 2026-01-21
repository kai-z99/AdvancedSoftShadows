'use strict';

// Shared uniforms and render state
const uLightPosition   = { type: 'v3', value: new THREE.Vector3(0.0, 20.0, -15.0) };
const uLightRadius     = { value: DEFAULT_LIGHT_RADIUS };
const uPCFRadius     = { value: DEFAULT_PCF_RADIUS };
const uPoissonSamples = { value: DEFAULT_POISSON_SAMPLES };
const uBlockerSamples = { value: DEFAULT_PCSS_BLOCKER_SAMPLES };
const uShadowType    = { value: 1 };
const uShadowNear    = { value: DEFAULT_SHADOW_NEAR };
const uShadowFar     = { value: DEFAULT_SHADOW_FAR };
const uShadowBias    = { value: DEFAULT_SHADOW_BIAS };
const uShadowCube = { value: null }; // set in recreateShadowPassRenderTargets()
const uESMK = { value: DEFAULT_ESM_K}

//shadow rts
let shadowCubeRT = null;
let shadowCubeBlurRT = null;
let currentShadowRes = BASE_SHADOW_RES; //res of rt
let showShadowDebug = false;

let ui = null;
let keyboard = null;

//scene materials
let armadilloMaterial = null;
let floorMaterial = null;
let sphereMaterial = null;
let pointShadowMaterial = null;
let blurMaterial = null;
let shadowDebugMaterial = null;

//2 tap blur scene for variance shadow map
let blurScene = null;
let blurCamera = null;
let blurPlane = null;

//shadow debug overlay
let shadowDebugScene = null;
let shadowDebugCamera = null;
let shadowDebugPlane = null;

//light sphere
let sphereGeometry = null;
let sphere = null;
let sphereLight = null;
let lightBrightness = DEFAULT_LIGHT_BRIGHTNESS; //dont need this as a uniform since its not used in our shaders
let lightAttenuationRadius = DEFAULT_LIGHT_ATTENUATION; //same here


/**
 * Creates a basic scene and returns necessary objects
 * to manipulate the scene, camera and render context.
 */
function setup() {
    // Check WebGL Version
    if (!WEBGL.isWebGL2Available()) {
            document.body.appendChild(WEBGL.getWebGL2ErrorMessage());
    }

    // Get the canvas element and its drawing context from the HTML document.
    const canvas = document.getElementById('webglcanvas');
    const context = canvas.getContext('webgl2');

    // Construct a THREEjs renderer from the canvas and context.
    const renderer = new THREE.WebGLRenderer({ canvas, context });
    renderer.setClearColor(0x000033); // black background colour. A dark blue would be something
    const scene = new THREE.Scene();

    // Set up the camera.
    const camera = new THREE.PerspectiveCamera(30.0, 1.0, 0.1, 1000.0); // view angle, aspect ratio, near, far
    camera.position.set(0.0, 30.0, 55.0);
    camera.lookAt(scene.position);
    scene.add(camera);

    // Setup orbit controls for the camera.
    const controls = new THREE.OrbitControls(camera, canvas);
    controls.damping = 0.2;
    controls.autoRotate = false;

    // Update projection matrix based on the windows size.
    function resize() {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    // Cast a weak ambient light to make the floor visible.
    const light = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(light);

    return {
            renderer,
            scene,
            camera,
    };
}

/**
 * Utility function that loads obj files using THREE.OBJLoader
 * and places them in the scene using the given callback `place`.
 * 
 * The variable passed into the place callback is a THREE.Object3D.
 */
function loadAndPlaceOBJ(file, material, place) {
        const manager = new THREE.LoadingManager();
        manager.onProgress = function (item, loaded, total) {
                console.log(item, loaded, total);
        };

        const onProgress = function (xhr) {
                if (xhr.lengthComputable) {
                        const percentComplete = xhr.loaded / xhr.total * 100.0;
                        console.log(Math.round(percentComplete, 2) + '% downloaded');
                }
        };

        const loader = new THREE.OBJLoader(manager);
        loader.load(file, function (object) {
                object.traverse(function (child) {
                        if (child instanceof THREE.Mesh) {
                                child.material = material;
                        }
                });
                place(object);
        }, onProgress);
}

function initializeSceneContent(scene) {
        initMaterials();
        initScenes();
        loadSceneObjects(scene);
        loadShadowShaders();
}

function initializeShadowUI() {
        if (ui) return ui;
        ui = createDebugPanel(getShadowUIControls());
        if (typeof window.updateShadowUI === 'function') {
                window.updateShadowUI();
        } else if (ui && typeof ui.update === 'function') {
                ui.update();
        }
        return ui;
}

function initMaterials() {
        if (armadilloMaterial) return;

        armadilloMaterial = new THREE.MeshStandardMaterial({
                color: 0xb5b5b5,
                metalness: 0.15,
                roughness: 0.65,
        });

        floorMaterial = new THREE.MeshStandardMaterial({
                color: 0x888888,
                metalness: 0.0,
                roughness: 0.9,
        });

        sphereMaterial = new THREE.ShaderMaterial({
                uniforms: {
                        lightPosition: uLightPosition,
                        lightRadius: uLightRadius,
                }
        });

        pointShadowMaterial = new THREE.ShaderMaterial({
                uniforms: {
                        lightPos: uLightPosition,
                        nearPlane: uShadowNear,
                        farPlane: uShadowFar,
                        ESMK: uESMK,
                }
        });

        blurMaterial = new THREE.ShaderMaterial({
                uniforms: {
                        sourceCube: { value: null },
                        direction: { value: new THREE.Vector2(1.0, 0.0) },
                        texelStep: { value: 2.0 / currentShadowRes },
                        faceRight: { value: new THREE.Vector3(1, 0, 0) },
                        faceUp: { value: new THREE.Vector3(0, 1, 0) },
                        faceForward: { value: new THREE.Vector3(0, 0, 1) },
                },
                depthTest: false,
                depthWrite: false,
                blending: THREE.NoBlending,
        });

        shadowDebugMaterial = new THREE.ShaderMaterial({
                uniforms: {
                        shadowCube: { value: null },
                        shadowNear: uShadowNear,
                        shadowFar: uShadowFar,
                },
                depthTest: false,
                depthWrite: false,
                blending: THREE.NoBlending,
        });
}

function initScenes() {
    //for the 2 pass gaussian blur
    if (!blurScene) {
            blurScene = new THREE.Scene();
            blurCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            blurPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
            blurScene.add(blurPlane);
    }

    //for the shadow map debug overlay
    if (!shadowDebugScene) {
            shadowDebugScene = new THREE.Scene();
            shadowDebugCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            shadowDebugPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
            shadowDebugScene.add(shadowDebugPlane);
    }
}

function loadSceneObjects(scene) {
    //floor
    /*
    const textureLoader = new THREE.TextureLoader();
    const floorColorMap = textureLoader.load('images/cobblestone_floor_diff.jpg');
    const floorNormalMap = textureLoader.load('images/cobblestone_floor_nor.jpg');
    const floorRoughnessMap = textureLoader.load('images/cobblestone_floor_rough.jpg');
    const floorAoMap = textureLoader.load('images/cobblestone_floor_ao.jpg');

    const floorRepeat = 8;
    [floorColorMap, floorNormalMap, floorRoughnessMap, floorAoMap].forEach((tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(floorRepeat, floorRepeat);
    });
    */
    

    const floorGeometry = new THREE.PlaneBufferGeometry(250.0, 250.0);
    floorGeometry.setAttribute('uv2', new THREE.BufferAttribute(floorGeometry.attributes.uv.array, 2));
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2.0;
    floor.position.y = -0.3;
    scene.add(floor);


    loadAndPlaceOBJ('obj/trex.obj', armadilloMaterial, function (armadillo) {
            armadillo.position.set(0.0, 30, -8.0);
            armadillo.rotation.x = -Math.PI
            armadillo.scale.set(1.0, 1.0, 1.0);
            scene.add(armadillo);
    });

    if (!sphereGeometry) {
            sphereGeometry = new THREE.SphereGeometry(1.0, 32.0, 32.0);
    }

    if (!sphere) {
            sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.set(0.0, 0.0, 0.0);
            sphere.scale.setScalar(uLightRadius.value);
            scene.add(sphere);
    }

    if (!sphereLight) {
            sphereLight = new THREE.PointLight(0xffffff, lightBrightness, lightAttenuationRadius);
            scene.add(sphereLight);
    } else {
            sphereLight.intensity = lightBrightness;
            sphereLight.distance = lightAttenuationRadius;
    }
}

function loadShadowShaders() {
    const shaderFiles = [
            'glsl/sphere.vs.glsl',
            'glsl/sphere.fs.glsl',
            'glsl/shadowPass.vs.glsl',
            'glsl/shadowPass.fs.glsl',
            'glsl/shadowCommon.glsl',
            'glsl/shadowBlur.vs.glsl',
            'glsl/shadowBlur.fs.glsl',
            'glsl/shadowDebug.vs.glsl',
            'glsl/shadowDebug.fs.glsl',
    ];

    new THREE.SourceLoader().load(shaderFiles, function (shaders) {
            sphereMaterial.vertexShader = shaders['glsl/sphere.vs.glsl'];
            sphereMaterial.fragmentShader = shaders['glsl/sphere.fs.glsl'];
            sphereMaterial.needsUpdate = true; 

            pointShadowMaterial.vertexShader     = shaders['glsl/shadowPass.vs.glsl'];
            pointShadowMaterial.fragmentShader = shaders['glsl/shadowPass.fs.glsl'];
            pointShadowMaterial.needsUpdate = true;

            blurMaterial.vertexShader = shaders['glsl/shadowBlur.vs.glsl'];
            blurMaterial.fragmentShader = shaders['glsl/shadowBlur.fs.glsl'];
            blurMaterial.needsUpdate = true;

            shadowDebugMaterial.vertexShader = shaders['glsl/shadowDebug.vs.glsl'];
            shadowDebugMaterial.fragmentShader = shaders['glsl/shadowDebug.fs.glsl'];
            shadowDebugMaterial.needsUpdate = true;
            

            blurPlane.material = blurMaterial;
            shadowDebugPlane.material = shadowDebugMaterial;

            const shadowCommon = shaders['glsl/shadowCommon.glsl'];
            injectPointShadowsIntoStandardMaterial(floorMaterial, shadowCommon);
            injectPointShadowsIntoStandardMaterial(armadilloMaterial, shadowCommon);
    });
}

function injectPointShadowsIntoStandardMaterial(mat, shadowCommon) {
    mat.onBeforeCompile = (shader) => {
            shader.uniforms.shadowCube             = uShadowCube;
            shader.uniforms.shadowNear             = uShadowNear;
            shader.uniforms.shadowFar              = uShadowFar;
            shader.uniforms.shadowBias             = uShadowBias;
            shader.uniforms.lightPos               = uLightPosition;
            shader.uniforms.pcfRadius              = uPCFRadius;
            shader.uniforms.poissonSamples         = uPoissonSamples;
            shader.uniforms.shadowType             = uShadowType;
            shader.uniforms.lightRadius              = uLightRadius;
            shader.uniforms.pcssBlockerSamples     = uBlockerSamples;
            shader.uniforms.ESMK                   = uESMK;
            mat.userData.shadowShader              = shader;

            shader.vertexShader = shader.vertexShader
                    .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;')
                    .replace(
                            '#include <worldpos_vertex>',
                            `#include <worldpos_vertex>
                    vec4 worldPos = modelMatrix * vec4( transformed, 1.0 );
                    vWorldPos = worldPos.xyz;`
                    );

            shader.fragmentShader = shader.fragmentShader
                    .replace(
                            '#include <common>',
                            `#include <common>
                    varying vec3 vWorldPos;

                    uniform samplerCube shadowCube;
                    uniform vec3 lightPos;
                    uniform float shadowNear;
                    uniform float shadowFar;
                    uniform float shadowBias;
                    uniform float pcfRadius;
                    uniform int shadowType;
                    uniform float lightRadius;
                    uniform int poissonSamples;
                    uniform int pcssBlockerSamples;
                    uniform float ESMK;

            ${shadowCommon}
            `
                    )
                    .replace(
                            '#include <lights_fragment_begin>',
                            `#include <lights_fragment_begin>
                    float shadow;
                    if (shadowType == 1) shadow = shadowFactorHard(shadowCube, lightPos, shadowNear, shadowFar, shadowBias, vWorldPos);
                    else if (shadowType == 2) shadow = shadowFactorPCF(shadowCube, lightPos, shadowNear, shadowFar, shadowBias, vWorldPos, pcfRadius, poissonSamples);
                    else if (shadowType == 3) shadow = shadowFactorVariance(shadowCube, lightPos, shadowNear, shadowFar, shadowBias, vWorldPos);
                    else if (shadowType == 4) shadow = shadowFactorPCSS(shadowCube, lightPos, shadowNear, shadowFar, shadowBias, vWorldPos, lightRadius, pcssBlockerSamples, poissonSamples);
                    else if (shadowType == 5) shadow = shadowFactorESM(shadowCube, lightPos, shadowNear, shadowFar, shadowBias, vWorldPos, ESMK);
                    else shadow = 1.0;

                    reflectedLight.directDiffuse *= shadow;
                    reflectedLight.directSpecular *= shadow;
`
                    );
    };

    mat.needsUpdate = true;
}

function initializeKeyboard() {
        if (keyboard) return keyboard;
        keyboard = new THREEx.KeyboardState();
        return keyboard;
}


