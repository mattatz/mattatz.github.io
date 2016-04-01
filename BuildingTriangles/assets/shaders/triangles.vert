
#define PI 3.14159265358

attribute float seed;

uniform float time;
uniform float loop;
uniform float speed;
uniform sampler2D noiseTex;
uniform float radius;

uniform mat4 invMatrix;

// varying float vn;
varying vec3 vPosition;
varying vec3 vViewPosition;

float rnd(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 rnd3(vec2 seed) {
	float t = sin(seed.x + seed.y * 1e3);
	return vec3(fract(t * 1e4), fract(t * 1e6), fract(t * 1e5));
}

float easeInCubic (float tt) {
    return tt * tt * tt;
}

float easeOutCubic (float tt) {
    tt -= 1.0;
    return (tt * tt * tt + 1.0);
}

vec3 rotate (vec3 p, vec3 axis, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    float nx = axis.x;
    float ny = axis.y;
    float nz = axis.z;
    mat4 rot = mat4(
        nx*nx*(1.0-c)+c, nx*ny*(1.0-c)-nz*s, nz*nx*(1.0-c)+ny*s, 0.0,
        nx*ny*(1.0-c)+nz*s, ny*ny*(1.0-c)+c, ny*nz*(1.0-c)-nx*s, 0.0,
        nz*nx*(1.0-c)-ny*s, ny*nz*(1.0-c)+nx*s, nz*nz*(1.0-c)+c, 0.0,
        0.0, 0.0, 0.0, 1.0
    );
    return (rot * vec4(p, 1)).xyz;
}

vec3 rotate (vec3 p, vec3 axis, float angle, vec3 center) {
    p -= center;
    p = rotate(p, axis, angle);
    p += center;
    return p;
}

void main() {
    vec3 pos = position;

    float t = mod(time * speed, loop);
    float hl = loop * 0.5;
    if(t >= hl) {
        t = loop - t;
    }
    t = t / hl;
    t = easeInCubic(t);

    float vn = clamp(texture2D(noiseTex, uv + seed).r - t, 0.0, 1.0);

    float angle = vn * PI * 2.0 * (seed - 0.5);
    pos = rotate(pos, rnd3(vec2(seed, 0.0)), angle);
    pos += normal * vn * radius;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = - mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
    vPosition = gl_Position.xyz;
}

