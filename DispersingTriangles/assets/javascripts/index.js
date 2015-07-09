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
                // wrapS: THREE.RepeatWrapping,
                // wrapT: THREE.RepeatWrapping,
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
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

            var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 5000);
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

            var sceneRTT = new THREE.Scene();
            var cameraRTT = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
            var quadRTT = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
            sceneRTT.add(quadRTT);

            var blit = function(material, writeBuffer) {
                quadRTT.material = material;
                renderer.render(sceneRTT, cameraRTT, writeBuffer, false);
            };

            var mesh;

            var type = THREE.HalfFloatType;
            // var type = THREE.FloatType;
            var fboAccelerationPP, fboVelocityPP, fboPositionPP;
            var space = new THREE.Vector3(5, 5, 5);
            var force;
            var acceleration;
            var velocity;
            var clear;

            var clock = new THREE.Clock();
            var elapsedTimeBeforeLoad = 0;
            var waitTime = 5.0;

            this.loadShaders([
                "kernel.vert",
                "force.frag",
                "acceleration.frag",
                "velocity.frag",
                "position.frag",
                "triangles.vert",
                "triangles.frag",
                "clear.frag"
            ], function(shaders) {

                var scale = { type : "v3", value : space };
                var time = { type : "f", value : 0.0 };
                var seed = { type : "f", value : Math.random() };
                var dt = { type : "f", value : 0.0 };

                var loader = new THREE.OBJLoader();

                loader.load("assets/models/elephant.obj", function(obj) {

                    var geometry = obj.children[0].geometry.toGeometry();
                    geometry.center();

                    var facesLength = geometry.faces.length;
                    var size = Math.ceil(Math.sqrt(facesLength));

                    fboAccelerationPP = new FboPingPong(size, size, type);
                    fboVelocityPP = new FboPingPong(size, size, type);
                    fboPositionPP = new FboPingPong(size, size, type);

                    var skin = THREE.ImageUtils.loadTexture("assets/textures/elephant.jpg");
                    skin.minFilter = THREE.NearestFilter;

                    var noiseUvs = [];
                    for(var i = 0, n = geometry.vertices.length; i < n; i++) {
                        var x = i % 512 / 512;
                        var y = parseInt(i / 512) / 512;
                        noiseUvs.push(new THREE.Vector2(x, y));
                    }

                    var centers = [];
                    var vertices = geometry.vertices;
                    var faces = geometry.faces;
                    var simulationUvs = [];

                    for(var i = 0, n = faces.length; i < n; i++) {
                        var f = faces[i];
                        var a = vertices[f.a];
                        var b = vertices[f.b];
                        var c = vertices[f.c];
                        var center = new THREE.Vector3(a.x + b.x + c.x, a.y + b.y + c.y, a.z + b.z + c.z);
                        center.divideScalar(3);

                        centers.push(center);
                        centers.push(center);
                        centers.push(center);

                        var simUv = new THREE.Vector2((i % size) / size, (i / size) / size);
                        simulationUvs.push(simUv);
                        simulationUvs.push(simUv);
                        simulationUvs.push(simUv);
                    }

                    mesh = new THREE.Mesh(
                        geometry, 
                        new THREE.ShaderMaterial({
                            uniforms : {
                                time                : { type : "f", value : 0.0 },
                                skinTex             : { type : "t", value : skin },
                                noiseTex            : { type : "t", value : THREE.ImageUtils.loadTexture("assets/textures/noise.png") },
                                positionTex         : { type : "t", value : fboPositionPP.getReadBuffer() }
                            },
                            attributes : {
                                noiseUv             : { type : "v2", value : noiseUvs },
                                simulationUv        : { type : "v2", value : simulationUvs },
                                center              : { type : "v3", value : centers  }
                            },
                            vertexShader : shaders[5],
                            fragmentShader : shaders[6]
                        })
                    );

                    mesh.scale.set(0.25, 0.25, 0.25);
                    scene.add(mesh);

                    force = new THREE.ShaderMaterial({
                        uniforms : {
                            accelerationTex    : { type : "t", value : fboAccelerationPP.getReadBuffer() },
                            positionTex        : { type : "t", value : fboPositionPP.getReadBuffer() },
                            scale              : scale,
                            time               : time,
                            dt                 : dt,
                            seed               : seed,
                        },
                        vertexShader : shaders[0],
                        fragmentShader : shaders[1]
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
                        vertexShader : shaders[0],
                        fragmentShader : shaders[2]
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
                        vertexShader : shaders[0],
                        fragmentShader : shaders[3]
                    });
                    
                    clear = new THREE.ShaderMaterial({
                        uniforms : {
                        },
                        vertexShader : shaders[0],
                        fragmentShader : shaders[shaders.length - 1]
                    });

                    // init
                    elapsedTimeBeforeLoad = clock.elapsedTime;
                    simulate(0.0, 0.0);
                });

            });

            var trackballControls = new THREE.TrackballControls(camera);
            trackballControls.minDistance = 1.0;
            trackballControls.maxDistance = 200.0;

            var dt = 0.1;

            var simulate = function(t, dt) {
                // apply force
                
                force.uniforms.accelerationTex.value = fboAccelerationPP.getReadBuffer();
                force.uniforms.positionTex.value = fboPositionPP.getReadBuffer();
                force.uniforms.time.value = t;
                force.uniforms.dt.value = dt;
                blit(force, fboAccelerationPP.getWriteBuffer());
                fboAccelerationPP.swap();

                // update velocity
                acceleration.uniforms.accelerationTex.value = fboAccelerationPP.getReadBuffer();
                acceleration.uniforms.velocityTex.value = fboVelocityPP.getReadBuffer();
                acceleration.uniforms.time.value = t;
                acceleration.uniforms.dt.value = dt;
                blit(acceleration, fboVelocityPP.getWriteBuffer());
                fboVelocityPP.swap();

                // update position
                velocity.uniforms.accelerationTex.value = fboAccelerationPP.getReadBuffer();
                velocity.uniforms.velocityTex.value = fboVelocityPP.getReadBuffer();
                velocity.uniforms.positionTex.value = fboPositionPP.getReadBuffer();
                velocity.uniforms.time.value = t;
                velocity.uniforms.dt.value = dt;
                blit(velocity, fboPositionPP.getWriteBuffer());
                fboPositionPP.swap();
            };

            (function loop() {
                requestAnimationFrame(loop);

                var t = clock.elapsedTime - elapsedTimeBeforeLoad - waitTime;

                if(mesh && t >= 0.0) {
                    simulate(t, dt);
                    mesh.material.uniforms.positionTex.value = fboPositionPP.getReadBuffer();
                    mesh.material.uniforms.time.value = t;
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

