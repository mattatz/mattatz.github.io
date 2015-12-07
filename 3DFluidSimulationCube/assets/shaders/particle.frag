
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform sampler2D particle;

varying vec2 texcoord;

void main(){
    vec3 vel = (normalize(texture2D(velocity, texcoord).xyz) + 1.0) * 0.5;
    float p = texture2D(pressure, texcoord).r;
    float alpha = texture2D(particle, gl_PointCoord).r;
    gl_FragColor = vec4(vel, smoothstep(0.0001, 0.001, p) * alpha * 0.35 + 0.005);
}

