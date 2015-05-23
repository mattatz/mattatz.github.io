
varying vec2 texcoord;

void main(){
    texcoord = uv;

    gl_Position = vec4(position, 1.0);
}

