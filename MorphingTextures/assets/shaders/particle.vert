
attribute vec2 vuv;

varying vec4 color;

uniform float pointSize;
uniform float time;
uniform vec3 scale;

uniform sampler2D texture0;
uniform sampler2D texture1;
uniform float t; // lerp [0.0 ~ 1.0]

float easeOutCubic (float tt) {
    tt -= 1.0;
    return (tt * tt * tt + 1.0);
}

void main() {
    vec2 texcoord = vuv;
    vec3 pos = position;
    vec4 c0 = texture2D(texture0, texcoord);
    vec4 c1 = texture2D(texture1, texcoord);
    color = mix(c0, c1, easeOutCubic(t));

    pos.x = (texcoord.x - 0.5) * scale.x;
    pos.y = (texcoord.y - 0.5) * scale.y;
    // pos.z = (texture2D(texture0, texcoord).r - 0.5) * scale.z;
    pos.z = (color.r - 0.5) * scale.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = pointSize;
}

