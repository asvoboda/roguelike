var Enemy = function(username, x, y, color) {
	this.heading = undefined;
	Entity.call(this, username, x, y, color);
};

Enemy.prototype = Object.create(Entity.prototype);

Enemy.prototype._draw = function() {
	Game.display.draw(this._x, this._y, Game.tiles.enemy.character, this._color);
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
				Game.map[key].character === Game.tiles.box.character ||
				Game.map[key].character === Game.tiles.stair.character);
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
		//Game.display.draw(this._x, this._y, Game.map[this._x+","+this._y].character, Game.viewedColor);
		this._x = x;
		this._y = y;
		//this._draw();
		sockets.emit('move', {'u': this._username, 'x': x, 'y': y, 'h': this.heading});
	}
};