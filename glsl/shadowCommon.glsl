//shadowCommon.glsl

float hash13(vec3 p) 
{
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
}

uint baseHash(uvec2 p)
{
    const uint PRIME32_2 = 2246822519U, PRIME32_3 = 3266489917U;
    const uint PRIME32_4 = 668265263U, PRIME32_5 = 374761393U;
    uint h32 = p.y + PRIME32_5 + p.x*PRIME32_3;
    h32 = PRIME32_4*((h32 << 17) | (h32 >> (32 - 17))); //Initial testing suggests this line could be omitted for extra perf
    h32 = PRIME32_2*(h32^(h32 >> 15));
    h32 = PRIME32_3*(h32^(h32 >> 13));
    return h32^(h32 >> 16);
}

float hash12(uvec2 x)
{
    uint n = baseHash(x);
    return float(n)*(1.0/float(0xffffffffU));
}

//THIS SET IS PROGRESSIVE FOR 8 16 32 64 SAMPLES. THEREFORE WE CAN JUST CLAMP THE LOOP TO THE DESIRED SAMPLE COUNT
const int POISSON_MAX = 64;
const vec2 poisson[POISSON_MAX] = vec2[](
        vec2(-0.0936905, 0.3196758),
        vec2(0.1592735, -0.9686295),
        vec2(0.9430245, 0.3139912),
        vec2(-0.7416366, -0.4377831),
        vec2(-0.9517487, 0.2963554),
        vec2(0.8581337, -0.4240460),
        vec2(0.3276062, 0.9244621),
        vec2(-0.5325066, 0.8410385),
        vec2(0.0902534, -0.3503742),
        vec2(0.4452095, 0.2580113),
        vec2(-0.4462856, -0.0426502),
        vec2(-0.2192158, -0.6911137),
        vec2(-0.1154335, 0.8248222),
        vec2(0.5149567, -0.7502338),
        vec2(-0.5523247, 0.4272514),
        vec2(0.6470215, 0.7474022),
        vec2(-0.5987766, -0.7512833),
        vec2(0.1604507, 0.5460774),
        vec2(0.5947998, -0.2146744),
        vec2(-0.1203411, -0.1301079),
        vec2(-0.7304786, -0.0100693),
        vec2(-0.3897587, -0.4665619),
        vec2(0.3929337, -0.5010948),
        vec2(-0.3096867, 0.5588146),
        vec2(0.0617981, 0.0729416),
        vec2(0.6455986, 0.0441933),
        vec2(0.8934509, 0.0736939),
        vec2(-0.3580975, 0.2806469),
        vec2(-0.8682281, -0.1990303),
        vec2(0.1853630, 0.3213367),
        vec2(0.8400612, -0.2001190),
        vec2(-0.1598610, 0.1038342),
        vec2(0.6632416, 0.3067062),
        vec2(0.1562584, -0.5610626),
        vec2(-0.6930340, 0.6913887),
        vec2(-0.9402866, 0.0447434),
        vec2(0.3029106, 0.0949703),
        vec2(0.6464897, -0.4666451),
        vec2(0.4356628, -0.0710125),
        vec2(0.1253822, 0.9892166),
        vec2(0.0349884, -0.7968109),
        vec2(0.3935608, 0.4609676),
        vec2(0.3085465, -0.7842533),
        vec2(-0.3090832, 0.9020988),
        vec2(-0.6518704, -0.2503952),
        vec2(-0.4037193, -0.2611179),
        vec2(0.3401214, -0.3047142),
        vec2(-0.0197372, 0.6478714),
        vec2(0.1741608, -0.1682285),
        vec2(-0.5128918, 0.1448544),
        vec2(-0.1596546, -0.8791054),
        vec2(0.6987045, -0.6843052),
        vec2(-0.7445076, 0.5035095),
        vec2(-0.5862702, -0.5531025),
        vec2(0.4112572, 0.7500054),
        vec2(-0.1080467, -0.5329178),
        vec2(0.8587891, 0.4838005),
        vec2(-0.7647934, 0.2709858),
        vec2(-0.1493771, -0.3147511),
        vec2(-0.4676369, 0.6570358),
        vec2(0.6295372, 0.5629555),
        vec2(0.0689201, 0.8124840),
        vec2(-0.0566467, 0.9952820),
        vec2(-0.4230408, -0.7129914)
);

/*
const int POISSON_MAX = 16;
const vec2 poisson[POISSON_MAX] = vec2[](
 vec2( -0.94201624, -0.39906216 ),
 vec2( 0.94558609, -0.76890725 ),
 vec2( -0.094184101, -0.92938870 ),
 vec2( 0.34495938, 0.29387760 ),
 vec2( -0.91588581, 0.45771432 ),
 vec2( -0.81544232, -0.87912464 ),
 vec2( -0.38277543, 0.27676845 ),
 vec2( 0.97484398, 0.75648379 ),
 vec2( 0.44323325, -0.97511554 ),
 vec2( 0.53742981, -0.47373420 ),
 vec2( -0.26496911, -0.41893023 ),
 vec2( 0.79197514, 0.19090188 ),
 vec2( -0.24188840, 0.99706507 ),
 vec2( -0.81409955, 0.91437590 ),
 vec2( 0.19984126, 0.78641367 ),
 vec2( 0.14383161, -0.14100790 ) 
);
*/


float shadowFactorHard(
    samplerCube shadowCube,
    vec3 lightPos,
    float shadowNear,
    float shadowFar,
    float shadowBias,
    vec3 worldPos
)
{
    float d = length(worldPos - lightPos);
    float current01 = clamp((d - shadowNear) / (shadowFar - shadowNear), 0.0, 1.0);

    vec3 dir = normalize(worldPos - lightPos);
    float closest01 = textureCube(shadowCube, dir).r;

    return (current01 - shadowBias > closest01) ? 0.0 : 1.0;
}

/*
float shadowFactorPCF(
        samplerCube shadowCube,
        vec3 lightPos,
        float shadowNear,
        float shadowFar,
        float shadowBias,
        vec3 worldPos,
        float diskRadius
){
        vec3 lightToFrag = worldPos - lightPos;
        float d = length(lightToFrag);
        
        float current01 = clamp((d - shadowNear) / (shadowFar - shadowNear), 0.0, 1.0);

        float shadowSum = 0.0;
        float samples = 0.0;
        
        for(int x = -1; x <= 1; x += 1)
        {
                for(int y = -1; y <= 1; y += 1)
                {
                        for(int z = -1; z <= 1; z += 1)
                        {
                                // jitter
                                vec3 offset = vec3(float(x), float(y), float(z)) * diskRadius;
                                
                                //jittered sample
                                float closest01 = texture(shadowCube, normalize(lightToFrag + offset)).r;

                                //depth check
                                if(current01 - shadowBias <= closest01)
                                {
                                        shadowSum += 1.0;
                                }
                                
                                samples += 1.0;
                        }
                }
        }

        return shadowSum / samples;
}
*/

// Build tangent basis around direction N
void makeBasis(vec3 N, out vec3 T, out vec3 B) 
{
    vec3 up = (abs(N.y) < 0.999) ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    T = normalize(cross(up, N));
    B = cross(N, T);
}

float shadowFactorPCF(
    samplerCube shadowCube,
    vec3 lightPos,
    float shadowNear,
    float shadowFar,
    float shadowBias,
    vec3 worldPos,
    float diskRadiusWorld,
    int sampleCount
)
{
    vec3 L = worldPos - lightPos;
    float D = length(L);
    vec3 dir = L / max(D, 1e-5);

    float current01 = clamp((D - shadowNear) / (shadowFar - shadowNear), 0.0, 1.0);

    vec3 T, B;
    makeBasis(dir, T, B);

    float rand = hash13(worldPos);
    float cs = cos(6.2831853 * rand);
    float sn = sin(6.2831853 * rand);
    mat2 rot = mat2(cs, -sn, sn, cs);

    float sum = 0.0;
    int iterations = clamp(sampleCount, 1, POISSON_MAX);
    for (int i = 0; i < iterations; i++)
    {
            vec2 o = rot * poisson[i];

            // offset on tangent plane in WORLD units at the receiver
            vec3 offset = (T * o.x + B * o.y) * diskRadiusWorld;

            float closest01 = textureCube(shadowCube, normalize(L + offset)).r;
            sum += (current01 - shadowBias > closest01) ? 0.0 : 1.0;
    }

    return sum / max(float(iterations), 1.0);
}

float ReduceLightBleeding(float p_max, float Amount)
{
  // Remove the [0, Amount] tail and linearly rescale (Amount, 1].
  return smoothstep(Amount, 1.0, p_max);
}

//TODO: need light bleeding reduction
float shadowFactorVariance(
    samplerCube shadowCube,
    vec3 lightPos,
    float shadowNear,
    float shadowFar,
    float shadowBias,
    vec3 worldPos
)
{
    vec3    lightToFrag = worldPos - lightPos;
    float d = length(lightToFrag);

    // stored the normalized not world space variance!!!!
    float depth01 = clamp((d - shadowNear) / (shadowFar - shadowNear), 0.0, 1.0);
    depth01 = clamp(depth01 - shadowBias, 0.0, 1.0);

    vec3 dir = normalize(lightToFrag);
    float m1 = textureCube(shadowCube, dir).r; // E[z]
    float m2 = textureCube(shadowCube, dir).g; // E[z^2]

    if (depth01 <= m1) return 1.0;

    float variance = max(m2 - m1 * m1, 1e-5);
    float t = depth01 - m1;
    float pMax = variance / (variance + t * t);
    pMax = ReduceLightBleeding(pMax, lightBleedReduction);
    return clamp(pMax, 0.0, 1.0);
}

float shadowFactorESM(
    samplerCube shadowCube, 
    vec3 lightPos, 
    float shadowNear, 
    float shadowFar, 
    float shadowBias, 
    vec3 worldPos, 
    float K
)
{
    vec3 L = worldPos - lightPos;
    float D = length(L);
    vec3 dir = L / max(D, 1e-5); //normalized L

    float current01 = clamp((D - shadowNear) / (shadowFar - shadowNear) - shadowBias, 0.0, 1.0);
    float closest01EXP = textureCube(shadowCube, dir).g; //exp(closest * k)
    float shadow = clamp(exp(-K * current01) * closest01EXP, 0.0, 1.0);
    return shadow;
}

float getAvgBlockerDepth(
    samplerCube shadowCube,
    vec3 lightPos,
    float shadowNear,
    float shadowFar,
    float shadowBias,
    vec3 worldPos,
    float lightRadius,
    int numSamples
)
{
    vec3 lightToFrag = worldPos - lightPos;
    float receiverDist = length(lightToFrag);
    vec3 lightDir = normalize(lightToFrag);
    float receiverDepthNormalized = clamp((receiverDist - shadowNear) / (shadowFar - shadowNear), 0.0, 1.0);

    vec3 T, B;
    makeBasis(normalize(worldPos - lightPos), T, B);

    //angular size of the light source from receiver point using small angle approximation
    float lightAngle = lightRadius / max(receiverDist, 1e-5);
    
    //search region (a bit larger than light angle)
    float searchAngle = lightAngle * 1.5;

    //get a random rotation matrix for poisson disk
    float rand = hash12(uvec2(gl_FragCoord.xy));
    float cs = cos(2.0 * 3.14159265 * rand); 
    float sn = sin(2.0 * 3.14159265 * rand);
    mat2 rot = mat2(cs, -sn, sn, cs); //rotation matrix for random rotation on tangent plane

    float blockerDepthSum = 0.0;
    int numBlockers = 0;

    int iterations = clamp(numSamples, 1, POISSON_MAX);
    for (int i = 0; i < iterations; i++)
    {
            vec2 o = rot * poisson[i]; //rotated poisson disk sample
            vec3 offsetDir = normalize(lightDir 
                    + T * o.x * searchAngle
                    + B * o.y * searchAngle);

            float sampleDepthNormalized = textureCube(shadowCube, offsetDir).r;

            //blocker?
            if (sampleDepthNormalized < receiverDepthNormalized - shadowBias)
            {
                    //blocker found
                    float blockerDepth = sampleDepthNormalized * (shadowFar - shadowNear) + shadowNear; //0-1 -> world space
                    blockerDepthSum += blockerDepth;
                    numBlockers++;
            }
    }

    return (numBlockers > 0) ? (blockerDepthSum / float(numBlockers)) : -1.0;
}

float getFilterRadius(
    float avgBlockerDepth,
    float receiverDist,
    float lightRadius
)
{
    float w_penumbra = (receiverDist - avgBlockerDepth) * lightRadius / (avgBlockerDepth + 1e-5); //world space
    return max( w_penumbra, 0.0 );
}

float shadowFactorPCSS(
    samplerCube shadowCube,
    vec3 lightPos,
    float shadowNear,
    float shadowFar,
    float shadowBias,
    vec3 worldPos,
    float lightRadius,
    int blockerSamples,
    int pcfSamples
)
{
    //Get average blocker depth:
    float avgBlockerDepth = getAvgBlockerDepth(shadowCube, lightPos, shadowNear, shadowFar, shadowBias, worldPos, lightRadius, blockerSamples);
    if (avgBlockerDepth < 0.0) return 1.0;    //No blockers found, fully lit
            
            
    //Estimate filter size from avg blocker depth:
    float filterRadius = getFilterRadius(avgBlockerDepth, length(worldPos - lightPos), lightRadius);

    //Do PCF with filter size:
    return shadowFactorPCF(shadowCube, lightPos, shadowNear, shadowFar, shadowBias, worldPos, filterRadius, pcfSamples);
}



float GetHamburger4MSMShadowIntensity(vec4 moments, float fragmentDepth, float depthBias, float momentBias)
{
    const float EPS = 1e-7;

    // Bias input moments toward 0.5 to reduce artifacts from quantization / inconsistency
    vec4 b = mix(moments, vec4(0.5), momentBias);

    float z0 = fragmentDepth - depthBias;

    // Cholesky factoriazation of hankel matrix
    float L32D22 = b.z - b.x * b.y;          // mad(-b0, b1, b2)
    float D22    = b.y - b.x * b.x;          // mad(-b0, b0, b1)
    float SDV    = b.w - b.y * b.y;          // mad(-b1, b1, b3)

    // D33D22 = dot( (SDV, -L32D22), (D22, L32D22) )
    float D33D22 = SDV * D22 - L32D22 * L32D22;

    // Keep denominators sane
    D22    = max(D22, EPS);
    D33D22 = max(D33D22, EPS);

    float invD22 = 1.0 / D22;
    float L32    = L32D22 * invD22;

    // Solve for c via forward/substitution/scaling/back-substitution
    vec3 c = vec3(1.0, z0, z0 * z0);

    // Forward substitution: L * c1 = bz
    c.y -= b.x;
    c.z -= (b.y + L32 * c.y);

    // Scaling: D * c2 = c1
    c.y *= invD22;
    c.z *= D22 / D33D22;

    // Backward substitution: L^T * c3 = c2
    c.y -= L32 * c.z;
    c.x -= dot(c.yz, b.xy);

    // Quadratic: c0 + c1*z + c2*z^2 = 0  -> roots z1, z2
    float c2s = (abs(c.z) < EPS) ? (c.z >= 0.0 ? EPS : -EPS) : c.z;
    float p   = c.y / c2s;
    float q   = c.x / c2s;

    float disc = max((p * p) * 0.25 - q, 0.0);
    float r    = sqrt(disc);

    float z1 = -0.5 * p - r;
    float z2 = -0.5 * p + r;

    // Piecewise selection
    vec4 sw =
        (z2 < z0) ? vec4(z1, z0, 1.0, 1.0) :
        ((z1 < z0) ? vec4(z0, z1, 0.0, 1.0) :
                     vec4(0.0, 0.0, 0.0, 0.0));

    float denom = (z2 - sw.y) * (z0 - z1);
    denom = (abs(denom) < EPS) ? (denom >= 0.0 ? EPS : -EPS) : denom;

    float quotient = (sw.x * z2 - b.x * (sw.x + z2) + b.y) / denom;

    return clamp(sw.z + sw.w * quotient, 0.0, 1.0);
}

float shadowFactorMSM(
    samplerCube shadowCube,
    vec3 lightPos,
    float shadowNear,
    float shadowFar,
    float shadowBias,
    vec3 worldPos
)
{
    //return shadowFactorHard(shadowCube, lightPos, shadowNear, shadowFar, shadowBias, worldPos);

    vec3 lightToFrag = worldPos - lightPos;
    float receiverDepth = length(lightToFrag);
    vec3 lightDir = normalize(lightToFrag);
    float receiverDepthNormalized = clamp((receiverDepth - shadowNear) / (shadowFar - shadowNear), 0.0, 1.0);

    vec4 moments = textureCube(shadowCube, lightDir);

    return 1.0 - GetHamburger4MSMShadowIntensity(moments, receiverDepthNormalized, shadowBias, 1e-4);

}