
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
		FLU: [-0.5, 0.5, -1],
		FLL: [-0.5, -0.5, -1],
		FRL: [0.5, -0.5, -1],
		FRU: [0.5, 0.5, -1],
		BLU: [-0.5, 0.5, -2],
		BRU: [0.5, 0.5, -2],
		BLL: [-0.5, -0.5, -2],
		BRL: [0.5, -0.5, -2]
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
	array = array.concat(verts);

	// const verts = [
	// 	c.FLU,     // Front-top-left
	// 	c.FRU,      // Front-top-right
	// 	c.FLL,    // Front-bottom-left
	// 	c.FRL,     // Front-bottom-right
	// 	c.BRL,    // Back-bottom-right
	// 	c.FRU,      // Front-top-right
	// 	c.BRU,     // Back-top-right
	// 	c.FLU,     // Front-top-left
	// 	c.BLU,    // Back-top-left
	// 	c.FLL,    // Front-bottom-left
	// 	c.BLL,   // Back-bottom-left
	// 	c.BRL,    // Back-bottom-right
	// 	c.BLU,    // Back-top-left
	// 	c.BRU      // Back-top-right
	// ];
	// const flatVerts = verts.reduce((all, one) => {
	// 	array = array.concat(one);
	// }, array);

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
//vertArray = rowsOfPyrs(vertArray);

vertArray = stick(vertArray);


const vertices = new Float32Array(vertArray);
window.vertices = vertices;

//window.vertices.mode = 'TRIANGLES';
//window.vertices.count = vertices.length/3

window.vertices.mode = 'TRIANGLE_STRIP';
window.vertices.count = vertices.length/4;

})();
