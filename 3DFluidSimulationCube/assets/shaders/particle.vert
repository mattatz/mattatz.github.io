
uniform vec3 px;
uniform float pointSize;

attribute vec2 vuv;

varying vec2 texcoord;

void main() {
    texcoord = vuv;

    vec3 pos = vec3(mod(texcoord.x, px.z) / px.z - 0.5, texcoord.y - 0.5, floor(texcoord.x / px.z) * px.z - 0.5);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = pointSize;
}

