
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var stylus = require('stylus');
var _un = require('underscore');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

var port = process.env.PORT || 3000;
server.listen(port);

// all environments
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(stylus.middleware({ src: __dirname + '/public', 
	compile: function (str, path) {
		return stylus(str)
			.set('filename', path)
			.use(nib())
		}
	}
));
app.use(express.static(__dirname + '/public'));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

app.get('/', function(req, res) {
	res.render('index.jade');
});

var dimensions = [[1397772122914]];
var users = {};

io.on('connection', function(socket){

	socket.on('event', function(data){
		console.log('event: ' + data);
	});

	socket.on('finishLevel', function() {
		//Pick the next level (or generate it) from the 2d dimensions array
		//[[1, 2, 3], [4, 5, 6]]
		//so if the player is on world 1, pick 2. If they are on 5, pick 6... and generate a new one if necessary
		var val = socket.world;
		var chosen = _un.find(dimensions, function(worlds) {
			var sel = _un.find(worlds, function(world) {
				return world === val; 
			});
			return sel !== undefined;
		});

		var nextIndex = _un.indexOf(chosen, val) + 1;

		var newWorld;
		if (nextIndex < _un.size(chosen)) {
			//grab this world number
			newWorld = chosen[nextIndex];
		} else {
			newWorld = _un.random(1000000000000, 100000000000000);
			//gen new world seed, push to dimensions
			var worldsIndex = _un.indexOf(dimensions, chosen);
			chosen.push(newWorld);
			dimensions[worldsIndex] = chosen;
		}
		io.sockets.in(socket.world).emit('disconnect', socket.username);
		socket.leave(socket.world);
		socket.world = newWorld;
		socket.join(newWorld);
		socket.emit('advance', {seed: newWorld});

		console.log(dimensions);
	});

	socket.on('seed', function() {
		var world = _un.sample(dimensions)[0];
		socket.join(world);
		socket.world = world;
		socket.emit('init', {seed: world});	
	});

	socket.on('addUser', function(username, x, y, color) {
		socket.username = username;
		var newPlayer = {"username": username, "x": x, "y": y, "color": color, "world": socket.world};
		users[username] = newPlayer;
		socket.emit('start');
		socket.broadcast.to(socket.world).emit('addUser', newPlayer);

		//send all existing users in the world as well!
		var others = _un.filter(users, function(user) {
			return (user.world === socket.world && user.username !== username);
		});
		socket.emit('others', others);
	});

	socket.on('move', function(data) {
		//update current position on server
		var player = users[socket.username];
		player.x = data.x;
		player.y = data.y
		users[data.username] = player;
		//broadcast information to rest of players in world
		io.sockets.in(socket.world).emit('move', {"username": socket.username, "x": data.x, "y": data.y});
	});

	socket.on('disconnect', function(){
		console.log('disconnect');
		delete users[socket.username];
		io.sockets.in(socket.world).emit('disconnect', socket.username);
		socket.leave(socket.world);
	});
});