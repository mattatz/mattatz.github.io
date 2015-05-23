
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform vec2 px;

varying vec2 texcoord;

void main() {

    float x0 = texture2D(pressure, texcoord - vec2(px.x, 0)).r;
    float x1 = texture2D(pressure, texcoord + vec2(px.x, 0)).r;
    float y0 = texture2D(pressure, texcoord - vec2(0, px.y)).r;
    float y1 = texture2D(pressure, texcoord + vec2(0, px.y)).r;

    vec2 v = texture2D(velocity, texcoord).xy;

    // subtract gradient of pressure from velocity
    gl_FragColor = vec4(
        (v - vec2(x1 - x0, y1 - y0) * 0.5),
        1.0,
        1.0
    );

}

