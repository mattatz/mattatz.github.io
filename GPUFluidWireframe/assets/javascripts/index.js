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

        init : function(id) {

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

            var sceneRTT = new THREE.Scene();
            var cameraRTT = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
            var quadRTT = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
            sceneRTT.add(quadRTT);

            var size = 128;

            // THREE.FloatType is not supported on iOS8.3
            var fboVelocityPP = new FboPingPong(size, size, THREE.HalfFloatType);
            var fboPressurePP = new FboPingPong(size, size, THREE.HalfFloatType);
            var fboDivergence = this.getRenderTarget(size, size, THREE.HalfFloatType);
            var fboVisualize = this.getRenderTarget(size, size, THREE.HalfFloatType);

            var advect;
            var divergence;
            var jacobi;
            var subtractPressureGradient;
            var visualize;

            var planeSize = 10;
            var plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(planeSize, planeSize, size, size), new THREE.MeshBasicMaterial({ color: 0xffffff }));

            app.loadShader("water.vert", function(vert) {
                app.loadShader("water.frag", function(frag) {
                    plane.material = new THREE.ShaderMaterial({
                        uniforms : {
                            pressure : { type : "t", value : fboPressurePP.getReadBuffer() }
                        },
                        vertexShader : vert,
                        fragmentShader : frag,
                        wireframe : true,
                        side : THREE.DoubleSide
                    });
                });
            });

            scene.add(plane);

            var clock = new THREE.Clock();
            var trackballControls = new THREE.TrackballControls(camera);

            var blit = function(material, writeBuffer) {
                quadRTT.material = material;
                renderer.render(sceneRTT, cameraRTT, writeBuffer, false);
            };

            var start = function(kernel, advect, divergence, jacobi, subtractPressureGradient) {

                var px = { type : "v2", value : new THREE.Vector2(1 / size, 1 / size) };

                advect = new THREE.ShaderMaterial({
                    uniforms : {
                        velocity : { type : "t", value : fboVelocityPP.getReadBuffer() },
                        px       : px,
                        mouse    : { type : "v2", value : new THREE.Vector2(0.5, 0.5) },
                        force    : { type : "v2", value : new THREE.Vector2(1, 1) },
                        radius   : { type : "f",  value  : 0.05 }
                    },
                    vertexShader : kernel,
                    fragmentShader : advect
                });

                divergence = new THREE.ShaderMaterial({
                    uniforms : {
                        velocity : { type : "t", value : fboVelocityPP.getWriteBuffer() },
                        px       : px
                    },
                    vertexShader : kernel,
                    fragmentShader : divergence
                });

                jacobi = new THREE.ShaderMaterial({
                    uniforms : {
                        pressure    : { type : "t", value : fboPressurePP.getReadBuffer() },
                        divergence  : { type : "t", value : fboDivergence },
                        px          : px,
                        alpha       : { type : "f", value : -1.0 },
                        beta        : { type : "f", value : 0.25 }
                    },
                    vertexShader : kernel,
                    fragmentShader : jacobi
                });

                subtractPressureGradient = new THREE.ShaderMaterial({
                    uniforms : {
                        pressure    : { type : "t", value : fboPressurePP.getReadBuffer() },
                        velocity    : { type : "t", value : fboVelocityPP.getWriteBuffer() },
                        px          : px
                    },
                    vertexShader : kernel,
                    fragmentShader : subtractPressureGradient
                });

                var mouse = new THREE.Vector2(0, 0);
                var x0 = 0, y0 = 0;

                var updateMousePosition = function(e) {
                    mouse.x = (e.pageX / window.innerWidth) * 2 - 1;
                    mouse.y = - (e.pageY / window.innerHeight) * 2 + 1;
                };

                var raycaster = new THREE.Raycaster();

                document.addEventListener('mousemove', updateMousePosition);
                document.addEventListener('touchstart', updateMousePosition);
                document.addEventListener('touchmove', updateMousePosition);

                (function loop() {
                    requestAnimationFrame(loop);

                    raycaster.setFromCamera(mouse, camera);

                    var intersect = raycaster.intersectObject(plane);
                    if(intersect.length > 0) {
                        // normalize to uv
                        var x = (intersect[0].point.x + planeSize * 0.5) / planeSize;
                        var y = (intersect[0].point.y + planeSize * 0.5) / planeSize;

                        advect.uniforms.mouse.value = new THREE.Vector2(x, y);
                        advect.uniforms.force.value = new THREE.Vector2(
                            (x - x0) * 300,
                            (y - y0) * 300
                        );

                        x0 = x;
                        y0 = y;
                    } else {
                        advect.uniforms.force.value = new THREE.Vector2(0, 0);
                    }

                    blit(advect, fboVelocityPP.getWriteBuffer());
                    blit(divergence, fboDivergence);

                    for(var i = 0; i < 6; i++) {
                        blit(jacobi, fboPressurePP.getWriteBuffer());
                        fboPressurePP.swap();
                        jacobi.uniforms.pressure.value = fboPressurePP.getReadBuffer();
                    }

                    blit(subtractPressureGradient, fboVelocityPP.getReadBuffer());

                    renderer.render(scene, camera);

                    var delta = clock.getDelta();
                    trackballControls.update(delta);
                })();

            };

            this.loadShaders([
                "kernel.vert",
                "advect.frag",
                "divergence.frag",
                "jacobi.frag",
                "subtractPressureGradient.frag",
            ], function(shaders) {
                start(shaders[0], shaders[1], shaders[2], shaders[3], shaders[4]);
            });

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

