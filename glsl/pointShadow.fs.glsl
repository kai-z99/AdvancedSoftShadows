//pointShadow.fs.glsl

uniform vec3 lightPos;
uniform float nearPlane;
uniform float farPlane;

varying vec3 fragPosWorld;

//basically a path through... render depth into cubemap face
void main() {
        float d = length(fragPosWorld - lightPos);
        float depth01 = (d - nearPlane) / (farPlane - nearPlane);
        depth01 = clamp(depth01, 0.0, 1.0);

        //d, d^2
        gl_FragColor = vec4(depth01, depth01 * depth01, 0, 1.0);
}
