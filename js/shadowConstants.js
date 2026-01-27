'use strict';

// Shadow options and configuration constants
const shadowModeNames = ['', 'Hard', 'PCF', 'Variance', 'ESM', 'PCSS', 'MSM']; //'' at 0 so the first starts at 1 (uShadowType)
const BASE_SHADOW_RES = 512;
const VARIANCE_SHADOW_RES = 512;
const SHADOW_RES_OPTIONS = [256, BASE_SHADOW_RES, 1024, 2048];

//bias
const MIN_SHADOW_BIAS = 0.0005;
const MAX_SHADOW_BIAS = 0.02;
const SHADOW_BIAS_STEP = 0.001;
const SHADOW_BIAS_DEFAULT = 0.0075;
const BIAS_EPS = 1e-6;

//far/near
const SHADOW_NEAR_MIN = 0.05;
const SHADOW_NEAR_MAX = 5.0;
const SHADOW_NEAR_DEFAULT = 0.1;
const SHADOW_NEAR_STEP = 0.1;
const SHADOW_FAR_MIN = 20.0;
const SHADOW_FAR_MAX = 500.0;
const SHADOW_FAR_DEFAULT = 350.0;
const SHADOW_FAR_STEP = 10.0;
const SHADOW_MIN_RANGE = 2.0;

//pcf
const PCF_RADIUS_MIN = 0.00;
const PCF_RADIUS_MAX = 1.0;
const PCF_RADIUS_STEP = 0.1;
const PCF_RADIUS_DEFAULT = 0.5;
const PCF_EPS = 1e-6;

const POISSON_SAMPLE_OPTIONS = [8, 16, 32, 64];
const POISSON_SAMPLES_DEFAULT = 64;

//pcss
const PCSS_BLOCKER_SAMPLE_OPTIONS = [4, 8, 16, 32];
const PCSS_BLOCKER_SAMPLES_DEFAULT = 32;

//esm
const ESM_K_MIN = 20.0;
const ESM_K_MAX = 150.0;
const ESM_K_DEFAULT = 70.0;
const ESM_K_STEP = 5.0;
const ESM_K_EPS = 1e-2;

// bleed reduction
const BLEED_REDUCTION_MIN = 0.0;
const BLEED_REDUCTION_MAX = 0.95;
const BLEED_REDUCTION_STEP = 0.05;
const BLEED_REDUCTION_DEFAULT = 0.5;
const BLEED_REDUCTION_EPS = 1e-3;

//light options
const LIGHT_RADIUS_MIN = 0.0;
const LIGHT_RADIUS_MAX = 4.0;
const LIGHT_RADIUS_STEP = 0.1;
const LIGHT_RADIUS_DEFAULT = 1.0;
const LIGHT_RADIUS_EPS = 1e-4;

const LIGHT_BRIGHTNESS_MIN = 0.1;
const LIGHT_BRIGHTNESS_MAX = 10.0;
const LIGHT_BRIGHTNESS_STEP = 0.1;
const LIGHT_BRIGHTNESS_DEFAULT = 1.5;
const LIGHT_BRIGHTNESS_EPS = 1e-3;

const LIGHT_ATTENUATION_MIN = 10.0;
const LIGHT_ATTENUATION_MAX = 600.0;
const LIGHT_ATTENUATION_STEP = 10.0;
const LIGHT_ATTENUATION_DEFAULT = 300.0;
const LIGHT_ATTENUATION_EPS = 1e-2;

// blur options
const BLUR_WIDTH_OPTIONS = [3, 5];
const BLUR_WIDTH_DEFAULT = 5;

const BLUR_SIGMA_OPTIONS = [1.0, 1.5, 2.0];
const BLUR_SIGMA_DEFAULT = 1.5;

const BLUR_MULTIPLIER_MIN = 0.5;
const BLUR_MULTIPLIER_MAX = 5.0;
const BLUR_MULTIPLIER_DEFAULT = 1.0;
const BLUR_MULTIPLIER_STEP = 0.1;
const BLUR_MULTIPLIER_EPS = 1e-4;


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
