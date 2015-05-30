
attribute vec2 vuv;
varying vec4 color;

uniform sampler2D positionTex;
uniform float pointSize;
uniform float time;
uniform vec3 scale;

vec3 uncomp(vec3 v3) {
    v3 = ((v3 - 0.5) * 2.0);
    v3.x *= scale.x;
    v3.y *= scale.y;
    v3.z *= scale.z;
    return v3;
}

void main() {
    vec2 texcoord = vuv;

    vec3 p = texture2D(positionTex, texcoord).xyz;
    vec3 pos = uncomp(p);

    color = vec4(p, 1.);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = pointSize;
}

