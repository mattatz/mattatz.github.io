
varying vec2 texcoord;

uniform sampler2D velocity;
uniform vec3 px;

uniform int interaction;
uniform float radius;

// p : vec3(0.0 ~ 1.0)
vec2 convertP2T(vec3 p) {
    return vec2(p.x * px.z + floor(p.z / px.z) * px.z, p.y);
}

// uv : vec2(0.0 ~ 1.0)
vec3 convertT2P(vec2 uv) {
    return vec3(mod(uv.x, px.z) / px.z, uv.y, floor(uv.x / px.z) * px.z);
}

void main() {
    vec3 vel = texture2D(velocity, texcoord).xyz;
    vec2 uv = texcoord;

    const float dt = 0.001;
    vec3 pos = convertT2P(uv);
    uv = convertP2T(pos - vel * dt);

    vec4 color = texture2D(velocity, uv);

    if(interaction > 0) {
        vec3 source = vec3(0.5, 0.5, 0.5);
        vec3 d = pos - source;
        if(length(d) < 0.05) {
            color.rgb += normalize(d) * 0.1;
        }
    }

    gl_FragColor = color;
}

