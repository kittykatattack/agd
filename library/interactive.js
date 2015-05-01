/* 
interactive.js
==============

This JavaScript file contains objects useful for
adding interactivity to sprites. See the display.js file for
sprite classes that can use this code

*/


/*
makePointer
-----------
Makes a pointer object that unifies touch and mouse interactivity.
The pointer has `x` and `y` properties and `isUp`, `isDown` and
`tapped` Boolean states.
*/

export function makePointer(element, scale = 1) {

  let pointer = {
    element: element,
    scale: scale,

    //Private x and y properties
    _x: 0,
    _y: 0,

    //The public x and y properties are divided by the scale. If the
    //HTML element that the pointer is sensitive to (like the canvas)
    //is scaled up or down, you can change the `scale` value to
    //correct the pointer's position values
    get x() {
      return this._x / this.scale;
    },
    get y() {
      return this._y / this.scale;
    },

    //Add `centerX` and `centerY` getters so that we
    //can use the pointer's coordinates with easing
    //and collision functions
    get centerX() {
      return this.x; 
    },
    get centerY() {
      return this.y;
    },

    //`position` returns an object with x and y properties that
    //contain the pointer's position
    get position() {
      return {x: this.x, y: this.y};
    },
    
    //Booleans to track the pointer state
    isDown: false,
    isUp: true,
    tapped: false,

    //Properties to help measure the time between up and down states
    downTime: 0,
    elapsedTime: 0,

    //Optional `press`,`release` and `tap` methods
    press: undefined,
    release: undefined,
    tap: undefined,

    //A `dragSprite` property to help with drag and drop
    dragSprite: null,

    //The drag offsets to help drag sprites
    dragOffsetX: 0,
    dragOffsetY: 0,
    
    //The pointer's mouse `moveHandler`
    moveHandler(event) {

      //Get the element that's firing the event
      let element = event.target;

      //Find the pointer’s x and y position (for mouse).
      //Subtract the element's top and left offset from the browser window
      this._x = (event.pageX - element.offsetLeft);
      this._y = (event.pageY - element.offsetTop);

      //Prevent the event's default behavior 
      event.preventDefault();
    },

    //The pointer's `touchmoveHandler`
    touchmoveHandler(event) {
      let element = event.target;

      //Find the touch point's x and y position
      this._x = (event.targetTouches[0].pageX - element.offsetLeft);
      this._y = (event.targetTouches[0].pageY - element.offsetTop);
      event.preventDefault();
    },

    //The pointer's `downHandler`
    downHandler(event) {

      //Set the down states
      this.isDown = true;
      this.isUp = false;
      this.tapped = false;

      //Capture the current time
      this.downTime = Date.now();

      //Call the `press` method if it's been assigned
      if (this.press) this.press();
      event.preventDefault();
    },

    //The pointer's `touchstartHandler`
    touchstartHandler(event) {
      let element = event.target;

      //Find the touch point's x and y position
      this._x = event.targetTouches[0].pageX - element.offsetLeft;
      this._y = event.targetTouches[0].pageY - element.offsetTop;

      //Set the down states
      this.isDown = true;
      this.isUp = false;
      this.tapped = false;

      //Capture the current time
      this.downTime = Date.now();

      //Call the `press` method if it's been assigned
      if (this.press) this.press();
      event.preventDefault();
    },

    //The pointer's `upHandler`
    upHandler(event) {

      //Figure out how much time the pointer has been down
      this.elapsedTime = Math.abs(this.downTime - Date.now());

      //If it's less than 200 milliseconds, it must be a tap or click
      if (this.elapsedTime <= 200 && this.tapped === false) {
        this.tapped = true;

        //Call the `tap` method if it's been assigned
        if (this.tap) this.tap(); 
      }
      this.isUp = true;
      this.isDown = false;

      //Call the `release` method if it's been assigned
      if (this.release) this.release();
      event.preventDefault();
    },

    //The pointer's `touchendHandler`
    touchendHandler(event) {

      //Figure out how much time the pointer has been down
      this.elapsedTime = Math.abs(this.downTime - Date.now());

      //If it's less than 200 milliseconds, it must be a tap or click
      if (this.elapsedTime <= 200 && this.tapped === false) {
        this.tapped = true;

        //Call the `tap` method if it's been assigned
        if (this.tap) this.tap(); 
      }
      this.isUp = true;
      this.isDown = false;

      //Call the `release` method if it's been assigned
      if (this.release) this.release();
      event.preventDefault();
    },

    //`hitTestSprite` figures out if the pointer is touching a sprite
    hitTestSprite(sprite) {

      //The `hit` variable will become `true` if the pointer is
      //touching the sprite and remain `false` if it isn't
      let hit = false;

      //Is the sprite rectangular?
      if (!sprite.circular) {

        //Get the position of the sprite's edges using global
        //coordinates
        let left = sprite.gx,
            right = sprite.gx + sprite.width,
            top = sprite.gy,
            bottom = sprite.gy + sprite.height;

        //Find out if the pointer is intersecting the rectangle.
        //`hit` will become `true` if the pointer is inside the
        //sprite's area
        hit 
          = this.x > left && this.x < right 
          && this.y > top && this.y < bottom;
      }

      //Is the sprite circular?
      else {

        //Find the distance between the pointer and the
        //center of the circle
        let vx = this.x - (sprite.gx + sprite.radius),
            vy = this.y - (sprite.gy + sprite.radius),
            distance = Math.sqrt(vx * vx + vy * vy);

        //The pointer is intersecting the circle if the
        //distance is less than the circle's radius
        hit = distance < sprite.radius;
      }
      return hit;
    },

    updateDragAndDrop(draggableSprites) {
      //Check whether the pointer is pressed down
      if (this.isDown) {

        //You need to capture the co-ordinates at which the pointer was
        //pressed down and find out if it's touching a sprite

        //Only run this code if the pointer isn't already dragging
        //sprite
        if (this.dragSprite === null) {

          //Loop through the `draggableSprites` in reverse to start searching at the bottom of the stack
          for (let i = draggableSprites.length - 1; i > -1; i--) {
            let sprite = draggableSprites[i];

            //Check for a collision with the pointer using `hitTestSprite`
            if (this.hitTestSprite(sprite) && sprite.draggable) {

              //Calculate the difference between the pointer's
              //position and the sprite's position
              this.dragOffsetX = this.x - sprite.gx;
              this.dragOffsetY = this.y - sprite.gy;

              //Set the sprite as the pointer's `dragSprite` property
              this.dragSprite = sprite;

              //The next two lines re-order the `sprites` array so that the
              //selected sprite is displayed above all the others.
              //First, splice the sprite out of its current position in
              //its parent's `children` array
              let children = sprite.parent.children;
              children.splice(children.indexOf(sprite), 1);

              //Next, push the `dragSprite` to the end of its `children` array so that it's
              //displayed last, above all the other sprites
              children.push(sprite);

              //Reorganize the `draggableSpites` array in the same way
              draggableSprites.splice(draggableSprites.indexOf(sprite), 1);
              draggableSprites.push(sprite);

              //Break the loop, because we only need to drag the topmost sprite
              break;
            }
          }
        } 
        
        //If the pointer is down and it has a `dragSprite`, make the sprite follow the pointer's
        //position, with the calculated offset
        else {
          this.dragSprite.x = this.x - this.dragOffsetX;
          this.dragSprite.y = this.y - this.dragOffsetY;
        }
      }

      //If the pointer is up, drop the `dragSprite` by setting it to `null`
      if (this.isUp) {
        this.dragSprite = null;
      }

      //Change the mouse arrow pointer to a hand if it's over a
      //draggable sprite
      draggableSprites.some(sprite => {
        if (this.hitTestSprite(sprite) && sprite.draggable) {
          this.element.style.cursor = "pointer";
          return true;
        } else {
          this.element.style.cursor = "auto";
          return false;
        }
      });
    }
  };

  //Bind the events to the handlers
  //Mouse events
  element.addEventListener(
    "mousemove", pointer.moveHandler.bind(pointer), false
  );
  element.addEventListener(
    "mousedown", pointer.downHandler.bind(pointer), false
  );
  
  //Add the `mouseup` event to the `window` to
  //catch a mouse button release outside of the canvas area
  window.addEventListener(
    "mouseup", pointer.upHandler.bind(pointer), false
  );

  //Touch events
  element.addEventListener(
    "touchmove", pointer.touchmoveHandler.bind(pointer), false
  );
  element.addEventListener(
    "touchstart", pointer.touchstartHandler.bind(pointer), false
  );

  //Add the `touchend` event to the `window` object to
  //catch a mouse button release outside of the canvas area
  window.addEventListener(
    "touchend", pointer.touchendHandler.bind(pointer), false
  );

  //Disable the default pan and zoom actions on the `canvas`
  element.style.touchAction = "none";

  //Return the pointer
  return pointer;
}


/*
keyboard
---

The `keyboard` function creates `key` objects
that listen for keyboard events. Create a new key object like
this:

    let keyObject = g.keyboard(asciiKeyCodeNumber);

Then assign `press` and `release` methods like this:

  keyObject.press = function() {
    //key object pressed
  };
  keyObject.release = function() {
    //key object released
  };

Keyboard objects also have `isDown` and `isUp` Booleans that you can check.

*/

export function keyboard(keyCode) {
  let key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;

  //The `downHandler`
  key.downHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
    }
    //Prevent the event's default behavior
    event.preventDefault();
  };

  //The `upHandler`
  key.upHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
    }
    event.preventDefault();
  };

  //Attach event listeners
  window.addEventListener(
    "keydown", key.downHandler.bind(key), false
  );
  window.addEventListener(
    "keyup", key.upHandler.bind(key), false
  );

  //Return the key object
  return key;
}

