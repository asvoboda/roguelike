var Entity = function(username, x, y, color) {
	this._username = username;
	this._x = x;
	this._y = y;
	this._color = color || '#' + Math.floor(Math.random()*16777215).toString(16); //the magic of 16777215=ffffff
	this._visibility = 8;
};

Entity.prototype.getX = function() { return this._x; };

Entity.prototype.setX = function(x) { this._x  = x; };

Entity.prototype.getY = function() { return this._y; };

Entity.prototype.setY = function(y) { this._y = y; };

Entity.prototype.getColor = function() { return this._color; };

Entity.prototype.setColor = function(color) { this._color = color; };

Entity.prototype.getVisibility = function() { return this._visibility; }

Entity.prototype.setVisibility = function(visibility) { this._visibility = visibility; }

Entity.prototype.getUsername = function() { return this._username; }

Entity.prototype.setUsername = function(username) { this._username = username; }