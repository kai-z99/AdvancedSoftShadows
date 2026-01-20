precision highp float;

uniform samplerCube sourceCube;
uniform vec2 direction;
uniform float texelStep;
uniform vec3 faceRight;
uniform vec3 faceUp;
uniform vec3 faceForward;

varying vec2 vClipUv;

vec3 dirFromUv(vec2 uv) {
        return normalize(faceForward + uv.x * faceRight + uv.y * faceUp);
}

void main() {
        const float weights[3] = float[3](0.38774, 0.24477, 0.06136);

        vec4 result = textureCube(sourceCube, dirFromUv(vClipUv)) * weights[0];

        for (int i = 1; i < 3; ++i) {
                vec2 offset = direction * texelStep * float(i);
                vec4 samplePos = textureCube(sourceCube, dirFromUv(vClipUv + offset));
                vec4 sampleNeg = textureCube(sourceCube, dirFromUv(vClipUv - offset));
                result += (samplePos + sampleNeg) * weights[i];
        }

        gl_FragColor = result;
}
