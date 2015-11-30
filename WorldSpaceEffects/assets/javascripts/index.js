/*
 * index.js
 * */

(function(global, THREE) {

    function createBuffer(width, height, opt) {
        opt = opt || {};
        return new THREE.WebGLRenderTarget(width, height, {
            wrapS: opt.wrapS || THREE.ClampToEdgeWrapping,
            wrapT: opt.wrapT || THREE.ClampToEdgeWrapping,
            minFilter: opt.minFilter || THREE.NearestFilter,
            magFilter: opt.magFilter || THREE.NearestFilter,
            format: opt.format || THREE.RGBAFormat,
            type: opt.type || THREE.FloatType,
            stencilBuffer: opt.stencilBuffer || false
        });
    }

    function FboPingPong(width, height, opt) {
        this.readBufferIndex = 0;
        this.writeBufferIndex = 1;
        this.buffers = [
            createBuffer(width, height, opt),
            createBuffer(width, height, opt)
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

            var head;

            var start = function(vert, frag) {
                var loader = new THREE.OBJLoader();
                loader.load("assets/models/head.obj", function(obj) {
                    var geometry = obj.children[0].geometry;
                    geometry.center();
                    head = new THREE.Mesh(
                        geometry,
                        new THREE.ShaderMaterial({
                            vertexShader : vert,
                            fragmentShader : frag,
                            uniforms : {
                                time : { type : "f", value : 0.0 },
                                mode : { type : "i", value : 0 },
                                speed : { type : "f", value : 0.5 },
                                fineness : { type : "f", value : 0.2 }
                            }
                        })
                    );
                    head.scale.set(15, 15, 15);
                    scene.add(head);
                });
            };

            var clock = new THREE.Clock();
            var trackballControls = new THREE.TrackballControls(camera, renderer.domElement);
            trackballControls.minDistance = 4;
            trackballControls.maxDistance = 20;

            var effectController = {
                mode : 0,
                fineness : 0.2,
                speed : 0.5
            };

            var modeCount = 5;

            var matChanger = function() {
                if(head) {
                    head.material.uniforms.mode.value = effectController.mode;
                    head.material.uniforms.fineness.value = effectController.fineness;
                    head.material.uniforms.speed.value = effectController.speed;
                }
            };

            var gui = new dat.GUI();
			gui.add(effectController, "mode", 0, modeCount - 1).listen().onChange(matChanger);
			gui.add(effectController, "fineness", 0.05, 0.80, 0.001).onChange(matChanger);
			gui.add(effectController, "speed", 0.0, 5.0, 0.01).onChange(matChanger);
			// gui.close();

            var composer = new THREE.EffectComposer(renderer);
            composer.addPass(new THREE.RenderPass(scene, camera));

            var film = new THREE.FilmPass(0.75, 0, 0, false);
            composer.addPass(film);

            var glitch = new THREE.GlitchPass(64);
            glitch.enabled = false;
            glitch.goWild = true;
            composer.addPass(glitch);

            var vignette = new THREE.ShaderPass(THREE.VignetteShader);
            vignette.uniforms["offset"].value = 0.95;
            vignette.uniforms["darkness"].value = 1.6;
            vignette.renderToScreen = true;
            composer.addPass(vignette);

            var trigger = false;

            (function loop() {
                requestAnimationFrame(loop);

                var delta = clock.getDelta();
                trackballControls.update(delta);

                if(head) {
                    head.material.uniforms.time.value = clock.elapsedTime;
                    if(clock.elapsedTime % 6 > 5.5) {
                        trigger = glitch.enabled = true;
                    } else {
                        if(trigger) {
                            var mode = head.material.uniforms.mode.value; 
                            effectController.mode = head.material.uniforms.mode.value = (mode + 1) % modeCount;
                        }
                        trigger = glitch.enabled = false;
                    }
                }

                // renderer.render(scene, camera);
                composer.render(delta);
            })();

            this.loadShaders([
                "effect.vert",
                "effect.frag"
            ], function(shaders) {
                start(shaders[0], shaders[1]);
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
                error: function(e) {
                }
            });
        },
    };

    global.App = App;

})(window, THREE);

$(function() {
    var app = new App("viewer");
});

