
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform float alpha;
uniform float beta;
uniform vec2 px;

varying vec2 texcoord;

void main(){
    float x0 = texture2D(pressure, texcoord - vec2(px.x, 0.0)).r;
    float x1 = texture2D(pressure, texcoord + vec2(px.x, 0.0)).r;
    float y0 = texture2D(pressure, texcoord - vec2(0.0, px.y)).r;
    float y1 = texture2D(pressure, texcoord + vec2(0.0, px.y)).r;
    float b = texture2D(divergence, texcoord).r;

    // program representation for Equation 16
    float relaxed = (x0 + x1 + y0 + y1 + alpha * b) * beta;

    gl_FragColor = vec4(relaxed);
}
