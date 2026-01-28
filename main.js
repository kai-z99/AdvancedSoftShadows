const {
    renderer,
    scene,
    camera,
} = setup();



initializeSceneContent(scene);
initializeShadowUI();
initializeKeyboard();
setupShadows();
const performanceTracker = createPerformanceTracker(renderer);


function scheduleNextFrame() {
    setTimeout(renderFrame, 0);
}

function renderFrame() {
    const now = performance.now();
    checkKeyboard();
    renderShadowMap();
    renderer.render(scene, camera);
    renderShadowDebugOverlay(renderer);
    performanceTracker.tick(now); 
    scheduleNextFrame();
}


scheduleNextFrame();


