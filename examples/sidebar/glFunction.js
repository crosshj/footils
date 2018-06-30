(function(){
const glFunction = (() => {

const vertCode = window.vertexShaderSource(alpha === undefined ? 1.0 : alpha);
const fragCode = window.fragmentShaderSource;
//const lightLocation = [0.25, 1.0, 0.0];
const lightLocation = [1, 6., 5.0];


/* Step 0: reset everything */

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.clearDepth(1.0);
	gl.viewport(0.0, 0.0, width, height);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


/* Step1: Define the geometry and store it in buffer objects */



	// vertices: create buffer, bind buffer, add data to buffer, unbind buffer
	var vertices = window.vertices;

	var vertex_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	// normals: compute normals, create buffer, bind buffer, add data to buffer, unbind buffer
	var normalize;
	const getNormals = function(vertices){
			var subtract = (a, b) => [
					a[0] - b[0],
					a[1] - b[1],
					a[2] - b[2]
			];
			var crossProduct = (a, b) => [
					a[1] * b[2] - a[2] * b[1],
					a[2] * b[0] - a[0] * b[2],
					a[0] * b[1] - a[1] * b[0]
			];
			normalize = function (a) {
					var vec3 = new Array(3);
					var len = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
					if (len > 0) {
							len = 1 / Math.sqrt(len);
							vec3[0] = len * a[0];
							vec3[1] = len * a[1];
							vec3[2] = len * a[2];
					}
					return vec3;
			}
			var buffer = [];
			//console.log('vert length: ', vertices);
			var _normals = vertices.reduce((all, one) => {
					buffer.push(one);

					if(buffer.length !== 9){
							return all;
					}

					const v1 = [ buffer[0], buffer[1], buffer[2] ];
					const v2 = [ buffer[3], buffer[4], buffer[5] ];
					const v3 = [ buffer[6], buffer[7], buffer[8] ];
					var p12 = subtract(v2, v1);
					var p23 = subtract(v3, v2);
					var cp = crossProduct(p12, p23);
					var normal = normalize(cp);

					//for each vertex in triangle, push same normal
					[0,1,2].forEach(x => {
							all.push(normal[0]);
							all.push(normal[1]);
							all.push(normal[2]);
					});

					buffer = [];

					return all;
			}, []);

			return new Float32Array(_normals);
	}

	const vertexNormals = getNormals(vertices);
	const normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertexNormals, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);


/* Step2: Create and compile Shader programs */

	// vertex shader: create, source, compile
	var vertShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertShader, vertCode);
	gl.compileShader(vertShader);

	// fragment shader: create, source, compile
	var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragShader, fragCode);
	gl.compileShader(fragShader);

	// shader program: create, attach shaders, link, test, use
	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertShader);
	gl.attachShader(shaderProgram, fragShader);
	gl.linkProgram(shaderProgram);

	const shaderLinked = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
	if(!shaderLinked){
			var programLog = gl.getProgramInfoLog( shaderProgram ).trim();
			var vertexLog = gl.getShaderInfoLog( vertShader ).trim();
			var fragmentLog = gl.getShaderInfoLog( fragShader ).trim();
			//console.log( '**VERTEX**',
			//    gl.getExtension( 'WEBGL_debug_shaders' ).getTranslatedShaderSource( vertShader )
			//);
			//console.log( '**FRAGMENT**',
			//    gl.getExtension( 'WEBGL_debug_shaders' ).getTranslatedShaderSource( fragShader )
			//);
			console.error(
					'Shader error: ', gl.getError(),
					'gl.VALIDATE_STATUS', gl.getProgramParameter( shaderProgram, gl.VALIDATE_STATUS ),
					'gl.getProgramInfoLog',
					programLog, vertexLog, fragmentLog
			);
			return;
	}

	gl.useProgram(shaderProgram);

/* Step 3: Associate the shader programs to buffer objects */
	var coordLocation = gl.getAttribLocation(shaderProgram, 'coordinates');
	var normalLocation = gl.getAttribLocation(shaderProgram, "a_normal");

	var matrixLocation = gl.getUniformLocation(shaderProgram, "u_matrix");
	var reverseLightDirectionLocation = gl.getUniformLocation(shaderProgram, "u_reverseLightDirection");

	// perspective
	// https://webglfundamentals.org/we bgl/frustum-diagram.html
	var aspect = width / height * .9;
	var zNear = 1;
	var zFar = 200;
	var fieldOfViewRadians = glMatrix.toRadian(60);
	var matrix =  mat4.create();
	//mat4.rotate(matrix, matrix, glMatrix.toRadian(45), [0, -1, 0]);
	mat4.perspective(matrix, fieldOfViewRadians, aspect, zNear, zFar);

	gl.uniformMatrix4fv(matrixLocation, false, matrix);

	// reverse lighting direction
	const revLightMatrix = vec3.normalize([], lightLocation)
	gl.uniform3fv(reverseLightDirectionLocation, new Float32Array(revLightMatrix));

	// coordinates
	const size = 3;
	gl.enableVertexAttribArray(coordLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	gl.vertexAttribPointer(coordLocation, size, gl.FLOAT, false, 0, 0);
	
	// normals
	gl.enableVertexAttribArray(normalLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.vertexAttribPointer(normalLocation, size, gl.FLOAT, false, 0, 0);

	/* Step4: Drawing the required object (triangle) */
	gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3);




}).toString().split('\n').slice(1, -1).join('\n');
window.glFunction = glFunction;
})();
