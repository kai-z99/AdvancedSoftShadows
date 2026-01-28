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


function update(now) {
    requestAnimationFrame(update);
    checkKeyboard();
    renderShadowMap();
    renderer.render(scene, camera);
    renderShadowDebugOverlay(renderer);
    performanceTracker.tick(now); 
}


update();