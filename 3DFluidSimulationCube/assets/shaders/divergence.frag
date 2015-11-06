
varying vec2 texcoord;

uniform sampler2D velocity;
uniform vec3 px;

bool isBoundary(vec2 uv) {
    float mz = mod(uv.x, px.z);
    return (mz < px.x) || (mz > px.z - px.x) || uv.x <= 0.0 || uv.x >= 1.0 || uv.y <= 0.0 || uv.y >= 1.0;
}

vec2 LEFT(vec2 uv) {
    return uv - vec2(px.x, 0.0);
}

vec2 RIGHT(vec2 uv) {
    return uv + vec2(px.x, 0.0);
}

vec2 TOP(vec2 uv) {
    return uv - vec2(0.0, px.y);
}

vec2 BOTTOM(vec2 uv) {
    return uv + vec2(0.0, px.y);
}

vec2 FRONT(vec2 uv) {
    return uv - vec2(px.z, 0.0);
}

vec2 BACK(vec2 uv) {
    return uv + vec2(px.z, 0.0);
}

void main() {
    vec2 left = LEFT(texcoord);
    vec2 right = RIGHT(texcoord);
    vec2 top = TOP(texcoord);
    vec2 bottom = BOTTOM(texcoord);
    vec2 front = FRONT(texcoord);
    vec2 back = BACK(texcoord);

    float x0 = isBoundary(left) ? texture2D(velocity, right).x : texture2D(velocity, left).x;
    float x1 = isBoundary(right) ? texture2D(velocity, left).x : texture2D(velocity, right).x;

    float y0 = isBoundary(top) ? texture2D(velocity, bottom).y : texture2D(velocity, top).y;
    float y1 = isBoundary(bottom) ? texture2D(velocity, top).y : texture2D(velocity, bottom).y;

    float z0 = isBoundary(front) ? texture2D(velocity, back).z : texture2D(velocity, front).z;
    float z1 = isBoundary(back) ? texture2D(velocity, front).z : texture2D(velocity, back).z;

    float divergence = (x1 - x0 + y1 - y0 + z1 - z0) * 0.5;
    gl_FragColor = vec4(divergence);
}

