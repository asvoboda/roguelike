
var sockets = null;
var username = null;
var Game = {
	display: null,
	map: {},
	player: null,
	others: {},
	engine: null,
	scheduler: null,
	stair: null,
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
		this.display = new ROT.Display();
		this.clear();
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
		//if (value) { return; } //we aren't storing walls.. yet!
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
	this._createPlayer(freeCells);

	this._drawWholeMap();
};

Game._drawWholeMap = function() {
	for (var key in this.map) {
		var parts = key.split(",");
		var x = parseInt(parts[0]);
		var y = parseInt(parts[1]);
		var color = this.map[key].viewed ? "#555" : "#000";
		this.display.draw(x, y, this.map[key].character, color);
	}
	this.player._fov();
	this.player._draw();
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
	this.player = new Player(username, x, y, undefined);
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

$(document).ready(function () {
	sockets = io.connect();
	sockets.on('connect', function() {
		sockets.emit('seed');
	});

	sockets.on('init', function(msg){
		var seed = msg.seed;
		ROT.RNG.setSeed(seed);
		username = prompt('Whats your name?') || 'anon';
		Game.init();
		
		sockets.emit('addUser', username, Game.player.getX(), Game.player.getY(), Game.player._color);
	});

	sockets.on('advance', function(msg){
		var seed = msg.seed;
		ROT.RNG.setSeed(seed);
		Game.init();
		
		sockets.emit('addUser', username, Game.player.getX(), Game.player.getY(), Game.player._color);
	});

	sockets.on('start', function(){
		//generate ROT map based on given seed value
		//todo: does nothing
	});

	sockets.on('addUser', function(msg) {
		var otherPlayer = new Player(msg.username, msg.x, msg.y, msg.color);
		Game.others[msg.username] = otherPlayer;
	});

	sockets.on('others', function(others) {
		_.each(others, function(properties) {
			var otherPlayer = new Player(properties.username, properties.x, properties.y, properties.color);
			Game.others[otherPlayer.username] = otherPlayer;
		});
	});

	sockets.on('move', function(msg) {
		var username = msg.username;
		var player = Game.others[username];
		if (player === undefined) return;
		player.setX(msg.x);
		player.setY(msg.y);

		//only draw the fov for the person who is playing
		Game.player._fov();
		Game.others[player.username] = player;
	});

	sockets.on('disconnect', function(username) {
		Game.removePlayer(username);
	});
});