#Recreating the Birdman opening credits with HTML5 Web Audio APIs

[See the demo here](http://markmarkoh.com/birdman)

The [opening credits to the 2014 Best Picture Birdman](https://www.youtube.com/watch?v=p75qQgNdc-0) was exceptionally creative. The music is composed primarily of a standard jazz drum set, and for each beat or loud hit of the cymbal, letters would appear on the screen, slowly filling out sentences.

This is my attempt to recreate that effect using the Web Audio APIs available in most modern browsers.

To do this, we download an .mp3 and pass it through a [filter](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode) to better isolate the louder drum and cymbal hits.
Then we loop through the [channel data](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer/getChannelData), and based on an arbitrary threshold (for this project it was 0.22), we make a note of *when* that beat occured in the track (1.445 seconds, for example).

Finally, after we have an array containing the timing of all the sound "peaks", we simply set a series of `window.setTimeouts`, each with a callback to update the UI.

*Note: If this were a more Javascript intensive application, you might want to find something more precise than window.setTimeout.*

Two great links to learn more about this approach:

1. [Intro To WebAudio](http://www.html5rocks.com/en/tutorials/webaudio/intro/)
2. [Beat Detection with WebAudio](http://tech.beatport.com/2014/web-audio/beat-detection-using-web-audio/)

*The copyright to the track 'Get Ready' by Antonio Sanchez belongs to Antonio Sanchez*
