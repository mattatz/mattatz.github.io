
varying vec2 texcoord;

uniform sampler2D velocity;
uniform vec2 px;

void main() {
    // gradient
    float x0 = texture2D(velocity, texcoord - vec2(px.x, 0.0)).x;
    float x1 = texture2D(velocity, texcoord + vec2(px.x, 0.0)).x;
    float y0 = texture2D(velocity, texcoord - vec2(0.0, px.y)).y;
    float y1 = texture2D(velocity, texcoord + vec2(0.0, px.y)).y;

    float divergence = (x1 - x0 + y1 - y0) * 0.5;
    gl_FragColor = vec4(divergence);
}

