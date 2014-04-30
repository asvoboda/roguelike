function generateColor() {
	var hex = Math.floor(Math.random()*16777215).toString(16);//the magic of 16777215=ffffff
	if (hex.length !== 6) {
		hex = "0" + hex;
	}
	return '#' + hex;
};