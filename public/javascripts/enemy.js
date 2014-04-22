var Enemy = function(name, x, y, color) {
	//todo
	this._x = x;
	this._y = y;
	this._color = color || '#' + Math.floor(Math.random()*16777215).toString(16); //the magic of 16777215=ffffff
	this.name = name;
	this.visibility = 8;
	this.tick = false;
	this.heading = undefined;
};

Enemy.prototype.getX = function() { return this._x; };

Enemy.prototype.getY = function() { return this._y; };

Enemy.prototype.setX = function(x) { this._x  = x; };

Enemy.prototype.setY = function(y) {this._y = y; };

Enemy.prototype.getColor = function() { return this._color; };

Enemy.prototype._draw = function() {
	Game.display.draw(this._x, this._y, Game.tiles.enemy.character, this._color);
};

//check all entities in the fov for the player
//if they have all moved, then so can the player
//entities outside the fov can move at will
Enemy.prototype._canTick = function() {
	var fov = new ROT.FOV.PreciseShadowcasting(_lightPasses);
	var canTick = true;

	/* output callback */
	fov.compute(this._x, this._y, this.visibility, function(x, y, r, visibility) {

		var others = Game.others;
		others.push(Game.player);

		var other = _.find(others, function(other) {
			return (x === other.getX() && y === other.getY());
		});
		if (other) {
			canTick = (other.tick && !this.tick);
		}
	});

	return canTick;
};

Enemy.prototype._findHeading = function() {
	var boxes = [];
	for(key in Game.map) {
		if (Game.map[key].character === Game.tiles.box.character) {
			boxes.push(key);
		}
	}
	var box = _.sample(boxes);
	this.heading = box;
};

Enemy.prototype.act = function() {
	if (!this.heading) {
		this._findHeading();
	}
	var parts = this.heading.split(",");
	var x = parseInt(parts[0]);
	var y = parseInt(parts[1]);

	var passableCallback = function(x, y) {
		var key = x + "," + y;
		return (Game.map[key].character === Game.tiles.floor.character ||
				Game.map[key].character === Game.tiles.box.character);
	};
	var astar = new ROT.Path.AStar(x, y, passableCallback, {topology: 4});

	var path = [];
	var pathCallback = function(x, y) {
		path.push([x, y]);
	};
	astar.compute(this._x, this._y, pathCallback);

	//remove current position
	path.shift();

	if (path.length === 1) {
		//find a new heading on the next iteration
		this.heading = undefined;
	} else {
		x = path[0][0];
		y = path[0][1];
		Game.display.draw(this._x, this._y, Game.map[this._x+","+this._y].character, "#555");
		this._x = x;
		this._y = y;
		this._draw();
	}
	this.tick = true;
};

Enemy.prototype.resetTick = function() {
	this.tick = false;
	setTimeout(this.resetTick, Game.tickAmount);
};

var resetEnemyTick = function(e) {
	this.player._handle(e.keyCode);
};