var Game = {
	display: null,
	map: {},
	player: null,
	others: {},
	engine: null,
	scheduler: null,
	stair: null,
	displayWidth: 80,
	displayHeight: 25,
	tiles: {
		"stair": {"color": "#fff", "character": "⇓"},
		"floor": {"color": "#f7bf8f", "character": "."},
		"box": {"color": "#f46065", "character": "¤"},
		"wall": {"color": "#614126", "character": "#"},
		"player": {"color": "", "character": "@"},
	},
	clear: function() {
		this.map = {};
		this.others = {};
		this.stair = null;
	},
	init: function() {
		this.display = new ROT.Display(this.displayWidth, this.displayHeight);
		var can = document.body.getElementsByTagName('canvas')[0];
		if (can !== undefined) {
			document.body.removeChild(can);
		}
		document.body.appendChild(this.display.getContainer());
		this._generateMap();
	}
};

Game._generateMap = function() {
	var freeCells = [];
	var digger = new ROT.Map.Digger();
	var digCallback = function(x, y, value) {
		if (!value) {
			var key = x+","+y;
			freeCells.push(key);
			this.map[key] = {"character": Game.tiles.floor.character, "viewed": false};
		} else {
			//store walls
			var key = x+","+y;
			this.map[key] = {"character": Game.tiles.wall.character, "viewed": false};
		}
	};
	digger.create(digCallback.bind(this));

	this._generateBoxes(freeCells);
	this._generateStair(freeCells);

	//remove the existing users on the map from the free cells
	//to make sure the new player doesn't get dropped on top of an existing one
	for(var key in this.others) {
		var pos = this.others[key].getX() + "," + this.others[key].getY();
		freeCells = _.without(freeCells, pos);
	}

	this._createPlayer(freeCells);

	this._drawWholeMap();
	this.player._fov();
	this.player._draw();
};

Game._drawWholeMap = function() {
	for (var key in this.map) {
		var parts = key.split(",");
		var x = parseInt(parts[0]);
		var y = parseInt(parts[1]);
		var color = this.map[key].viewed ? "#555" : "#000";
		this.display.draw(x, y, this.map[key].character, color);
	}
};

Game._generateBoxes = function(freeCells) {
	for (var i=0;i<10;i++) {
		var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
		var key = freeCells.splice(index, 1)[0];
		this.map[key] = {"character": Game.tiles.box.character, "viewed": false};
	}
};

Game._generateStair = function(freeCells) {
	var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
	var key = freeCells.splice(index, 1)[0];
	this.map[key] = {"character": Game.tiles.stair.character, "viewed": false};
	this.stair = key;
};

Game._createPlayer = function(freeCells) {
	var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
	var key = freeCells.splice(index, 1)[0];
	var parts = key.split(",");
	var x = parseInt(parts[0]);
	var y = parseInt(parts[1]);

	if (this.player === null) {
		this.player = new Player(username, x, y, undefined);
	} else {
		this.player = new Player(username, x, y, this.player.getColor());
	}
	var movementCallback = function(e) {
		this.player._handle(e.keyCode);
	};
	var enterCallback = function(e) {
		this.player._check();
	};
	Mousetrap.bind(["up", "right", "down", "left"], movementCallback.bind(this));
	Mousetrap.bind("enter", enterCallback.bind(this));
};

Game.removePlayer = function(username) {
	var player = Game.others[username];
	if (player === undefined) return;
	var key = player.getX() + "," + player.getY();
	var color = Game.map[key].viewed ? "#555" : "#000";
	Game.display.draw(player.getX(), player.getY(), Game.map[key].character, color);
	delete Game.others[username];
};

//x, y are in game grid co-ordinates
Game.drawLabel = function(text, x, y) {
	var can = document.getElementsByTagName('canvas')[0];
	var ctx = Game.display._context;
	var oldFont = ctx.font;
	var oldFill = ctx.fillStyle;
	var oldAlign = ctx.textAlign;
	var oldBaseline = ctx.textBaseline;

	ctx.textAlign = "left"
	ctx.font = "8px sans-serif";
	ctx.fillStyle = "#fff";
	ctx.textBaseline = "top";

	var newX = (x + 1) * parseInt(can.getAttribute('width')) / this.displayWidth;
	var newY = (y + 1) * parseInt(can.getAttribute('height')) / this.displayHeight;
	ctx.fillText(text, newX, newY);

	//reset styles for normal drawing
	ctx.textBaseline = oldBaseline;
	ctx.textAlign = oldAlign;
	ctx.fillStyle = oldFill;
	ctx.font = oldFont;
}
