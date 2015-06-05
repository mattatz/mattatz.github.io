#define THRESHOLD 0.5
#define BOUNDARY 0.005

varying vec2 texcoord;

uniform sampler2D velocityNEESE;
uniform sampler2D velocitySWWNW;

uniform vec2 px;
uniform vec2 mouse;
uniform float radius;
uniform float t;

float rnd(vec2 p){
    return fract(sin(dot(p ,vec2(12.9898,78.233))) * 43758.5453);
}

int boolean(float f) {
    return (f >= THRESHOLD) ? 1 : 0;
}

// FHP 1
int collide(int array[6], int irand) {
    return irand * array[1] * array[4] * (1 - array[0]) * (1 - array[2]) * (1 - array[3]) * (1 - array[5])
        + (1 - irand) * array[2] * array[5] * (1 - array[0]) * (1 - array[1]) * (1 - array[3]) * (1 - array[4])
        - array[0] * array[3] * (1 - array[1]) * (1 - array[2]) * (1 - array[4]) * (1 - array[5])
        + array[1] * array[3] * array[5] * (1 - array[0]) * (1 - array[2]) * (1 - array[4])
        - array[0] * array[2] * array[4] * (1 - array[1]) * (1 - array[3]) * (1 - array[5]);
}

void shift(inout int array[6]) {
    int tmp = array[0];
    for(int i = 0; i < 5; i++) {
        array[i] = array[i + 1];
    }
    array[5] = tmp;
}

int irandom(vec2 uv, float k) {
    bool random = (rnd(uv + vec2(k, k)) >= THRESHOLD);
    return random ? 1 : 0;
}

void main() {

    vec4 result = vec4(0., 0., 0., 1.);

    if(distance(texcoord, mouse) < radius) {
        result.rgb = vec3(1., 1., 1.);
    } else {
        vec4 vNEESE = texture2D(velocityNEESE, texcoord);
        vec4 vSWWNW = texture2D(velocitySWWNW, texcoord);

        int values[6];
        values[0] = boolean(vSWWNW.r);
        values[1] = boolean(vSWWNW.g);
        values[2] = boolean(vSWWNW.b);
        values[3] = boolean(vNEESE.r);
        values[4] = boolean(vNEESE.g);
        values[5] = boolean(vNEESE.b);

        int sw = collide(values, irandom(texcoord, t + 13.));

        shift(values);
        int w = collide(values, irandom(texcoord * 23., t - 9.));

        shift(values);
        int nw = collide(values, irandom(texcoord * 7., t + 5.));

        result.rgb = vec3(sw + int(texture2D(velocitySWWNW, texcoord).r), w + int(texture2D(velocitySWWNW, texcoord).g), nw + int(texture2D(velocitySWWNW, texcoord).b));
    }

    gl_FragColor = result;
}

