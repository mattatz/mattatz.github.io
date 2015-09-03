/*
 * index.js
 * */

(function(global, $, THREE) {

    var app, App = function(id) {
        app = this;
        app.init(id);
    };

    App.prototype = {

        init : function(id) {

            var $dom = $("#" + id);

            var scene = this.scene = new THREE.Scene();
            var camera = this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 1000);
            camera.position.z = 2;
            scene.add(camera);

            var light = new THREE.DirectionalLight(0xffffff, 0.8);
            light.position.set(0, 1, 0);
            scene.add(light);

            var renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });

            renderer.setClearColor(0x7ec0ee);
            renderer.setSize(window.innerWidth, window.innerHeight);
            $dom.append(renderer.domElement);

            var cloudCount = 10;
            var clouds = [];
            var range = 10;

            var rand = function() {
                return Math.random() - 0.5;
            };

            var wireframeMat = new THREE.MeshBasicMaterial({
                color : new THREE.Color(0x000000),
                wireframe : true
            });

            for(var i = 0; i < cloudCount; i++) {

                var cloud = new THREE.Cloud();

                var wireframe = new THREE.Mesh(cloud.geometry.clone(), wireframeMat.clone());
                cloud.add(wireframe);
                wireframe.visible = false;

                cloud.position.set(rand() * range, rand() * range, rand() * range);
                cloud.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);

                var scale = 2.0 + Math.random() * 6;
                cloud.scale.set(scale, scale, scale);

                scene.add(cloud);

                clouds.push(cloud);
            }

            var clock = new THREE.Clock();
            var trackballControls = new THREE.TrackballControls(camera, renderer.domElement);
            trackballControls.minDistance = 1;
            trackballControls.maxDistance = 12;

            var controller = {
                speed     : 1.0,
                wireframe : false
            };

            var gui = new dat.GUI();
            gui.add(controller, "speed", 0.1, 10.0).step(0.1);
			      gui.add(controller, "wireframe").onChange(function() {
                for(var i = 0, n = clouds.length; i < n; i++) {
                    var cloud = clouds[i];
                    var wireframe = cloud.children[0];
                    wireframe.visible = controller.wireframe;
                }
            });

            (function loop() {
                requestAnimationFrame(loop);

                var delta = clock.getDelta();
                trackballControls.update(delta);

                var t = clock.elapsedTime * controller.speed;

                for(var i = 0, n = clouds.length; i < n; i++) {
                    var cloud = clouds[i];
                    cloud.update(t);
                }
                
                renderer.render(scene, camera);
            })();

            var updateRendererSize = function() {
                var w = window.innerWidth;
                var h = window.innerHeight;

                camera.aspect = w / h;
                camera.updateProjectionMatrix();

                renderer.setSize(w, h);
            };

            $(window).on('resize', updateRendererSize);
        }

    };

    global.App = App;

})(window, $, THREE);

$(function() {
    new App("viewer");
});

