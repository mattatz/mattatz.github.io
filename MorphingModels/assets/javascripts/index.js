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

            var ps;

            var textureIndex = 0;
            var textures = [
                THREE.ImageUtils.loadTexture("assets/textures/256x256/humanFace.png"),
                THREE.ImageUtils.loadTexture("assets/textures/256x256/humanBody.png"),
                THREE.ImageUtils.loadTexture("assets/textures/256x256/elephant.png"),
                THREE.ImageUtils.loadTexture("assets/textures/256x256/tiger.png"),
                THREE.ImageUtils.loadTexture("assets/textures/256x256/butterfly.png")
            ];
            textures = textures.map(function(tex) {
                tex.magFilter = THREE.NearestFilter;
                tex.minFilter = THREE.NearestFilter;
                return tex;
            });

            var step = 5;
            var size = 256;

            app.getShader("particle.vert", function(vert) {
                app.getShader("particle.frag", function(frag) {

                    var geometry = new THREE.Geometry();
                    var uv = [];
                    for(var y = 0; y < size; y++) {
                        var ry = y / size;
                        for(var x = 0; x < size; x++) {
                            geometry.vertices.push(
                                new THREE.Vector3(
                                    (Math.random() - 0.5) * 100,
                                    (Math.random() - 0.5) * 100,
                                    (Math.random() - 0.5) * 100
                                )
                            );
                            uv.push(new THREE.Vector2(x / size, ry));
                        }
                    }

                    ps = new THREE.PointCloud(
                        geometry,
                        new THREE.ShaderMaterial({
                            uniforms : {
                                pointSize           : { type : "f",     value : 1 },
                                scale               : { type : "v3",    value : new THREE.Vector3(10, 10, 2) },
                                time                : { type : "f",     value : 0.0 },
                                texture0            : { type : "t",     value : textures[textureIndex % textures.length] },
                                texture1            : { type : "t",     value : textures[(textureIndex + 1) % textures.length] },
                                t                   : { type : "f",     value : 0.0 },
                                px                  : { type : "f",     value : 1 / size }
                            },
                            attributes : {
                                "vuv" : { type : "v2", value : uv }
                            },
                            vertexShader : vert,
                            fragmentShader : frag
                        })
                    );
                    scene.add(ps);
                });
            });

            var clock = new THREE.Clock();
            var trackballControls = new THREE.TrackballControls(camera);

            (function loop() {
                requestAnimationFrame(loop);

                if(ps) {
                    textureIndex = parseInt(clock.elapsedTime / step);
                    ps.material.uniforms.texture0.value = textures[textureIndex % textures.length];
                    ps.material.uniforms.texture1.value = textures[(textureIndex + 1) % textures.length];
                    ps.material.uniforms.time.value = clock.elapsedTime;
                    ps.material.uniforms.t.value = (clock.elapsedTime % step) / step;
                    // ps.rotation.set(clock.elapsedTime * 0.1, clock.elapsedTime * 0.1, 0);
                }

                renderer.render(scene, camera);

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

    };

    global.App = App;

})(window, THREE);

$(function() {
    var app = new App("viewer");
});

