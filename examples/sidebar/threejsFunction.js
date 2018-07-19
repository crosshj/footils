(function(){
    // https://resources.oreilly.com/examples/9781784392215/blob/dd019759a7b48fe409b13f232abb1b0ce988cf5e/learning-threejs-master/chapter-04/04-mesh-normal-material.html

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
        light2.position.set( 20, 70, 20 );
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
        var ambientLight = new THREE.AmbientLight(0x303030);
        scene.add(ambientLight);

        // add spotlight for the shadows
        // var spotLight = new THREE.SpotLight(0xffffff);
        // spotLight.position.set(0, 50, 10);
        // spotLight.castShadow = true;
        // spotLight.shadow.mapSize.width = 1024;
        // spotLight.shadow.mapSize.height = 1024;
        // scene.add(spotLight);

        var helper = new THREE.CameraHelper( light.shadow.camera );
        //scene.add( helper );

        var groundMaterial = new THREE.MeshStandardMaterial( { color: 0xffffff } );
        
        //var mat_wireframe = new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true});
        //var mat_lambert = new THREE.MeshLambertMaterial({color: 0xffffff, shading: THREE.FlatShading});
        //var cubeMaterial = [ mat_wireframe, mat_lambert ];
        
        var t = new THREE.Texture(document.getElementById('pattern-leaves'));
        t.repeat.set(1, 1);
        t.needsUpdate = true;
        t.anisotropy = 32;
        //t.rotation = (90 * Math.PI)/180;
        // var cubeMaterial = new THREE.MeshBasicMaterial({
        //     map: t
        // });

        // tree
        var cubeMaterial = new THREE.MeshPhongMaterial( {
            color: 0x8899dd, specular: 0x8bc34a, shininess: 1,
            map: t
        } );

        // trunk
        var u = new THREE.Texture(document.getElementById('pattern-stones'));
        u.needsUpdate = true;
        var sphereMaterial = new THREE.MeshPhongMaterial( {
            color: 0x654321, specular: 0xdcc19c, shininess: 5,
            map: u
        } );

        var groundGeom = new THREE.PlaneGeometry(1000, 1000, 4, 4);
        var groundMesh = new THREE.Mesh(groundGeom, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = -20;
        groundMesh.position.z = 400;
        groundMesh.receiveShadow = true;
        groundMesh.castShadow = true;
        scene.add(groundMesh);

        //var sphereGeometry = new THREE.SphereGeometry(21, 20, 20);

        var divisions = 1;
        var modifier = new THREE.SubdivisionModifier(divisions);
        
        // var cubeDim = 16;
        // var cubeGeometry = new THREE.BoxGeometry(cubeDim, cubeDim, cubeDim);
        // modifier.modify(cubeGeometry);

        // var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        // var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

        // position the sphere
        // sphere.position.x = 0;
        // sphere.position.y = 2.75;
        // sphere.position.z = 7;
        // sphere.castShadow = true;
        // sphere.receiveShadow = true;

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

        // cube.position.x = 0;
        // cube.position.y = 35;
        // cube.position.z = 16.5;
        // cube.rotation.y = (45 * Math.PI)/180;
        // cube.rotation.x = (25 * Math.PI)/180;
        // cube.castShadow = true;
        // cube.receiveShadow = true;

        // add the sphere to the scene
        //scene.add(sphere);
        //scene.add(cube);
        //scene.add(plane);

        // position and point the camera to the center of the scene
        camera.position.x = 0;
        camera.position.y = 50;
        camera.position.z = 160;
        camera.lookAt(new THREE.Vector3(0, 35, 5));

        var camhelper = new THREE.CameraHelper( camera );
        //scene.add( camhelper );

        var axesHelper = new THREE.AxesHelper( 5 );
        //scene.add( axesHelper );

        var loader = new THREE.OBJLoader();
        const tree = loader.parse(window.treeModel);

        tree.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.material = child.material.map(material => {
                    if(material.name === 'Bark'){
                        return sphereMaterial;
                    }
                    if(material.name === 'Tree'){
                        return cubeMaterial;
                    }
                    return material;
                });
                child.material.overdraw = 1

                //var geometry = new THREE.Geometry().fromBufferGeometry( child.geometry );
                //geometry.computeFaceNormals();
                //geometry.mergeVertices();
                //geometry.computeVertexNormals();
                //modifier.modify(geometry);
                //child.geometry = new THREE.BufferGeometry().fromGeometry( geometry );

                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );


        const bunny = loader.parse(window.bunnyModel);
        bunny.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.material = new THREE.MeshPhongMaterial( {
                    color: 0xffffff, specular: 0xffffff, shininess: 1,
                    emissive: 0x181818
                });
                child.material.side = THREE.BackSide;
                child.material.overdraw = 1
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );

        var bunnyScaleDim = 3;
        bunny.scale.set(bunnyScaleDim, bunnyScaleDim, bunnyScaleDim);
        bunny.position.x = 0;
        bunny.position.y = -20;
        bunny.position.z = 40;
        // bunny.rotateX((-135 * Math.PI)/180);
        bunny.rotateY((-50 * Math.PI)/180);
        //bunny.rotation.z = (0 * Math.PI)/180;
        scene.add(bunny);

        const tree2 = tree.clone();
        const bush = tree.clone();
        const bush2 = bush.clone();
        const tree3 = tree.clone();

        var treeScaleDim = 3;
        tree.scale.set(treeScaleDim, treeScaleDim, treeScaleDim);
        tree.position.x = 65;
        tree.position.y = -20;
        tree.position.z = -55;
        tree.rotation.y = (-45 * Math.PI)/180;
        scene.add(tree);

        const tree2ScaleDim = 3.7;
        tree2.scale.set(tree2ScaleDim, tree2ScaleDim, tree2ScaleDim);
        tree2.position.x = -50;
        tree2.position.y = -20;
        tree2.position.z = -20;
        tree2.rotation.y = (150 * Math.PI)/180;
        scene.add(tree2);

        const bushScaleDim = 2.7;
        bush.scale.set(bushScaleDim, bushScaleDim, bushScaleDim);
        bush.position.x = -88;
        bush.position.y = -65;
        bush.position.z = 30;
        bush.rotation.y = (-80 * Math.PI)/180;
        scene.add(bush);

        const bush2ScaleDim = 3;
        bush2.scale.set(bush2ScaleDim, bush2ScaleDim, bush2ScaleDim);
        bush2.position.x = 83;
        bush2.position.y = -55;
        bush2.position.z = 50;
        bush2.rotation.y = (-90 * Math.PI)/180;
        scene.add(bush2);

        // FRONT TREE
        const tree3ScaleDim = 4;
        tree3.scale.set(tree3ScaleDim, tree3ScaleDim, tree3ScaleDim);
        tree3.position.x = -106;
        tree3.position.y = -20;
        tree3.position.z = 75;
        tree3.rotation.y = (220 * Math.PI)/180;
        scene.add(tree3);

        renderer.render(scene, camera);

    }).toString().split('\n').slice(1, -1).join('\n');
    window.threejsFunction = glFunction;
})();