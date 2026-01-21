function setShadowResolution(size) {
    if (size === currentShadowRes) return;
    currentShadowRes = size;
    recreateShadowPassRenderTargets();
    const idx = SHADOW_RES_OPTIONS.indexOf(size);
    console.log(`Shadow resolution set to ${currentShadowRes}x${currentShadowRes}`);
    updateShadowUI();
}

function setShadowType(newType) {
    const clamped = Math.min(Math.max(newType, 1), shadowModeNames.length - 1);
    if (uShadowType.value === clamped) return;
    uShadowType.value = clamped;
    const mode = shadowModeNames[uShadowType.value] || `Mode ${uShadowType.value}`;
    console.log("Shadow type changed to: " + mode);
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
    const maxNear = getMaxShadowNear();
    const clamped = Math.min(Math.max(value, SHADOW_NEAR_MIN), maxNear);
    if (Math.abs(clamped - uShadowNear.value) < BIAS_EPS) return;
    uShadowNear.value = clamped;
    console.log("Shadow near plane: " + uShadowNear.value.toFixed(2));
    updateShadowCamerasNearFar();
    updateShadowUI();
}

function setShadowFar(value) {
    const minFar = getMinShadowFar();
    const clamped = Math.min(Math.max(value, minFar), SHADOW_FAR_MAX);
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

function getShadowUIControls() {
    const modeValues = Array.from({ length: shadowModeNames.length - 1 }, (_, idx) => idx + 1);
    const shadowControls = [
        createDiscreteControl({
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
            key: 'pcfRadius',
            label: 'PCF Radius',
            getValue: () => uPCFRadius.value,
            setValue: setPCFRadius,
            step: PCF_RADIUS_STEP,
            min: PCF_RADIUS_MIN,
            max: PCF_RADIUS_MAX,
            defaultValue: DEFAULT_PCF_RADIUS,
            eps: PCF_EPS,
            formatValue: (value) => value.toFixed(2),
        }),
        createNumericControl({
            key: 'shadowNear',
            label: 'Near Plane',
            getValue: () => uShadowNear.value,
            setValue: setShadowNear,
            step: SHADOW_NEAR_STEP,
            min: SHADOW_NEAR_MIN,
            max: getMaxShadowNear,
            defaultValue: DEFAULT_SHADOW_NEAR,
            eps: BIAS_EPS,
            formatValue: (value) => value.toFixed(2),
        }),
        createNumericControl({
            key: 'shadowFar',
            label: 'Far Plane',
            getValue: () => uShadowFar.value,
            setValue: setShadowFar,
            step: SHADOW_FAR_STEP,
            min: getMinShadowFar,
            max: SHADOW_FAR_MAX,
            defaultValue: DEFAULT_SHADOW_FAR,
            eps: BIAS_EPS,
            formatValue: (value) => value.toFixed(1),
        }),
        createNumericControl({
            key: 'shadowBias',
            label: 'Bias',
            getValue: () => uShadowBias.value,
            setValue: setShadowBias,
            step: SHADOW_BIAS_STEP,
            min: MIN_SHADOW_BIAS,
            max: MAX_SHADOW_BIAS,
            defaultValue: DEFAULT_SHADOW_BIAS,
            eps: BIAS_EPS,
            formatValue: (value) => value.toFixed(4),
        }),
        createDiscreteControl({
            key: 'poissonSamples',
            label: 'Poisson Samples',
            values: POISSON_SAMPLE_OPTIONS,
            getValue: () => uPoissonSamples.value,
            setValue: setPoissonSamples,
            defaultValue: DEFAULT_POISSON_SAMPLES,
            formatValue: (value) => value.toString(),
        }),
        createDiscreteControl({
            key: 'pcssBlockers',
            label: 'Blocker Samples',
            values: PCSS_BLOCKER_SAMPLE_OPTIONS,
            getValue: () => uBlockerSamples.value,
            setValue: setPCSSBlockerSamples,
            defaultValue: DEFAULT_PCSS_BLOCKER_SAMPLES,
            formatValue: (value) => value.toString(),
        }),
        createNumericControl({
            key: 'uESMK',
            label: 'ESM Coefficient',
            getValue: () => uESMK.value,
            setValue: setESMK,
            step: ESM_K_STEP,
            min: ESM_K_MIN,
            max: ESM_K_MAX,
            defaultValue: DEFAULT_ESM_K,
            eps: ESM_K_EPS,
            formatValue: (value) => value.toFixed(1),
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
            defaultValue: DEFAULT_LIGHT_BRIGHTNESS,
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
            defaultValue: DEFAULT_LIGHT_ATTENUATION,
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
            defaultValue: DEFAULT_LIGHT_RADIUS,
            eps: LIGHT_RADIUS_EPS,
            formatValue: (value) => value.toFixed(2),
        }),
    ];

    const toggles = [
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

    return {
        sections: [
            {
                title: 'Shadow Settings',
                controls: shadowControls,
                toggles,
            },
            {
                title: 'Light Settings',
                controls: lightControls,
            },
        ],
    };
}

function getMaxShadowNear() {
    return Math.max(SHADOW_NEAR_MIN, Math.min(SHADOW_NEAR_MAX, uShadowFar.value - SHADOW_MIN_RANGE));
}

function getMinShadowFar() {
    return Math.min(SHADOW_FAR_MAX, Math.max(SHADOW_FAR_MIN, uShadowNear.value + SHADOW_MIN_RANGE));
}
