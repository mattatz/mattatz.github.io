/*
 * index.js
 * */

(function(global, THREE) {

    THREE.Geometry.prototype.disperse = function() {
        var geometry = new THREE.Geometry();
        geometry.faceVertexUvs = this.faceVertexUvs;

        var idx = 0;

        for(var i = 0, n = this.faces.length; i < n; i++) {
            var face = this.faces[i];

            var v0 = this.vertices[face.a].clone();
            var v1 = this.vertices[face.b].clone();
            var v2 = this.vertices[face.c].clone();

            geometry.vertices.push(v0, v1, v2);

            var nface = new THREE.Face3(idx, idx + 1, idx + 2, face.normal);
            nface.vertexNormals = face.vertexNormals;
            geometry.faces.push(nface);
            idx += 3;
        }

        return geometry;
    };

    var app, App = function(id) {
        app = this;
        app.init(id);
    };

    App.prototype = {

        init: function(id) {

            var $dom = $("#" + id);
            var scene = new THREE.Scene();

            var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 10000);
            camera.position.z = 10;

            var renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });
            renderer.setClearColor(0xffffff);
            renderer.setSize(window.innerWidth, window.innerHeight);
            $dom.append(renderer.domElement);

            var mesh;
            var wireframe;

            var container = new THREE.Object3D();
            scene.add(container);

            var origin = new THREE.SphereGeometry(5, 32, 32).disperse();
            var geometry = (new THREE.BufferGeometry()).fromGeometry(origin);

            var vertexCount = geometry.attributes.position.count;
            var seeds = new Float32Array(vertexCount);
            for(var i = 0, n = vertexCount; i < n; i += 3) {
                var r = Math.random();
                seeds[i + 0] = r;
	            seeds[i + 1] = r;
                seeds[i + 2] = r;
            }

            geometry.addAttribute('seed', new THREE.BufferAttribute(seeds, 1));

            var invMatrix = new THREE.Matrix4();
            app.getShader("triangles.vert", function(vert) {
                app.getShader("triangles.frag", function(frag) {
                    mesh = new THREE.Mesh(
                        geometry, 
                        new THREE.ShaderMaterial({
                            uniforms : {
                                time                : { type : "f", value : 0.0 },
                                loop                : { type : "f", value : 2.0 },
                                speed               : { type : "f", value : 0.25 },
                                noiseTex            : { type : "t", value : THREE.ImageUtils.loadTexture("assets/textures/noise.png") },
                                radius              : { type : "f", value : 10.0 },
                                invMatrix           : { type : "m4", value : invMatrix }
                            },
                            vertexShader : vert,
                            fragmentShader : frag,
                            transparent : true
                        })
                    );
                    container.add(mesh);
                });
            });

            app.getShader("wireframe.vert", function(vert) {
                app.getShader("wireframe.frag", function(frag) {
                    wireframe = new THREE.Mesh(
                        origin,
                        new THREE.ShaderMaterial({ 
                            vertexShader : vert,
                            fragmentShader : frag,
                            wireframe : true
                        })
                    );
                    container.add(wireframe);
                });
            });

            var clock = new THREE.Clock();
            var trackballControls = new THREE.TrackballControls(camera);
            trackballControls.minDistance = 7.5;
            trackballControls.maxDistance = 20;

            (function loop() {
                requestAnimationFrame(loop);

                if(mesh) {
                    invMatrix.getInverse(mesh.matrix);
                    mesh.material.uniforms.time.value = clock.elapsedTime;
                    mesh.material.uniforms.invMatrix.value = invMatrix;
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

