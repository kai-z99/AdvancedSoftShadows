precision highp float;

uniform samplerCube sourceCube;
uniform vec2 direction;
uniform float texelStep;
uniform vec3 faceRight;
uniform vec3 faceUp;
uniform vec3 faceForward;
uniform int blurWidth;
uniform float blurSigma;

varying vec2 vClipUv;

const float weights3_sigma1[2]  = float[2](0.45186276, 0.27406862);
const float weights3_sigma15[2] = float[2](0.38439734, 0.30780133);
const float weights3_sigma2[2]  = float[2](0.36166446, 0.31916777);
const float weights5_sigma1[3]  = float[3](0.40261995, 0.24420134, 0.05448868);
const float weights5_sigma15[3] = float[3](0.29208172, 0.23388076, 0.12007838);
const float weights5_sigma2[3]  = float[3](0.25137912, 0.22184130, 0.15246914);

const float SIGMA_EPS = 0.01;

//fuyllscreen quad in input vertices, so that can recover one face of the cubemap.
vec3 dirFromUv(vec2 uv) 
{
    return normalize(faceForward + uv.x * faceRight + uv.y * faceUp);
}

vec2 selectWeights3(float sigma) 
{
    if (abs(sigma - 1.0) < SIGMA_EPS) return vec2(weights3_sigma1[0], weights3_sigma1[1]);   // (w0, w1)
    if (abs(sigma - 1.5) < SIGMA_EPS) return vec2(weights3_sigma15[0], weights3_sigma15[1]); // (w0, w1)
    return vec2(weights3_sigma2[0], weights3_sigma2[1]);                                      // (w0, w1)
}

vec3 selectWeights5(float sigma) 
{
    if (abs(sigma - 1.0) < SIGMA_EPS) return vec3(weights5_sigma1[0], weights5_sigma1[1], weights5_sigma1[2]);   // (w0, w1, w2)
    if (abs(sigma - 1.5) < SIGMA_EPS) return vec3(weights5_sigma15[0], weights5_sigma15[1], weights5_sigma15[2]); // (w0, w1, w2)
    return vec3(weights5_sigma2[0], weights5_sigma2[1], weights5_sigma2[2]);                                       // (w0, w1, w2)
}

void main() 
{
    float weights[3];
    int radius = (blurWidth <= 3) ? 1 : 2;

    if (blurWidth <= 3) 
    {
        vec2 selected = selectWeights3(blurSigma); // (w0, w1)
        weights[0] = selected.x; // w0 (center)
        weights[1] = selected.y; // w1 (+/-1)
        weights[2] = 0.0;        // unused
    } 
    else 
    {
        vec3 selected = selectWeights5(blurSigma); // (w0, w1, w2)
        weights[0] = selected.x; // w0 (center)
        weights[1] = selected.y; // w1 (+/-1)
        weights[2] = selected.z; // w2 (+/-2)
    }

    vec4 result = textureCube(sourceCube, dirFromUv(vClipUv)) * weights[0];

    for (int i = 1; i < 3; ++i) 
    {
        if (i > radius) break;
        vec2 offset = direction * texelStep * float(i);
        vec4 samplePos = textureCube(sourceCube, dirFromUv(vClipUv + offset));
        vec4 sampleNeg = textureCube(sourceCube, dirFromUv(vClipUv - offset));
        result += (samplePos + sampleNeg) * weights[i];
    }

    gl_FragColor = result;
}
