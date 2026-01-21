//Setup keyboard input handling
function checkKeyboard() {
    if (keyboard.pressed("W"))
        uLightPosition.value.z -= 0.3;
    else if (keyboard.pressed("S"))
        uLightPosition.value.z += 0.3;

    if (keyboard.pressed("A"))
        uLightPosition.value.x -= 0.3;
    else if (keyboard.pressed("D"))
        uLightPosition.value.x += 0.3;

    if (keyboard.pressed("E"))
        uLightPosition.value.y -= 0.3;
    else if (keyboard.pressed("Q"))
        uLightPosition.value.y += 0.3;

    sphereLight.position.set(uLightPosition.value.x, uLightPosition.value.y, uLightPosition.value.z);
}