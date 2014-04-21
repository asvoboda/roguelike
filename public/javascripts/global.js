
var sockets = null;
var username = null;

$(document).ready(function () {
	sockets = io.connect();
	sockets.on('connect', function() {
		if (world) {
			sockets.emit('seed', world);
		} else {
			sockets.emit('seed', 0);
		}
	});

	sockets.on('init', function(msg){
		var seed = msg.seed;
		ROT.RNG.setSeed(seed);
		username = prompt('Whats your name?') || 'anon';

		sockets.emit('getOtherUsers', username);

		//Game.init();
		
		//sockets.emit('addUser', username, Game.player.getX(), Game.player.getY(), Game.player._color);
	});

	sockets.on('advance', function(msg){
		var seed = msg.seed;
		ROT.RNG.setSeed(seed);
		Game.clear();
		//Game.init();
		
		sockets.emit('getOtherUsers', username);
		//sockets.emit('addUser', username, Game.player.getX(), Game.player.getY(), Game.player._color);
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

		Game.init();

		sockets.emit('addUser', username, Game.player.getX(), Game.player.getY(), Game.player._color);
	});

	sockets.on('move', function(msg) {
		var username = msg.u;
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