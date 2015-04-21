(function() {
  console.info('Load');

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
var audioBuffer;
window.filteredBuffer;

function loadBirdmanOpening() {
  var url = 'get-ready-trim.mp3';
  //var url = 'just-chatting.mp3';
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      audioBuffer = buffer;
      playSound(audioBuffer);
    }, onError);
  }
  request.send();
}

function playSound(buffer) {
  var offlineContext = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
  var source = offlineContext.createBufferSource();
  source.buffer = buffer;                    // tell the source which sound to play
  source.connect(offlineContext.destination);       // connect the source to the context's destination (the speakers)

  var filter = offlineContext.createBiquadFilter();
  filter.type = "lowpass";

  // Pipe the song into the filter, and the filter into the offline context
  source.connect(filter);
  filter.connect(offlineContext.destination);

  source.start(0);

  var source2 = context.createBufferSource(); // creates a sound source
  source2.buffer = buffer;                    // tell the source which sound to play
  source2.connect(context.destination);       // connect the source to the context's destination (the speakers)
  source2.start(0);                           // play the source now
window.source = source2;
  console.log('Started');

  offlineContext.startRendering()
// Act on the result
  offlineContext.oncomplete = function(e) {
    // Filtered buffer!
    filteredBuffer = e.renderedBuffer;
    console.log(filteredBuffer);

    // 44100 samples per second
    // 
    var peaks = getPeaksAtThreshold(e.renderedBuffer.getChannelData(0), 0.30);
    console.log('Peaks found:', peaks.length);

    var map = document.getElementById('mad');
    peaks.forEach(function(peak) {
      window.setTimeout(hit, (peak / filteredBuffer.sampleRate) * 1000);
    })
  };
}

function getPeaksAtThreshold(data, threshold) {
  var peaksArray = [];
  var length = data.length;
  for(var i = 0; i < length;) {
    if (data[i] > threshold) {
      peaksArray.push(i);
      // Skip forward ~ 1/4s to get past this peak.
      i += 44100 / 4;
    }
    i++;
  }
  return peaksArray;
}

function onError() {
  console.error(arguments);
}

function prepText() {
  var text = document.getElementById('text');
  Array.prototype.forEach.call(text.getElementsByTagName('p'), function(p) {
    var characters = p.innerText.split("").map(function(char) {
      return '<span class="' + char + '">' + char + '</span>';
    });

    p.innerHTML = characters.join("");
  })
}

function hit() {
  console.log('bam');
}

prepText();
loadBirdmanOpening();


})();