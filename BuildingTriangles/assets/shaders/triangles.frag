
uniform sampler2D skinTex;

varying float vn;
varying vec2 vUv;
varying float vLambert;

void main() {

    vec4 color;
    if(vn - fract(vn) >= 1.0) {
        color = texture2D(skinTex, vUv);
        color.rgb *= vLambert;
    } else {
        discard;
    }

    gl_FragColor = color;
}

