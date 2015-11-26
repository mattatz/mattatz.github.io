
uniform mat4 invMatrix;

varying float vn;
varying vec3 vPosition;
varying vec3 vNormal;

float easeInCubic (float tt) {
    return tt * tt * tt;
}

float easeOutCubic (float tt) {
    tt -= 1.0;
    return (tt * tt * tt + 1.0);
}

float lighting (vec3 eyeDir, vec3 lightDir) {
    vec3 halfLE = normalize(lightDir + eyeDir);
    float diffuse = clamp(dot(vNormal, lightDir), 0.0, 1.0);
    float specular = pow(clamp(dot(vNormal, halfLE), 0.0, 1.0), 50.0);
    return diffuse + specular;
}

void main() {

    vec3 n = normalize(viewMatrix * vec4(vNormal, 1.0)).xyz;
    vec3 p = (viewMatrix * vec4(vPosition, 1.0)).xyz;
    vec3 eyeDir = normalize(-p);

    float highlight = 0.0;
    highlight += lighting(eyeDir, normalize(invMatrix * vec4(vec3(1.0, 1.0, 0.0), 1.0)).xyz);

    float alpha = easeInCubic(easeInCubic(1.0 - vn));
    gl_FragColor = vec4(vec3(highlight + 0.2), alpha);
}

