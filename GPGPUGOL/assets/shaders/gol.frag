
uniform sampler2D tDiffuse;
uniform float dx;
uniform float dy;
uniform float threshold;
varying vec2 texcoord;

void main() {
    vec4 c = texture2D(tDiffuse, texcoord);
    bool alive = (c.x > threshold);

    // neighbors
    bool n  = texture2D(tDiffuse, texcoord + vec2(   0, - dy)).x > threshold;
    bool e  = texture2D(tDiffuse, texcoord + vec2(  dx,    0)).x > threshold;
    bool w  = texture2D(tDiffuse, texcoord + vec2(- dx,    0)).x > threshold;
    bool s  = texture2D(tDiffuse, texcoord + vec2(   0,   dy)).x > threshold;
    bool ne = texture2D(tDiffuse, texcoord + vec2(  dx, - dy)).x > threshold;
    bool nw = texture2D(tDiffuse, texcoord + vec2(- dx, - dy)).x > threshold;
    bool se = texture2D(tDiffuse, texcoord + vec2(  dx,   dy)).x > threshold;
    bool sw = texture2D(tDiffuse, texcoord + vec2(- dx,   dy)).x > threshold;

    int count = 0;
    if(n) count++;
    if(e) count++;
    if(w) count++;
    if(s) count++;
    if(ne) count++;
    if(nw) count++;
    if(se) count++;
    if(sw) count++;

    if(alive) {
        if(count <= 1 || count >= 4) {
            c = vec4(vec3(0), 1);
        }
    } else {
        if(count == 3) {
            c = vec4(vec3(1), 1);
        }
    }

    gl_FragColor = c;
}

