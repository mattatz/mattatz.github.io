
varying vec3 wPosition;

void main(){
    vec3 pos = position;

    wPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}

