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

            var sceneRTT = new THREE.Scene();
            var cameraRTT = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
            var quadRTT = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
            sceneRTT.add(quadRTT);

            var width = height = 512;

            // var type = THREE.FloatType; // THREE.FloatType is not supported on iOS
            var opt = {
                type : THREE.HalfFloatType,
                format : THREE.RGBAFormat,
                wrapS : THREE.RepeatWrapping,
                wrapT : THREE.RepeatWrapping,
                minFilter : THREE.LinearFilter,
                magFilter : THREE.LinearFilter
            };

            var fboRD = new FboPingPong(width, height, opt);

            var Mode = {
                Init        : 0,
                Update      : 1
            };

            var sphere;
            var rdMat;

            var reset = function() {
                if(!rdMat) return;

                quadRTT.material = rdMat;
                rdMat.uniforms.mode.value = Mode.Init;
                rdMat.uniforms.rdTex.value = fboRD.getReadBuffer();
                renderer.render(sceneRTT, cameraRTT, fboRD.getWriteBuffer());
                fboRD.swap();
            };

            var start = function(kernelVert, updateFrag, sphereVert, sphereFrag) {

                rdMat = new THREE.ShaderMaterial({
                    vertexShader : kernelVert,
                    fragmentShader : updateFrag,
                    uniforms : {
                        rdTex : { type : "t", value : fboRD.getReadBuffer() },
                        texel : { type : "v2", value : new THREE.Vector2(1 / width, 1 / height) },
                        mode : { type : "i", value : -1 },
                        F : { type : "f", value : 0.037 },
                        k : { type : "f", value : 0.06 },
                        dt : { type : "f", value : 0.1 },
                        mouse : { type : "v2", value : new THREE.Vector2(-1, -1) }
                    }
                });

                sphere = new THREE.Mesh(
                    new THREE.OctahedronGeometry(5, 7),
                    new THREE.ShaderMaterial({
                        vertexShader : sphereVert,
                        fragmentShader : sphereFrag,
                        uniforms : {
                            rdTex : { type : "t", value : fboRD.getReadBuffer() }
                        }
                    })
                );

                scene.add(sphere);

                reset();
            };

            var clock = new THREE.Clock();
            var trackballControls = new THREE.TrackballControls(camera, renderer.domElement);
            trackballControls.minDistance = 6;
            trackballControls.maxDistance = 20;

            var mouse = new THREE.Vector2(0, 0);

            var updateMousePosition = function(e) {
                mouse.x = (e.pageX / window.innerWidth) * 2 - 1;
                mouse.y = - (e.pageY / window.innerHeight) * 2 + 1;
            };

            var disablemouse = function(e) {
                if(rdMat) {
                    rdMat.uniforms.mouse.value = new THREE.Vector2(-1, -1);
                }
            };

            var raycaster = new THREE.Raycaster();

            document.addEventListener('mousemove', updateMousePosition);
            document.addEventListener('mouseup', disablemouse);

            document.addEventListener('touchstart', updateMousePosition);
            document.addEventListener('touchmove', updateMousePosition);
            document.addEventListener('touchend', disablemouse);

            var effectController = {
                F       : 0.037,
                k       : 0.06,
                speed   : 5,
                reset   : reset
            };

            var matChanger = function() {
                if(rdMat) {
                    rdMat.uniforms.F.value = effectController.F;
                    rdMat.uniforms.k.value = effectController.k;
                }
            };

            var gui = new dat.GUI();
			gui.add(effectController, "F", 0.01, 0.07, 0.0001 ).onChange(matChanger);
			gui.add(effectController, "k", 0.01, 0.07, 0.0001 ).onChange(matChanger);
			gui.add(effectController, "speed", 1, 20, 1).onChange(matChanger);
			gui.add(effectController, "reset");
			gui.close();

            (function loop() {
                requestAnimationFrame(loop);

                var delta = clock.getDelta();
                trackballControls.update(delta);

                if(rdMat) {

                    raycaster.setFromCamera(mouse, camera);

                    var intersect = raycaster.intersectObject(sphere);
                    if(intersect.length > 0) {
                        // normalize to uv
                        var idx = intersect[0].faceIndex;
                        var uv = sphere.geometry.faceVertexUvs[0][idx];
                        rdMat.uniforms.mouse.value = uv[0];
                    } else {
                        rdMat.uniforms.mouse.value = new THREE.Vector2(-1, -1);
                    }

                    rdMat.uniforms.mode.value = Mode.Update;

                    var dt = Math.min(delta * 40.0, 0.8);
                    rdMat.uniforms.dt.value = dt;

                    var speed = effectController.speed;
                    for(var i = 0; i < speed; i++) {
                        rdMat.uniforms.rdTex.value = fboRD.getReadBuffer();
                        renderer.render(sceneRTT, cameraRTT, fboRD.getWriteBuffer());
                        fboRD.swap();
                    }
                }

                renderer.render(scene, camera);

            })();

            this.loadShaders([
                "kernel.vert",
                "grayscott.frag",
                "sphere.vert",
                "sphere.frag"
            ], function(shaders) {
                start(shaders[0], shaders[1], shaders[2], shaders[3]);
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

