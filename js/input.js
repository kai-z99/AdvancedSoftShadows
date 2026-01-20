//Setup keyboard input handling
function checkKeyboard() {
    if (keyboard.pressed("W"))
        uOrbPosition.value.z -= 0.3;
    else if (keyboard.pressed("S"))
        uOrbPosition.value.z += 0.3;

    if (keyboard.pressed("A"))
        uOrbPosition.value.x -= 0.3;
    else if (keyboard.pressed("D"))
        uOrbPosition.value.x += 0.3;

    if (keyboard.pressed("E"))
        uOrbPosition.value.y -= 0.3;
    else if (keyboard.pressed("Q"))
        uOrbPosition.value.y += 0.3;

    sphereLight.position.set(uOrbPosition.value.x, uOrbPosition.value.y, uOrbPosition.value.z);
}