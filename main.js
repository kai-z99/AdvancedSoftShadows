const {
    renderer,
    scene,
    camera,
} = setup();

initializeSceneContent(scene);
initializeShadowUI();
initializeKeyboard();
setupShadows();
const performanceTracker = createPerformanceTracker();

function update() {
    const frameStart = performance.now();

    checkKeyboard();
    requestAnimationFrame(update);
    renderShadowMap();
    renderer.render(scene, camera);
    renderShadowDebugOverlay(renderer);

    const frameEnd = performance.now();
    performanceTracker.trackFrame(frameEnd - frameStart);
}

update();



