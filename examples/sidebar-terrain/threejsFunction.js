(function(){

    const glFunction = (() => {
        console.log({ ctx, gl, alpha, width, height});
        const canvas = gl.canvas;
        const renderer = new THREE.WebGLRenderer({ canvas });
        //renderer.setClearColor("#000000");
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap
        // default THREE.PCFShadowMap
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera( 75, width/height, 0.1, 1000 );

        var light = new THREE.PointLight( 0xaa11dd, 2, 120);
        light.position.set( -20, 70, 20 );
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.shadow.camera.left = 500;
        scene.add( light );

        var light2 = new THREE.PointLight( 0xffaa22, 2, 120);
        light2.position.set( 20, 700, 20 );
        light2.castShadow = true;
        light2.shadow.mapSize.width = 1024;
        light2.shadow.mapSize.height = 1024;
        light2.shadow.camera.left = 500;
        scene.add( light2 );

        // front light
        var light3 = new THREE.PointLight( 0xffff00, 1, 120);
        light3.position.set( 10, 30, 60 );
        light3.castShadow = false;
        light3.shadow.mapSize.width = 1024;
        light3.shadow.mapSize.height = 1024;
        light3.shadow.camera.left = 500;
        scene.add( light3 );

        // add subtle ambient lighting
        var ambientLight = new THREE.AmbientLight(0xffffff);
        scene.add(ambientLight);


        var t = new THREE.Texture(document.getElementById('pattern-needles'));
        t.repeat.set(1, 1);
        t.needsUpdate = true;
        t.anisotropy = 32;

        var cubeMaterial = new THREE.MeshPhongMaterial( {
            color: 0x8899dd, specular: 0x8bc34a, shininess: 1,
            map: t
        } );

        // trunk
        var myTexture = new THREE.Texture(document.getElementById('pattern-stones'));
        myTexture.needsUpdate = true;

        var dMap = new THREE.Texture(document.getElementById('pattern-displace'));
        dMap.repeat.set(1, 1);
        dMap.needsUpdate = true;
        dMap.anisotropy = 32;

        var groundMaterial = new THREE.MeshStandardMaterial( {
            //color: 0x333333,
            displacementMap: dMap,
            map: t,
            displacementScale: 250,
            displacementBias: -1, // from original model
            //side: THREE.DoubleSide
        } );

        var groundGeom = new THREE.PlaneGeometry(2000, 1000, 500, 500);
        //groundGeom.computeTangents();

        var groundMesh = new THREE.Mesh(groundGeom, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = -20;
        groundMesh.position.z = 0;
        groundMesh.receiveShadow = true;
        groundMesh.castShadow = true;

        scene.add(groundMesh);


        // position and point the camera to the center of the scene
        camera.position.x = 0;
        camera.position.y = 50;
        camera.position.z = 160;
        camera.lookAt(new THREE.Vector3(0, 35, 5));

        renderer.render(scene, camera);

    }).toString().split('\n').slice(1, -1).join('\n');
    window.threejsFunction = glFunction;
})();