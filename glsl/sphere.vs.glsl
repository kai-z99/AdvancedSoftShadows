
uniform vec3 lightPosition;

void main()
{
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    worldPos.xyz += lightPosition;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
