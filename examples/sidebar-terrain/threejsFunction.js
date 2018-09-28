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
        const fov = 75;
        const aspect = width/height;
        const near = 0.1;
        const far = 1000;
        var camera = new THREE.PerspectiveCamera( fov, aspect, near, far );

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

        var light = new THREE.PointLight( sunColor, 2, 400, 1.4);
        //var light = new THREE.PointLight( sunColor, .8, 100, 1.4);>>>>>>> 90f762598e82043ecb88490d14a1577030193094
        light.position.set( 0, 15, 170 );
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
            emissive: 0x111900,
            metalness: 0.9,
            //shininess: 1,
            roughness: 0.75,
            transparent: false,
            skinning : true
        });


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
        function getBones(geometry){
            var segmentHeight = 1.6;
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

            for (let i = 0; i < geometry.vertices.length; i += 1) {
                const vertex = geometry.vertices[i];
                const y = (vertex.y + halfHeight);
                const skinIndex = Math.floor(y / segmentHeight);
                const skinWeight = (y % segmentHeight) / segmentHeight;

                geometry.skinIndices.push(new THREE.Vector4(skinIndex, skinIndex + 1, 0, 0));
                geometry.skinWeights.push(new THREE.Vector4(1 - skinWeight, skinWeight, 0, 0));
            }

            return bones;
        }


        function getMesh(index) {

            var sphereGeom = new THREE.SphereGeometry(3, 64, 64);
            var sphereMesh = new THREE.SkinnedMesh(sphereGeom, sphereMat);

            sphereMesh.position.x = 0;
            sphereMesh.position.y = 8;
            sphereMesh.position.z = 142;
            sphereMesh.receiveShadow = true;
            sphereMesh.castShadow = true;

            var bones = getBones(sphereGeom);
            var skeleton = new THREE.Skeleton( bones );

            sphereMesh.add( bones[ 0 ] );
            sphereMesh.bind( skeleton );

            skeletonHelper = new THREE.SkeletonHelper( sphereMesh );
            skeletonHelper.material.linewidth = 2;
            //scene.add( skeletonHelper );

            sphereMesh.scale.multiplyScalar(1);

            scene.add(sphereMesh);

            // TODO: hate that I have to do two renders to see this
            //sphereMesh.skeleton.bones[1].rotation.z = .2;
            sphereMesh.skeleton.bones[1].position.y = 3;

            sphereMesh.skeleton.bones[1].scale.x = 0.35;
            sphereMesh.skeleton.bones[1].scale.z = 0.35;


            sphereMesh.skeleton.bones[2].scale.x = 1.5;
            sphereMesh.skeleton.bones[2].scale.z = 1.5;
            sphereMesh.skeleton.bones[2].position.y = 3;
            //sphereMesh.skeleton.bones[2].rotation.z = .3;

            //sphereMesh.skeleton.bones[3].rotation.z = -.8;
            sphereMesh.skeleton.bones[3].position.y = 4;
            // sphereMesh.skeleton.bones[3].scale.x = 1.1;
            // sphereMesh.skeleton.bones[3].scale.z = 1.1;
            //sphereMesh.skeleton.bones[3].position.x = -1;

            //sphereMesh.skeleton.bones[4].rotation.z = .45;
            sphereMesh.skeleton.bones[4].position.y = 2;

            sphereMesh.rotation.y = 0;
            sphereMesh.position.x = -17;
            return sphereMesh;
        }

        const meshes = (new Array(8)).fill().map( x => getMesh() );

        meshes.forEach((x, i) => {
            x.position.x = x.position.x + i * 5;
            x.rotation.y = x.rotation.y + i * -.75;
        });


        // position and point the camera to the center of the scene
        camera.position.x = 0;
        camera.position.y = 10;
        camera.position.z = 160;
        camera.lookAt(new THREE.Vector3(0, 35, 5));


        renderer.render(scene, camera);
        // renderer.render(scene, camera);
        //window.scene = scene;
        //window.sphere = sphereMesh;
        //window.renderer = () => renderer.render(scene, camera);

    }).toString().split('\n').slice(1, -1).join('\n');
    window.threejsFunction = glFunction;
})();