
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform sampler2D particle;

varying vec2 texcoord;

void main(){
    float p = texture2D(pressure, texcoord).r;
    float alpha = texture2D(particle, gl_PointCoord).r;
    gl_FragColor = vec4(vec3(0.0), smoothstep(0.0001, 0.003, p) * alpha * 0.25 + 0.005);
}

