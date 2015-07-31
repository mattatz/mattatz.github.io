/**
 * @author mattatz / http://mattatz.github.io
 *
 * Based on 
 * Charlotte Hoare MSc Project / http://nccastaff.bournemouth.ac.uk/jmacey/MastersProjects/MSc12/Hoare/index.html
 * and 
 * Su et al. Real-Time rendering of watercolor effects for virtual environments. / http://dl.acm.org/citation.cfm?id=2131253
 */

THREE.Watercolor = {

    uniforms: {
        "tDiffuse":		{ type: "t", value: null }, // diffuse texture
        "tPaper":		{ type: "t", value: null }, // paper texture
        "texel":		{ type: "v2", value: new THREE.Vector2(1.0 / 512, 1.0 / 512) },
        "scale":		{ type: "f", value: 0.03 }, // wobble scale
        "threshold":	{ type: "f", value: 0.7 }, // edge threshold
        "darkening":    { type: "f", value: 1.75 }, // edge darkening
        "pigment":      { type: "f", value: 1.2 }, // pigment dispersion
    },

    vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
            "vUv = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        "}"
    ].join("\n"),

    fragmentShader: [
        "uniform sampler2D tDiffuse;",
        "uniform sampler2D tPaper;",

        "uniform vec2 texel;",
        "uniform float scale;",
        "uniform float threshold;",
        "uniform float darkening;",
        "uniform float pigment;",

        "varying vec2 vUv;",

        "float sobel(sampler2D tex, vec2 uv) {",

            "vec3 hr = vec3(0., 0., 0.);",
            "hr += texture2D(tex, (uv + vec2(-1.0, -1.0) * texel)).rgb *  1.0;",
            "hr += texture2D(tex, (uv + vec2( 0.0, -1.0) * texel)).rgb *  0.0;",
            "hr += texture2D(tex, (uv + vec2( 1.0, -1.0) * texel)).rgb * -1.0;",
            "hr += texture2D(tex, (uv + vec2(-1.0,  0.0) * texel)).rgb *  2.0;",
            "hr += texture2D(tex, (uv + vec2( 0.0,  0.0) * texel)).rgb *  0.0;",
            "hr += texture2D(tex, (uv + vec2( 1.0,  0.0) * texel)).rgb * -2.0;",
            "hr += texture2D(tex, (uv + vec2(-1.0,  1.0) * texel)).rgb *  1.0;",
            "hr += texture2D(tex, (uv + vec2( 0.0,  1.0) * texel)).rgb *  0.0;",
            "hr += texture2D(tex, (uv + vec2( 1.0,  1.0) * texel)).rgb * -1.0;",

            "vec3 vt = vec3(0., 0., 0.);",
            "vt += texture2D(tex, (uv + vec2(-1.0, -1.0) * texel)).rgb *  1.0;",
            "vt += texture2D(tex, (uv + vec2( 0.0, -1.0) * texel)).rgb *  2.0;",
            "vt += texture2D(tex, (uv + vec2( 1.0, -1.0) * texel)).rgb *  1.0;",
            "vt += texture2D(tex, (uv + vec2(-1.0,  0.0) * texel)).rgb *  0.0;",
            "vt += texture2D(tex, (uv + vec2( 0.0,  0.0) * texel)).rgb *  0.0;",
            "vt += texture2D(tex, (uv + vec2( 1.0,  0.0) * texel)).rgb *  0.0;",
            "vt += texture2D(tex, (uv + vec2(-1.0,  1.0) * texel)).rgb * -1.0;",
            "vt += texture2D(tex, (uv + vec2( 0.0,  1.0) * texel)).rgb * -2.0;",
            "vt += texture2D(tex, (uv + vec2( 1.0,  1.0) * texel)).rgb * -1.0;",

            "return sqrt(dot(hr, hr) + dot(vt, vt));",
        "}",

        "vec2 wobble(sampler2D tex, vec2 uv) {",
            "return uv + (texture2D(tex, uv).xy - 0.5) * scale;",
        "}",

        "vec4 edgeDarkening(sampler2D tex, vec2 uv) {",
            "vec4 c = texture2D(tex, uv);",
            "return c * (1.0 - (1.0 - c) * (darkening - 1.0));",
        "}",

        "float granulation(sampler2D tex, vec2 uv, float beta) {",
            "vec4 c = texture2D(tex, uv);",
            "float intensity = (c.r + c.g + c.b) / 3.0;",
            "return 1.0 + beta * (intensity - 0.5);",
        "}",

        "void main() {",
            "vec2 uv = vUv;",
            "uv = wobble(tPaper, uv);",

            "float pd = granulation(tPaper, vUv, pigment);", // pigment dispersion

            "float edge = sobel(tDiffuse, uv);",
            "if (edge > threshold) {",
                "gl_FragColor = pd * edgeDarkening(tDiffuse, uv);",
            "} else {",
                "gl_FragColor = pd * texture2D(tDiffuse, uv);",
            "}",
		"}"

	].join("\n")

};
