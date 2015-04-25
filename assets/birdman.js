(function() {

window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
var context = new AudioContext();
var _buffer;

//Convert certain tags to have each character in it's own span
prepText();

//Prefetch the song
loadBirdmanOpening();

// The audio has to start based on a user click for mobile devices
$('#home .call-to-action-img-holder').on('click', function(e) {
    analyzeSound(_buffer).then(function(source, peaks, sampleRate) {
      $('#slides').show().find('article').first().show();
      $('#home').slideUp('slow');
      setPeakTimeouts(peaks, sampleRate);
      source.start(0);
      window.setTimeout(function() {
        ga('send', 'event', 'demo', 'start');
      }, 15);
    });
})

function loadBirdmanOpening() {
  var deferred = $.Deferred();
  var url = 'get-ready-trim.mp3';
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      _buffer = buffer;
    }, function() {
  console.error(arguments);
  });
  }
  request.send();

  return deferred.promise();
}

function analyzeSound(buffer) {
  var deferred = $.Deferred();
  var offlineContext = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
  var filteredSource = offlineContext.createBufferSource();
  filteredSource.buffer = buffer;                    // tell the source which sound to play
  filteredSource.connect(offlineContext.destination);       // connect the source to the context's destination (the speakers)

  var filterOffline = offlineContext.createBiquadFilter();
  filterOffline.type = 'highpass';
  filterOffline.Q.value = 2;
  filterOffline.frequency.value = 2000;

  // Pipe the song into the filter, and the filter into the offline context
  filteredSource.connect(filterOffline);
  filterOffline.connect(offlineContext.destination);

  filteredSource.start(0);

  var source = context.createBufferSource(); // creates a sound source
  source.buffer = buffer;                    // tell the source which sound to play
  source.connect(context.destination);       // connect the source to the context's destination (the speakers)

  offlineContext.startRendering()
  offlineContext.oncomplete = function(e) {
    // Determine 'peaks', which for a drum track should be pretty clear
    var peaks = getPeaksAtThreshold(e.renderedBuffer.getChannelData(0), e.renderedBuffer.sampleRate, 0.21);
    console.log('Number of peaks found:', peaks.length);
    ga('send', 'event', 'counts', 'peaks', 'found', peaks.length);
    ga('send', 'event', 'counts', 'sampleRate', 'found', e.renderedBuffer.sampleRate);
    ga('send', 'event', 'counts', 'orderList', 'found', order.lengthds);

    deferred.resolve(source, peaks, e.renderedBuffer.sampleRate)
  };

  return deferred.promise();
}



function setPeakTimeouts(peaks, sampleRate) {
    // For each peak, set a timeout based on the peak time (relative to right now)
    peaks.forEach(function(peak) {
      window.setTimeout(hit, (peak / sampleRate) * 1000);
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

      // at 25% of the way through the song, decrease the threshold and skipRatio
      if ( skipRatio === 5 && i > length * 0.25) {
        threshold -= .022;
        skipRatio = 7;
      }
      else if ( skipRatio === 7 && i > length * 0.40 ) {
        skipRatio = 9;
        threshold -= .05;
      }
      else if ( skipRatio === 9 && i > length * 0.75 ) {
        skipRatio = 10;
        threshold += .1;
      }
    }
    i++;
  }
  return peaksArray;
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
      charShown = 0;
      nextElementToShow++;
    }
  }
  else {
    nextElementToShow++;
    nextCharIndex = 0;
  }

  if ( nextElementToShow === order.length ) {
    ga('send', 'event', 'demo', 'finish');
  }
}

function hitLetters(el, letters) {
  var charToShow = letters[nextCharIndex];

  $(el).find('[data-char="' + charToShow + '"]').css('visibility', 'visible');
  return nextCharIndex++;
}

})();