
uniform sampler2D velocity;
uniform sampler2D pressure;
varying vec2 texcoord;

void main(){
    gl_FragColor = vec4(texture2D(pressure, texcoord).xyz, 1);
}

