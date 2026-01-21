// The uniform variable is set up in the javascript code and the same for all vertices
uniform vec3 lightPosition;

void main() {

        // Apply the object's transform first (handles scaling)
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        worldPos.xyz += lightPosition;

        gl_Position = projectionMatrix * viewMatrix * worldPos;
}
