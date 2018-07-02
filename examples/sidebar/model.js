
(function(){

const nZ = -1.8;

function upPyr(x, y){
	const d = 2;
	// pyramid
	return [
		0+x,  0+y, nZ, //left
		0+x, 1+y, -2,
		-1+x, -1+y, -2,

		0+x,  0+y, nZ, //right
		1+x, -1+y, -2,
		0+x, 1+y, -2,

		0+x,  0+y, nZ, // bottom
		-1+x, -1+y, -2,
		1+x, -1+y, -2,
	];
}

function downPyr(x, y){
	const d = 2;
	// pyramid
	return [
		0+x,  0+y, nZ, //top
		1+x,  1+y, -2,
	 -1+x,  1+y, -2,
	
		0+x,  0+y, nZ, //left
	 -1+x,  1+y, -2,
		0+x, -1+y, -2,
	
		0+x,  0+y, nZ, //right
		0+x, -1+y, -2,
		1+x,  1+y, -2,
	];
}

function row(array, x, y){
	array = array.concat(upPyr(-2+x, y))
	array = array.concat(downPyr(1+x, y))
	array = array.concat(upPyr(0+x, y))
	array = array.concat(downPyr(-1+x, y))
	array = array.concat(upPyr(2+x, y))
	array = array.concat(downPyr(3+x, y))
	return array;
}

function block(array, x, y){
	vertArray = row(vertArray, 1+x, 2+y);
	vertArray = row(vertArray, 0+x, 0+y);
	vertArray = row(vertArray, -1+x, -2+y);
	return vertArray;	
}

function rowsOfPyrs(array){
	array = block(array, 0, 0);
	array = block(array, 6, 0);
	array = block(array, -6, 0);

	array = block(array, -1, -6);
	array = block(array, 5, -6);
	array = block(array, -7, -6);

	array = block(array, 1, 6);
	array = block(array, 7, 6);
	array = block(array, -5, 6);

	return array;
}

function stick(array){
	const c = {
		FLU: [0, 1, -1],
		FRU: [1, 1, -1],
		FLL: [0, 0, -1],
		FRL: [1, 0, -1],
		BLU: [0, 1, -2],
		BRU: [1, 1, -2],
		BLL: [0, 0, -2],
		BRL: [1, 0, -2]
	};

	array = array.concat(c.FLU);
	array = array.concat(c.FLL);
	array = array.concat(c.FRU);

	array = array.concat(c.FRU);
	array = array.concat(c.FLL);
	array = array.concat(c.FRL);

	return array;
}

function rotate(array, axis, degree){
	return array;
}

function scale(array, axis, percent){
	return array;
}

function move(array, direction){
	return array;
}

var vertArray = [];
vertArray = rowsOfPyrs(vertArray);

//vertArray = stick(vertArray);


const vertices = new Float32Array(vertArray);

window.vertices = vertices;
})();
