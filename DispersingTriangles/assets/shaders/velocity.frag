
varying vec2 texcoord;

uniform sampler2D accelerationTex;
uniform sampler2D velocityTex;
uniform sampler2D positionTex;
uniform vec3 scale;
uniform float time;
uniform float dt;
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

// output position
void main() {

    if(time <= 0.3) {
        float x = rnd(texcoord);
        float y = rnd(texcoord + seed);
        float z = rnd(texcoord + seed * 10.);
        float w = rnd(texcoord + seed * 100.);
        gl_FragColor = vec4(x, y, z, w);
    } else {
        vec3 vel = uncomp(texture2D(velocityTex, texcoord).xyz);

        vec4 p = texture2D(positionTex, texcoord);
        vec3 pos = uncomp(p.xyz);
        pos += vel * dt;
        gl_FragColor = vec4(comp(pos), p.w);
    }

}

