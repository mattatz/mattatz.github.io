#define THRESHOLD 0.5
#define BOUNDARY 0.005

varying vec2 texcoord;

uniform sampler2D velocityNEESE;
uniform sampler2D velocitySWWNW;

uniform vec2 px;

int boolean(float f) {
    return (f >= THRESHOLD) ? 1 : 0;
}

void main() {

    vec4 result = vec4(0., 0., 0., 1.);

    vec2 ne, e, se;
    vec2 sw, w, nw;

    e = texcoord + vec2( px.x, 0);
    w = texcoord + vec2(-px.x, 0);

    if(mod(texcoord.y / px.y, 2.) < 1.) {
        ne = texcoord + vec2(    0, -px.y);
        se = texcoord + vec2(    0,  px.y);
        sw = texcoord + vec2(-px.x,  px.y);
        nw = texcoord + vec2(-px.x, -px.y);
    } else {
        ne = texcoord + vec2( px.x, -px.y);
        se = texcoord + vec2( px.x,  px.y);
        sw = texcoord + vec2(    0,  px.y);
        nw = texcoord + vec2(    0, -px.y);
    }

    int nei = boolean(texture2D(velocityNEESE, sw).r);
    int ei = boolean(texture2D(velocityNEESE, w).g);
    int sei = boolean(texture2D(velocityNEESE, nw).b);
    int swi = boolean(texture2D(velocitySWWNW, ne).r);
    int wi = boolean(texture2D(velocitySWWNW, e).g);
    int nwi = boolean(texture2D(velocitySWWNW, se).b);

    // boundary

    if(texcoord.x <= px.x) {
        if(swi > 0) {
            nei = 1;
        }
        if(wi > 0) {
            ei = 1;
        }
        if(nwi > 0) {
            sei = 1;
        }
    } else if(texcoord.x >= 1.0 - px.x) {
        nei = 0;
        ei = 0;
        sei = 0;
    }

    if(texcoord.y <= px.y) {
        nei = 0;
        if(nwi > 0) {
            sei = 1;
        }
    } else if(texcoord.y >= 1.0 - px.y) {
        sei = 0;
        if(swi > 0) {
            nei = 1;
        }
    }

    result.rgb = vec3(nei, ei, sei);

    gl_FragColor = result;
}

