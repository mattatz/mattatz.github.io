/*
 * index.js
 * */

(function(global, THREE) {

    function createBuffer(width, height, type, format) {
        return new THREE.WebGLRenderTarget(width, height, {
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: format || THREE.RGBAFormat,
            type: type,
            stencilBuffer: false
        });
    }

    function FboPingPong(width, height, type, format) {
        this.readBufferIndex = 0;
        this.writeBufferIndex = 1;
        this.buffers = [
            createBuffer(width, height, type, format),
            createBuffer(width, height, type, format)
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

            var width = height = depth = 32 << 1;
            var textureSizeW = width * depth;
            var textureSizeH = height;

            var px = { type : "v3", value : new THREE.Vector3(1 / textureSizeW, 1 / textureSizeH, 1 / depth) };

            // var type = THREE.FloatType; // THREE.FloatType is not supported on iOS
            var type = THREE.HalfFloatType;
            var format = THREE.RGBFormat;
            var fboVelocityPP = new FboPingPong(textureSizeW, textureSizeH, type, format);
            var fboPressurePP = new FboPingPong(textureSizeW, textureSizeH, type, format);
            var fboDivergence = createBuffer(textureSizeW, textureSizeH, type, format);

            var advect;
            var divergence;
            var jacobi;
            var subtractPressureGradient;

            var texture = THREE.ImageUtils.loadTexture("assets/textures/particle.jpg");

            app.loadShader("particle.vert", function(vert) {
                app.loadShader("particle.frag", function(frag) {

                    var geometry = new THREE.Geometry();
                    var uv = [];
                    for(var y = 0; y < textureSizeH; y++) {
                        var ry = y / textureSizeH;
                        for(var x = 0; x < textureSizeW; x++) {
                            geometry.vertices.push(new THREE.Vector3());
                            uv.push(new THREE.Vector2(x / textureSizeW, ry));
                        }
                    }

                    var ps = new THREE.PointCloud(
                        geometry,
                        new THREE.ShaderMaterial({
                            uniforms : {
                                pointSize   : { type : "f", value : 3.0 },
                                px          : px,
                                pressure    : { type : "t", value : fboPressurePP.getReadBuffer() },
                                velocity    : { type : "t", value : fboVelocityPP.getWriteBuffer() },
                                particle    : { type : "t", value : texture },
                            },
                            attributes : {
                                "vuv" : { type : "v2", value : uv }
                            },
                            vertexShader : vert,
                            fragmentShader : frag,
                            transparent : true,
                            depthTest : false
                        })
                    );
                    ps.scale.set(2, 2, 2);
                    scene.add(ps);

                });
            });

            var clock = new THREE.Clock();
            var trackballControls = new THREE.TrackballControls(camera);
            trackballControls.minDistance = 2;
            trackballControls.maxDistance = 8;

            var render = function(material, writeBuffer) {
                quadRTT.material = material;
                renderer.render(sceneRTT, cameraRTT, writeBuffer, false);
            };

            var start = function(kernel, advect, divergence, jacobi, subtractPressureGradient) {

                advect = new THREE.ShaderMaterial({
                    uniforms : {
                        velocity : { type : "t", value : fboVelocityPP.getReadBuffer() },
                        px       : px,
                        interaction : { type : "i", value : 0 },
                        radius   : { type : "f",  value  : 0.05 }
                    },
                    vertexShader : kernel,
                    fragmentShader : advect
                });

                divergence = new THREE.ShaderMaterial({
                    uniforms : {
                        velocity : { type : "t", value : fboVelocityPP.getWriteBuffer() },
                        px       : px,
                    },
                    vertexShader : kernel,
                    fragmentShader : divergence
                });

                jacobi = new THREE.ShaderMaterial({
                    uniforms : {
                        pressure    : { type : "t", value : fboPressurePP.getReadBuffer() },
                        divergence  : { type : "t", value : fboDivergence },
                        px          : px
                    },
                    vertexShader : kernel,
                    fragmentShader : jacobi
                });

                subtractPressureGradient = new THREE.ShaderMaterial({
                    uniforms : {
                        pressure    : { type : "t", value : fboPressurePP.getReadBuffer() },
                        velocity    : { type : "t", value : fboVelocityPP.getWriteBuffer() },
                        px          : px,
                    },
                    vertexShader : kernel,
                    fragmentShader : subtractPressureGradient
                });

                var interaction = false;

                var interact = function(e) {
                    interaction = true;
                };

                var release = function(e) {
                    interaction = false;
                };

                document.addEventListener('mousedown', interact);
                document.addEventListener('mouseup', release);

                document.addEventListener('touchstart', interact);
                document.addEventListener('touchend', release);

                (function loop() {
                    requestAnimationFrame(loop);

                    advect.uniforms.interaction.value = interaction ? 1 : 0;

                    render(advect, fboVelocityPP.getWriteBuffer());
                    render(divergence, fboDivergence);

                    for(var i = 0; i < 5; i++) {
                        render(jacobi, fboPressurePP.getWriteBuffer());
                        fboPressurePP.swap();
                        jacobi.uniforms.pressure.value = fboPressurePP.getReadBuffer();
                    }

                    render(subtractPressureGradient, fboVelocityPP.getReadBuffer());

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
    };

    global.App = App;

})(window, THREE);

$(function() {
    var app = new App("viewer");
});

