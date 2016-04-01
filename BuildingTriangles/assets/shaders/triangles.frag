
uniform mat4 invMatrix;

// varying float vn;
varying vec3 vPosition;
varying vec3 vViewPosition;

float easeInCubic (float tt) {
    return tt * tt * tt;
}

float easeOutCubic (float tt) {
    tt -= 1.0;
    return (tt * tt * tt + 1.0);
}

float specular(vec3 lightDir, vec3 viewDir, vec3 surfNormal, float shininess) {
    vec3 halfDir = normalize(lightDir + viewDir);
    return pow(max(0.0, dot(halfDir, surfNormal)), shininess);
}

const vec3 lightDir0 = vec3(1., 1., 0.);

void main() {
    vec3 viewDir = normalize(vViewPosition);

    vec3 dx = dFdx(vPosition.xyz);
    vec3 dy = dFdy(vPosition.xyz);
    vec3 normal = normalize(cross(normalize(dx), normalize(dy)));

    float spec = 0.0;
    spec += specular(normalize(lightDir0), viewDir, normal, 8.5);

    // float alpha = easeInCubic(easeInCubic(1.0 - vn));
    // gl_FragColor = vec4(vec3(spec + 0.2), alpha);
    gl_FragColor = vec4(vec3(spec + 0.2), 1.0);
}

