var Game = {
	display: undefined,
	map: {},
	player: undefined,
	others: {},
	enemies: {},
	engine: undefined,
	scheduler: undefined,
	stair: undefined,
	displayWidth: 80,
	displayHeight: 25,
	tickAmount: 10000,
	viewedColor: "#555",
	unviewedColor: "#000",
	tiles: {
		"stair": {"color": "#fff", "character": "⇓"},
		"floor": {"color": "#f7bf8f", "character": "."},
		"box": {"color": "#f46065", "character": "¤"},
		"wall": {"color": "#614126", "character": "#"},
		"player": {"color": "", "character": "@"},
		"enemy": {"color": "", "character": "P"},
	},
	clear: function() {
		this.map = {};
		this.others = {};
		this.stair = undefined;
	},
	init: function() {
		this.scheduler = new ROT.Scheduler.Simple();
		this.engine = new ROT.Engine(this.scheduler);
		this.display = new ROT.Display(this.displayWidth, this.displayHeight);
		var can = document.body.getElementsByTagName('canvas')[0];
		if (can !== undefined) {
			document.body.removeChild(can);
		}
		document.body.appendChild(this.display.getContainer());
		this._generateMap();
		this.engine.start();
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

	if (_.size(this.enemies) === 0) {
		for(var i = 0; i < 1; i++) {
			this._createEnemy(freeCells);
		}
	} else {
		for(var key in this.enemies) {
			this.scheduler.add(this.enemies[key], true);
		}
	}

	this._drawWholeMap();
	this.player._fov();
	this.player._draw();
};

Game._drawWholeMap = function() {
	for (var key in this.map) {
		var parts = key.split(",");
		var x = parseInt(parts[0]);
		var y = parseInt(parts[1]);
		var color = this.map[key].viewed ? this.viewedColor : this.unviewedColor;
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

	if (this.player === undefined) {
		this.player = new Player(username, x, y);
	} else {
		this.player = new Player(username, x, y, this.player.getColor());
	}
	this.scheduler.add(this.player, true);
};

Game._createEnemy = function(freeCells) {
	var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
	var key = freeCells.splice(index, 1)[0];
	var parts = key.split(",");
	var x = parseInt(parts[0]);
	var y = parseInt(parts[1]);

	var randomEnemyName = Math.random().toString(36).substr(2, 10);
	var enemy = new Enemy(randomEnemyName, x, y);
	this.scheduler.add(enemy, true);
	Game.enemies[enemy.getUsername()] = enemy;
	sockets.emit('addEnemy', enemy.getUsername(), enemy.getX(), enemy.getY(), enemy._color);
}

Game.removePlayer = function(username) {
	var player = Game.others[username];
	if (player === undefined) return;
	var key = player.getX() + "," + player.getY();
	var color = Game.map[key].viewed ? this.viewedColor : this.unviewedColor;
	Game.display.draw(player.getX(), player.getY(), Game.map[key].character, color);
	delete Game.others[username];
};