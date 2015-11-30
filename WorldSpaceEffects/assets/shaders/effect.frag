
#define MODE_COUNT 5

uniform int mode;
uniform float fineness;
uniform float time;
uniform float speed;

varying vec3 wPosition;

int modi(int x, int y) {
    return x - y * (x / y);
}

float modulo(float v) {
    return mod(v, fineness) / fineness;
}

float threshold(float v, float t) {
    return (v > t) ? 1.0 : 0.0;
}

float hash(vec2 p){
    return fract(sin(dot(p ,vec2(12.9898,78.233))) * 43758.5453);
}

vec2 hash2(vec2 p) {
	return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

vec4 line(float t) {
    const float lineWidth = 0.5;
    float p = (mod(wPosition.x + wPosition.y + wPosition.z + t, fineness) / fineness);
    return vec4(vec3(p > lineWidth ? 1.0 : 0.0), 1.0);
}

vec4 grid(float t) {
    const float gridSize = 0.35;
    float p = threshold(modulo(wPosition.x), gridSize) * threshold(modulo(wPosition.y + t), gridSize);
    return vec4(vec3(p), 1.0);
}

vec4 circle(float t) {
    const float circleSize = 0.35;
    float p = threshold(length(vec2(modulo(wPosition.x) - 0.5, modulo(wPosition.y - t) - 0.5)), circleSize);
    return vec4(vec3(p), 1.0);
}

vec4 voronoi(float t) {
    vec2 n = floor(wPosition.xy);
    vec2 f = fract(wPosition.xy);

    float md = 5.0;

    for(int j = -1; j <= 1; j++) {
        for(int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash2(n + g);

            o = 0.5 + 0.5 * sin(t + 6.2831 * o);

            vec2 r = g + o - f;
            float d = dot(r, r) + fineness;

            if(d < md) {
                md = d;
            }
        }
    }

    return vec4(vec3(md), 1.0);
}

vec4 maze(float t) {
    const float lineWidth = 0.35;
    float count = 32.0 * fineness;

    vec2 p = wPosition.xy;
    p.y += time * 0.5;

	vec2 v = floor(p * count);
	p = mod(p * count, 1.0) - 0.5;
	p.x *= 2.0 * floor(fract(hash(v)) * (1.1 + (sin(t) + 1.0) * 0.45)) - 1.0;

	float c = abs(1.0 - 2.0 * abs(dot(p, vec2(1.0))));
	return vec4(vec3(threshold(c, lineWidth)), 1.0);
}

void main() {
    float t = time * speed;
    int m = modi(mode, MODE_COUNT);
    vec4 color = vec4(0.0);
    if(m == 0) {
        color = line(t);
    } else if(m == 1) {
        color = maze(t);
    } else if(m == 2) {
        color = grid(t);
    } else if(m == 3) {
        color = circle(t);
    } else if(m == 4) {
        color = voronoi(t);
    }

    color = clamp(color, vec4(vec3(0.0), 0.0), vec4(vec3(0.65), 1.0));
    gl_FragColor = color;
}

