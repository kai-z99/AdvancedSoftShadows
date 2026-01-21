const {
    renderer,
    scene,
    camera,
} = setup();

initializeSceneContent(scene);
initializeShadowUI();
initializeKeyboard();
setupShadows();

function update() {
    checkKeyboard();
    requestAnimationFrame(update);
    renderShadowMap();
    renderer.render(scene, camera);
    renderShadowDebugOverlay(renderer);
}

update();

//todo: add multipler uniform for gaussian blur offfset.