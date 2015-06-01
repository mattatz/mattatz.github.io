
#define THRESHOLD 0.5
#define BOUNDARY 0.005

varying vec2 texcoord;

uniform sampler2D velocity;
uniform vec2 px;
uniform vec2 mouse;
uniform float radius;

bool over(float s) {
    return s >= THRESHOLD;
}

// http://en.wikipedia.org/wiki/HPP_model
void main() {

    vec4 n = texture2D(velocity, texcoord + vec2(   0., -px.y));
    vec4 e = texture2D(velocity, texcoord + vec2( px.x,    0.));
    vec4 w = texture2D(velocity, texcoord + vec2(-px.x,    0.));
    vec4 s = texture2D(velocity, texcoord + vec2(   0.,  px.y));

    // rgba = (n, e, w, s)
    vec4 c = texture2D(velocity, texcoord);

    vec4 result = vec4(0., 0., 0., 0.);

    if(over(n.a)) {
        if(over(c.r)) {
            result.g = 1.0;
        } else {
            result.a = 1.0;
        }
    }

    if(over(e.b)) {
        if(over(c.g)) {
            result.a = 1.0;
        } else {
            result.b = 1.0;
        }
    }

    if(over(w.g)) {
        if(over(c.b)) {
            result.r = 1.0;
        } else {
            result.g = 1.0;
        }
    }

    if(over(s.r)) {
        if(over(c.a)) {
            result.b = 1.0;
        } else {
            result.r = 1.0;
        }
    }
    
    if(distance(texcoord, mouse) < radius) {
        result = vec4(1., 1., 1., 1.);
    }

    if(texcoord.x <= px.x && over(c.b)) {
        result.g = 1.0;
    }

    if(1.0 - texcoord.x <= px.x && over(c.g)) {
        result.b = 1.0;
    }

    if(texcoord.y <= px.y && over(c.r)) {
        result.a = 1.0;
    }

    if(1.0 - texcoord.y <= px.y && over(c.a)) {
        result.r = 1.0;
    }

    gl_FragColor = result;
}

