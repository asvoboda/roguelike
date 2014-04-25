
var sockets = undefined;
var username = undefined;

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

		sockets.emit('confirmUsername', username);
	});

	sockets.on('confirmUsername', function(username){
		username = username;
		sockets.emit('getOthers', username);
	});

	sockets.on('advance', function(msg){
		var seed = msg.seed;
		ROT.RNG.setSeed(seed);
		Game.clear();
		
		sockets.emit('getOthers');
	});

	sockets.on('others', function(others) {
		_.each(others, function(properties) {
			if (properties.user) {
				var otherPlayer = new Player(properties.username, properties.x, properties.y, properties.color);
				Game.others[otherPlayer.getUsername()] = otherPlayer;
			} else {
				var enemy = new Enemy(properties.username, properties.x, properties.y, properties.color);
				Game.enemies[properties.username] = enemy;
				//Game.scheduler.add(enemy, true);
			}
		});

		Game.init();

		sockets.emit('addUser', Game.player.getX(), Game.player.getY(), Game.player._color);
	});

	sockets.on('addUser', function(msg) {
		var otherPlayer = new Player(msg.username, msg.x, msg.y, msg.color);
		Game.others[msg.username] = otherPlayer;
	});


	sockets.on('move', function(msg) {
		var username = msg.u;
		var player = Game.others[username];
		var enemy = Game.enemies[username];
		if(player !== undefined) {
			player.setX(msg.x);
			player.setY(msg.y);

			//only draw the fov for the person who is playing
			Game.player._fov();
			Game.others[player.getUsername()] = player;
		} else if (enemy !== undefined) {
			enemy.setX(msg.x);
			enemy.setY(msg.y);
			Game.player._fov();
			Game.enemies[enemy.getUsername()] = enemy;
		}
	});

	sockets.on('disconnect', function(username) {
		Game.removePlayer(username);
	});
});