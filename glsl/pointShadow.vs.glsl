uniform vec3 lightPos;
uniform float orbRadius;

varying vec3 fragPosWorld;

const float deformRange = 3.0;
const float pullAmount    = 0.3;

void main() {
        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;

        vec3 toLight = worldPos - lightPos;
        float d = length(toLight);
        float influence = orbRadius + deformRange;

        if (d < influence) {
                worldPos += normalize(-toLight) * pullAmount;
        }

        fragPosWorld = worldPos;
        gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
}
