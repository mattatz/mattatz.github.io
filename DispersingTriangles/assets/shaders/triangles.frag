
uniform sampler2D skinTex;

varying vec2 vUv;
varying float vLambert;

void main() {
    vec4 color = texture2D(skinTex, vUv);
    color.rgb *= vLambert;
    gl_FragColor = color;
}

