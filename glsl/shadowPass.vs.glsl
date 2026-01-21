uniform vec3 lightPos;
uniform float lightRadius;

varying vec3 fragPosWorld;


void main() {
        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;

        fragPosWorld = worldPos;
        gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
}
