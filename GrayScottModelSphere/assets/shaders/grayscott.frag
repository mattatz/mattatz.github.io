
uniform sampler2D rdTex;
uniform vec2 texel;
uniform int mode;
uniform float F;
uniform float k;
uniform float dt;
uniform vec2 mouse;

varying vec2 texcoord;

vec4 init() {
    return vec4(1.0, 0.0, 0.0, 1.0);
}

vec4 update() {
    vec2 c = texture2D(rdTex, texcoord).rg;
    vec2 l = texture2D(rdTex, texcoord + texel * vec2(-1.0,  0.0)).rg;
    vec2 r = texture2D(rdTex, texcoord + texel * vec2( 1.0,  0.0)).rg;
    vec2 t = texture2D(rdTex, texcoord + texel * vec2( 0.0, -1.0)).rg;
    vec2 b = texture2D(rdTex, texcoord + texel * vec2( 0.0,  1.0)).rg;

    vec2 laplacian = (l + r + t + b - 4.0 * c);

    const float ru = 0.2097; // rate of diffusion of U
    const float rv = 0.1050; // rate of diffusion of V

    // - uv.r * uv.g * uv.g : reaction rate
    // F * (1 - uv.r) : replenishment
    float du = ru * laplacian.r - c.r * c.g * c.g + F * (1.0 - c.r);

    // - (F + k) * uv.g : dimishment
    float dv = rv * laplacian.g + c.r * c.g * c.g - (F + k) * c.g;
    vec2 dst = c + dt * vec2(du, dv);

    if(mouse.x > 0.0) {
        if(distance(texcoord, mouse) < 0.005) {
            dst.g = 0.9;
        }
    }

    return vec4(dst, 0.0, 1.0);
}

void main() {
    if(mode == 0) { // init
        gl_FragColor = init();
    } else if(mode == 1) { // update
        gl_FragColor = update();
    } else {
        gl_FragColor = texture2D(rdTex, texcoord);
    }
}

