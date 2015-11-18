
uniform sampler2D rdTex;

varying vec2 vUv;

void main(){
    vUv = uv;
    vec3 pos = position;
    vec4 rd = texture2D(rdTex, uv);
    pos += normal * rd.g * 0.75;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}

