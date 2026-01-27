//pointShadow.fs.glsl

uniform vec3 lightPos;
uniform float nearPlane;
uniform float farPlane;
uniform float ESMK;
uniform int shadowType;

varying vec3 fragPosWorld;

//render depth into cubemap face
void main() 
{
    float d = length(fragPosWorld - lightPos);
    float depth01 = (d - nearPlane) / (farPlane - nearPlane);
    depth01 = clamp(depth01, 0.0, 1.0);

    //d, d^2, 
    switch (shadowType)
    {
        case 1: //hard
        case 2: //pcf
        case 5: //pcss
            gl_FragColor = vec4(depth01, 0.0, 0.0, 1.0);
            break;
        case 3: //var
            gl_FragColor = vec4(depth01, depth01 * depth01, 0.0, 1.0);
            break;
        case 4: //esm
            gl_FragColor = vec4(depth01, exp(ESMK * depth01), 0.0, 1.0);
            break;
        case 6: //msm
            gl_FragColor = vec4(depth01, depth01 *depth01, depth01*depth01*depth01, depth01*depth01*depth01*depth01);
            break;
        default: 
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            break;
    }
    
}
