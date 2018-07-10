(function(){
    // https://resources.oreilly.com/examples/9781784392215/blob/dd019759a7b48fe409b13f232abb1b0ce988cf5e/learning-threejs-master/chapter-04/04-mesh-normal-material.html

    const glFunction = (() => {
        console.log({ ctx, gl, alpha, width, height});
        const canvas = gl.canvas;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        //renderer.setClearColor("#000000");
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        //renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera( 75, width/height, 0.1, 1000 );

        var light = new THREE.PointLight( 0xffff99, 1, 100 );
        light.position.set( 0, 65, 25 );
        light.castShadow = true;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.left = 500
        scene.add( light );

        var meshMaterial = new THREE.MeshPhongMaterial( { color: 0x00dddd, specular: 0x009900, shininess: 10 } );
        var groundMaterial = new THREE.MeshStandardMaterial( { color: 0xffffff } );
        var cubeMaterial = new THREE.MeshPhongMaterial( { color: 0x8899dd, specular: 0x009900, shininess: 10 } );

        var groundGeom = new THREE.PlaneGeometry(1000, 100, 4, 4);
        var groundMesh = new THREE.Mesh(groundGeom, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = -20;
        groundMesh.receiveShadow = true;
        groundMesh.castShadow = true;
        scene.add(groundMesh);

        var sphereGeometry = new THREE.SphereGeometry(14, 20, 20);
        var cubeGeometry = new THREE.BoxGeometry(8, 8, 8);

        var sphere = new THREE.Mesh(sphereGeometry, meshMaterial);
        var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

        // position the sphere
        sphere.position.x = 0;
        sphere.position.y = 2.75;
        sphere.position.z = 7;
        sphere.castShadow = true;
        sphere.receiveShadow = true;

        // sphere normals
        // for (var f = 0, fl = sphere.geometry.faces.length; f < fl; f++) {
        //     var face = sphere.geometry.faces[f];
        //     var centroid = new THREE.Vector3(0, 0, 0);
        //     centroid.add(sphere.geometry.vertices[face.a]);
        //     centroid.add(sphere.geometry.vertices[face.b]);
        //     centroid.add(sphere.geometry.vertices[face.c]);
        //     centroid.divideScalar(3);

        //     var arrow = new THREE.ArrowHelper(
        //             face.normal,
        //             centroid,
        //             2,
        //             0x3333FF,
        //             0.5,
        //             0.5);
        //     sphere.add(arrow);
        // }

        cube.position.x = 0;
        cube.position.y = 35;
        cube.position.z = 16.5;
        cube.rotation.y = (45 * Math.PI)/180;
        cube.rotation.x = (25 * Math.PI)/180;
        cube.castShadow = true;
        cube.receiveShadow = true;

        // add the sphere to the scene
        scene.add(sphere);
        scene.add(cube);

        //scene.add(plane);

        // position and point the camera to the center of the scene
        camera.position.x = 0;
        camera.position.y = 40;
        camera.position.z = 80;
        camera.lookAt(new THREE.Vector3(0, 10, 10));

        // add subtle ambient lighting
        var ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        // add spotlight for the shadows
        // var spotLight = new THREE.SpotLight(0xffffff);
        // spotLight.position.set(0, 50, 10);
        // spotLight.castShadow = true;
        // spotLight.shadow.mapSize.width = 1024;
        // spotLight.shadow.mapSize.height = 1024;
        // scene.add(spotLight);

        renderer.render(scene, camera);

    }).toString().split('\n').slice(1, -1).join('\n');
    window.threejsFunction = glFunction;
})();