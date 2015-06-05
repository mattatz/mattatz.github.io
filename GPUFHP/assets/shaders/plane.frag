
uniform sampler2D velocityNEESE;
uniform sampler2D velocitySWWNW;
uniform float t;

varying vec2 texcoord;

float rnd(vec2 p){
    return fract(sin(dot(p ,vec2(12.9898,78.233))) * 43758.5453);
}

void main(){
    vec4 vNEESE = texture2D(velocityNEESE, texcoord);
    vec4 vSWWNW = texture2D(velocitySWWNW, texcoord);

    vec3 neese;
    vec3 swwnw;

    float mt = rnd(texcoord + vec2(t, t * 0.5));
    if(mt < 0.333) {
        neese = vNEESE.rgb;
        swwnw = vSWWNW.brg;
    } else if(mt < 0.666) {
        neese = vNEESE.gbr;
        swwnw = vSWWNW.rgb;
    } else {
        neese = vNEESE.brg;
        swwnw = vSWWNW.gbr;
    }

    gl_FragColor = vec4(
        vec3((neese + swwnw) * 0.5), 0.7
    );

}

