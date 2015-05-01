//Create the audio context
let actx = new AudioContext();

//The sound object
class Sound {
  constructor(source, loadHandler) {

    //Assign the `source` and `loadHandler` values to this object 
    this.source = source;
    this.loadHandler = loadHandler;

    //Set the default properties
    this.actx = actx;
    this.volumeNode = this.actx.createGain();
    this.panNode = this.actx.createStereoPanner();
    this.convolverNode = this.actx.createConvolver();
    this.delayNode = this.actx.createDelay();
    this.feedbackNode = this.actx.createGain();
    this.filterNode = this.actx.createBiquadFilter();
    //this.panNode.panningModel = "equalpower";
    this.soundNode = null;
    this.buffer = null;
    this.loop = false;
    this.playing = false;

    //Values for the pan and volume getters/setters
    this.panValue = 0;
    this.volumeValue = 1;

    //Values to help track and set the start and pause times
    this.startTime = 0;
    this.startOffset = 0;
   
    //The playback rate
    this.playbackRate = 1;
    this.randomPitch = true;

    //Reverb parameters
    this.reverb = false;
    this.reverbImpulse = null;

    //Echo parameters
    this.echo = false;
    this.delayValue = 0.3;
    this.feebackValue = 0.3;
    this.filterValue = 0;

    //Load the sound
    this.load();   
  }

  //The sound object's methods

  load() {
    //Use xhr to load the sound file
    let xhr = new XMLHttpRequest();
    xhr.open("GET", this.source, true);
    xhr.responseType = "arraybuffer";
    xhr.addEventListener("load", () => {

      //Decode the sound and store a reference to the buffer 
      this.actx.decodeAudioData(
        xhr.response, 
        buffer => {
          this.buffer = buffer;
          this.hasLoaded = true;

          //This next bit is optional, but important.
          //If you have a load manager in your game, call it here so that
          //the sound is registered as having loaded. 
          if (this.loadHandler) {
            this.loadHandler();
          }
        }, 

        //Throw an error if the sound can't be decoded
        error => {
          throw new Error("Audio could not be decoded: " + error);
        }
      );
    });

    //Send the request to load the file
    xhr.send();
  }

  play() {
    //Set the time to start the sound (immediately)
    this.startTime = this.actx.currentTime;

    //Create a sound node 
    this.soundNode = this.actx.createBufferSource();

    //Set the sound node's buffer property to the loaded sound
    this.soundNode.buffer = this.buffer;

    //Connect all the nodes
    this.soundNode.connect(this.volumeNode);
    //If there's no reverb, bypass the convolverNode
    if (this.reverb === false) {
      this.volumeNode.connect(this.panNode);
    } 
    //If there is reverb, connect the `convolverNode` and apply
    //the impulse response
    else {
      this.volumeNode.connect(this.convolverNode);
      this.convolverNode.connect(this.panNode);
      this.convolverNode.buffer = this.reverbImpulse;
    }
    this.panNode.connect(this.actx.destination);

    //To create the echo effect, connect the volume to the 
    //delay, the delay to the feedback, and the feedback to the
    //destination
    if (this.echo) {
      this.feedbackNode.gain.value = this.feebackValue;
      this.delayNode.delayTime.value = this.delayValue;
      this.filterNode.frequency.value = this.filterValue;
      this.delayNode.connect(this.feedbackNode);
      if (this.filterValue > 0) {
        this.feedbackNode.connect(this.filterNode);
        this.filterNode.connect(this.delayNode);
      } else {
        this.feedbackNode.connect(this.delayNode);
      }
      this.volumeNode.connect(this.delayNode);
      this.delayNode.connect(this.panNode);
    }

    //Will the sound loop? This can be `true` or `false`
    this.soundNode.loop = this.loop;

    //Set the playback rate
    this.soundNode.playbackRate.value = this.playbackRate;

    //Finally, use the `start` method to play the sound.
    //The start time will either be `currentTime`,
    //or a later time if the sound was paused
    this.soundNode.start(
      this.startTime, 
      this.startOffset % this.buffer.duration
    );

    //Set `playing` to `true` to help control the 
    //`pause` and `restart` methods
    this.playing = true;

  }

  setReverb(duration = 2, decay = 2, reverse = false) {
    this.reverbImpulse = impulseResponse(duration, decay, reverse);
    this.reverb = true;
  }

  setEcho(delayValue = 0.3, feedbackValue = 0.3, filterValue = 0) {
    this.delayValue = delayValue;
    this.feebackValue = feedbackValue;
    this.filterValue = filterValue;
    this.echo = true;
  }

  pause() {
    //Pause the sound if it's playing, and calculate the
    //`startOffset` to save the current position 
    if (this.playing) {
      this.soundNode.stop(this.actx.currentTime);
      this.startOffset += this.actx.currentTime - this.startTime;
      this.playing = false;
      console.log(this.startOffset);
    }
  }

  restart() {
    //Stop the sound if it's playing, reset the start and offset times,
    //then call the `play` method again
    if (this.playing) {
      this.soundNode.stop(this.actx.currentTime);
    }
    this.startOffset = 0;
    this.startPoint = 0;
    this.endPoint = this.buffer.duration;
    this.play();
  }

  playFrom(value) {
    if (this.playing) {
      this.soundNode.stop(this.actx.currentTime);
    }
    this.startOffset = value;
    this.play();
  }
  
  //An experimental `playSection` method used to play a section of a
  //sound
  playSection(start, end) {
    if (this.playing) {
      this.soundNode.stop(this.actx.currentTime);
    }

    if (this.startOffset === 0) this.startOffset = start;

    //Set the time to start the sound (immediately)
    this.startTime = this.actx.currentTime;

    //Create a sound node 
    this.soundNode = this.actx.createBufferSource();

    //Set the sound node's buffer property to the loaded sound
    this.soundNode.buffer = this.buffer;

    //Connect the sound to the pan, connect the pan to the
    //volume, and connect the volume to the destination
    this.soundNode.connect(this.panNode);
    this.panNode.connect(this.volumeNode);
    this.volumeNode.connect(this.actx.destination);

    //Will the sound loop? This can be `true` or `false`
    this.soundNode.loop = this.loop;
    this.soundNode.loopStart = start;
    this.soundNode.loopEnd = end;

    //Find out what the duration of the sound is
    let duration = end - start;

    //Finally, use the `start` method to play the sound.
    //The start time will either be `currentTime`,
    //or a later time if the sound was paused
    this.soundNode.start(
      this.startTime, 
      this.startOffset % this.buffer.duration,
      duration
    );

    //Set `playing` to `true` to help control the 
    //`pause` and `restart` methods
    this.playing = true;
  }

  //Volume and pan getters/setters

  get volume() {
    return this.volumeValue;
  }
  set volume(value) {
    this.volumeNode.gain.value = value;
    this.volumeValue = value;
  }

  get pan() {
    return this.panNode.pan.value;
  }
  set pan(value) {
    this.panNode.pan.value = value;
  }
}

//Create a high-level wrapper to keep our API consistent and flexible
export function makeSound(source, loadHandler) {
  return new Sound(source, loadHandler);  
}

/*
soundEffect
-----------

The `soundEffect` function lets you generate your sounds and musical notes from scratch
(Reverb effect requires the `impulseResponse` function that you'll see further ahead in this file)
Here's a model the illustrates how to use it, along with a description
of the parameters

    soundEffect(
      frequencyValue,  //The sound's fequency pitch in Hertz
      attack,          //The time, in seconds, to fade the sound in
      decay,           //The time, in seconds, to fade the sound out
      type,            //waveform type: "sine", "triangle", "square", "sawtooth"
      volumeValue,     //The sound's maximum volume
      panValue,        //The speaker pan. left: -1, middle: 0, right: 1
      wait,            //The time, in seconds, to wait before playing the sound
      pitchBendAmount, //The number of Hz in which to bend the sound's pitch down
      reverse,         //If `reverse` is true the pitch will bend up
      randomValue,     //A range, in Hz, within which to randomize the pitch
      dissonance,      //A value in Hz. Creates 2 additional dissonant frequencies 
      echo,            //An array: [delayTime, feedbackTime, filterValue]
      reverb           //An array: [duration, decayRate, reverse?]
    );

To create a custom sound effect, define all the parameters that characterize your sound. Here's how to
create a laser shooting sound:

    soundEffect(
      1046.5,           //frequency
      0,                //attack
      0.3,              //decay
      "sawtooth",       //waveform
      1,                //Volume
      -0.8,             //pan
      0,                //wait before playing
      1200,             //pitch bend amount
      false,            //reverse bend
      0,                //random pitch range
      25,               //dissonance
      [0.2, 0.2, 2000], //echo: [delay, feedback, filter]
      undefined         //reverb: [duration, decay, reverse?]
    );

Experiment by changing these parameters to see what kinds of effects you can create, and build
your own library of custom sound effects for games.
*/

export function soundEffect(
  frequencyValue, 
  attack = 0,
  decay = 1, 
  type = "sine", 
  volumeValue = 1,
  panValue = 0,
  wait = 0,
  pitchBendAmount = 0,
  reverse = false,
  randomValue = 0,
  dissonance = 0,
  echo = undefined,
  reverb = undefined
) {

  //Create oscillator, gain and pan nodes, and connect them
  //together to the destination
  let oscillator = actx.createOscillator(),
      volume = actx.createGain(),
      pan = actx.createStereoPanner();

  oscillator.connect(volume);
  volume.connect(pan);
  pan.connect(actx.destination);

  //Set the supplied values
  volume.gain.value = volumeValue;
  pan.pan.value = panValue;
  oscillator.type = type;

  //Optionally randomize the pitch. If the `randomValue` is greater
  //than zero, a random pitch is selected that's within the range
  //specified by `frequencyValue`. The random pitch will be either
  //above or below the target frequency.
  let frequency;
  let randomInt = (min, max) => {
   return Math.floor(Math.random() * (max - min+ 1)) + min;
  }
  if (randomValue > 0) {
    frequency = randomInt(
      frequencyValue - randomValue / 2,
      frequencyValue + randomValue / 2
    );
  } else {
    frequency = frequencyValue;
  }
  oscillator.frequency.value = frequency;

  //Apply effects
  if (attack > 0) fadeIn(volume);
  if (decay > 0) fadeOut(volume);
  if (pitchBendAmount > 0) pitchBend(oscillator);
  if (echo) addEcho(volume);
  if (reverb) addReverb(volume);  
  if (dissonance > 0) addDissonance();

  //Play the sound
  play(oscillator);

  //The helper functions:

  //Reverb
  function addReverb(volumeNode) {
    let convolver = actx.createConvolver();
    convolver.buffer = impulseResponse(reverb[0], reverb[1], reverb[2]);
    volumeNode.connect(convolver);
    convolver.connect(pan);
  }  

  //Echo
  function addEcho(volumeNode) {

    //Create the nodes
    let feedback = actx.createGain(),
        delay = actx.createDelay(),
        filter = actx.createBiquadFilter();

    //Set their values (delay time, feedback time and filter frequency)
    delay.delayTime.value = echo[0];
    feedback.gain.value = echo[1];
    if (echo[2]) filter.frequency.value = echo[2];

    //Create the delay feedback loop, with
    //optional filtering
    delay.connect(feedback);
    if (echo[2]) {
      feedback.connect(filter);
      filter.connect(delay);
    } else {
      feedback.connect(delay);
    }

    //Connect the delay loop to the oscillator's volume
    //node, and then to the destination
    volumeNode.connect(delay);

    //Connect the delay loop to the main sound chain's
    //pan node, so that the echo effect is directed to
    //the correct speaker
    delay.connect(pan);
  }

  //Fade in (the sound’s “attack”)
  function fadeIn(volumeNode) {

    //Set the volume to 0 so that you can fade in from silence
    volumeNode.gain.value = 0;

    volumeNode.gain.linearRampToValueAtTime(
      0, actx.currentTime + wait
    );
    volumeNode.gain.linearRampToValueAtTime(
      volumeValue, actx.currentTime + wait + attack
    );
  }

  //Fade out (the sound’s “decay”)
  function fadeOut(volumeNode) {
    volumeNode.gain.linearRampToValueAtTime(
      volumeValue, actx.currentTime + attack + wait
    );
    volumeNode.gain.linearRampToValueAtTime(
      0, actx.currentTime + wait + attack + decay
    );
  }

  //Pitch bend.
  //Uses `linearRampToValueAtTime` to bend the sound’s frequency up or down
  function pitchBend(oscillatorNode) {

    //Get the frequency of the current oscillator
    let frequency = oscillatorNode.frequency.value;

    //If `reverse` is true, make the sound drop in pitch.
    //(Useful for shooting sounds)
    if (!reverse) {
      oscillatorNode.frequency.linearRampToValueAtTime(
        frequency, 
        actx.currentTime + wait
      );
      oscillatorNode.frequency.linearRampToValueAtTime(
        frequency - pitchBendAmount, 
        actx.currentTime + wait + attack + decay
      );
    }

    //If `reverse` is false, make the note rise in pitch. 
    //(Useful for jumping sounds)
    else {
      oscillatorNode.frequency.linearRampToValueAtTime(
        frequency, 
        actx.currentTime + wait
      );
      oscillatorNode.frequency.linearRampToValueAtTime(
        frequency + pitchBendAmount, 
        actx.currentTime + wait + attack + decay
      );
    }
  }

  //Dissonance
  function addDissonance() {

    //Create two more oscillators and gain nodes
    let d1 = actx.createOscillator(),
        d2 = actx.createOscillator(),
        d1Volume = actx.createGain(),
        d2Volume = actx.createGain();

    //Set the volume to the `volumeValue`
    d1Volume.gain.value = volumeValue;
    d2Volume.gain.value = volumeValue;

    //Connect the oscillators to the gain and destination nodes
    d1.connect(d1Volume);
    d1Volume.connect(actx.destination);
    d2.connect(d2Volume);
    d2Volume.connect(actx.destination);

    //Set the waveform to "sawtooth" for a harsh effect
    d1.type = "sawtooth";
    d2.type = "sawtooth";

    //Make the two oscillators play at frequencies above and
    //below the main sound's frequency. Use whatever value was
    //supplied by the `dissonance` argument
    d1.frequency.value = frequency + dissonance;
    d2.frequency.value = frequency - dissonance;

    //Apply effects to the gain and oscillator
    //nodes to match the effects on the main sound
    if (attack > 0) {
      fadeIn(d1Volume);
      fadeIn(d2Volume);
    }
    if (decay > 0) {
      fadeOut(d1Volume);
      fadeOut(d2Volume);
    }
    if (pitchBendAmount > 0) {
      pitchBend(d1);
      pitchBend(d2);
    }
    if (echo) {
      addEcho(d1Volume);
      addEcho(d2Volume);
    }
    if (reverb) {
      addReverb(d1Volume);
      addReverb(d2Volume);
    }

    //Play the sounds
    play(d1);
    play(d2);
  }

  //The `play` function that starts the oscillators
  function play(oscillatorNode) {
    oscillatorNode.start(actx.currentTime + wait);
  }
}




//`impulseResponse` is a function that uses a convolver node to create
//a dynamic reverb effect
//based on "Simple-Reverb": github.com/web-audio-components/simple-reverb
function impulseResponse(duration = 2, decay = 2, reverse = false) {

  //The length of the reverb effect will be the audio context's
  //`sampleRate` (the sound resolution) multiplied by the supplied duration
  let length = actx.sampleRate * duration;

  //Create an audio buffer (an empty sound container) to store the 
  //reverb effect. The audio context's `createBuffer` method lets you
  //do this. It creates a space in memory to store all the sound data in 
  //"sample frame" units. It takes three arguments: 
  //1. numberOfChannels: 2, for right and left speakers (maximum is 32) 
  //bufferSize: the size of the buffer in sample frames 
  //sampleRate: the resolution of the sound
  let impulse = actx.createBuffer(2, length, actx.sampleRate);

  //Use `getChannelData` to initialize empty arrays to store sound data for
  //the left and right channels. The left channel is `0`, the right
  //channel is `1`
  let left = impulse.getChannelData(0),
      right = impulse.getChannelData(1);

  //Fill each channel data array element with random white noise that decays
  //logarithmically (a natural sounding proportionate way). 
  //This noise will be used by the convolver node to
  //create the reverb effect
  
  //Loop through each sample-frame and fill the channel
  //data with random noise
  for (let i = 0; i < length; i++){
    //Apply the reverse effect, if `reverse` is `true`
    let n;
    if (reverse) {
      n = length - i;
    } else {
      n = i;
    }
    //Fill the left and right channels with random white noise which
    //decays exponentially
    left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
  }
  return impulse;
}

