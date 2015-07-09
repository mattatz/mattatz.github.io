
varying vec2 texcoord;

uniform sampler2D accelerationTex;
uniform sampler2D velocityTex;
uniform vec3 scale;
uniform float time;
uniform float dt;
uniform float seed;

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
        // initialize

        gl_FragColor = vec4(0.5, 0.5, 0.5, 1.);
    } else {
        // update velocity

        vec3 acc = uncomp(texture2D(accelerationTex, texcoord).xyz);
        vec3 vel = uncomp(texture2D(velocityTex, texcoord).xyz);
        vel += acc;

        // linear drag
        if(length(vel) > 0.0) {
            // vel += vel * -0.02;
        }

        // gl_FragColor = vec4(0.5, 0.5, 0.5, 1.);
        gl_FragColor = vec4(comp(vel), 1.);
    }

}

