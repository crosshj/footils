(function(){

const nZ = -1.9;

function upPyr(x, y){
	const d = 2;
	// pyramid
return [
		-.5+x/d,  0+y, nZ, //left
		-1+x, 1+y, -2,
		-2+x, -1+y, -2,

		-.5+x/d,  0+y, nZ, //right
		0+x, -1+y, -2,
		-1+x, 1+y, -2,

		-.5+x/d,  0+y, nZ, // bottom
		-2+x, -1+y, -2,
		0+x, -1+y, -2,
	];
}

var vertArray = [
	// middle pyramid
		0,  0, nZ, //top
		1,  1, -2,
	 -1,  1, -2,
	
		0,  0, nZ, //left
	 -1,  1, -2,
		0, -1, -2,
	
		0,  0, nZ, //right
		0, -1, -2,
		1,  1, -2,
	];
vertArray = vertArray.concat(upPyr(0, 0))
vertArray = vertArray.concat(upPyr(2, 0))

// offset
vertArray = vertArray.concat(upPyr(1, .5))
vertArray = vertArray.concat(upPyr(-1, .5))
vertArray = vertArray.concat(upPyr(3, .5))

// upper row
vertArray = vertArray.concat(upPyr(1, 2))
vertArray = vertArray.concat(upPyr(3, 2))
vertArray = vertArray.concat(upPyr(-1, 2))

//bottom row
vertArray = vertArray.concat(upPyr(1, -2))
vertArray = vertArray.concat(upPyr(3, -2))
vertArray = vertArray.concat(upPyr(-1, -2))

const vertices = new Float32Array(vertArray);

window.vertices = vertices;
})();
