
attribute vec2 vuv;
varying vec4 color;

uniform float pointSize;
uniform float time;
uniform vec3 scale;

uniform sampler2D texture0;
uniform sampler2D texture1;
uniform float t; // lerp [0.0 ~ 1.0]
uniform float px;

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
    pos.x = (color.x - 0.5) * 10.0;
    pos.y = ((1.0 - color.y) - 0.5) * 10.0;
    pos.z = (color.z - 0.5) * 10.0;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = pointSize;
}

