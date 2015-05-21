
varying vec2 texcoord;

void main() {
    texcoord = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}

