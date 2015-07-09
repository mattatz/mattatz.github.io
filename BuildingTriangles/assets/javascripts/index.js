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

            var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 10000);
            camera.position.z = 200;

            var renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });
            renderer.setClearColor(0xffffff);
            renderer.setSize(window.innerWidth, window.innerHeight);
            $dom.append(renderer.domElement);

            var cubemap = THREE.ImageUtils.loadTextureCube([
                "assets/textures/cube/px.jpg",
                "assets/textures/cube/nx.jpg",
                "assets/textures/cube/py.jpg",
                "assets/textures/cube/ny.jpg",
                "assets/textures/cube/pz.jpg",
                "assets/textures/cube/nz.jpg"
            ]);
            var shader = THREE.ShaderLib["cube"];
            shader.uniforms["tCube"].value = cubemap;

            var skybox = new THREE.Mesh(
                new THREE.CubeGeometry(5000, 5000, 5000),
                new THREE.ShaderMaterial({
                    vertexShader : shader.vertexShader,
                    fragmentShader : shader.fragmentShader,
                    uniforms : shader.uniforms,
                    depthWrite : false,
                    side : THREE.BackSide
                })
            );
            scene.add(skybox);

            var mesh;
            var wireframe;

            var container = new THREE.Object3D();
            container.scale.set(0.25, 0.25, 0.25);
            scene.add(container);

            var loader = new THREE.OBJLoader();

            loader.load("assets/models/elephant.obj", function(obj) {

                var geometry = obj.children[0].geometry.toGeometry();
                geometry.center();

                app.getShader("triangles.vert", function(vert) {
                    app.getShader("triangles.frag", function(frag) {

                        var size = 512;

                        var skin = THREE.ImageUtils.loadTexture("assets/textures/elephant.jpg");
                        skin.minFilter = THREE.NearestFilter;

                        var noiseUvs = [];
                        for(var i = 0, n = geometry.vertices.length; i < n; i++) {
                            var x = i % size / size;
                            var y = parseInt(i / size) / size;
                            noiseUvs.push(new THREE.Vector2(x, y));
                        }

                        mesh = new THREE.Mesh(
                            geometry, 
                            new THREE.ShaderMaterial({
                                uniforms : {
                                    time                : { type : "f", value : 0.0 },
                                    loop                : { type : "f", value : 2.0 },
                                    speed               : { type : "f", value : 0.25 },
                                    skinTex             : { type : "t", value : skin },
                                    noiseTex            : { type : "t", value : THREE.ImageUtils.loadTexture("assets/textures/noise.png") }
                                },
                                attributes : {
                                    noiseUv             : { type : "v2", value : noiseUvs }
                                },
                                vertexShader : vert,
                                fragmentShader : frag,
                                transparent : true,
                            })
                        );

                        container.add(mesh);
                    });
                });

                app.getShader("wireframe.vert", function(vert) {
                    app.getShader("wireframe.frag", function(frag) {
                        
                        wireframe = new THREE.Mesh(
                            geometry,
                            new THREE.ShaderMaterial({ 
                                vertexShader : vert,
                                fragmentShader : frag,
                                wireframe : true,
                                transparent : true,
                                opacity : 0.5
                            })
                        );

                        container.add(wireframe);
                    });
                });
            });

            var clock = new THREE.Clock();
            var trackballControls = new THREE.TrackballControls(camera);
            trackballControls.maxDistance = 200;

            (function loop() {
                requestAnimationFrame(loop);

                if(mesh) {
                    mesh.material.uniforms.time.value = clock.elapsedTime;
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

