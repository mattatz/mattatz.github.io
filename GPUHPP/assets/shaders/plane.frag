
uniform sampler2D velocity;
varying vec2 texcoord;

void main(){
    vec4 v = texture2D(velocity, texcoord);
    float s = (v.x + v.y + v.z + v.a) / 4.;
    gl_FragColor = vec4(s, s, s, 1.0);
}

