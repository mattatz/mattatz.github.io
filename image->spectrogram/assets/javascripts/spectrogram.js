/*
 * Spectrogram.js
 * */

(function(global) {

    var spectrogram, Spectrogram = function(options) {
        spectrogram = this;
        spectrogram.init(options);
    };
    
    Spectrogram.prototype = {

        init : function(options) {

            if (!options) {
                options = {};
            }
            spectrogram.options = options;

            spectrogram.sampleRate = options.sampleSize || 512;

            spectrogram.context = options.context || new AudioContext();
            spectrogram.analyser = spectrogram.context.createAnalyser();
            spectrogram.javascriptNode = spectrogram.context.createScriptProcessor(spectrogram.sampleRate, 1, 1);

            spectrogram.analyser.minDecibels = options.minDecibels || - 120;
            spectrogram.analyser.maxDecibels = options.maxDecibels || 0;

            spectrogram.analyser.smoothingTimeConstant = options.smoothing || 0.0;
            spectrogram.analyser.fftSize = options.fftSize || 2048;

            spectrogram.freqs = new Uint8Array(spectrogram.analyser.frequencyBinCount);
            spectrogram.data = [];

            spectrogram.isPlaying = false;
            spectrogram.isLoaded = false;
            spectrogram.startTime = 0;
            spectrogram.startOffset = 0;
            spectrogram.count = 0;
            spectrogram.curSec = 0;
            spectrogram.maxCount = 0;

        },

        analyse : function(buffer, onprocess, onfinishprocess) {

            spectrogram.buffer = buffer;

            spectrogram.startTime = spectrogram.context.currentTime;
            spectrogram.count = 0;
            spectrogram.curSec = 0;
            spectrogram.curDuration = 0;
            spectrogram.source = spectrogram.context.createBufferSource();
            spectrogram.source.buffer = spectrogram.buffer;
            spectrogram.analyser.buffer = spectrogram.buffer;
            spectrogram.onprocess = onprocess;
            spectrogram.onfinishprocess = onfinishprocess;
            spectrogram.javascriptNode.onaudioprocess = spectrogram.process.bind(spectrogram);

            spectrogram.maxCount = (spectrogram.context.sampleRate / spectrogram.sampleRate) * spectrogram.buffer.duration;

            // Connect graph
            spectrogram.source.connect(spectrogram.analyser);
            spectrogram.analyser.connect(spectrogram.javascriptNode);

            // spectrogram.source.connect(spectrogram.context.destination);
            spectrogram.javascriptNode.connect(spectrogram.context.destination);

            spectrogram.source.loop = false;
            spectrogram.source.start(0, spectrogram.startOffset % spectrogram.buffer.duration);

        },

        process : function(u, evt) {

            if(!spectrogram.isLoaded) {

                spectrogram.count += 1;
                spectrogram.curSec =  (spectrogram.sampleRate * spectrogram.count) / spectrogram.buffer.sampleRate;
                spectrogram.analyser.getByteFrequencyData(spectrogram.freqs);

                var d = {
                    'key' : spectrogram.curSec,
                    'values' : new Uint8Array(spectrogram.freqs)
                };
                spectrogram.data.push(d);

                if(spectrogram.onprocess) {
                    spectrogram.onprocess(spectrogram.data, spectrogram.count, spectrogram.maxCount);
                }

                if(spectrogram.count >= spectrogram.maxCount) {
                    spectrogram.source.stop();
                    spectrogram.isLoaded = true;

                    if(spectrogram.onfinishprocess) {
                        spectrogram.onfinishprocess(spectrogram.data);
                    }
                }
            }

        },

        destroy : function() {
            spectrogram.javascriptNode.disconnect(spectrogram.context.destination);
            spectrogram.source.stop();
        },

        getBinFrequency : function(index) {
            var nyquist = spectrogram.context.sampleRate / 2;
            return index / spectrogram.freqs.length * nyquist;
        }

    };

    global.Spectrogram = Spectrogram;

})(window);

