
(function(){

const nZ = -1.7;

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
		FUL: [-0.5, 0.5, 0.5],
		FLL: [-0.5, -0.5, 0.5],
		FLR: [0.5, -0.5, 0.5],
		FUR: [0.5, 0.5, 0.5],
		
		BUL: [-0.5, 0.5, -0.5],
		BLL: [-0.5, -0.5, -0.5],
		BLR: [0.5, -0.5, -0.5],
		BUR: [0.5, 0.5, -0.5]
	};

	const verts = [
		// FRONT
		...c.FUR,
		...c.FUL,
		...c.FLL,
		...c.FLR,
		...c.FUR,
		...c.FLL,

		// RIGHT
		...c.FUR,
		...c.FLR,
		...c.BUR,
		...c.BUR,
		...c.FLR,
		...c.BLR,

		// BACK
		...c.BUR,
		...c.BUL,
		...c.BLL,
		...c.BLR,
		...c.BUR,
		...c.BLL,

		// LEFT
		...c.FUL,
		...c.FLL,
		...c.BUL,
		...c.BUL,
		...c.FLL,
		...c.BLL,

		// TOP
		...c.FUR,
		...c.BUR,
		...c.BUL,
		...c.BUL,
		...c.FUL,
		...c.FUR,

		// BOTTOM
		...c.FLR,
		...c.BLR,
		...c.BLL,
		...c.BLL,
		...c.FLL,
		...c.FLR,

	];

	return [ ...array, ...rotate(verts, [0, 45, 0]) ];
}


var rotateX = function(vector, angleRads) {
	var sinTheta = Math.sin(angleRads);
	var cosTheta = Math.cos(angleRads);
	return [
		vector[0],
		vector[1] * cosTheta - vector[2] * sinTheta,
		vector[2] * cosTheta + vector[1] * sinTheta
	];
 };
var rotateY = function(vector, angleRads) {
	var sinTheta = Math.sin(angleRads);
	var cosTheta = Math.cos(angleRads);
	return [
		vector[0] * cosTheta - vector[2] * sinTheta,
		vector[1],
		vector[2] * cosTheta + vector[0] * sinTheta
	];
 };
 var rotateZ = function(vector, angleRads) {
	var sinTheta = Math.sin(angleRads);
	var cosTheta = Math.cos(angleRads);
	return [
		vector[0] * cosTheta - vector[1] * sinTheta,
		vector[1] * cosTheta + vector[0] * sinTheta,
		vector[2]
	];
 };


function rotate(array, angle){
	const xangle = glMatrix.toRadian(angle[0]);
	const yangle = glMatrix.toRadian(angle[1]);
	const zangle = glMatrix.toRadian(angle[2]);
	for(var i=0; i < array.length; i+=3){
		//TODO: lame, do it better
		var rotated = rotateY([array[i], array[i+1], array[i+2]], yangle);
		rotated = rotateX(rotated, xangle);
		rotated = rotateZ(rotated, zangle);
		array[i] = rotated[0];
		array[i+1] = rotated[1];
		array[i+2] = rotated[2];
	}
	return array;
}

function scale(array, axis, percent){
	return array;
}

function move(array, direction){
	array = array.map((one, i) => {
		if(direction[0] && i % 3 === 0){
			return one + direction[0];
		}
		if(direction[1] && i % 3 === 1){
			return one + direction[1];
		}
		if(direction[2] && i % 3 === 2){
			return one + direction[2];
		}
		return one;
	});
	return array;
}

var vertArray = [];
vertArray = rowsOfPyrs(vertArray);

 vertArray = stick(vertArray);
 vertArray = rotate(vertArray, [0, 0, 0]);
 vertArray = move(vertArray, [0, 0, -1.5]);
//vertArray = move(vertArray, [0, 0, -0.2]);


const vertices = new Float32Array(vertArray);
window.vertices = vertices;

//window.vertices.mode = 'TRIANGLES';
//window.vertices.count = vertices.length/3

//TODO: should compute normals here and normals should be same for triangles on same face
window.vertices.mode = 'TRIANGLES';
window.vertices.count = vertices.length/3;

})();
