/*
 * index.js
 * */

THREE.CelShading = {

    uniforms: {
        "dirLightPos"   : { type: "v3", value: new THREE.Vector3() },
        "dirLightColor" : { type: "c", value: new THREE.Color( 0xffffff ) },
        "color"         : { type: "c", value: new THREE.Color( 0xffffff ) },
        "kd"            : { type: "f", value: 0.9 }
    },

    vertexShader: [
        "varying vec3 vNormal;",
        "void main() {",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
            "vNormal = normalize( normalMatrix * normal );",
        "}"

    ].join("\n"),

    fragmentShader: [

        "uniform vec3 color;",
        "uniform vec3 dirLightPos;",
        "uniform vec3 dirLightColor;",

        "uniform float kd;",

        "varying vec3 vNormal;",

        "void main() {",

            // compute direction to light
            "vec3 lightDir = normalize( ( viewMatrix * vec4( dirLightPos, 0.0 ) ).xyz );",

            // diffuse: N * L. Normal must be normalized, since it's interpolated.
            "float diffuse = dot( normalize(vNormal), lightDir );",

            "if ( diffuse > 0.7 ) { diffuse = 1.0; }",
            "else if ( diffuse > 0.1 ) { diffuse = 0.7; }",
            "else { diffuse = 0.2; }",

            "gl_FragColor = vec4( kd * color * dirLightColor * diffuse, 1.0 );",

        "}"

    ].join("\n")

};

(function(global, $) {

    var app, App = function(id) {
        app = this;
        app.init(id);
    };

    App.prototype = {

        init : function(id) {

            var $dom = $("#" + id);

            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 1000);
            camera.position.z = 100;

            var renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });
            renderer.setClearColor(0xffffff);
            renderer.setSize(window.innerWidth, window.innerHeight);
            $dom.append(renderer.domElement);

            var light = new THREE.DirectionalLight( 0xffffff );
            light.position.set( 1, 1, 1 );
            scene.add( light );

            var loader = new THREE.OBJLoader();

            var mesh;

            loader.load("assets/models/elephant.obj", function(obj) {
                mesh = obj.children[0];
                mesh.geometry.center();
                mesh.scale.set(0.1, 0.1, 0.1);

                var q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, -1, 0), Math.PI * 0.25);
                mesh.rotation.setFromQuaternion(q);

                mesh.material = new THREE.ShaderMaterial(THREE.CelShading);
                mesh.material.uniforms["dirLightPos"].value = light.position;
                mesh.material.uniforms["color"].value = new THREE.Color(0xffc100);
                scene.add(mesh);
            });

            var clock = new THREE.Clock();
            var trackballControls = new THREE.TrackballControls(camera, renderer.domElement);
            trackballControls.minDistance = 10.0;
            trackballControls.maxDistance = 200.0;

            var composer = new THREE.EffectComposer(renderer);
            composer.addPass(new THREE.RenderPass(scene, camera));

            var paper = new THREE.ImageUtils.loadTexture("./assets/textures/paper.png");
            var noise = new THREE.ImageUtils.loadTexture("./assets/textures/fractal.jpg");

            var waterColorPass = new THREE.WaterColorPass(paper, noise);
            waterColorPass.renderToScreen = true;
			composer.addPass( waterColorPass );

            var effectController = {
                scale: 		0.03,
                threshold:	0.7,
                darkening:	1.75,
                pigment:	1.2
            };

            var matChanger = function() {
                waterColorPass.uniforms[ "scale" ].value = effectController.scale;
				waterColorPass.uniforms[ "threshold" ].value = effectController.threshold;
				waterColorPass.uniforms[ "darkening" ].value = effectController.darkening;
				waterColorPass.uniforms[ "pigment" ].value = effectController.pigment;
            };

            var gui = new dat.GUI();
			gui.add( effectController, "scale", 0.0, 0.2, 0.001 ).onChange( matChanger );
			gui.add( effectController, "threshold", 0.0, 1.0, 0.025 ).onChange( matChanger );
			gui.add( effectController, "darkening", 0.0, 3.0, 0.025 ).onChange( matChanger );
			gui.add( effectController, "pigment", 0.0, 3.0, 0.025 ).onChange( matChanger );
			gui.close();

            (function loop() {

                requestAnimationFrame(loop);

                composer.render();

                if(mesh) {
                    var q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), clock.elapsedTime * 0.05);
                    mesh.rotation.setFromQuaternion(q);
                }

                var delta = clock.getDelta();
                trackballControls.update(delta);
            })();

            var updateRendererSize = function() {
                var w = window.innerWidth;
                var h = window.innerHeight;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            };
            $(window).on('resize', updateRendererSize);
        }

    };

    global.App = App;

})(window, jQuery);

$(function() {
    var app = new App("viewer");
});

