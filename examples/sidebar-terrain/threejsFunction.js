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

        // var light = new THREE.PointLight( 0xaa11dd, 2, 120);
        // light.position.set( -20, 70, 20 );
        // light.castShadow = true;
        // light.shadow.mapSize.width = 1024;
        // light.shadow.mapSize.height = 1024;
        // light.shadow.camera.left = 500;
        // scene.add( light );

        //back lights
        var sunColor = 0x884466;

        var width = 2000;
        var height = 100;
        var intensity = 5;
        var rectLight = new THREE.RectAreaLight( sunColor, intensity,  width, height );
        rectLight.position.set( 0, 300, -350 );
        rectLight.lookAt( 0, 0, -950 );
        scene.add( rectLight )

        // var rectLightHelper = new THREE.RectAreaLightHelper( rectLight );
        // scene.add( rectLightHelper );

        // front lights
        var frontLight = new THREE.RectAreaLight( sunColor, intensity/2,  width, height );
        frontLight.position.set( 0,  200, 100 );
        frontLight.lookAt( 0, 0, 100 );
        scene.add( frontLight )

        // var frontLightHelper = new THREE.RectAreaLightHelper( frontLight );
        // scene.add( frontLightHelper );

        // var light3 = new THREE.PointLight( sunColor, 2, 240);
        // light3.position.set( 0, 170, 50 );
        // light3.castShadow = false;
        // light3.shadow.mapSize.width = 1024;
        // light3.shadow.mapSize.height = 1024;
        // light3.shadow.camera.left = 0;
        // scene.add( light3 );

        // var light31 = new THREE.PointLight( sunColor, 2, 240);
        // light31.position.set( -190, 170, 150 );
        // light31.castShadow = false;
        // light31.shadow.mapSize.width = 1024;
        // light31.shadow.mapSize.height = 1024;
        // light31.shadow.camera.left = 0;
        // scene.add( light31 );

        // var light32 = new THREE.PointLight( sunColor, 2, 240);
        // light32.position.set( 190, 170, 150 );
        // light32.castShadow = false;
        // light32.shadow.mapSize.width = 1024;
        // light32.shadow.mapSize.height = 1024;
        // light32.shadow.camera.left = 0;
        // scene.add( light32 );


        //add subtle ambient lighting
        // var ambientLight = new THREE.AmbientLight(0x303030);
        // scene.add(ambientLight);

        var t = new THREE.Texture(document.getElementById('pattern-needles'));
        t.repeat.set(1, 1);
        t.needsUpdate = true;
        t.anisotropy = 32;

        var myTexture = new THREE.Texture(document.getElementById('pattern-stones'));
        myTexture.needsUpdate = true;

        var mountMap = new THREE.Texture(document.getElementById('pattern-displace'));
        mountMap.repeat.set(1, 1);
        mountMap.needsUpdate = true;
        mountMap.anisotropy = 32;

        var mountMaterial = new THREE.MeshStandardMaterial( {
            //color: 0xffffff,
            displacementMap: mountMap,
            //map: t,
            displacementScale: 250,
            displacementBias: -1, // from original model
            //side: THREE.DoubleSide
        } );

        var mountGeom = new THREE.PlaneGeometry(2000, 1000, 500, 500);

        var mountMesh = new THREE.Mesh(mountGeom, mountMaterial);
        mountMesh.rotation.x = -Math.PI / 2;
        mountMesh.position.y = -20;
        mountMesh.position.z = 0;
        mountMesh.receiveShadow = true;
        mountMesh.castShadow = true;

        scene.add(mountMesh);

        var groundMaterial = new THREE.MeshStandardMaterial( { color: 0xffffff } );

        var groundGeom = new THREE.PlaneGeometry(1000, 1000, 4, 4);
        var groundMesh = new THREE.Mesh(groundGeom, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = 1;
        groundMesh.position.z = 400;
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