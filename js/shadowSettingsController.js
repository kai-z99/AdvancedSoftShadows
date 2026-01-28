function setShadowResolution(size) {
    if (size === currentShadowRes) return;
    currentShadowRes = size;
    recreateShadowPassRenderTargets();
    const idx = SHADOW_RES_OPTIONS.indexOf(size);
    console.log(`Shadow resolution set to ${currentShadowRes}x${currentShadowRes}`);
    updateShadowUI();
}

function applyShadowTypeDefineToMaterial(mat, shadowType) {
  mat.defines = mat.defines || {};
  mat.defines.SHADOW_TYPE = shadowType;

  // Make sure Three builds a different program per SHADOW_TYPE
  mat.customProgramCacheKey = function () {
    return `SHADOW_TYPE:${this.defines?.SHADOW_TYPE ?? 0}`;
  };

  mat.needsUpdate = true; // triggers recompile
}

function applyShadowTypeDefineToAllLitMaterials(shadowType) {
  applyShadowTypeDefineToMaterial(armadilloMaterial, shadowType);
  Object.values(floorMaterialByKey).forEach(entry => {
    applyShadowTypeDefineToMaterial(entry.material, shadowType);
  });
}


function setShadowType(newType) {
  const clamped = Math.min(Math.max(newType, 1), shadowModeNames.length - 1);
  if (uShadowType.value === clamped) return;

  const prevUseMipmaps = shouldUseShadowMipmaps();
  uShadowType.value = clamped;

  // recompile lighting shaders as specialized variants
  applyShadowTypeDefineToAllLitMaterials(clamped);

  const nextUseMipmaps = shouldUseShadowMipmaps();
  if (prevUseMipmaps !== nextUseMipmaps) {
    recreateShadowPassRenderTargets();
  }

  console.log("Shadow type changed to: " + (shadowModeNames[uShadowType.value] || `Mode ${uShadowType.value}`));
  updateShadowUI();
}

function setPoissonSamples(value) {
    const idx = POISSON_SAMPLE_OPTIONS.indexOf(value);
    if (idx === -1) return;
    if (uPoissonSamples.value === value) return;
    uPoissonSamples.value = value;
    console.log("Poisson samples: " + value);
    updateShadowUI();
}

function setPCSSBlockerSamples(value) {
    const idx = PCSS_BLOCKER_SAMPLE_OPTIONS.indexOf(value);
    if (idx === -1) return;
    if (uBlockerSamples.value === value) return;
    uBlockerSamples.value = value;
    console.log("PCSS blocker samples: " + value);
    updateShadowUI();
}

function setShadowBias(value) {
    const clamped = Math.min(Math.max(value, MIN_SHADOW_BIAS), MAX_SHADOW_BIAS);
    if (Math.abs(clamped - uShadowBias.value) < BIAS_EPS) return;
    uShadowBias.value = clamped;
    console.log("Shadow bias: " + uShadowBias.value.toFixed(4));
    updateShadowUI();
}

function setPCFRadius(value) {
    const clamped = Math.min(Math.max(value, PCF_RADIUS_MIN), PCF_RADIUS_MAX);
    if (Math.abs(clamped - uPCFRadius.value) < PCF_EPS) return;
    uPCFRadius.value = clamped;
    console.log("PCF Radius: " + uPCFRadius.value.toFixed(2));
    updateShadowUI();
}

function setShadowNear(value) {
    const clamped = Math.min(Math.max(value, SHADOW_NEAR_MIN), SHADOW_NEAR_MAX);
    if (Math.abs(clamped - uShadowNear.value) < BIAS_EPS) return;
    uShadowNear.value = clamped;
    console.log("Shadow near plane: " + uShadowNear.value.toFixed(2));
    updateShadowCamerasNearFar();
    updateShadowUI();
}

function setShadowFar(value) {
    const clamped = Math.min(Math.max(value, SHADOW_FAR_MIN), SHADOW_FAR_MAX);
    if (Math.abs(clamped - uShadowFar.value) < BIAS_EPS) return;
    uShadowFar.value = clamped;
    console.log("Shadow far plane: " + uShadowFar.value.toFixed(1));
    updateShadowCamerasNearFar();
    updateShadowUI();
}

function setLightRadius(value) {
    const clamped = Math.min(Math.max(value, LIGHT_RADIUS_MIN), LIGHT_RADIUS_MAX);
    if (Math.abs(clamped - uLightRadius.value) < LIGHT_RADIUS_EPS) return;
    uLightRadius.value = clamped;
    sphere.scale.setScalar(uLightRadius.value);
    console.log("Light radius: " + uLightRadius.value.toFixed(2));
    updateShadowUI();
}

function setLightBrightness(value) {
    const clamped = Math.min(Math.max(value, LIGHT_BRIGHTNESS_MIN), LIGHT_BRIGHTNESS_MAX);
    if (Math.abs(clamped - lightBrightness) < LIGHT_BRIGHTNESS_EPS) return;
    lightBrightness = clamped;
    if (sphereLight) {
        sphereLight.intensity = clamped;
    }
    console.log("Light brightness: " + lightBrightness.toFixed(2));
    updateShadowUI();
}

function setLightAttenuationRadius(value) {
    const clamped = Math.min(Math.max(value, LIGHT_ATTENUATION_MIN), LIGHT_ATTENUATION_MAX);
    if (Math.abs(clamped - lightAttenuationRadius) < LIGHT_ATTENUATION_EPS) return;
    lightAttenuationRadius = clamped;
    if (sphereLight) {
        sphereLight.distance = clamped;
    }
    console.log("Light attenuation radius: " + lightAttenuationRadius.toFixed(1));
    updateShadowUI();
}

function updateShadowUI(info) {
    if (!ui || typeof ui.update !== 'function') return;
    ui.update(info || {});
}

function setESMK(value)
{
    const clamped = Math.min(Math.max(value, ESM_K_MIN), ESM_K_MAX);
    if (Math.abs(clamped - uESMK.value) < ESM_K_EPS) return;
    uESMK.value = clamped;
    console.log("ESM K: " + uESMK.value.toFixed(2));
    updateShadowUI();
}

function setBleedReduction(value)
{
    const clamped = Math.min(Math.max(value, BLEED_REDUCTION_MIN), BLEED_REDUCTION_MAX);
    if (Math.abs(clamped - uBleedReduction.value) < BLEED_REDUCTION_EPS) return;
    uBleedReduction.value = clamped;
    console.log("Bleed Reduction: " + uBleedReduction.value.toFixed(2));
    updateShadowUI();
}

function setBlurWidth(value)
{
    if (BLUR_WIDTH_OPTIONS.indexOf(value) === -1) return;
    if (uBlurWidth.value === value) return;
    uBlurWidth.value = value;
    console.log("Blur width: " + value);
    updateShadowUI();
}

function setBlurSigma(value)
{
    if (BLUR_SIGMA_OPTIONS.indexOf(value) === -1) return;
    uBlurSigma.value = value;
    console.log("Blur sigma: " + value.toFixed(1));
    updateShadowUI();
}


function setBlurMultiplier(value)
{
    const clamped = Math.min(Math.max(value, BLUR_MULTIPLIER_MIN), BLUR_MULTIPLIER_MAX);
    if (Math.abs(clamped - uBlurMultiplier.value) < BLUR_MULTIPLIER_EPS) return;
    uBlurMultiplier.value = clamped;
    console.log("Blur Multipler: " + uBlurMultiplier.value.toFixed(2));
    updateShadowUI();
}

function setShadowMipmapsEnabled(enabled)
{
    if (enableShadowMipmaps === enabled) return;
    const prevUseMipmaps = shouldUseShadowMipmaps();
    enableShadowMipmaps = enabled;
    const nextUseMipmaps = shouldUseShadowMipmaps();
    if (prevUseMipmaps !== nextUseMipmaps) {
        recreateShadowPassRenderTargets();
    }
    console.log("Shadow mipmaps: " + (enabled ? 'Enabled' : 'Disabled'));
    updateShadowUI();
}

function setFloorMaterial(key) {
    if (key === getCurrentFloorMaterialKey()) return;

    setFloorMaterialByKey(key);

    console.log("Material changed to: " + key);
    updateShadowUI();
}

function getShadowUIControls() {
    const modeValues = Array.from({ length: shadowModeNames.length - 1 }, (_, idx) => idx + 1);

    const generalControls = [
        createDropdownControl({
            key: 'shadowType',
            label: 'Shadow Method',
            values: modeValues,
            getValue: () => uShadowType.value,
            setValue: setShadowType,
            formatValue: (value) => shadowModeNames[value] || `Mode ${value}`,
        }),
        createDiscreteControl({
            key: 'shadowResolution',
            label: 'Shadow Map Res',
            values: SHADOW_RES_OPTIONS,
            getValue: () => currentShadowRes,
            setValue: setShadowResolution,
            defaultValue: BASE_SHADOW_RES,
            formatValue: (value) => `${value} x ${value}`,
            valueMinWidth: '90px',
        }),
        createNumericControl({
            key: 'shadowNear',
            label: 'Near Plane',
            getValue: () => uShadowNear.value,
            setValue: setShadowNear,
            step: SHADOW_NEAR_STEP,
            min: SHADOW_NEAR_MIN,
            max: SHADOW_NEAR_MAX,
            defaultValue: SHADOW_NEAR_DEFAULT,
            eps: BIAS_EPS,
            formatValue: (value) => value.toFixed(2),
        }),
        createNumericControl({
            key: 'shadowFar',
            label: 'Far Plane',
            getValue: () => uShadowFar.value,
            setValue: setShadowFar,
            step: SHADOW_FAR_STEP,
            min: SHADOW_FAR_MIN,
            max: SHADOW_FAR_MAX,
            defaultValue: SHADOW_FAR_DEFAULT,
            eps: BIAS_EPS,
            formatValue: (value) => value.toFixed(1),
        }),
        createNumericControl({
            key: 'shadowBias',
            label: 'Shadow Bias',
            getValue: () => uShadowBias.value,
            setValue: setShadowBias,
            step: SHADOW_BIAS_STEP,
            min: MIN_SHADOW_BIAS,
            max: MAX_SHADOW_BIAS,
            defaultValue: SHADOW_BIAS_DEFAULT,
            eps: BIAS_EPS,
            formatValue: (value) => value.toFixed(4),
        }),
    ];

    const samplingControls = [
        createNumericControl({
            key: 'pcfRadius',
            label: 'PCF Radius',
            getValue: () => uPCFRadius.value,
            setValue: setPCFRadius,
            step: PCF_RADIUS_STEP,
            min: PCF_RADIUS_MIN,
            max: PCF_RADIUS_MAX,
            defaultValue: PCF_RADIUS_DEFAULT,
            eps: PCF_EPS,
            formatValue: (value) => value.toFixed(2),
        }),
        createDiscreteControl({
            key: 'poissonSamples',
            label: 'Poisson Samples',
            values: POISSON_SAMPLE_OPTIONS,
            getValue: () => uPoissonSamples.value,
            setValue: setPoissonSamples,
            defaultValue: POISSON_SAMPLES_DEFAULT,
            formatValue: (value) => value.toString(),
        }),
        createDiscreteControl({
            key: 'pcssBlockers',
            label: 'Blocker Samples',
            values: PCSS_BLOCKER_SAMPLE_OPTIONS,
            getValue: () => uBlockerSamples.value,
            setValue: setPCSSBlockerSamples,
            defaultValue: PCSS_BLOCKER_SAMPLES_DEFAULT,
            formatValue: (value) => value.toString(),
        }),
    ];

    const filteringControls = [
        createDiscreteControl({
            key: 'blurWidth',
            label: 'Blur Width',
            values: BLUR_WIDTH_OPTIONS,
            getValue: () => uBlurWidth.value,
            setValue: setBlurWidth,
            defaultValue: BLUR_WIDTH_DEFAULT,
            formatValue: (value) => value.toString(),
        }),
        createDiscreteControl({
            key: 'blurSigma',
            label: 'Blur Sigma',
            values: BLUR_SIGMA_OPTIONS,
            getValue: () => uBlurSigma.value,
            setValue: setBlurSigma,
            defaultValue: BLUR_SIGMA_DEFAULT,
            formatValue: (value) => value.toFixed(1),
        }),
        createNumericControl({
            key: 'blurMultipler',
            label: 'Blur Multipler',
            getValue: () => uBlurMultiplier.value,
            setValue: setBlurMultiplier,
            step: BLUR_MULTIPLIER_STEP,
            min: BLUR_MULTIPLIER_MIN,
            max: BLUR_MULTIPLIER_MAX,
            defaultValue: BLUR_MULTIPLIER_DEFAULT,
            eps: BLUR_MULTIPLIER_EPS,
            formatValue: (value) => value.toFixed(1),
        }),
    ];

    const filteringToggles = [
        createToggleControl({
            key: 'shadowMipmaps',
            label: 'Generate Mipmaps',
            getValue: () => enableShadowMipmaps,
            setValue: setShadowMipmapsEnabled,
        }),
    ];

    const miscControls = [
        createNumericControl({
            key: 'uESMK',
            label: 'ESM Coefficient',
            getValue: () => uESMK.value,
            setValue: setESMK,
            step: ESM_K_STEP,
            min: ESM_K_MIN,
            max: ESM_K_MAX,
            defaultValue: ESM_K_DEFAULT,
            eps: ESM_K_EPS,
            formatValue: (value) => value.toFixed(1),
        }),
        createNumericControl({
            key: 'bleedReduction',
            label: 'Bleed Reduction',
            getValue: () => uBleedReduction.value,
            setValue: setBleedReduction,
            step: BLEED_REDUCTION_STEP,
            min: BLEED_REDUCTION_MIN,
            max: BLEED_REDUCTION_MAX,
            defaultValue: BLEED_REDUCTION_DEFAULT,
            eps: BLEED_REDUCTION_EPS,
            formatValue: (value) => value.toFixed(2),
        }),
    ];

    const lightControls = [
        createNumericControl({
            key: 'lightBrightness',
            label: 'Brightness',
            getValue: () => lightBrightness,
            setValue: setLightBrightness,
            step: LIGHT_BRIGHTNESS_STEP,
            min: LIGHT_BRIGHTNESS_MIN,
            max: LIGHT_BRIGHTNESS_MAX,
            defaultValue: LIGHT_BRIGHTNESS_DEFAULT,
            eps: LIGHT_BRIGHTNESS_EPS,
            formatValue: (value) => value.toFixed(2),
        }),
        createNumericControl({
            key: 'lightAttenuation',
            label: 'Atten Radius',
            getValue: () => lightAttenuationRadius,
            setValue: setLightAttenuationRadius,
            step: LIGHT_ATTENUATION_STEP,
            min: LIGHT_ATTENUATION_MIN,
            max: LIGHT_ATTENUATION_MAX,
            defaultValue: LIGHT_ATTENUATION_DEFAULT,
            eps: LIGHT_ATTENUATION_EPS,
            formatValue: (value) => value.toFixed(1),
            valueMinWidth: '90px',
        }),
        createNumericControl({
            key: 'lightRadius',
            label: 'Light Radius',
            getValue: () => uLightRadius.value,
            setValue: setLightRadius,
            step: LIGHT_RADIUS_STEP,
            min: LIGHT_RADIUS_MIN,
            max: LIGHT_RADIUS_MAX,
            defaultValue: LIGHT_RADIUS_DEFAULT,
            eps: LIGHT_RADIUS_EPS,
            formatValue: (value) => value.toFixed(2),
        }),
    ];

    const materialKeys = getAvailableFloorMaterialKeys(); // not empty ever

    const modelMaterialControls = [
        createDiscreteControl({
            key: 'modelMaterial',
            label: 'Material',
            values: materialKeys,
            getValue: () => getCurrentFloorMaterialKey(),
            setValue: setFloorMaterial,
            defaultValue: materialKeys[0],
            formatValue: (value) => getFloorMaterialLabel(value),
        }),
    ];

    const miscToggles = [
        createToggleControl({
            key: 'shadowDebug',
            label: 'Show Shadow Map',
            getValue: () => showShadowDebug,
            setValue: (checked) => {
                showShadowDebug = checked;
                updateShadowUI();
            },
        }),
    ];

    const sections = [
        {
            title: 'General',
            controls: generalControls,
        },
        {
            title: 'Sampling',
            controls: samplingControls,
        },
        {
            title: 'Filtering',
            controls: filteringControls,
            toggles: filteringToggles,
        },
        {
            title: 'Misc',
            controls: miscControls,
            toggles: miscToggles,
        },
        {
            title: 'Light Settings',
            controls: lightControls,
        },
        { 
            title: 'Model / Material', 
            controls: modelMaterialControls 
        },
    ];



    return { sections };
}
