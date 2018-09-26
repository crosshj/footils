(function(){

    const glFunction = (() => {
        //console.log({ ctx, gl, alpha, width, height});
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

        //back lights
        var sunColor = 0x884466;

        var width = 2000;
        var height = 100;
        var intensity = 4;
        var rectLight = new THREE.RectAreaLight( 0xbb2288, intensity,  width, height );
        rectLight.position.set( 0, 200, -350 );
        rectLight.lookAt( 0, 0, -850 );
        scene.add( rectLight )

        // var rectLightHelper = new THREE.RectAreaLightHelper( rectLight );
        // scene.add( rectLightHelper );

        // front lights
        // var frontLightIntensity = 3;
        // var frontLight = new THREE.RectAreaLight( sunColor, frontLightIntensity,  width, height );
        // frontLight.position.set( 0,  200, 100 );
        // frontLight.lookAt( 0, 0, 350 );
        // scene.add( frontLight )

        // var frontLightHelper = new THREE.RectAreaLightHelper( frontLight );
        // scene.add( frontLightHelper );

        var light = new THREE.PointLight( sunColor, 1.1, 400, 1.4);
        //var light = new THREE.PointLight( sunColor, .8, 100, 1.4);>>>>>>> 90f762598e82043ecb88490d14a1577030193094
        light.position.set( 0, 30, 170 );
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.shadow.camera.left = 0;
        scene.add( light );

        var t = new THREE.Texture(document.getElementById('pattern-needles'));
        t.repeat.set(1, 1);
        t.needsUpdate = true;
        //t.anisotropy = 32;

        var mountMap = new THREE.Texture(document.getElementById('pattern-displace'));
        mountMap.repeat.set(1, 1);
        mountMap.needsUpdate = true;
        //mountMap.anisotropy = 32;

        var mountMaterial = new THREE.MeshStandardMaterial( {
            //color: 0xffffff,
            displacementMap: mountMap,
            map: t,
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
        //groundMesh.castShadow = true;
        scene.add(groundMesh);


        var sphereMat = new THREE.MeshStandardMaterial( {
            //color: 0xdddddd,
            //specular: 0x009900,
            emissive: 0x001100,
            metalness: 0.6,
            //shininess: 1,
            roughness: 0.6,
            transparent: false,
            skinning : true
        });
        var sphereGeom = new THREE.SphereGeometry(3, 64, 64);
        var sphereMesh = new THREE.SkinnedMesh(sphereGeom, sphereMat);
        sphereMesh.position.x = 0;
        sphereMesh.position.y = 8;
        sphereMesh.position.z = 140;
        sphereMesh.receiveShadow = true;
        sphereMesh.castShadow = true;

        function createBones ( sizing ) {
            bones = [];
            var prevBone = new THREE.Bone();
            bones.push( prevBone );
            prevBone.position.y = - sizing.halfHeight;
            for ( var i = 0; i < sizing.segmentCount; i ++ ) {
                var bone = new THREE.Bone();
                bone.position.y = sizing.segmentHeight;
                bones.push( bone );
                prevBone.add( bone );
                prevBone = bone;

            }
            return bones;
        }
        function getBones(){
            var segmentHeight = 1.4;
            var segmentCount = 4;
            var height = segmentHeight * segmentCount;
            var halfHeight = height * 0.5;

            var sizing = {
                segmentHeight : segmentHeight,
                segmentCount : segmentCount,
                height : height,
                halfHeight : halfHeight
            };

            var bones = createBones( sizing );
            return bones;
        }

        var bones = getBones();
        var skeleton = new THREE.Skeleton( bones );

        sphereMesh.add( bones[ 0 ] );
        sphereMesh.bind( skeleton );


        skeletonHelper = new THREE.SkeletonHelper( sphereMesh );
        skeletonHelper.material.linewidth = 2;
        scene.add( skeletonHelper );

        sphereMesh.scale.multiplyScalar(1);
        scene.add(sphereMesh);

        //sphereMesh.skeleton.bones[2].position.y = -120;
        sphereMesh.skeleton.bones[2].position.x = -20;
        // sphereMesh.skeleton.bones[2].matrixWorldNeedsUpdate = true;

        //skeletonHelper.update();
        console.log(sphereMesh)



        // position and point the camera to the center of the scene
        camera.position.x = 0;
        camera.position.y = 10;
        camera.position.z = 160;
        camera.lookAt(new THREE.Vector3(0, 35, 5));


        renderer.render(scene, camera);

        window.sphere = sphereMesh;
        window.renderer = () => renderer.render(scene, camera);

    }).toString().split('\n').slice(1, -1).join('\n');
    window.threejsFunction = glFunction;
})();