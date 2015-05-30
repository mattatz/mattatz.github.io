/*
 * index.js
 * */

(function(global, THREE) {

    function FboPingPong(width, height, type) {
        this.readBufferIndex = 0;
        this.writeBufferIndex = 1;
        this.buffers = [
            this.createBuffer(width, height, type),
            this.createBuffer(width, height, type)
        ];
    }

    FboPingPong.prototype = {

        getReadBuffer : function() {
            return this.buffers[this.readBufferIndex];
        },

        getWriteBuffer : function() {
            return this.buffers[this.writeBufferIndex];
        },

        swap : function() {
            var tmp = this.buffers[this.writeBufferIndex];
            this.buffers[this.writeBufferIndex] = this.buffers[this.readBufferIndex];
            this.buffers[this.readBufferIndex] = tmp;
        },

        createBuffer : function(width, height, type) {
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
            // renderer.setClearColor(0xffffff);
            renderer.setClearColor(0x000000);
            renderer.setSize(window.innerWidth, window.innerHeight);
            $dom.append(renderer.domElement);

            var sphere = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32), new THREE.MeshNormalMaterial({}));
            // scene.add(sphere);

            var sceneRTT = new THREE.Scene();
            var cameraRTT = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
            var quadRTT = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
            sceneRTT.add(quadRTT);

            var blit = function(material, writeBuffer) {
                quadRTT.material = material;
                renderer.render(sceneRTT, cameraRTT, writeBuffer, false);
            };

            var ps;

            var size = 256;
            // var size = 512;

            var type = THREE.HalfFloatType;
            // var type = THREE.FloatType;
            var fboAccelerationPP = new FboPingPong(size, size, type);
            var fboVelocityPP = new FboPingPong(size, size, type);
            var fboPositionPP = new FboPingPong(size, size, type);

            // var space = new THREE.Vector3(10, 10, 10);
            var space = new THREE.Vector3(5, 5, 5);
            var force;
            var acceleration;
            var velocity;
            var clear;

            this.loadShaders([
                "particle.vert",
                "particle.frag",
                "kernel.vert",
                "force.frag",
                "acceleration.frag",
                "velocity.frag",
                "position.frag",
                "clear.frag",
            ], function(shaders) {

                var scale = { type : "v3", value : space };
                var time = { type : "f", value : 0.0 };
                var seed = { type : "f", value : Math.random() };
                var dt = { type : "f", value : 0.0 };

                force = new THREE.ShaderMaterial({
                    uniforms : {
                        accelerationTex    : { type : "t", value : fboAccelerationPP.getReadBuffer() },
                        positionTex        : { type : "t", value : fboPositionPP.getReadBuffer() },
                        attractor          : { type : "v3", value : new THREE.Vector3(0.5, 0.5, 0.5) },
                        scale              : scale,
                        time               : time,
                        dt                 : dt,
                        seed               : seed,
                        inverse            : { type : "i", value : 0 }
                    },
                    vertexShader : shaders[2],
                    fragmentShader : shaders[3]
                });

                acceleration = new THREE.ShaderMaterial({
                    uniforms : {
                        accelerationTex    : { type : "t", value : fboAccelerationPP.getReadBuffer() },
                        velocityTex        : { type : "t", value : fboVelocityPP.getReadBuffer() },
                        scale              : scale,
                        time               : time,
                        dt                 : dt,
                        seed               : seed
                    },
                    vertexShader : shaders[2],
                    fragmentShader : shaders[4]
                });

                velocity = new THREE.ShaderMaterial({
                    uniforms : {
                        accelerationTex    : { type : "t", value : fboAccelerationPP.getReadBuffer() },
                        velocityTex        : { type : "t", value : fboVelocityPP.getReadBuffer() },
                        positionTex        : { type : "t", value : fboPositionPP.getReadBuffer() },
                        scale              : scale,
                        time               : time,
                        dt                 : dt,
                        seed               : seed
                    },
                    vertexShader : shaders[2],
                    fragmentShader : shaders[5]
                });
                
                clear = new THREE.ShaderMaterial({
                    uniforms : {
                    },
                    vertexShader : shaders[2],
                    fragmentShader : shaders[shaders.length - 1]
                });

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
                            positionTex         : { type : "t", value : fboPositionPP.getReadBuffer() },
                            pointSize           : { type : "f",     value : 1 },
                            scale               : scale,
                            time                : time,
                            px                  : { type : "f",     value : 1 / size }
                        },
                        attributes : {
                            "vuv" : { type : "v2", value : uv }
                        },
                        vertexShader : shaders[0],
                        fragmentShader : shaders[1] 
                    })
                );
                scene.add(ps);

            });

            var clock = new THREE.Clock();
            var trackballControls = new THREE.TrackballControls(camera);
            trackballControls.minDistance = 1.0;
            trackballControls.maxDistance = 150.0;

            var dt = 0.1;
            var mspace = space.clone().divideScalar(2.0);

            document.addEventListener('mousedown', function(e) {
                force.uniforms.inverse.value = 1;
            });

            document.addEventListener('touchstart', function(e) {
                force.uniforms.inverse.value = 1;
            });

            document.addEventListener('mouseup', function(e) {
                force.uniforms.inverse.value = 0;
            });

            document.addEventListener('touchend', function(e) {
                force.uniforms.inverse.value = 0;
            });

            (function loop() {
                requestAnimationFrame(loop);

                var t = clock.elapsedTime * 0.25;
                // sphere.position.set(Math.cos(t) * space.x, Math.sin(t) * space.y, Math.sin(t) * space.z);
                sphere.position.set(Math.cos(t) * mspace.x, Math.sin(t) * mspace.y, Math.sin(t) * mspace.z);

                if(ps) {

                    // apply force
                    
                    force.uniforms.accelerationTex.value = fboAccelerationPP.getReadBuffer();
                    force.uniforms.positionTex.value = fboPositionPP.getReadBuffer();
                    force.uniforms.time.value = clock.elapsedTime;
                    // force.uniforms.attractor.value = new THREE.Vector3(Math.cos(clock.elapsedTime) * 0.5 + 0.5, Math.sin(clock.elapsedTime) * 0.5 + 0.5, 0.);
                    force.uniforms.attractor.value = new THREE.Vector3(sphere.position.x / space.x * 0.5 + 0.5, sphere.position.y / space.y * 0.5 + 0.5, sphere.position.z / space.z * 0.5 + 0.5);
                    force.uniforms.dt.value = dt;
                    blit(force, fboAccelerationPP.getWriteBuffer());
                    fboAccelerationPP.swap();

                    // update velocity
                    acceleration.uniforms.accelerationTex.value = fboAccelerationPP.getReadBuffer();
                    acceleration.uniforms.velocityTex.value = fboVelocityPP.getReadBuffer();
                    acceleration.uniforms.time.value = clock.elapsedTime;
                    acceleration.uniforms.dt.value = dt;
                    blit(acceleration, fboVelocityPP.getWriteBuffer());
                    fboVelocityPP.swap();

                    // update position
                    velocity.uniforms.accelerationTex.value = fboAccelerationPP.getReadBuffer();
                    velocity.uniforms.velocityTex.value = fboVelocityPP.getReadBuffer();
                    velocity.uniforms.positionTex.value = fboPositionPP.getReadBuffer();
                    velocity.uniforms.time.value = clock.elapsedTime;
                    velocity.uniforms.dt.value = dt;
                    blit(velocity, fboPositionPP.getWriteBuffer());
                    fboPositionPP.swap();

                    ps.material.uniforms.positionTex.value = fboPositionPP.getReadBuffer();

                    blit(clear, fboAccelerationPP.getReadBuffer());
                }

                renderer.render(scene, camera);

                trackballControls.update(clock.getDelta());
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

        loadShaders : function(names, success) {
            var req = function(name) {
                var d = $.Deferred();
                app.loadShader(name, function(shader) {
                    d.resolve(shader);
                });
                return d;
            };

            $.when.apply($, names.map(function(name) { return req(name); })).done(function(s1, s2, s3) {
                if(success) success(arguments);
            });
        },

        loadShader: function(name, success) {
            return $.ajax({
                type: "GET",
                url: "assets/shaders/" + name,
                dataType: "text",
                success: function(shader) {
                    if(success) success(shader);
                },
                error: function() {
                }
            });
        },

    };

    global.App = App;

})(window, THREE);

$(function() {
    var app = new App("viewer");
});

