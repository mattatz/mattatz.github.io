#define THRESHOLD 0.5
#define BOUNDARY 0.005

varying vec2 texcoord;
uniform vec2 px;

float rnd(vec2 p){
    return fract(sin(dot(p ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    gl_FragColor = vec4(0., 0., 0., 1.);
}

