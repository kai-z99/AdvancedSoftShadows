varying vec2 vUv;

uniform samplerCube shadowCube;
uniform float shadowNear;
uniform float shadowFar;

// Equirectangular mapping from uv to direction
vec3 uvToDir(vec2 uv) {
        vec2 p = uv * 2.0 - 1.0;
        float phi = p.x * 3.14159265;
        float theta = p.y * 1.57079633; // PI/2
        float ct = cos(theta);
        return normalize(vec3(sin(phi) * ct, sin(theta), cos(phi) * ct));
}

void main() {
        vec3 dir = uvToDir(vUv);
        float depth01 = textureCube(shadowCube, dir).r;
        float linear = mix(shadowNear, shadowFar, clamp(depth01, 0.0, 1.0));
        float normalized = clamp((linear - shadowNear) / (shadowFar - shadowNear), 0.0, 1.0);
        gl_FragColor = vec4(vec3(normalized), 1.0);
}
