
uniform sampler2D rdTex;
varying vec2 vUv;

void main() {
    vec4 rd = texture2D(rdTex, vUv);
    vec4 dst = vec4(min(vec3(1.0 - rd.g), 0.85), 0.9);
    gl_FragColor = dst;
}

