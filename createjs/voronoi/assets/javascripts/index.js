/*
 * index.js
 * */

(function(global) {

    var app, App = function App(id) {
        app = this;
        this.init(id);
    }

    App.prototype = {

        init : function(id) {

            app.stage = new createjs.Stage(id);
            createjs.Touch.enable(app.stage);

            app.voronoi =  new Voronoi();

            app.sites = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map(function(e) {
                return { x : Math.random(), y : Math.random() }
            });

            app.bbox = { xl : 0, xr : 0, yt : 0, yb : 0 };

            app.category20 = [
                "#1f77b4",
                "#aec7e8",
                "#ff7f0e",
                "#ffbb78",
                "#2ca02c",
                "#98df8a",
                "#d62728",
                "#ff9896",
                "#9467bd",
                "#c5b0d5",
                "#8c564b",
                "#c49c94",
                "#e377c2",
                "#f7b6d2",
                "#7f7f7f",
                "#c7c7c7",
                "#bcbd22",
                "#dbdb8d",
                "#17becf",
                "#9edae5"
            ];

            app.cursor = new createjs.Shape();
            app.cursor.graphics.beginStroke('#000').drawCircle(0, 0, 5);

            app.diagram = new createjs.Container();

            app.stage.addChild(app.diagram);
            app.stage.addChild(app.cursor);

            app.stage.on('stagemousemove', function(e) {
                app.sites[app.sites.length - 1].x = e.stageX / app.stage.canvas.width;
                app.sites[app.sites.length - 1].y = e.stageY / app.stage.canvas.height;

                app.cursor.x = e.stageX;
                app.cursor.y = e.stageY;

                app.renderDiagram();
            });

            app.stage.on('stagemousedown', function(e) {
                app.sites.push({
                    x : e.stageX / app.stage.canvas.width,
                    y : e.stageY / app.stage.canvas.height
                });
                app.renderDiagram();
            });

            app.resize();

            createjs.Ticker.addEventListener('tick', app.tick);
            createjs.Ticker.setFPS(25);
        },

        update : function() {
            app.stage.update();
        },

        tick : function() {
            app.update();
        },

        resize : function() {
            app.bbox.xr = app.stage.canvas.width = $(window).width();
            app.bbox.yb = app.stage.canvas.height = $(window).height();
            app.renderDiagram();
        },

        renderDiagram : function() {

            app.diagram.removeAllChildren();

            var diagram = app.voronoi.compute(app.sites.map(function(site) { return { x : site.x * app.stage.canvas.width , y : site.y * app.stage.canvas.height } }), app.bbox);
            for (var i = 0, n = app.sites.length; i < n; i++) {

                var cell = diagram.cells[i];

                if(!cell || cell.halfedges.length <= 0) continue;

                var points = cell.halfedges.map(function(he) {
                    return he.getEndpoint();
                });

                var polygon = new createjs.Shape();
                polygon.graphics.beginFill(app.category20[i % 20]);
                polygon.graphics.moveTo(points[0].x, points[0].y)

                for(var j = 0, m = points.length; j < m; j++) {
                    var to = points[(j + 1) % m];
                    polygon.graphics.lineTo(to.x, to.y);
                }

                polygon.graphics.endFill();

                app.diagram.addChild(polygon);

                var point = new createjs.Shape();
                point.graphics.beginFill('#000').drawCircle(0, 0, 3);
                point.x = cell.site.x;
                point.y = cell.site.y;
                app.diagram.addChild(point);
            }


        }

    };

    global.App = App;

})(window);

$(function() {
    var $canvas = $('<canvas id="voronoi"></canvas>').appendTo('body');
    var $window = $(window);
    var app = new App('voronoi');
    $window.on('resize', app.resize);
});

