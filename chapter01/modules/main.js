
import {hello} from "firstModule";
import {hello as helloTwo} from "secondModule";
import {color, shape} from "thirdModule";
module position from "fourthModule";
import Animal from "Animal";
import {mood} from "fifthModule";
//The sixth module runs automatically because it its
//wrapped in an immmediate function
import "sixthModule";

console.log(hello);
console.log(helloTwo);
console.log(`Shape: ${shape} Color: ${color}`);
console.log(`x: ${position.x}, y: ${position.y}, z: ${position.z}`);
console.log(`The fifth module is: ${mood}`);

let cat = new Animal();
cat.say = "Meow!";
cat.speak();

