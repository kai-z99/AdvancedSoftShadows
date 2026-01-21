# Advanced Soft Shadow Mapping Techniques

Implemented techniques:
- **Hard Shadows**
- **PCF (Percentage Closer Filtering)**
- **VSM (Variance Shadow Mapping)**
- **ESM (Exponential Shadow Mapping)**
- **PCSS (Percentage Closer Soft Shadows)**

## Features
- Real-time toggle between shadow techniques
- Adjustable settings (bias, filter size, light size, etc.)

## Screenshots

| Technique | Preview |
|----------|---------|
| Hard |<img width="1920" height="1200" alt="image" src="https://github.com/user-attachments/assets/0bbac256-f5c7-4eed-a854-2128d962a1a4" />|
| PCF | <img width="1920" height="1200" alt="image" src="https://github.com/user-attachments/assets/676349e5-71a2-4301-8e75-787be6618b3b" />|
| VSM | <img width="1920" height="1200" alt="image" src="https://github.com/user-attachments/assets/ce9749f4-319d-4327-880e-cada2692b318" />|
| PCSS (r=1)| <img width="1920" height="1200" alt="image" src="https://github.com/user-attachments/assets/d9e5f826-5de2-4346-b89e-ff4759888029" />|
| PCSS (r=2.5)|<img width="1919" height="1199" alt="image" src="https://github.com/user-attachments/assets/71cf6f8a-ac23-4b4c-a302-c783d0b0857e" />|


## Controls
- WASD to move light on XZ. Q/E to move light on Y. 
- Use mouse to click UI.

## Build/Run
1. Run index.html with a live server.

## Techniques

### Hard Shadows
Hard shadows are the basic form of shadow mapping. The shadow map stores a single depth value from the light’s perspective, and fragments are either fully lit or fully shadowed.

**Implementation:**
Render scene depth from the light to get a shadow map. Since we have a pointlight, this will be a cubemap.
During shading, compare fragment depth vs stored depth, then decide if the fragment is in a shadow as a binary decision.

**Pros:**
- Very fast
- Simple and easy to debug

**Cons:**
- Jagged edges (aliasing)
- Shadow acne / peter-panning if bias is poorly tuned

**Settings:**
- Depth bias
- Shadow map resolution

---

### PCF (Percentage Closer Filtering)
PCF smooths shadow edges by sampling multiple nearby depth comparisons and averaging them.

**Implementation:**
Perform $n$ depth comparisons around the shadow UV using a poisson disk distribution.
Average the results to create a softer edge

**Pros:**
- Softer edges than hard shadows
- Relatively easy to implement

**Cons:**
- Softness is uniform (doesn’t depend on distance from occluder)
- More samples = more expensive

**Settings:**
- Kernel size (radius)
- Sample count
- Bias

---

### VSM (Variance Shadow Mapping)
VSM stores moments of depth (`E[z]` and `E[z²]`) to estimate shadow probability, and uses that number directly as the shadowing value.

**Implementation:**
Store depth moments in the shadow map. In this case it will just be the depth and depth squared because of the next step.
Apply a 2 tap gaussian blur to the shadowmap and optionally create mipmaps.
Note that because of the blur:

$$
M_1 = d \approx E[z] = \int_{-\infty}^{\infty} z\,p(z)\,dz
$$

$$
M_2 = d^2 \approx E[z^2] = \int_{-\infty}^{\infty} z^2 p(z)\,dz
$$

Reconstruct variance and estimate chance that feragment is occulded using Chebyshev's inequality:

$$
\sigma^2 = E[z^2] - E[z]^2 = M_2 - M_1^2
$$

$$
P(x \ge t) \le \frac{\sigma^2}{\sigma^2 + (t - \mu)^2}
$$
  
**Pros:**
- Soft shadows with efficient filtering

**Cons:**
- Light bleeding (objects incorrectly appear lit through shadows)

**Settings:**
- Resolution
- Gaussian blur

---
### ESM (Exponential Shadow Mapping)

**Implementation:**

**Pros:**
- Soft shadows with efficient filtering
- Less dramatic light bleeding than VSM
- More memory efficient than VSM (only need to store $e^{kz}$ instead of 2 moments)

**Cons:**
- Light bleeding 

**Settings:**
- Resolution
- Gaussian blur

---

### PCSS (Percentage Closer Soft Shadows)
PCSS creates contact-hardening shadows, meaning shadows are sharper near contact points and blurrier farther away. Essentialy we want to estimate the *penumbra* of a shadow as if our pointlight were an area light.

**Implementation:**
1. **Blocker Search:** find average occluder depth near the receiver. Do this by taking $n$ samples where your ray offsets are sampled from a poisson disk distrubution.
2. **Penumbra Estimation:** compute filter radius based on blocker distance and light size using the formula:
   
$$
 w_{penumbra} = (d_{reciever} - d_{blocker}) \cdot w_{light} / d_{blocker}
$$

  where $d_{reciever}$ is the depth of your target fragment in the shadowmap,  $d_{blocker}$ is the average depth of the blockers of that fragment, computed from step 1, and $w_{light}$ is the radius of your light.
   

3. **PCF Filtering:** Do PCF filtering as described before with filter size proportional to $w_{penumbra}$.

**Pros:**
- Most realistic out of the four techniques
- Responds to geometry and light size correctly

**Cons:**
- More expensive than PCF
- Can be noisy if sample count is too low or sampling distribution is bad.

**Settings:**
- Light size
- Blocker search radius / samples
- PCF sample count
- Bias

## Sources
- https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-8-summed-area-variance-shadow-maps
- https://developer.download.nvidia.com/shaderlibrary/docs/shadow_PCSS.pdf
- https://developer.download.nvidia.com/assets/gamedev/docs/PCSS_Integration.pdf
- https://github.com/pboechat/PCSS
- https://jankautz.com/publications/esm_gi08.pdf

