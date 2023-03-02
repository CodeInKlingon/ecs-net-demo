import './style.css'
import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from 'three';
import { Peer } from "peerjs";

export const peer = new Peer();


  
await RAPIER.init();

import { createWorld, World, createQuery } from "@javelin/ecs";
import threeRenderSystem from './systems/threeRenderSystem';
import { RigidBody, SpinningCube } from './schemas';
import physics from './systems/physics';
import { initUI } from './setup/initUI';
import { bundleSpawner } from './systems/bundleSpawner';
import { bundleMap } from './setup/prefab';

console.log(bundleMap)

export let world: World | undefined;

export function applySnapShot(snapshot: any = {}){
	if(world)
		world.reset();
	world = createWorld({snapshot: snapshot})
	world.addSystem(bundleSpawner)
	world.addSystem(rotateCube)
	world.addSystem(physics)
	world.addSystem(threeRenderSystem)
}
applySnapShot();

export const physicsWorld = new RAPIER.World(new RAPIER.Vector3(0,-9.8,0));

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

export const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


camera.position.z = 5;

// spawnStaticCube(world);
initUI(world!)

function animate() {
  requestAnimationFrame( animate );

  world!.step();
}


const cube = createQuery( RigidBody, SpinningCube)
function rotateCube (world: World) {
	cube((entity, [handle, _]) => {
        let rb = physicsWorld.bodies.get(handle.handle);
        // console.log(handle)
		if(!rb) return
		
        let rot = rb!.rotation();
        const q = new THREE.Quaternion(rot.x,rot.y,rot.z,rot.w);

        q.multiply(new THREE.Quaternion(1,1,0.01,0.01))
        
        rb!.setRotation(
            {x: q.x,y: q.y, z: q.z, w: q.w},
            true
        );
	});
}
// world.addSystem(initScene)

animate();




