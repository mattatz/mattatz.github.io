/*
 * index.js
 * */

(function(global, $) {

    global.AudioContext = global.AudioContext || global.webkitAudioContext;

    var app, App = function(viewerId, samplesId, downloadId) {
        app = this;
        app.init(viewerId, samplesId, downloadId);
    };

    App.prototype = {

        init : function(viewerId, samplesId, downloadId) {

            app.Mode = {
                None    : 0,
                Process : 1,
                Play    : 2 
            };

            app.mode = app.Mode.None;
            app.context = new AudioContext();

            app.$viewer = $("#" + viewerId);

            app.$dragover = $(app.$viewer.find('.dragover'));
            // app.$dragover.hide();

            // set option for #viewer 
            Dropzone.options.viewer = {
                paramName : "viewer",
                dragover : function(e) {
                    // app.$dragover.show();
                },
                dragleave : function(e) {
                    // app.$dragover.hide();
                },
                // acceptedFiles : "image/*",
                accept : function(file, done) {
                    app.$dragover.hide();

                    if(app.mode != app.Mode.None) return;

                    app.dropzone.disable();
                    app.reset();
                    app.read(file);
                },
                autoProcessQueue : false,
                createImageThumbnail : false,
                previewsContainer : false
            };

            app.dropzone = new Dropzone("#" + viewerId, { url : "upload" });

            $("#" + samplesId).children().each(function(i, elem) {
                var imageUrl = $(elem).attr('src');
                $(elem).on('click', function() {
                    if(app.mode != app.Mode.None) return;

                    app.dropzone.disable();
                    app.$dragover.hide();
                    app.reset();

                    var img = new Image();
                    img.onload = function(e) {
                        app.$viewer.show();
                        app.play(img, "sample" + i);
                    };
                    img.src = imageUrl;
                });
            });

            app.$download = $("#" + downloadId);
            app.$download.hide();
            app.$download.find('a').on('click', function() {
                app.recorder.exportWAV(function(blob) {
                    Recorder.forceDownload(blob, app.recorder.name + ".wav");
                });
            });

            app.chroma = chroma.scale(["#000000", "#0000ff", '#ff0000', '#ffff00', '#ffffff']).domain([0, 120]).mode('rgb');

        },

        fetchAudioBuffer : function(url, oncomplete) {
            var req = new XMLHttpRequest();
            req.open("GET", url, true);
            req.responseType = "arraybuffer";
            req.onload = function() {
                app.audioContext = new AudioContext();
                app.audioContext.decodeAudioData(req.response, function(buffer) {
                    oncomplete(buffer);
                });
            };
            req.send();
        },

        read : function(file) {
            var reader = new FileReader();
            reader.onload = function() {
                if(reader.result.indexOf("image") >= 0) {
                    var img = new Image();
                    img.onload = function(e) {
                        app.play(img, file.name.split('.')[0]);
                    };
                    img.src = reader.result;
                } else if(reader.result.indexOf("audio") >= 0) {
                    app.fetchAudioBuffer(reader.result, function(buffer) {
                        app.setupVisualizer();

                        app.visualize(buffer, function() {
                            app.mode = app.Mode.None;
                        });

                        var source = app.context.createBufferSource();
                        source.buffer = buffer;

                        var gain = app.context.createGain();
                        gain.gain.value = 0.2;
                        source.connect(gain);
                        gain.connect(app.context.destination);

                        source.start(0);
                    });
                } else {
                }
            };
            reader.readAsDataURL(file);
        },

        visualize : function(buffer, oncomplete) {

            app.spectrogram = new Spectrogram({
                maxDecibels : 120,
                minDecibels : -120,
                context     : app.context
            });

            app.spectrogram.analyse(
                buffer,
                function(data, i, len) {
                    app.drawSpectrogram(data, i, len);
                },
                oncomplete
            );

        },

        drawSpectrogram : function(data, index, len) {

            var d = data[index - 1];

            var cw = app.canvas.width;
            var ch = app.canvas.height;

            var x = index / len * cw;
            var w = cw / len;

            var values = d.values;
            var n = values.length;
            var h = n / ch;

            var min = Number.MAX_VALUE, max = Number.MIN_VALUE;

            for(var i = 0; i < n; i++) {
                var y = (1 - i / n) * ch;
                var v = values[i];
                if(v < min) min = v;
                if(v > max) max = v;

                var hex = app.chroma(v).hex();

                app.context2d.fillStyle = hex;
                app.context2d.fillRect(x, y, w, h);
            }

        },

        play : function(img, filename) {

            app.mode = app.Mode.Process;
            app.setupVisualizer(img);

            var viewerId = app.$viewer.attr("id");

            app.progressbar = new ProgressBar.Circle("#" + viewerId, {
                color : "#66ccff",
                duration : 1000,
                trailColor : "#eee",
                trailWidth : 0.8,
                strokeWidth : 0.8,
                step : function(state, bar) {
                    // bar.setText((bar.value() * 100).toFixed(0));
                }
            });

            $(app.progressbar.svg).hide();

            setTimeout(function() {
                $(app.progressbar.svg).fadeIn('normal');
            });

            app.imageToSpectrogram(
                img, 
                function(index, len) {
                    setTimeout(function() {
                        app.progressbar.animate(Math.min(index / len, 1.0));
                    });
                },
                function(buffer) {
                    setTimeout(function() {
                        $(app.progressbar.svg).fadeOut('slow', function() {

                            app.mode = app.Mode.Play;

                            app.source = app.context.createBufferSource();
                            app.source.buffer = buffer;

                            var gain = app.context.createGain();
                            gain.gain.value = 0.2;
                            app.source.connect(gain);
                            gain.connect(app.context.destination);

                            app.record(app.source, filename);
                            app.source.start(0);

                            app.visualize(buffer, function() {
                                app.mode = app.Mode.None;
                            });

                        });
                    }, 1000);
                }
            );

        },

        setupVisualizer : function(img) {
            app.canvas = document.createElement("canvas");
            app.canvas.setAttribute("id", "visualizer");
            app.$viewer.append(app.canvas);

            app.canvas.height = app.$viewer.height();
            if(img) {
                app.canvas.width = (img.width / img.height) * app.canvas.height;
            } else {
                app.canvas.width = app.$viewer.width();
            }

            app.context2d = app.canvas.getContext("2d");
        },

        imageToSpectrogram : function(img, onprogress, oncomplete) {

            // context.sampleRate is readonly
            // context.sampleRate = 44100;

            var imageData = app.getImageData(img);
            var step = 2;
            // var step = 10;
            var w = imageData.width;
            var h = imageData.height;
            var pixels = imageData.data;

            var index = 0;
            var maxSumRGB = 256 * 3;
            var maxFrequency = parseInt(app.context.sampleRate / 2);
            // var maxFrequency = 22000;

            var seconds = ((w / step) / 5);
            // var buf = context.createBuffer(1, seconds * context.sampleRate, context.sampleRate);
            var buf = app.context.createBuffer(2, seconds * app.context.sampleRate, app.context.sampleRate);
            var data = buf.getChannelData(0);

            // asynchronous processing
            (function loop(x) {
                if(x < w) {
                    var samples = [];
                    var decibels = [];
                    for(var y = 0; y < h; y += step) {
                        var idx = (x + y * w) * 4;
                        var r = pixels[idx + 0];
                        var g = pixels[idx + 1];
                        var b = pixels[idx + 2];
                        
                        if(r < 10 && g < 10 && b < 10) {
                            continue;
                        }

                        samples.push(maxFrequency - (y + 1) / (h + 1) * maxFrequency); // push the frequency

                        var c = 4.25 - 4.25 * ((r + g + b) / maxSumRGB);
                        decibels.push(c); // push pixel color
                    }

                    index = app.addSine(app.context, data, 0.2, samples, decibels, index);

                    onprogress(index, data.length);

                    setTimeout(function() {
                        loop(x + step);
                    }, 5);

                } else {
                    oncomplete(buf);
                } 
            })(0);

        },

        record : function(src, name) {
            // http://www.cyokodog.net/blog/media-capture-and-streams-web-audio-api/

            app.recorder = new Recorder(src, {
                // bufferLen : 8192,
                // numChannels : 1,
                workerPath : "assets/javascripts/lib/recorderWorker.js"
            });
            app.recorder.name = name;

            src.onended = function(e) {
                app.recorder.stop();
                app.$download.css('display', 'inline');
            };

            app.recordSource = src;
            app.recorder.record();

            return app.recorder;
        },

        reset : function() {
            if(app.canvas) {

                if(app.source) app.source.stop();
                if(app.spectrogram) app.spectrogram.destroy();

                $(app.canvas).remove();
                if(app.progressbar) $(app.progressbar.svg).remove();

                app.source = null;
                app.canvas = null;
            }

            app.$download.hide();
        },

        addSine : function(context, data, length, samples, decibels, index) {
            // var maxNo = Math.pow(2, 16) / 2;
            var maxNo = Math.pow(2, 4);
            length *= context.sampleRate;

            for(var pos = 0; pos < length; pos++) {
                var val = 0;
                var n = samples.length;
                for(var i = 0; i < n; i++) {
                    // sin(2 * pi + sample(i)) / decibel(i)
                    var time = (pos / context.sampleRate) * samples[i];
                    val += (Math.sin(Math.PI * 2 * time) * 10) / (Math.pow(10, decibels[i]));
                }
                val /= (n + 1);
                data[index++] = val * maxNo; // add sample
            }

            return index;
        },

        getImageData : function(img, step) {
            var canvas = document.createElement('canvas');

            var width, height;
            if(img.width > img.height) {
                width = img.width > 300 ? 300 : img.width;
                height = (img.height / img.width) * width;
            } else {
                height = img.height > 300 ? 300 : img.height;
                width = (img.width / img.height) * height;
            }

            canvas.width = width;
            canvas.height = height;

            var context2d = canvas.getContext('2d');
            context2d.drawImage(img, 0, 0, width, height);
            return context2d.getImageData(0, 0, width, height);
        }

    };

    global.App = App;

})(window, $);

$(function() {
    new App("viewer", "samples", "download");

    if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        window.alert("image->spectrogram is not available on your device.")
    }
});

