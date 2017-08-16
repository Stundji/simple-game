var actorChars = {
  "@": Player,
  "o": Coin,
  "=": Lava, "|": Lava, "v": Lava
};  // characters object (used by Level constructor to associate characters with constructor functions)

function Level(plan) {

this.width = plan[0].length;
  this.height = plan.length;
  this.grid = [];
  this.actors = [];
  
    for (var y = 0; y < this.height; y++) {
    var line = plan[y], gridLine = [];
    for (var x = 0; x < this.width; x++) {
      var ch = line[x], fieldType = null;
      var Actor = actorChars[ch];
      if (Actor)
        this.actors.push(new Actor(new Vector(x, y), ch));
      else if (ch == "x")
        fieldType = "wall";
      else if (ch == "!")
        fieldType = "lava";
      gridLine.push(fieldType);
    }
    this.grid.push(gridLine);
  }

  this.player = this.actors.filter(function(actor) {
    return actor.type == "player";
  })[0];
  this.status = this.finishDelay = null;
  
}
/* Level constructor(creates level object) takes an array of strings as argument(level plan).
The constructor stores width and height, along with two arrays—one for the grid and one for the actors(the dynamic elements). The grid is an array of arrays(each of the inner arrays represents a horizontal line and each square contains either null, for empty squares, or a string indicating the type of the square—"wall" or "lava").

The actors array holds objects that track the current position and state of the dynamic elements in the level. Each element have a pos property that gives its position (the coordinates of its top-left corner), a size property that gives its size, and a type property that holds a string identifying the element ("lava", "coin", or "player"). 

Filter method is used to find the player actor object and store it in a property of the level.

Status property is tracking whether the player lost or won.When this happens finishDelay is activated to keep an active level for a short animation. */

Level.prototype.isFinished = function() {
  return this.status != null && this.finishDelay < 0;
};

function Vector(x, y) {
  this.x = x; this.y = y;
}
Vector.prototype.plus = function(other) {
  return new Vector(this.x + other.x, this.y + other.y);
};
Vector.prototype.times = function(factor) {
  return new Vector(this.x * factor, this.y * factor);
};
/* Vector for storing ACTORS position and size coordinates
TIMES method scales a vector(used to multiply a speed vector by time interval to get the distance traveled during that time) */

function Player(pos) {
  this.pos = pos.plus(new Vector(0, -0.5));
  this.size = new Vector(0.8, 1.5);
  this.speed = new Vector(0, 0);
}   //PLAYER constructor - takes vector as argument and fix its position with half a square above(pos.plus). SPEED property stores current speed(simulate momentum and gravity)
Player.prototype.type = "player";

function Lava(pos, ch) {
  this.pos = pos;
  this.size = new Vector(1, 1);
  if (ch == "=") {
    this.speed = new Vector(2, 0);
  } else if (ch == "|") {
    this.speed = new Vector(0, 2);
  } else if (ch == "v") {
    this.speed = new Vector(0, 3);
    this.repeatPos = pos;
  }
} // LAVA constructor. repeatPos property will make lava jump back to starting position(for falling and moving lava)
Lava.prototype.type = "lava"; // Check method for MOVING(written bellow)

function Coin(pos) {
  this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
  this.size = new Vector(0.6, 0.6);
  this.wobble = Math.random() * Math.PI * 2;
}   //COIN actors constructor. 
Coin.prototype.type = "coin";// Stores a base position and WOBBLE property(visual trembling of the coins)
                                    
                                            // DRAWING STARTS HERE
function elt(name, className) {
  var elt = document.createElement(name);
  if (className) elt.className = className;
  return elt;
} // helper function for creating elements and giving them class

function DOMDisplay(parent, level) {
  this.wrap = parent.appendChild(elt("div", "game"));
  this.level = level;

  this.wrap.appendChild(this.drawBackground());
  this.actorLayer = null;
  this.drawFrame();
} // Display constructor - takes parent and level object as arguments(the display appends itself to the parent argument)
// level background is drawn once(it never changes). 
// actorLayer property will be used by drawFrame to track the element that holds the actors so that they can be easily removed and replaced.

var scale = 20; // scale the coordinates up(20 px for a single unit on the screen)

DOMDisplay.prototype.drawBackground = function() {
  var table = elt("table", "background");
  table.style.width = this.level.width * scale + "px";
  this.level.grid.forEach(function(row) {
    var rowElt = table.appendChild(elt("tr"));
    rowElt.style.height = scale + "px";
    row.forEach(function(type) {
      rowElt.appendChild(elt("td", type));
    });
  });
  return table;
}; // background CONSTRUCTOR: draw the background as a table. Each row of the grid is turned into a TR. The strings in the grid are used as class names for TD cells

DOMDisplay.prototype.drawActors = function() {
  var wrap = elt("div");
  this.level.actors.forEach(function(actor) {
    var rect = wrap.appendChild(elt("div",
                                    "actor " + actor.type));
    rect.style.width = actor.size.x * scale + "px";
    rect.style.height = actor.size.y * scale + "px";
    rect.style.left = actor.pos.x * scale + "px";
    rect.style.top = actor.pos.y * scale + "px";
  });
  return wrap;
};
// method for drawing Actors on DOM. Creates a DOM element for actor and sets it's position and size based on properties. Multiplies the values by Scale.

DOMDisplay.prototype.drawFrame = function() {
  if (this.actorLayer)
    this.wrap.removeChild(this.actorLayer);
  this.actorLayer = this.wrap.appendChild(this.drawActors());
  this.wrap.className = "game " + (this.level.status || "");
  this.scrollPlayerIntoView();   // if level is outside the viewport, ensure that player is centered
};
// update the display - removes old actor graphics and redraws them in their new position. this.level.status - used to style player depending on win/loss

DOMDisplay.prototype.scrollPlayerIntoView = function() {
  var width = this.wrap.clientWidth;
  var height = this.wrap.clientHeight;
  var margin = width / 3;

  var left = this.wrap.scrollLeft, right = left + width;
  var top = this.wrap.scrollTop, bottom = top + height;

  var player = this.level.player;
  var center = player.pos.plus(player.size.times(0.5))
                 .times(scale);       // To find actor's center, add it's position and half it's size, then multiply it by scale to find pixel coordinates

  if (center.x < left + margin)
    this.wrap.scrollLeft = center.x - margin;
  else if (center.x > right - margin)
    this.wrap.scrollLeft = center.x + margin - width;
  if (center.y < top + margin)
    this.wrap.scrollTop = center.y - margin;
  else if (center.y > bottom - margin)
    this.wrap.scrollTop = center.y + margin - height;
//Checks to verify that player position is not outside of allowed range.(a neutral area in the middle)
};

DOMDisplay.prototype.clear = function() {
  this.wrap.parentNode.removeChild(this.wrap);
};
// clear displayed level to move to next or reset.

Level.prototype.obstacleAt = function(pos, size) {
  var xStart = Math.floor(pos.x);
  var xEnd = Math.ceil(pos.x + size.x);
  var yStart = Math.floor(pos.y);
  var yEnd = Math.ceil(pos.y + size.y);

  if (xStart < 0 || xEnd > this.width || yStart < 0)
    return "wall";
  if (yEnd > this.height)
    return "lava";
  for (var y = yStart; y < yEnd; y++) {
    for (var x = xStart; x < xEnd; x++) {
      var fieldType = this.grid[y][x];
      if (fieldType) return fieldType;
    }
  }
};

// checking if rectangle overlaps with any nonempty space on the background grid. Computes the set of grid squares that the body overlaps with
// if the body sticks out of the level - 'wall' is returned for sides and 'lava' for the bottom - ensures that player dies when falling out of the world
// loop is used to return the content of the first nonempty square that it finds(e.g wall,lava,coin)

Level.prototype.actorAt = function(actor) {
  for (var i = 0; i < this.actors.length; i++) {
    var other = this.actors[i];
    if (other != actor &&
        actor.pos.x + actor.size.x > other.pos.x &&
        actor.pos.x < other.pos.x + other.size.x &&
        actor.pos.y + actor.size.y > other.pos.y &&
        actor.pos.y < other.pos.y + other.size.y)
      return other;
  }
};
// This method scans the array of actors, looking for an actor that overlaps the one given as an argument
// collision between player and other dynamic actors(lava,coins) - when the motion has taken player into another actor - effect is activated(collecting or dying)


var maxStep = 0.05;  // time step in seconds

Level.prototype.animate = function(step, keys) {  // keys obj contains info about the arrow keys player has pressed
  if (this.status != null)
    this.finishDelay -= step;  // if level status is won or lost, a countdown is executed( to stop showing the level)

  while (step > 0) {
    var thisStep = Math.min(step, maxStep);   // ensures that no step larger than maxStep is  taken
    this.actors.forEach(function(actor) {
      actor.act(thisStep, this, keys);  //  act method
    }, this);
    step -= thisStep;
  }
};

Lava.prototype.act = function(step, level) {
  var newPos = this.pos.plus(this.speed.times(step));
  if (!level.obstacleAt(newPos, this.size))
    this.pos = newPos;
  else if (this.repeatPos)
    this.pos = this.repeatPos;
  else
    this.speed = this.speed.times(-1);
};

// this method computes a new lava position. if no obstacle lava moves there. if(dripping lava) it jumps back to first Position. if(bouncing lava), it inverts its speed.

var wobbleSpeed = 8, wobbleDist = 0.07;

Coin.prototype.act = function(step) {
  this.wobble += step * wobbleSpeed;
  var wobblePos = Math.sin(this.wobble) * wobbleDist;
  this.pos = this.basePos.plus(new Vector(0, wobblePos));
};

// Act method for coin Wobbling. Colision with the player is handled by player Act method.

var playerXSpeed = 7;

Player.prototype.moveX = function(step, level, keys) {
  this.speed.x = 0;
  if (keys.left) this.speed.x -= playerXSpeed;
  if (keys.right) this.speed.x += playerXSpeed;

  var motion = new Vector(this.speed.x * step, 0);
  var newPos = this.pos.plus(motion);
  var obstacle = level.obstacleAt(newPos, this.size);
  if (obstacle)
    level.playerTouched(obstacle);
  else
    this.pos = newPos;
};

// Player motion. Handled separately per axis
// for moveX - when motion causes player to hit something - if obstacle playerTouched method is called - handles dying in lava and collecting coins

var gravity = 30;
var jumpSpeed = 17;   // gravity and jumping simulation

Player.prototype.moveY = function(step, level, keys) {
  this.speed.y += step * gravity;   // vertical acceleration (gravity)
  var motion = new Vector(0, this.speed.y * step);
  var newPos = this.pos.plus(motion);
  var obstacle = level.obstacleAt(newPos, this.size);
  if (obstacle) {
    level.playerTouched(obstacle);
    if (keys.up && this.speed.y > 0)    //  jump
      this.speed.y = -jumpSpeed;
    else
      this.speed.y = 0; // bumped into something sets speed to 0
  } else {
    this.pos = newPos;
  }
};

Player.prototype.act = function(step, level, keys) {
  this.moveX(step, level, keys);
  this.moveY(step, level, keys);

  var otherActor = level.actorAt(this);
  if (otherActor)
    level.playerTouched(otherActor.type, otherActor);  // checks for other actors that player is colliding with

  if (level.status == "lost") {
    this.pos.y += step;
    this.size.y -= step;   // remove animation if player dies
  }
};

Level.prototype.playerTouched = function(type, actor) {
  if (type == "lava" && this.status == null) {
    this.status = "lost";
    this.finishDelay = 1;
  } else if (type == "coin") {
    this.actors = this.actors.filter(function(other) {
      return other != actor;
    });
    if (!this.actors.some(function(actor) {
      return actor.type == "coin";
    })) {
      this.status = "won";
      this.finishDelay = 1;
    }
  }
};

// handles collision between player and other objects



var arrowCodes = {37: "left", 38: "up", 39: "right"};

function trackKeys(codes) {
  var pressed = Object.create(null);
  function handler(event) {
    if (codes.hasOwnProperty(event.keyCode)) {
      var down = event.type == "keydown";
      pressed[codes[event.keyCode]] = down;
      event.preventDefault();
    }
  }
  addEventListener("keydown", handler);
  addEventListener("keyup", handler);
  return pressed;
}

// when given an object will return object that tracks current pos of the keys.
// registers event handlers for "keydown" and "keyup" events. when the key code in the event is present in the set of codes that it is tracking, updates the object.


function runAnimation(frameFunc) {
  var lastTime = null;
  function frame(time) {
    var stop = false;
    if (lastTime != null) {
      var timeStep = Math.min(time - lastTime, 100) / 1000; // convert the time steps to seconds
      stop = frameFunc(timeStep) === false;
    }
    lastTime = time;
    if (!stop)
      requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// takes a function that expects time difference and draws a single frame. animation stops when frame func returns false

var arrows = trackKeys(arrowCodes);

function runLevel(level, Display, andThen) {
  var display = new Display(document.body, level);
  runAnimation(function(step) {
    level.animate(step, arrows);
    display.drawFrame(step);
    if (level.isFinished()) {
      display.clear();
      if (andThen)
        andThen(level.status);
      return false;
    }
  });
}

// runLevel takes a level object, constructor for Display and function(optional)
// displays the level in DOM, and when user finishes level, runLevel clears display,stop animation and if(andThen) calls it with level status.


function runGame(plans, Display) {
    function startLevel(n, lives) {
      runLevel(new Level(plans[n]), Display, function(status) {
        if (status == "lost") {
          if (lives > 0) {
            startLevel(n, lives - 1);
          } else {
            alert("Game over");
            startLevel(0, 3);
          }     
        } else if (n < plans.length - 1) {
          startLevel(n + 1, lives);
        } else {
          alert("You win!");
        }
      });
    }
    startLevel(0, 3);
  }

// function for level sequence or restart. Schedule actions, so functions can be called at the right moment. If lives 0 - start from first level.


