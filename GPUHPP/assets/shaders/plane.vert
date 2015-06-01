
uniform sampler2D velocity;
varying vec2 texcoord;

void main() {
    texcoord = uv;
    vec4 v = texture2D(velocity, texcoord);
    float p = (v.x + v.y + v.z + v.a) / 4.;

    // rift up
    vec3 pos = position;
    pos.z += (p - 0.5) * 0.2;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}

