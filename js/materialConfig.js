function initFloorMaterials() {
    const loader = new THREE.TextureLoader();

    floorMaterialKeys = FLOOR_MATERIAL_CONFIGS.map(c => c.key);
    currentFloorMaterialKey = floorMaterialKeys[0];

    for (const cfg of FLOOR_MATERIAL_CONFIGS) {
        floorMaterialByKey[cfg.key] = makeFloorEntry(loader, cfg);
    }

    floorMaterial = floorMaterialByKey[currentFloorMaterialKey].material;
}

function makeFloorEntry(loader, cfg) {
    const r = cfg.repeat ?? 1;
    const m = cfg.maps;

    const mat = new THREE.MeshStandardMaterial({
        map:          m.map          ? loadTex(loader, m.map,          r, true)  : null,
        normalMap:    m.normalMap    ? loadTex(loader, m.normalMap,    r, false) : null,
        roughnessMap: m.roughnessMap ? loadTex(loader, m.roughnessMap, r, false) : null,
        aoMap:        m.aoMap        ? loadTex(loader, m.aoMap,        r, false) : null,
        metalnessMap: m.metalnessMap ? loadTex(loader, m.metalnessMap, r, false) : null,

        metalness: cfg.metalness ?? 0.1,
        roughness: cfg.roughness ?? 0.9,
    });

    return { label: cfg.label, material: mat };
}

function setFloorMaterialByKey(key) {
    if (key === currentFloorMaterialKey) return;
    const entry = floorMaterialByKey[key];
    if (!entry) return;

    currentFloorMaterialKey = key;

    if (floorMesh) floorMesh.material = entry.material;
}


function loadTex(loader, path, repeat, isColor = false) {
    const t = loader.load(path);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);

    // three.js version compatibility (newer uses colorSpace, older uses encoding)
    if (isColor) {
        if ('colorSpace' in t && THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
        else if ('encoding' in t && THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
    }

    return t;
}



function getCurrentFloorMaterialKey() {
    return currentFloorMaterialKey;
}

function getAvailableFloorMaterialKeys() {
    return floorMaterialKeys;
}

function getFloorMaterialLabel(key) {
    return floorMaterialByKey[key]?.label ?? key;
}