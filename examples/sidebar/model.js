
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

function stick(){
	const c = {
		FLU: [-0.5, 0.5, 0.5],
		FLL: [-0.5, -0.5, 0.5],
		FRL: [0.5, -0.5, 0.5],
		FRU: [0.5, 0.5, 0.5],
		BLU: [-0.5, 0.5, -0.5],
		BRU: [0.5, 0.5, -0.5],
		BLL: [-0.5, -0.5, -0.5],
		BRL: [0.5, -0.5, -0.5]
	};

	const verts = [
		...c.FLU,
		...c.FRU,
		...c.FLL,
		...c.FRL,
		...c.BRL,
		...c.FRU,
		...c.BRU,
		...c.FLU,
		...c.BLU,
		...c.FLL,
		...c.BLL,
		...c.BRL,
		...c.BLU,
		...c.BRU
	];

	return verts;
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

function rotate(array, axis, degrees){
	const angle = glMatrix.toRadian(degrees);
	const xangle = glMatrix.toRadian(35);
	for(var i=0; i < array.length; i+=3){
		//TODO: lame, do it better
		const rotated = rotateY([array[i], array[i+1], array[i+2]], angle);
		const rotatedX = rotateX(rotated, xangle);
		array[i] = rotatedX[0];
		array[i+1] = rotatedX[1];
		array[i+2] = rotatedX[2];
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
//vertArray = rowsOfPyrs(vertArray);

vertArray = stick();
vertArray = rotate(vertArray, [], 45);
vertArray = move(vertArray, [0, 0, -1.2]);


const vertices = new Float32Array(vertArray);
window.vertices = vertices;

//window.vertices.mode = 'TRIANGLES';
//window.vertices.count = vertices.length/3

//TODO: should compute normals here and normals should be same for triangles on same face
window.vertices.mode = 'TRIANGLE_STRIP';
window.vertices.count = vertices.length/4 + 1;

})();
