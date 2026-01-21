'use strict';

// Shadow options and configuration constants
const shadowModeNames = ['', 'Hard', 'PCF', 'Variance', 'ESM', 'PCSS']; //'' at 0 so the first starts at 1 (uShadowType)
const BASE_SHADOW_RES = 512;
const VARIANCE_SHADOW_RES = 512;
const SHADOW_RES_OPTIONS = [256, BASE_SHADOW_RES, 1024, 2048];

//bias
const MIN_SHADOW_BIAS = 0.0005;
const MAX_SHADOW_BIAS = 0.02;
const SHADOW_BIAS_STEP = 0.001;
const DEFAULT_SHADOW_BIAS = 0.0075;
const BIAS_EPS = 1e-6;

//far/near
const SHADOW_NEAR_MIN = 0.05;
const SHADOW_NEAR_MAX = 5.0;
const DEFAULT_SHADOW_NEAR = 0.1;
const SHADOW_NEAR_STEP = 0.1;
const SHADOW_FAR_MIN = 20.0;
const SHADOW_FAR_MAX = 400.0;
const DEFAULT_SHADOW_FAR = 200.0;
const SHADOW_FAR_STEP = 10.0;
const SHADOW_MIN_RANGE = 2.0;

//pcf
const PCF_RADIUS_MIN = 0.00;
const PCF_RADIUS_MAX = 1.0;
const PCF_RADIUS_STEP = 0.1;
const DEFAULT_PCF_RADIUS = 0.2;
const PCF_EPS = 1e-6;

const POISSON_SAMPLE_OPTIONS = [8, 16, 32, 64];
const DEFAULT_POISSON_SAMPLES = 32;

//pcss
const PCSS_BLOCKER_SAMPLE_OPTIONS = [4, 8, 16, 32];
const DEFAULT_PCSS_BLOCKER_SAMPLES = 16;

//esm
const ESM_K_MIN = 20.0;
const ESM_K_MAX = 150.0;
const DEFAULT_ESM_K = 70.0;
const ESM_K_STEP = 5.0;
const ESM_K_EPS = 1e-2;

// bleed reduction
const BLEED_REDUCTION_MIN = 0.0;
const BLEED_REDUCTION_MAX = 0.95;
const BLEED_REDUCTION_STEP = 0.05;
const DEFAULT_BLEED_REDUCTION = 0.25;
const BLEED_REDUCTION_EPS = 1e-3;

//light options
const LIGHT_RADIUS_MIN = 0.0;
const LIGHT_RADIUS_MAX = 4.0;
const LIGHT_RADIUS_STEP = 0.1;
const DEFAULT_LIGHT_RADIUS = 1.0;
const LIGHT_RADIUS_EPS = 1e-4;

const LIGHT_BRIGHTNESS_MIN = 0.1;
const LIGHT_BRIGHTNESS_MAX = 10.0;
const LIGHT_BRIGHTNESS_STEP = 0.1;
const DEFAULT_LIGHT_BRIGHTNESS = 2.0;
const LIGHT_BRIGHTNESS_EPS = 1e-3;

const LIGHT_ATTENUATION_MIN = 10.0;
const LIGHT_ATTENUATION_MAX = 600.0;
const LIGHT_ATTENUATION_STEP = 10.0;
const DEFAULT_LIGHT_ATTENUATION = 300.0;
const LIGHT_ATTENUATION_EPS = 1e-2;

//variance blur options
const VARIANCE_BLUR_WIDTH_OPTIONS = [3, 5];
const DEFAULT_VARIANCE_BLUR_WIDTH = 5;
const VARIANCE_BLUR_SIGMA_OPTIONS = [1.0, 1.5, 2.0];
const DEFAULT_VARIANCE_BLUR_SIGMA = 1.5;
const VARIANCE_BLUR_SIGMA_EPS = 1e-3;



// Shadow pass math helpers
const faceDirs = [
  new THREE.Vector3( 1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3( 0, 1, 0),
  new THREE.Vector3( 0,-1, 0),
  new THREE.Vector3( 0, 0, 1),
  new THREE.Vector3( 0, 0,-1),
];
const faceUps = [
  new THREE.Vector3(0,-1, 0),
  new THREE.Vector3(0,-1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0,-1),
  new THREE.Vector3(0,-1, 0),
  new THREE.Vector3(0,-1, 0),
];

const blurDirections = [
  new THREE.Vector2(1, 0),
  new THREE.Vector2(0, 1),
];
const VARIANCE_BLUR_TAPS_PER_PASS = 5; // center + two offsets in each direction
const VARIANCE_BLUR_PASSES = 2;        // horizontal + vertical
const VARIANCE_TOTAL_TAPS = VARIANCE_BLUR_TAPS_PER_PASS * VARIANCE_BLUR_PASSES;
