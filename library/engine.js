module utilities from "../library/utilities";
module display from "../library/display";
module collision from "../library/collision";
module interactive from "../library/interactive";
module sound from "../library/sound";
module tween from "../library/tween";

export class Game {
  constructor(width = 256, height = 256, setup, assetsToLoad, load) {
    //Copy all the imported library code into 
    //properties on this class
    Object.assign(this, utilities);
    Object.assign(this, display);
    Object.assign(this, collision);
    Object.assign(this, interactive);
    Object.assign(this, sound);
    Object.assign(this, tween);

    //Make the canvas and initialize the stage
    this.canvas = this.makeCanvas(width, height, "none");
    this.canvas.style.backgroundColor = "white";
    this.stage.width = this.canvas.width;
    this.stage.height = this.canvas.height;

    //Make the pointer
    this.pointer = this.makePointer(this.canvas);

    //The game's scale
    this.scale = 1;

    //Set the game `state`
    this.state = undefined;

    //Set the user-defined `load` and `setup` states
    this.load = load;
    this.setup = setup;

    //Get a reference to the `assetsToLoad` array
    this.assetsToLoad = assetsToLoad;

    //A Boolean to let us pause the game
    this.paused = false;
    
    //The `setup` function is required, so throw an error if it's
    //missing
    if (!setup) {
      throw new Error(
        "Please supply the setup function in the constructor"
      );
    }
  }

  //The game loop
  gameLoop() {
    requestAnimationFrame(this.gameLoop.bind(this));

    //Update all the buttons
    if (this.buttons.length > 0) {
      this.canvas.style.cursor = "auto";
      this.buttons.forEach(button => {
        button.update(this.pointer, this.canvas);
        if (button.state === "over" || button.state === "down") {
          if(button.parent !== undefined) {
            this.canvas.style.cursor = "pointer";
          }
        }
      });
    }

    //Update all the particles
    if (this.particles.length > 0) {
      for(let i = this.particles.length - 1; i >= 0; i--) {
        let particle = this.particles[i];
        particle.update();
      }
    }

    //Update all the tweens
    if (this.tweens.length > 0) {
      for(let i = this.tweens.length - 1; i >= 0; i--) {
        let tween = this.tweens[i];
        if (tween) tween.update();
      }
    }
    
    //Update all the shaking sprites
    if (this.shakingSprites.length > 0) {
      for(let i = this.shakingSprites.length - 1; i >= 0; i--) {
        let shakingSprite = this.shakingSprites[i];
        if (shakingSprite.updateShake) shakingSprite.updateShake();
      }
    }
    
    //Update the pointer for drag and drop
    if (this.draggableSprites.length > 0) {
      this.pointer.updateDragAndDrop(this.draggableSprites);
    }

    //Run the current game `state` function if it's been defined and
    //the game isn't `paused`
    if(this.state && !this.paused) {
      this.state();
    }

    //Render the canvas
    this.render(this.canvas);

  }

  //The `start` method that gets the whole engine going. This needs to
  //be called by the user from the game application code, right after
  //the engine is instantiated
  start() {
    if (this.assetsToLoad) {

      //Use the supplied file paths to load the assets then run
      //the user-defined `setup` function
      this.assets.load(this.assetsToLoad).then(() => {

        //Clear the game `state` function for now to stop the loop.
        this.state = undefined;

        //Call the `setup` function that was supplied by the user in
        //`Game` class's constructor
        this.setup();
      });

      //While the assets are loading, set the user-defined `load`
      //function as the game state. That will make it run in a loop.
      //You can use the `load` state to create a loading progress bar
      if (this.load) {
        this.state = this.load;
      }
    }

    //If there aren't any assets to load,
    //just run the user-defined `setup` function
    else {
      this.setup();
    }

    //Start the game loop
    this.gameLoop();
  }

  //Pause and resume methods
  pause() {
    this.paused = true;
  }
  resume() {
    this.paused = false;
  }

  //Center and scale the game engine inside the HTML page 
  scaleToWindow(backgroundColor = "#2C3539") {

    let scaleX, scaleY, scale, center;
    
    //1. Scale the canvas to the correct size
    //Figure out the scale amount on each axis
    scaleX = window.innerWidth / this.canvas.width;
    scaleY = window.innerHeight / this.canvas.height;

    //Scale the canvas based on whichever value is less: `scaleX` or `scaleY`
    scale = Math.min(scaleX, scaleY);
    this.canvas.style.transformOrigin = "0 0";
    this.canvas.style.transform = "scale(" + scale + ")";

    //2. Center the canvas.
    //Decide whether to center the canvas vertically or horizontally.
    //Wide canvases should be centered vertically, and 
    //square or tall canvases should be centered horizontally

    if (this.canvas.width > this.canvas.height) {
      center = "vertically";
    } else {
      center = "horizontally";
    }
    
    //Center horizontally (for square or tall canvases)
    if (center === "horizontally") {
      let margin = (window.innerWidth - this.canvas.width * scaleY) / 2;
      this.canvas.style.marginLeft = margin + "px";
      this.canvas.style.marginRight = margin + "px";
    }

    //Center vertically (for wide canvases) 
    if (center === "vertically") {
      let margin = (window.innerHeight - this.canvas.height * scaleX) / 2;
      this.canvas.style.marginTop = margin + "px";
      this.canvas.style.marginBottom = margin + "px";
    }

    //3. Remove any padding from the canvas and set the canvas
    //display style to "block"
    this.canvas.style.paddingLeft = 0;
    this.canvas.style.paddingRight = 0;
    this.canvas.style.display = "block";
    
    //4. Set the color of the HTML body background
    document.body.style.backgroundColor = backgroundColor;
    
    //5. Set the game engine and pointer to the correct scale. 
    //This is important for correct hit testing between the pointer and sprites
    this.pointer.scale = scale;
    this.scale = scale;

    //Fix some quirkiness in scaling for Safari
    /*
    let ua = navigator.userAgent.toLowerCase(); 
    if (ua.indexOf('safari') != -1) { 
      if (ua.indexOf('chrome') > -1) {
        // Chrome
      } else {
        // Safari
        this.canvas.style.maxHeight = "100%";
        this.canvas.style.minHeight = "100%";
      }
    }
    */
  }
}

/*
game
----
A high level wrapper for creating a game
*/

export function game(
  width = 256, height = 256,
  setup, assetsToLoad, load
) {
  return new Game(width, height, setup, assetsToLoad, load);
}



