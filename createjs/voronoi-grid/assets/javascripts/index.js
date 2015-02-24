/*
 * index.js
 * */

(function(global) {

    var app, App = function App(id, gridSize) {
        app = this;
        this.init(id, gridSize);
    }

    App.prototype = {

        init : function(id, gridSize) {

            app.stage = new createjs.Stage(id);
            createjs.Touch.enable(app.stage);

            app.gridSize = gridSize;

            app.voronoi =  new Voronoi();

            app.sites = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map(function(e) {
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

            app.diagram = new createjs.Container();

            app.stage.addChild(app.diagram);

            app.stage.on('stagemousemove', function(e) {
                app.sites[app.sites.length - 1].x = e.stageX / app.stage.canvas.width;
                app.sites[app.sites.length - 1].y = e.stageY / app.stage.canvas.height;

                app.renderGridDiagram();
            });

            app.stage.on('stagemousedown', function(e) {
                app.sites.push({
                    x : e.stageX / app.stage.canvas.width,
                    y : e.stageY / app.stage.canvas.height
                });
                app.renderGridDiagram();
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

        createGrid : function() {
            app.grid = [];

            app.gridX = app.stage.canvas.width / app.gridSize;
            app.gridY = app.stage.canvas.height / app.gridSize;

            for(var y = 0; y < app.gridY; y++) {
                for(var x = 0; x < app.gridX; x++) {
                    var g = new Grid(x / app.gridX, y / app.gridY);
                    app.grid.push(g);
                }
            }
        },

        resize : function() {
            app.bbox.xr = app.stage.canvas.width = $(window).width();
            app.bbox.yb = app.stage.canvas.height = $(window).height();

            app.createGrid();

            app.renderGridDiagram();
        },

        renderGridDiagram : function() {

            app.diagram.removeAllChildren();

            var diagram = app.voronoi.compute(app.sites.map(function(site) { return { x : site.x * app.stage.canvas.width , y : site.y * app.stage.canvas.height } }), app.bbox);

            var len = diagram.cells.length;
            var hw = (app.stage.canvas.width / 30) / 2;
            var hh = (app.stage.canvas.width / 8) / 2;

            for (var i = 0, n = app.sites.length; i < n; i++) {

                var cell = diagram.cells[i];

                if(!cell || cell.halfedges.length <= 0) continue;

                cell.points = cell.halfedges.map(function(he) {
                    return he.getEndpoint();
                });

            }

            for(var i = 0, n = app.grid.length; i < n; i++) {
                var grid = app.grid[i];
                var x = grid.x * app.stage.canvas.width + hw;
                var y = grid.y * app.stage.canvas.height + hh;

                for(j = 0; j < len; j++) {
                    var cell = diagram.cells[j];
                    if(app.containsInPolygon(x, y, cell.points)) {

                        var shape = new createjs.Shape();
                        shape.graphics.beginFill(app.category20[j % 20]).drawRect(x - hw, y - hh, hw * 2, hh * 2);
                        app.diagram.addChild(shape);

                        break;
                    }
                }

            }

        },

        containsInPolygon : function(x, y, points) {
            var count = 0

            var pos0 = points[0];
            var bFlag0x = (x <= pos0.x);
            var bFlag0y = (y <= pos0.y);

            for(var i = 1, n = points.length; i < n + 1; i++) {
                var pos1 = points[i % n];
                var bFlag1x = (x <= pos1.x);
                var bFlag1y = (y <= pos1.y);

                if (bFlag0y != bFlag1y) {
                    if(bFlag0x == bFlag1x) {
                        if(bFlag0x) {
                            count += (bFlag0y ? -1 : 1);
                        }
                    } else {
                        if(x <= (pos0.x + (pos1.x - pos0.x) * (y - pos0.y) / (pos1.y - pos0.y))) {
                            count += (bFlag0y ? -1 : 1);
                        }
                    }
                }

                pos0 = pos1;
                bFlag0x = bFlag1x;
                bFlag0y = bFlag1y;
            }
            
            return count != 0;
        }


    };

    function Grid(x, y) {
        this.init.call(this, x, y);
    }

    Grid.prototype = {
        init : function(x, y) {
            this.x = x;
            this.y = y;
        }
    };

    global.App = App;

})(window);

$(function() {

    var $canvas = $('<canvas id="voronoi"></canvas>').appendTo('body');

    var $window = $(window);

    var app = new App('voronoi', 30);
    $window.on('resize', app.resize);

});

