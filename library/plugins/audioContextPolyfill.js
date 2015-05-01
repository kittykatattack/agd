//WebAudio API AudioContext polyfill 

(function() {

var vendors = ["ms", "webkit", "o"];

for(var x = 0; x < vendors.length && !window.AudioContext; ++x) 
{
  window.AudioContext = window[vendors[x]+"AudioContext"];
}
	
}());