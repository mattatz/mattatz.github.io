
varying vec2 texcoord;

uniform sampler2D velocity;
uniform float scale;
uniform vec2 px;
uniform vec2 force;
uniform vec2 mouse;
uniform float radius;

void main() {

    vec4 color = texture2D(velocity, texcoord - texture2D(velocity, texcoord).xy * px);

    // apply mouse interaction
    float d = length(texcoord - mouse);
    if(d < radius) {
        float dir = 1.0 - min(length(texcoord - mouse), 1.0);
        color = (color + vec4(force * dir, 0.0, 1.0)) * 0.5; // blend
    }
    gl_FragColor = color;
}

