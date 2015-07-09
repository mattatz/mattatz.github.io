
uniform float time;
uniform float loop;
uniform float speed;
uniform sampler2D noiseTex;

attribute vec2 noiseUv;

varying vec2 vUv;
varying float vn;
varying float vLambert;

void main() {
    vec3 pos = position;

    float t = mod(time * speed, loop);
    float hl = loop * 0.5;
    if(t >= hl) {
        t = loop - t;
    }
    t = t / hl;
    vn = clamp(texture2D(noiseTex, noiseUv).r + t, 0.0, 1.0);

    vUv = uv;

    vec3 lightDir = normalize(vec3(0.2, 0.2, 0.8));
    vLambert = max(0.0, dot(lightDir, normal));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}

