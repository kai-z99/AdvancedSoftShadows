const {
    renderer,
    scene,
    camera,
} = setup();

initializeSceneContent(scene);
initializeShadowUI();
initializeKeyboard();

// Set up shadow related things before starting the render loop
setupShadows();

function update() {
    checkKeyboard();
    requestAnimationFrame(update);
    renderShadowMap();
    renderer.render(scene, camera);
    renderShadowDebugOverlay(renderer);
}

update();
