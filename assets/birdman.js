(function() {
  console.info('Load');

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
var audioBuffer;

function loadBirdmanOpening() {
  var url = 'get-ready-trim.mp3';
  //var url = 'night-chatter.mp3';
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
  var filteredSource = offlineContext.createBufferSource();
  filteredSource.buffer = buffer;                    // tell the source which sound to play
  filteredSource.connect(offlineContext.destination);       // connect the source to the context's destination (the speakers)

  var filter = offlineContext.createBiquadFilter();
  filter.type = "lowpass";

  // Pipe the song into the filter, and the filter into the offline context
  filteredSource.connect(filter);
  filter.connect(offlineContext.destination);

  filteredSource.start(0);

  var source = context.createBufferSource(); // creates a sound source
  source.buffer = buffer;                    // tell the source which sound to play
  source.connect(context.destination);       // connect the source to the context's destination (the speakers)

  offlineContext.startRendering()
  offlineContext.oncomplete = function(e) {
    // Determine 'peaks', which for a drum track should be pretty clear
    var peaks = getPeaksAtThreshold(e.renderedBuffer.getChannelData(0), e.renderedBuffer.sampleRate, 0.22);
    console.log('Number of peaks found:', peaks.length);
    ready(source, peaks, e.renderedBuffer.sampleRate);
  };
}



function setPeakTimeouts(peaks, sampleRate) {
    // For each peak, set a timeout based on the peak time (relative to right now)
    peaks.forEach(function(peak) {
      window.setTimeout(hit, (peak / sampleRate) * 1000);
    });
}

function start(source) {
  source.start(0);
}

function ready(source, peaks, sampleRate) {
  $('body').on('click', function() {
    start(source);
    setPeakTimeouts(peaks, sampleRate);

  });
}

function getPeaksAtThreshold(data, sampleRate, threshold) {
  var peaksArray = [];
  var length = data.length;
  var skipRatio = 5;
  for(var i = 0; i < length;) {
    if (data[i] > threshold) {
      peaksArray.push(i);
      // Skip forward ~ 1/4s to get past this peak.
      i += sampleRate / skipRatio;
      if ( skipRatio === 5 && i > length * 0.50 ) {
        console.log('Skip Ratio kicked', skipRatio);
        skipRatio = 6;
        threshold -= .05;
      }
      if ( skipRatio === 6 && i > length * 0.75 ) {
        console.log('Skip Ratio kicked again', skipRatio);
        skipRatio = 7;
        threshold -= .05;
      }
    }
    i++;
  }
  return peaksArray;
}

function onError() {
  console.error(arguments);
}

/* Convert text from:
 <p>Hey!</p> 
 to:
 <p>
  <span class="character H">H</span>
  <span class="character E">H</span>
  <span class="character Y">H</span>
  <span class="character bang">H</span>
</p>
*/ 
function prepText() {
  var $text = $('.letters');
  $text.each(function() {
     var characters = this.textContent.split("").map(function(char) {
          return '<span data-char="' + char.toUpperCase() + '" class="character">' + char.toUpperCase() + '</span>';
      });
      this.innerHTML = characters.join("");
  });
}


var LETTER_ORDER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!?/,.()';
var nextCharIndex = 0;
var nextElementToShow = 0;
var lastShownPage = 0;

function hit() {
  var showable = order[nextElementToShow];
  var charShown;

  if ( !showable ) return;

  // Skip to the next "page" (article)
  if ( showable.page > lastShownPage ) {
    $($('article').get(lastShownPage)).hide();
    $($('article').get(showable.page)).show();
    lastShownPage = showable.page;
  }

  $(showable.el).css('visibility', 'visible');

  if ( showable.type === 'letters' ) {
    charShown = hitLetters(showable.el, showable.letters);
    if ( charShown === showable.letters.length ) {
      nextCharIndex = 0;
      nextElementToShow++;
    }
  }
  else {
    nextElementToShow++;
    nextCharIndex = 0;
  }
}

function hitLetters(el, letters) {
  var charToShow = letters[nextCharIndex];

  $(el).find('[data-char="' + charToShow + '"]').css('visibility', 'visible');
  return nextCharIndex++;
}

prepText();
loadBirdmanOpening();


})();