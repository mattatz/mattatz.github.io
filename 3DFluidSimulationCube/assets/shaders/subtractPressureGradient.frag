
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform vec3 px;

varying vec2 texcoord;

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

    float x0 = isBoundary(left) ? 0.0 : texture2D(pressure, left).r;
    float x1 = isBoundary(right) ? 0.0 : texture2D(pressure, right).r;

    float y0 = isBoundary(top) ? 0.0 : texture2D(pressure, top).r;
    float y1 = isBoundary(bottom) ? 0.0 : texture2D(pressure, bottom).r;

    float z0 = isBoundary(front) ? 0.0 : texture2D(pressure, front).r;
    float z1 = isBoundary(back) ? 0.0 : texture2D(pressure, back).r;

    vec3 v = texture2D(velocity, texcoord).xyz;

    // subtract gradient of pressure from velocity
    gl_FragColor = vec4(
        (v - vec3(x1 - x0, y1 - y0, z1 - z0) * 0.5),
        0.0
    );

}

