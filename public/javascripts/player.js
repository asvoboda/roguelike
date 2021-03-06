var Player = function(username, x, y, color) {
	Entity.call(this, username, x, y, color);
};

Player.prototype = Object.create(Entity.prototype);

Player.prototype._draw = function() {
	Game.display.draw(this._x, this._y, Game.tiles.player.character, this._color);
};

Player.prototype.act = function() {
    Game.engine.lock();
    /* wait for user input; do stuff when user hits a key */
	var movementCallback = function(e) {
		this._handle(e.keyCode);
	};
	var enterCallback = function(e) {
		this._check();
	};
	Mousetrap.bind(["up", "right", "down", "left"], movementCallback.bind(this));
	Mousetrap.bind("enter", enterCallback.bind(this));
}

/* input callback */
var _lightPasses = function(x, y) {
	var key = x+","+y;
	if (key in Game.map) { 
		return (Game.map[key].character === Game.tiles.floor.character ||
		 Game.map[key].character === Game.tiles.box.character || 
		 Game.map[key].character === Game.tiles.stair.character); 
	}
	return false;
}

//to be called before changing x/y in order to remove existing fov
Player.prototype._removeFov = function() {
	var fov = new ROT.FOV.PreciseShadowcasting(_lightPasses);

	/* output callback */
	fov.compute(this._x, this._y, this._visibility, function(x, y, r, visibility) {
		var key = x + "," + y;
		var character = Game.map[key].character
		var tile = _.find(Game.tiles, function(t) {
			return t.character === character;
		});

		var ch = (r ? tile.character : Game.tiles.player.character);
		Game.display.draw(x, y, ch, Game.viewedColor);
	});
};

Player.prototype._fov = function() {
	var fov = new ROT.FOV.PreciseShadowcasting(_lightPasses);

	/* output callback */
	fov.compute(this._x, this._y, this._visibility, function(x, y, r, visibility) {
		var key = x + "," + y;
		var character = Game.map[key].character
		var tile = _.find(Game.tiles, function(t) {
			return t.character === character;
		});
		var other = _.find(Game.others, function(other) {
			return (x === other.getX() && y === other.getY());
		});
		var enemy = _.find(Game.enemies, function(enemy) {
			return (x === enemy.getX() && y === enemy.getY());
		});

		var ch;
		var color;
		if (other) {
			ch = Game.tiles.player.character;
			color = other.getColor();
		} else if (enemy) {
			ch = Game.tiles.enemy.character;
			color = enemy.getColor();
		} else {
			ch = (r ? tile.character : Game.tiles.player.character);
			color = (r ? tile.color : Game.player.getColor());
		}
		Game.display.draw(x, y, ch, color);
		Game.map[key].viewed = true;
	});
};

Player.prototype._handle = function(code) {
	var keyMap = {};
	keyMap[38] = 0;
	keyMap[33] = 1;
	keyMap[39] = 2;
	keyMap[34] = 3;
	keyMap[40] = 4;
	keyMap[35] = 5;
	keyMap[37] = 6;
	keyMap[36] = 7;

	if (!(code in keyMap)) { return; }

	var diff = ROT.DIRS[8][keyMap[code]];
	var newX = this._x + diff[0];
	var newY = this._y + diff[1];

	var newKey = newX + "," + newY;

	if (Game.map[newKey].character === Game.tiles.wall.character) {
		return;
	}

	var otherInWay = false;
	_.each(Game.others, function(other) {
		var key = other.getX() + "," + other.getY();
		if (key === newKey) {
			otherInWay = true;
		}
	});

	_.each(Game.enemies, function(enemy) {
		var key = enemy.getX() + "," + enemy.getY();
		if (key === newKey) {
			otherInWay = true;
		}
	});

	if (otherInWay) {
		return;
	}

	this._removeFov();
	this._x = newX;
	this._y = newY;

	sockets.emit('move', {'u': this._username, 'x': newX, 'y': newY});

	this._fov();
	this._draw();

	
	Mousetrap.unbind(["up", "right", "down", "left"]);
	Mousetrap.unbind("enter");
	Game.engine.unlock();
};

Player.prototype._check = function() {
	var key = this._x + "," + this._y;
	if (Game.map[key].character === Game.tiles.stair.character) {
		sockets.emit('finishLevel');
	} else if (Game.map[key].character === Game.tiles.box.character) {
		//todo: do something with boxes, doors, etc
	}
};