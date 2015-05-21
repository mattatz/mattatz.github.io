/*
 * index.js
 * */

(function(global, THREE) {

    var app, App = function(id) {
        app = this;
        app.init(id);
    };

    App.prototype = {

        init: function(id) {

            var $dom = $("#" + id);
            var scene = new THREE.Scene();

            var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 1000);
            camera.position.z = 10;

            var renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });
            renderer.setClearColor(0xffffff);
            renderer.setSize(window.innerWidth, window.innerHeight);
            $dom.append(renderer.domElement);

            var size = 1024;
            var composer = new THREE.EffectComposer(renderer, app.getRenderTarget(size, size, THREE.HalfFloatType));

            app.getShader("simple.vert", function(vert) {
                app.getShader("init.frag", function(initFrag) {
                    var initPass = new THREE.ShaderPass({
                        uniforms : {
                            "tDiffuse": { type : "t", value : null },
                            "threshold" : { type : "f", value : 0.5 }
                        },
                        vertexShader : vert,
                        fragmentShader : initFrag
                    }, "tDiffuse");
                    composer.addPass(initPass);
                    composer.render();
                    composer.removePass(initPass);
                    composer.pingpong();

                    app.getShader("gol.frag", function(golFrag) {
                        var pass = new THREE.ShaderPass({
                            uniforms : {
                                "tDiffuse": { type : "t", value : null },
                                "threshold" : { type : "f", value : 0.5 },
                                "dx": { type : "f", value : (1 / size) },
                                "dy": { type : "f", value : (1 / size) }
                            },
                            vertexShader : vert,
                            fragmentShader : golFrag
                        }, "tDiffuse");
                        composer.addPass(pass);
                    });
                });
            });

            var plane = new THREE.Mesh(
                new THREE.PlaneBufferGeometry(10, 10, 1),
                new THREE.MeshBasicMaterial({
                    map: composer.writeBuffer,
                    side: THREE.DoubleSide
                })
            );
            scene.add(plane);

            var clock = new THREE.Clock();
            var trackballControls = new THREE.TrackballControls(camera);

            (function loop() {
                requestAnimationFrame(loop);

                if(composer.passes.length > 0) {
                    composer.render();
                    composer.pingpong();
                }

                renderer.render(scene, camera);
                plane.rotation.set(clock.elapsedTime * 0.1, clock.elapsedTime * 0.1, 0);

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
        },

        getShader: function(name, success) {
            $.ajax({
                type: "GET",
                url: "assets/shaders/" + name,
                dataType: "text",
                success: success,
                error: function() {}
            });
        },

        getRenderTarget: function(width, height, type) {
            return new THREE.WebGLRenderTarget(width, height, {
                wrapS: THREE.RepeatWrapping,
                wrapT: THREE.RepeatWrapping,
                minFilter: THREE.NearestFilter,
                magFilter: THREE.NearestFilter,
                format: THREE.RGBAFormat,
                type: type,
                stencilBuffer: false
            });
        }

    };

    global.App = App;

})(window, THREE);

$(function() {
    var app = new App("viewer");
});

