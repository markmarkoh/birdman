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

  // expose
  window.source = source2;

  offlineContext.startRendering()
  offlineContext.oncomplete = function(e) {
    filteredBuffer = e.renderedBuffer;
    console.log(filteredBuffer);

    // Determine 'peaks', which for a drum track should be pretty clear
    var peaks = getPeaksAtThreshold(e.renderedBuffer.getChannelData(0), filteredBuffer.sampleRate, 0.22);
    console.log('Number of peaks found:', peaks.length);


    // For each peak, set a timeout based on the peak time (relative to right now)
    peaks.forEach(function(peak) {
      window.setTimeout(hit, (peak / filteredBuffer.sampleRate) * 1000);
    })
  };
}

function getPeaksAtThreshold(data, sampleRate, threshold) {
  var peaksArray = [];
  var length = data.length;
  for(var i = 0; i < length;) {
    if (data[i] > threshold) {
      peaksArray.push(i);
      // Skip forward ~ 1/4s to get past this peak.
      i += sampleRate / 4;
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
          return '<span data-char="' + char.toUpperCase() + '" class="character ' + getClassName(char) + '">' + char.toUpperCase() + '</span>';
      });
      this.innerHTML = characters.join("");
  });
}

function getClassName(character) {
  if ( /[a-zA-Z]/.test(character) ) {
    return character.toUpperCase();
  }
  if ( character === '!' ) return 'bang';
  if ( character === '?' ) return 'question';
  if ( character === '/' ) return 'slash';
  if ( character === ',' ) return 'comma';
  if ( character === '.' ) return 'period';
  if ( character === ' ' ) return 'space';
  if ( character === '(' ) return 'l-paren';
  if ( character === ')' ) return 'r-paren';
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
    console.log('Hiding page', lastShownPage);
    console.log('Showing page', showable.page);
    $($('article').get(lastShownPage)).hide();
    $($('article').get(showable.page)).show();
    lastShownPage = showable.page;
  }

  $(showable.el).css('visibility', 'visible');

  if ( showable.type === 'letters' ) {
    charShown = hitLetters(showable.el);
    if ( charShown === LETTER_ORDER.length ) {
      nextCharIndex = 0;
      nextElementToShow++;
    }
  }
  else {
    nextElementToShow++;
    nextCharIndex = 0;
  }
}

function hitLetters(el) {
  var charToShow = LETTER_ORDER[nextCharIndex % LETTER_ORDER.length];

  $(el).find('[data-char="' + charToShow + '"]').css('visibility', 'visible');
  return nextCharIndex++;
}

prepText();
loadBirdmanOpening();


})();