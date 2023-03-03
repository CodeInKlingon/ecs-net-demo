import './style.css'
import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from 'three';
import { Peer } from "peerjs";

export const peer = new Peer();

export const state = {
	world: undefined
}
  
await RAPIER.init();

import { createWorld, World } from "@javelin/ecs";
import threeRenderSystem from './systems/threeRenderSystem';
import physics from './systems/physics';
import { initUI } from './setup/initUI';
import { bundleSpawner } from './systems/bundleSpawner';
import { bundleMap } from './setup/prefab';
import { rotateCube } from './systems/rotateCube';

console.log(bundleMap)

export let world: World | undefined;

export async function applySnapShot(snapshot: any = {}){
	requestAnimationFrame( () => {});
	if(world)
		world.reset();
	world = createWorld({snapshot: snapshot})
	world.addSystem(bundleSpawner)
	world.addSystem(rotateCube)
	world.addSystem(physics)
	world.addSystem(threeRenderSystem)
}


export const physicsWorld = new RAPIER.World(new RAPIER.Vector3(0,-9.8,0));

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

export const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


camera.position.z = 5;

let t1: number
function animate() {
	
	requestAnimationFrame( animate );
	const t2 = performance.now()

	world!.step(t2 - (t1 ?? t2))
	t1 = t2
}


//init ecs world
applySnapShot();
initUI(world!);

(function () {
	console.log("spawn floor")
	let groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.1, 10.0)
		.setTranslation(0,-4,0)
	physicsWorld.createCollider(groundColliderDesc);
})();

animate();




