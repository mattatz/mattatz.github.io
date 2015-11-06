
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform float alpha;
uniform float beta;
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

void main(){
    vec2 left = LEFT(texcoord);
    vec2 right = RIGHT(texcoord);
    vec2 top = TOP(texcoord);
    vec2 bottom = BOTTOM(texcoord);
    vec2 front = FRONT(texcoord);
    vec2 back = BACK(texcoord);

    float c = texture2D(pressure, texcoord).r;

    float x0 = isBoundary(left) ? c : texture2D(pressure, left).r;
    float x1 = isBoundary(right) ? c : texture2D(pressure, right).r;
    float y0 = isBoundary(top) ? c : texture2D(pressure, top).r;
    float y1 = isBoundary(bottom) ? c : texture2D(pressure, bottom).r;
    float z0 = isBoundary(front) ? c : texture2D(pressure, front).r;
    float z1 = isBoundary(back) ? c : texture2D(pressure, back).r;

    float b = texture2D(divergence, texcoord).r;
    gl_FragColor = vec4((x0 + x1 + y0 + y1 + z0 + z1 - b) / 6.0);
}
