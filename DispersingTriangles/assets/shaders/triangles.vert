
uniform float time;
uniform float loop;
uniform float speed;
uniform sampler2D noiseTex;
uniform sampler2D positionTex;

attribute vec2 noiseUv;
attribute vec2 simulationUv;
attribute vec3 center;

varying vec2 vUv;
varying float vLambert;

float rnd(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 rnd3(vec2 seed) {
	float t = sin(seed.x + seed.y * 1e3);
	return vec3(fract(t * 1e4), fract(t * 1e6), fract(t * 1e5));
}

vec3 rotate(vec3 v, vec3 axis, float angle) {
	float s = sin(angle);
    float c = cos(angle);
	float nx = axis.x;
    float ny = axis.y;
    float nz = axis.z;
	mat4 rot = mat4(
		nx * nx * (1. - c) + c,      nx * ny * (1. - c) - nz * s, nz * nx * (1. - c) + ny * s, 0.,
		nx * ny * (1. - c) + nz * s, ny * ny * (1. - c) + c,      ny * nz * (1. - c) - nx * s, 0.,
		nz * nx * (1. - c) - ny * s, ny * nz * (1. - c) + nx * s,      nz * nz * (1. - c) + c, 0.,
                                 0.,                          0.,                          0., 1.
	);
	return (rot * vec4(v, 1.)).xyz;
}

vec3 rotate(vec3 v, vec3 axis, float angle, vec3 center) {
	v -= center;
	v = rotate(v, axis, angle);
	v += center;
	return v;
}

void main() {
    vUv = uv;

    vec3 p = texture2D(positionTex, simulationUv).rgb;

    float r = rnd(simulationUv);
    vec3 pos = rotate(position, normalize(center), time * r, center) + p;

    vec3 lightDir = normalize(vec3(0.2, 0.2, 0.8));
    vec3 norm = normal;
    vLambert = max(0.0, dot(lightDir, rotate(norm, normalize(center), time * r, vec3(0., 0., 0.))));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}

