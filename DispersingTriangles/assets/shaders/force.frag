
varying vec2 texcoord;

uniform sampler2D accelerationTex;
uniform sampler2D positionTex;

uniform vec3 attractor;
uniform vec3 scale;
uniform float time;
uniform float seed;

float rnd(vec2 p){
    return fract(sin(dot(p ,vec2(12.9898,78.233))) * 43758.5453);
}

vec3 uncomp(vec3 v3) {
    v3 = ((v3 - 0.5) * 2.0);
    v3.x *= scale.x;
    v3.y *= scale.y;
    v3.z *= scale.z;
    return v3;
}

vec3 comp(vec3 v3) {
    v3.x /= scale.x;
    v3.y /= scale.y;
    v3.z /= scale.z;
    return (v3 / 2.0) + 0.5;
}

void main() {

    if(time <= 0.3) {
        float x = rnd(texcoord);
        float y = rnd(texcoord + seed);
        float z = rnd(texcoord + seed * 10.);
        gl_FragColor = vec4(x, y, z, 1.);
    } else {
        // vec3 to = uncomp(texture2D(positionTex, texcoord).xyz);
        // vec3 from = uncomp(attractor);
        // vec3 dir = (to - from) * 0.1 + vec3(0., -1., 0.);
        vec3 dir = vec3(0., -1., 0.);

        float m = length(dir) * rnd(texcoord);
        m = clamp(m, 0.001, 1.0);
        vec3 f = normalize(dir) * m; 
        gl_FragColor = vec4(comp(f), 1.);
    }

}

