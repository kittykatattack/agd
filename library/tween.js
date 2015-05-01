/*
tweens
------
An array to store all the tweens in the game
*/

export let tweens = [];

//Easing functions

//Linear
let linear = x => x;

//Smoothstep
let smoothstep = x => x * x * (3 - 2 * x);
let smoothstepSquared = x => Math.pow((x * x * (3 - 2 * x)), 2);
let smoothstepCubed = x => Math.pow((x * x * (3 - 2 * x)), 3);

//Acceleration
let acceleration = x => x * x;
let accelerationCubed = x => Math.pow(x * x, 3);

//Deceleration
let deceleration = x => 1 - Math.pow(1 - x, 2);
let decelerationCubed = x => 1 - Math.pow(1 - x, 3);

//Sine
let sine = x => Math.sin(x * Math.PI / 2);
let sineSquared = x => Math.pow(Math.sin(x * Math.PI / 2), 2);
let sineCubed = x => Math.pow(Math.sin(x * Math.PI / 2), 2);
let inverseSine = x => 1 - Math.sin((1 - x) * Math.PI / 2);
let inverseSineSquared = x => 1 - Math.pow(Math.sin((1 - x) * Math.PI / 2), 2);
let inverseSineCubed = x => 1 - Math.pow(Math.sin((1 - x) * Math.PI / 2), 3);
//`sineComplete` uses the whole sine curve, and the effect is the same as
//smoothstep, but more computationally expensive.
let sineComplete = x => 0.5 - Math.cos(-x * Math.PI) * 0.5;

//Weighted average
//Good to use if the destination value is changing dynamically
//arguments: 
//`p`: sprite property, 
//`d`: destination value, 
//`w`: amount to weight (5 to 50 is a good range of values to start with)
let weightedAverage = (p, d, w) => ((p * (w - 1)) + d) / w; 

//Spline
//An implementation of Catmull-Rom spline
//arguments:
//t: ratio
//p0 to p3: points along the path
let spline = (t, a, b, c, d) => {
  return 0.5 * (
    (2 * b) +
    (-a + c) * t +
    (2 * a - 5 * b + 4 * c - d) * t * t +
    (-a + 3 * b - 3 * c + d) * t * t * t
  );
}

//Bezier curve
function cubicBezier(t, a, b, c, d) {
    var t2 = t * t;
    var t3 = t2 * t;
    return a  
      + (-a * 3 + t * (3 * a - a * t)) * t
      + (3 * b + t * (-6 * b + b * 3 * t)) * t 
      + (c * 3 - c * 3 * t) * t2 + d * t3;
}


let ease = {

  //Linear
  linear(x) {return x;},

  //Smoothstep
  smoothstep(x) {return x * x * (3 - 2 * x);},
  smoothstepSquared(x) {return Math.pow((x * x * (3 - 2 * x)), 2);},
  smoothstepCubed(x) {return Math.pow((x * x * (3 - 2 * x)), 3);},

  //Acceleration
  acceleration(x) {return x * x;},
  accelerationCubed(x) {return Math.pow(x * x, 3);},

  //Deceleration
  deceleration(x) {return 1 - Math.pow(1 - x, 2);},
  decelerationCubed(x) {return 1 - Math.pow(1 - x, 3);},

  //Sine
  sine(x) {return Math.sin(x * Math.PI / 2);},
  sineSquared(x) {return Math.pow(Math.sin(x * Math.PI / 2), 2);},
  sineCubed(x) {return Math.pow(Math.sin(x * Math.PI / 2), 2);},
  inverseSine(x) {return 1 - Math.sin((1 - x) * Math.PI / 2);},
  inverseSineSquared(x) {return 1 - Math.pow(Math.sin((1 - x) * Math.PI / 2), 2);},
  inverseSineCubed(x) {return 1 - Math.pow(Math.sin((1 - x) * Math.PI / 2), 3);},

  //Spline
  spline (t, p0, p1, p2, p3) {
    return 0.5 * (
      (2 * p1) +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
    );
  }
};

export function tweenProperty(
  sprite,                  //Sprite object
  property,                //String property
  startValue,              //Tween start value
  endValue,                //Tween end value
  totalFrames,             //Duration in frames
  type = ["smoothstep"],   //The easing type
  yoyo = false,            //Yoyo?
  delayBeforeRepeat = 0    //Delay in milliseconds before repeating
) {

  //Create the tween object
  let o = {};

  //If the tween is a spline, set the
  //start and end magnitude values
  if(type[0] === "spline" ){
    o.startMagnitude = type[1];
    o.endMagnitude = type[2];
  }

  //Use `o.start` to make a new tween using the current
  //end point values
  o.start = (startValue, endValue) => {

    //Clone the start and end values so that any possible references to sprite
    //properties are converted to ordinary numbers 
    o.startValue = JSON.parse(JSON.stringify(startValue));
    o.endValue = JSON.parse(JSON.stringify(endValue));
    o.playing = true;
    o.totalFrames = totalFrames;
    o.frameCounter = 0;

    //Add the tween to the global `tweens` array. The `tweens` array is
    //updated on each frame
    tweens.push(o);
  };

  //Call `o.start` to start the tween
  o.start(startValue, endValue);

  //The `update` method will be called on each frame by the game loop.
  //This is what makes the tween move
  o.update = () => {
    
    let time, curvedTime;

    if (o.playing) {

      //If the elapsed frames are less than the total frames,
      //use the tweening formulas to move the sprite
      if (o.frameCounter < o.totalFrames) {

        //Find the normalized value
        let normalizedTime = o.frameCounter / o.totalFrames;

        //Select the correct easing function from the 
        //`ease` object’s library of easing functions


        //If it's not a spline, use one of the ordinary easing functions
        if (type[0] !== "spline") {
          curvedTime = ease[type](normalizedTime);
        } 
        
        //If it's a spline, use the `spline` function and apply the
        //2 additional `type` array values as the spline's start and
        //end points
        else {
          curvedTime = ease.spline(normalizedTime, o.startMagnitude, 0, 1, o.endMagnitude);
        }

        //Interpolate the sprite's property based on the curve
        sprite[property] = (o.endValue * curvedTime) + (o.startValue * (1 - curvedTime));

        o.frameCounter += 1;
      }

      //When the tween has finished playing, run the end tasks
      else {
       o.end(); 
      }
    }
  };
    
  //The `end` method will be called when the tween is finished
  o.end = () => {

    //Set `playing` to `false`
    o.playing = false;

    //Call the tween's `onComplete` method, if it's been assigned
    if (o.onComplete) o.onComplete();

    //Remove the tween from the `tweens` array
    tweens.splice(tweens.indexOf(o), 1);

    //If the tween's `yoyo` property is `true`, create a new tween
    //using the same values, but use the current tween's `startValue`
    //as the next tween's `endValue` 
    if (yoyo) {
      wait(delayBeforeRepeat).then(() => {
        o.start(o.endValue, o.startValue);
      });
    }
  };

  //Pause and play methods
  o.play = () => o.playing = true;
  o.pause = () => o.playing = false;
  
  //Return the tween object
  return o;
}

/* High level tween functions */

//`fadeOut`
export function fadeOut(sprite, frames = 60) {
  return tweenProperty(
    sprite, "alpha", sprite.alpha, 0, frames, ["sine"]
  );
}

//`fadeIn`
export function fadeIn(sprite, frames = 60) {
  return tweenProperty(
    sprite, "alpha", sprite.alpha, 1, frames, ["sine"]
  );
}

//`pulse`
//Fades the sprite in and out at a steady rate.
//Set the `minAlpha` to something greater than 0 if you
//don't want the sprite to fade away completely
export function pulse(sprite, frames = 60, minAlpha = 0) {
  return tweenProperty(
    sprite, "alpha", sprite.alpha, minAlpha, frames, ["smoothstep"], true
  );
}

//`makeTween` is a general function for making complex tweens
//out of multiple `tweenProperty` functions. It's one argument,
//`tweensToAdd` is an array containing multiple `tweenProperty` calls

function makeTween(tweensToAdd) {

  //Create an object to manage the tweens
  let o = {};

  //Create a `tweens` array to store the new tweens
  o.tweens = [];

  //Make a new tween for each array
  tweensToAdd.forEach(tweenPropertyArguments => {
     
     //Use the tween property arguments to make a new tween
     let newTween = tweenProperty(...tweenPropertyArguments);

     //Push the new tween into this object's internal `tweens` array
     o.tweens.push(newTween);
  });

  //Add a counter to keep track of the
  //number of tweens that have completed their actions
  let completionCounter = 0;
  
  //`o.completed` will be called each time one of the tweens
  //finishes
  o.completed = () => {

    //Add 1 to the `completionCounter`
    completionCounter += 1;

    //If all tweens have finished, call the user-defined `onComplete`
    //method, if it's been assigned. Reset the `completionCounter`
    if (completionCounter === o.tweens.length) {
      if (o.onComplete) o.onComplete();
      completionCounter = 0;
    }
  }; 

  //Add `onComplete` methods to all tweens
  o.tweens.forEach(tween => {
    tween.onComplete = () => o.completed();
  });
  
  //Add pause and play methods to control all the tweens
  o.pause = () => {
    o.tweens.forEach(tween => {
      tween.playing = false;
    });
  };
  o.play = () => {
    o.tweens.forEach(tween => {
      tween.playing = true;
    });
  };

  //Return the tween object
  return o;
}

export function slide(
  sprite, endX, endY, 
  frames = 60, type = ["smoothstep"], yoyo = false, delayBeforeRepeat = 0
) {
  return makeTween([ 

    //Create the x axis tween
    [sprite, "x", sprite.x, endX, frames, type, yoyo, delayBeforeRepeat],

    //Create the y axis tween
    [sprite, "y", sprite.y, endY, frames, type, yoyo, delayBeforeRepeat]

  ]);
}

export function breathe(
  sprite, endScaleX, endScaleY, 
  frames = 60, yoyo = true, delayBeforeRepeat = 0
) {
  return makeTween([ 

    //Create the scaleX tween
    [
      sprite, "scaleX", sprite.scaleX, endScaleX, 
      frames, ["smoothstepSquared"], yoyo, delayBeforeRepeat
    ],

    //Create the scaleY tween
    [
      sprite, "scaleY", sprite.scaleY, endScaleY, 
      frames, ["smoothstepSquared"], yoyo, delayBeforeRepeat
    ]
  ]);
}

export function scale(sprite, endScaleX, endScaleY, frames = 60) {
  return makeTween([ 

    //Create the scaleX tween
    [
      sprite, "scaleX", sprite.scaleX, endScaleX, 
      frames, ["smoothstep"], false
    ],

    //Create the scaleY tween
    [
      sprite, "scaleY", sprite.scaleY, endScaleY, 
      frames, ["smoothstep"], false
    ]
  ]);
}

export function strobe(
  sprite, scaleFactor = 1.3, startMagnitude = 10, endMagnitude = 20, 
  frames = 10, yoyo = true, delayBeforeRepeat = 0
) {
  return makeTween([ 

    //Create the scaleX tween
    [
      sprite, "scaleX", sprite.scaleX, scaleFactor, frames, 
      ["spline", startMagnitude, endMagnitude], yoyo, delayBeforeRepeat
    ],

    //Create the scaleY tween
    [
      sprite, "scaleY", sprite.scaleY, scaleFactor, frames, 
      ["spline", startMagnitude, endMagnitude], 
      yoyo, delayBeforeRepeat
    ]
  ]);
}

export function wobble(
  sprite, 
  scaleFactorX = 1.2, 
  scaleFactorY = 1.2, 
  frames = 10,
  xStartMagnitude = 10, 
  xEndMagnitude = 10,
  yStartMagnitude = -10, 
  yEndMagnitude = -10,
  friction = 0.98,
  yoyo = true,
  delayBeforeRepeat = 0
) {

  let o = makeTween([ 

    //Create the scaleX tween
    [
      sprite, "scaleX", sprite.scaleX, scaleFactorX, frames, 
      ["spline", xStartMagnitude, xEndMagnitude], 
      yoyo, delayBeforeRepeat
    ],

    //Create the scaleY tween
    [
      sprite, "scaleY", sprite.scaleY, scaleFactorY, frames, 
      ["spline", yStartMagnitude, yEndMagnitude], 
      yoyo, delayBeforeRepeat
    ]
  ]);

  //Add some friction to the `endValue` at the end of each tween 
  o.tweens.forEach(tween => {
    tween.onComplete = () => {

      //Add friction if the `endValue` is greater than 1
      if (tween.endValue > 1) {
        tween.endValue *= friction;

        //Set the `endValue` to 1 when the effect is finished and 
        //remove the tween from the global `tweens` array
        if (tween.endValue <= 1) {
          tween.endValue = 1; 
          removeTween(tween);
        }
      }
    };
  });

  return o;
}

/*
removeTween
-----------
A utility to remove tweens from the game

*/
export function removeTween(tweenObject) {

  //Remove the tween if `tweenObject` doesn't have any nested
  //tween objects
  if(!tweenObject.tweens) {
    tweenObject.pause();
    tweens.splice(tweens.indexOf(tweenObject), 1);
  
  //Otherwise, remove the nested tween objects
  } else {
    tweenObject.pause();
    tweenObject.tweens.forEach(element => {
      tweens.splice(tweens.indexOf(element), 1);
    });
  }
}

/*
followCurve
------------
*/

export function followCurve(
  sprite,
  pointsArray,
  totalFrames, 
  type = ["smoothstep"],
  yoyo = false, 
  delayBeforeRepeat = 0
) {

  //Create the tween object
  let o = {};

  if(type[0] === "spline" ){
    o.startMagnitude = type[1];
    o.endMagnitude = type[2];
  }

  //Use `tween.start` to make a new tween using the current
  //end point values
  o.start = (pointsArray) => {
    o.playing = true;
    o.totalFrames = totalFrames;
    o.frameCounter = 0;

    //Clone the points array
    o.pointsArray = JSON.parse(JSON.stringify(pointsArray));

    //Add the tween to the global `tweens` array. The global `tweens` array is
    //updated on each frame
    tweens.push(o);
  };

  //Call `tween.start` to start the first tween
  o.start(pointsArray);

  //The `update` method will be called on each frame by the game loop.
  //This is what makes the tween move
  o.update = () => {
    
    let normalizedTime, curvedTime, 
        p = o.pointsArray;

    if (o.playing) {

      //If the elapsed frames are less than the total frames,
      //use the tweening formulas to move the sprite
      if (o.frameCounter < o.totalFrames) {

        //Find the normalized value
        normalizedTime = o.frameCounter / o.totalFrames;

        //Select the correct easing function
        
        //If it's not a spline, use one of the ordinary tween
        //functions
        if (type[0] !== "spline") {
          curvedTime = ease[type](normalizedTime);
        } 
        
        //If it's a spline, use the `spine` function and apply the
        //2 additional `type` array values as the spline's start and
        //end points
        else {
          //curve = tweenFunction.spline(n, type[1], 0, 1, type[2]);
          curvedTime = ease.spline(normalizedTime, o.startMagnitude, 0, 1, o.endMagnitude);
        }

        //Apply the Bezier curve to the sprite's position 
        sprite.x = cubicBezier(curvedTime, p[0][0], p[1][0], p[2][0], p[3][0]);
        sprite.y = cubicBezier(curvedTime, p[0][1], p[1][1], p[2][1], p[3][1]);
        
        //Add one to the `elapsedFrames`
        o.frameCounter += 1;
      }

      //When the tween has finished playing, run the end tasks
      else {
       o.end(); 
      }
    }
  };
    
  //The `end` method will be called when the tween is finished
  o.end = () => {

    //Set `playing` to `false`
    o.playing = false;

    //Call the tween's `onComplete` method, if it's been
    //assigned
    if (o.onComplete) o.onComplete();

    //Remove the tween from the global `tweens` array
    tweens.splice(tweens.indexOf(o), 1);

    //If the tween's `yoyo` property is `true`, reverse the array and
    //use it to create a new tween
    if (yoyo) {
      wait(delayBeforeRepeat).then(() => {
        o.pointsArray = o.pointsArray.reverse();
        o.start(o.pointsArray);
      });
    }
  };

  //Pause and play methods
  o.pause = () => {
    o.playing = false;
  };
  o.play = () => {
    o.playing = true;
  };
  
  //Return the tween object
  return o;
}


export function walkPath(
  sprite,                   //The sprite
  originalPathArray,        //A 2D array of waypoints
  totalFrames = 300,        //The duration, in frames
  type = ["smoothstep"],    //The easing type
  loop = false,             //Should the animation loop?
  yoyo = false,             //Shoud the direction reverse?
  delayBetweenSections = 0  //Delay, in milliseconds, between sections
) {
  
  //Clone the path array so that any possible references to sprite
  //properties are converted into ordinary numbers 
  let pathArray = JSON.parse(JSON.stringify(originalPathArray));

  //Figure out the duration, in frames, of each path section by 
  //dividing the `totalFrames` by the length of the `pathArray`
  let frames = totalFrames / pathArray.length;
  
  //Set the current point to 0, which will be the first waypoint
  let currentPoint = 0;

  //Make the first path using the internal `makePath` function (below)
  let tween = makePath(currentPoint);

  //The `makePath` function creates a single tween between two points and
  //then schedules the next path to be made after it

  function makePath(currentPoint) {

    //Use the `makeTween` function to tween the sprite's
    //x and y position
    let tween = makeTween([ 

      //Create the x axis tween between the first x value in the
      //current point and the x value in the following point
      [
        sprite, 
        "x", 
        pathArray[currentPoint][0], 
        pathArray[currentPoint + 1][0], 
        frames, 
        type
      ],

      //Create the y axis tween in the same way
      [
        sprite, 
        "y", 
        pathArray[currentPoint][1], 
        pathArray[currentPoint + 1][1], 
        frames, 
        type
      ]
    ]);

    //When the tween is complete, advance the `currentPoint` by one.
    //Add an optional delay between path segments, and then make the
    //next connecting path
    tween.onComplete = () => {

      //Advance to the next point
      currentPoint += 1;

      //If the sprite hasn't reached the end of the
      //path, tween the sprite to the next point
      if (currentPoint < pathArray.length - 1) {
        wait(delayBetweenSections).then(() => {
          tween = makePath(currentPoint);
        });
      } 
      
      //If we've reached the end of the path, optionally
      //loop and yoyo it
      else {

        //Reverse the path if `loop` is `true`
        if (loop) {

          //Reverse the array if `yoyo` is `true`
          if (yoyo) pathArray.reverse();

          //Optionally wait before restarting
          wait(delayBetweenSections).then(() => {

            //Reset the `currentPoint` to 0 so that we can
            //restart at the first point
            currentPoint = 0;

            //Set the sprite to the first point
            sprite.x = pathArray[0][0];
            sprite.y = pathArray[0][1];

            //Make the first new path
            tween = makePath(currentPoint);

            //... and so it continues!
          });
        }
      }
    };

    //Return the path tween to the main function
    return tween;
  }

  //Pass the tween back to the main program
  return tween;
}

export function walkCurve(
  sprite,                  //The sprite
  pathArray,               //2D array of Bezier curves
  totalFrames = 300,       //The duration, in frames
  type = ["smoothstep"],   //The easing type
  loop = false,            //Should the animation loop?
  yoyo = false,            //Should the direction reverse?
  delayBeforeContinue = 0  //Delay, in milliseconds, between sections
) {

  //Divide the `totalFrames` into sections for each part of the path
  let frames = totalFrames / pathArray.length;
  
  //Set the current curve to 0, which will be the first one
  let currentCurve = 0;

  //Make the first path
  let tween = makePath(currentCurve);

  function makePath(currentCurve) {

    //Use the custom `followCurve` function to make
    //a sprite follow a curve
    let tween = followCurve(
      sprite, 
      pathArray[currentCurve],
      frames,
      type
    );

    //When the tween is complete, advance the `currentCurve` by one.
    //Add an optional delay between path segments, and then make the
    //next path
    tween.onComplete = () => {
      currentCurve += 1;
      if (currentCurve < pathArray.length) {
        wait(delayBeforeContinue).then(() => {
          tween = makePath(currentCurve);
        });
      } 
      
      //If we've reached the end of the path, optionally
      //loop and reverse it
      else {
        if (loop) {
          if (yoyo) {

            //Reverse order of the curves in the `pathArray` 
            pathArray.reverse();

            //Reverse the order of the points in each curve
            pathArray.forEach(curveArray => curveArray.reverse());
          }

          //After an optional delay, reset the sprite to the
          //beginning of the path and make the next new path
          wait(delayBeforeContinue).then(() => {
            currentCurve = 0;
            sprite.x = pathArray[0][0];
            sprite.y = pathArray[0][1];
            tween = makePath(currentCurve);
          });
        }
      }
    };

    //Return the path tween to the main function
    return tween;
  }
  
  //Pass the tween back to the main program
  return tween;
}

/*
Wait
----

Lets you set up a timed sequence of events

    wait(1000)
      .then(() => console.log("One"))
      .then(() => wait(1000))
      .then(() => console.log("Two"))
      .then(() => wait(1000))
      .then(() => console.log("Three"))

*/

function wait(duration = 0) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, duration);
  });
}

/*
//This is the older version of the `slide` function that didn't use
//`makeTween`
export function slide(sprite, endX, endY, frames, type, yoyo, delayBeforeRepeat) {

  //Create a `tween` object to store the two x and y tweens
  let tween = {};

  //Create the x axis tween
  tween.x = tweenProperty(
    sprite, "x", sprite.x, endX, frames, type, yoyo, delayBeforeRepeat
  );

  //Create the y axis tween
  tween.y = tweenProperty(
    sprite, "y", sprite.x, endY, frames, type, yoyo, delayBeforeRepeat
  );
  
  //Add a counter to the `tween` object to keep track of the
  //number of tweens that have complete their actions.
  tween.completionCounter = 0;

  //`tween.completed` will be called each time one of the tweens
  //finishes
  tween.completed = () => {

    //Add 1 to the `completionCounter`
    tween.completionCounter += 1;

    //If both tweens have finished, call the user-defined `onComplete`
    //method, if it's been assigned. Reset the `completionCounter`
    if (tween.completionCounter === 2) {
      if (tween.onComplete) tween.onComplete();
      tween.completionCounter = 0;
    }
  }; 

  //Add `onComplete` methods to both tweens
  tween.x.onComplete = () => tween.completed();
  tween.y.onComplete = () => tween.completed();
  
  //Add pause and play methods
  tween.pause = () => {
    tween.x.playing = false;
    tween.y.playing = false;
  };
  tween.play = () => {
    tween.x.playing = true;
    tween.y.playing = true;
  };

  //Return this `tween` object
  return tween;
}
*/


/* 
tween
-----
A universal property tweening function
`slide` arguments:
sprite, destinationX, destinationY, speed
*/

/*
export function tweenProperty(sprite, property, startValue, endValue, speed, yoyo = true, delay = false) {

  //Create the tween object
  let tween = {};

  //Use `tween.start` to make a new tween using the current
  //end point values
  tween.start = (startValue, endValue) => {
    tween.startValue = startValue;
    tween.endValue = endValue;
    tween.playing = true;
    tween.i = 0;

    //Add the tween to the `tweens` array. The `tweens` array is
    //updated on each frame
    tweens.push(tween);
  };

  //Call `tween.start` to start the first tween
  tween.start(startValue, endValue);

  //The `update` method will be called on each frame by the game loop.
  //This is what makes the tween move
  tween.update = () => {
    if (tween.playing) {

      //If the sprite's property value is greater than the `endValue`
      //tween the value down
      if (tween.endValue < sprite[property]) {
        if (sprite[property] > tween.endValue) {
          sprite[property] -= speed;
          if (sprite[property] < tween.endValue) sprite[property] = tween.endValue;
        } else {
          tween.end();
        }
      }

      //If the sprite's property value is less than the `endValue`
      //tween the value up
      else {
        if (sprite[property] < tween.endValue) {
          sprite[property] += speed;
          if (sprite[property] > tween.endValue) sprite[property] = tween.endValue;
        } else {
          tween.end();
        }
      }
    }
  };
    
  //The `end` method will be called when the tween is finsihed
  tween.end = () => {
    tween.playing = false;

    //Call the tween's `onComplete` method, if it's been
    //assigned
    if (tween.onComplete) tween.onComplete();

    //Remove the tween from the `tweens` array
    tweens.splice(tweens.indexOf(tween), 1);

    //If the tween's `yoyo` property is `true`, create a new tween
    //using the same values, but use the current tween's alpha
    //value as the next tween's alpha value 
    if (yoyo) {
      wait(delay).then(
        () => tween.start(tween.endValue, tween.startValue)
      );
    }
  };

  //Pause and play methods
  tween.pause = () => {
    tween.playing = false;
  };
  tween.play = () => {
    tween.playing = true;
  };
  
  //Return the tween object
  return tween;
}
*/


/* 
slide
-----
Use `slide` to ease a sprite to a new position.
`slide` arguments:
sprite, destinationX, destinationY, speed
*/

/*
export function slide(sprite, endX, endY, speed = 0.05, yoyo = false, delay = 0) {

  //Create the tween object
  let tween = {};

  //Use `createTween` to make a new tween using the current
  //end point values
  createTween(endX, endY);
  
  //Return the tween object
  return tween;

  function createTween(endX, endY) {

    //Capture the start and end points
    tween.startX = sprite.x;
    tween.startY = sprite.y;
    tween.endX = endX;
    tween.endY = endY;

    //Set the tween's `playing` property to true
    tween.playing = true;

    //The tween's `update` function will be called once
    //each frame inside the game loop
    tween.update = () => {

      //If the tween is playing, move it
      if (tween.playing) {
        let vx = tween.endX - sprite.x,
            vy = tween.endY - sprite.y,
            distance = Math.sqrt(vx * vx + vy * vy);

        if (distance >= 0.5) {
          sprite.x += vx * speed;
          sprite.y += vy * speed;
        } 
        
        //If the tween has reached its destination, stop it
        else {
          sprite.x = tween.endX;
          sprite.y = tween.endY;
          tween.playing = false;

          //Call the tween's `onComplete` method, if it's been
          //assigned
          if (tween.onComplete) tween.onComplete();

          //Remove the tween from the `tweens` array
          tweens.splice(tweens.indexOf(tween), 1);

          //If the tween's `yoyo` property is true, create a new tween
          //using the same values, but use the current tween's start
          //point as the next tween's end point 
          if (yoyo) {
            wait(delay).then(
              () => createTween(tween.startX, tween.startY)
            );
          };
        }
      }
    };

    //Give the tween `pause` and `play` methods
    tween.pause = () => {
      tween.playing = false;
    };
    tween.play = () => {
      tween.playing = true;
    };

    //Add the tween to the `tweens` array. The `tweens` array is
    //updated on each frame
    tweens.push(tween);
  }
}
*/

/*
fade
----
Use `fade` to fade-in or fade-out any sprite.
`fade` arguments:
sprite, speed, finalValue
*/
/*
export function fade(sprite, endAlpha = 0, speed = 0.02, yoyo = true, delay = 1000) {
  //Create the tween object
  let tween = {};

  //Use `createTween` to make a new tween using the current
  //end point values
  createTween(endAlpha);
  
  //Return the tween object
  return tween;

  function createTween(endAlpha) {
    tween.startAlpha = sprite.alpha;
    tween.endAlpha = endAlpha;
    tween.playing = true;
    tween.update = () => {
      if (tween.playing) {
        //Fade out
        if (tween.endAlpha < sprite.alpha) {
          if (sprite.alpha > tween.endAlpha) {
            sprite.alpha -= speed;
            if (sprite.alpha < tween.endAlpha) sprite.alpha = tween.endAlpha;
          } else {
            tween.playing = false;
            if (tween.onComplete) tween.onComplete();
            //Remove the tween from the `tweens` array
            tweens.splice(tweens.indexOf(tween), 1);
          }
        }
        else {
          //Fade in
          if (sprite.alpha < tween.endAlpha) {
            sprite.alpha += speed;
            if (sprite.alpha > tween.endAlpha) sprite.alpha = tween.endAlpha;
          } else {
            tween.playing = false;
            //Call the tween's `onComplete` method, if it's been
            //assigned
            if (tween.onComplete) tween.onComplete();

            //Remove the tween from the `tweens` array
            tweens.splice(tweens.indexOf(tween), 1);

            //If the tween's `yoyo` property is true, create a new tween
            //using the same values, but use the current tween's alpha
            //value as the next tween's alpha value 
            if (yoyo) {
              wait(delay).then(
                () => createTween(tween.startAlpha)
              );
            };
          }
        }
      }
    };

    //Pause and play methods
    tween.pause = () => {
      tween.playing = false;
    };
    tween.play = () => {
      tween.playing = true;
    };

    //Add the tween to the `tweens` array. The `tweens` array is
    //updated on each frame
    tweens.push(tween);
  }
}
*/

