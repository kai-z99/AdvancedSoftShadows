varying vec2 vClipUv;

//fullscreen quad is input vertices
void main() 
{
    vClipUv = position.xy;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
