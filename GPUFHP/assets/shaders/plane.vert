
#define SIN_PI_DIV_3 0.86602540378
#define COS_PI_DIV_3 0.5
#define PI 3.14159265359	

uniform sampler2D velocityNEESE;
uniform sampler2D velocitySWWNW;
varying vec2 texcoord;

void main() {
    texcoord = uv;

    vec4 vNEESE = texture2D(velocityNEESE, texcoord);
    vec4 vSWWNW = texture2D(velocitySWWNW, texcoord);

    vec3 pos = position;
    vec2 bend = vec2(0, 0);

    bend += vec2(  COS_PI_DIV_3 * vNEESE.x, - SIN_PI_DIV_3 * vNEESE.x);
    bend += vec2(                 vNEESE.y,                         0);
    bend += vec2(  COS_PI_DIV_3 * vNEESE.z,   SIN_PI_DIV_3 * vNEESE.z);
    bend += vec2(- COS_PI_DIV_3 * vSWWNW.z, - SIN_PI_DIV_3 * vSWWNW.z);
    bend += vec2(               - vSWWNW.y,                         0);
    bend += vec2(- COS_PI_DIV_3 * vSWWNW.x,   SIN_PI_DIV_3 * vSWWNW.x);

    pos.xy += bend * 0.2;
    pos.z += length(vNEESE.rgb + vSWWNW.rgb) * 0.5;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}

