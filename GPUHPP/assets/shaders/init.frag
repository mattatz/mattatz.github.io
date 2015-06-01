
#define THRESHOLD 0.5

varying vec2 texcoord;

uniform vec2 px;

float rnd(vec2 p){
    return fract(sin(dot(p ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    float n = rnd(texcoord);
    float e = rnd(texcoord * 2.);
    float w = rnd(texcoord * 4.);
    float s = rnd(texcoord * 6.);
    gl_FragColor = vec4(n, e, w, s);

}

