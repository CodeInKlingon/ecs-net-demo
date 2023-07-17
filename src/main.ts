import "./style.css";
import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { Peer } from "peerjs";

import { ComponentType, World } from "@lastolivegames/becsy";
import {ThreeRenderSystem} from "./systems/threeRenderSystem";
import {PhysicsSystem} from "./systems/physics";
import { initUI } from "./setup/initUI";
import { BundleSpawner } from "./systems/bundleSpawner";
import { bundleMap } from "./setup/prefab";
import { rotateCube } from "./systems/rotateCube";
import { entitySpawner } from "./systems/entitySpawner";

export const createEntityQueue: (ComponentType<any> | Record<string, unknown>)[][] = [];
export const peer = new Peer();
export let physicsWorld: RAPIER.World | undefined; // = new RAPIER.World(new RAPIER.Vector3(0, -9.8, 0));

await initPhysicsLib();
export const world = await World.create()
initUI(world);
ThreeRenderSystem
PhysicsSystem
BundleSpawner
bundleMap
rotateCube


entitySpawner
// export async function applySnapShot(snapshot: any = {}) {

// 	world = 
// 	world.addSystem(bundleSpawner);
// 	world.addSystem(rotateCube);
// 	world.addSystem(physics);
// 	world.addSystem(threeRenderSystem);
// }


export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(
	75,
	1920 / 1080,
	0.1,
	1000
);

export const renderer = new THREE.WebGLRenderer();
renderer.setSize(1920, 1080);
document.body.appendChild(renderer.domElement);

camera.position.z = 10;

async function animate() {
	await world.execute();
	requestAnimationFrame(animate);
}

await animate();

async function initPhysicsLib(){
	await RAPIER.init();

	physicsWorld = new RAPIER.World(new RAPIER.Vector3(0, -9.8, 0));
	
	const groundColliderDesc = RAPIER.ColliderDesc.cuboid(
		10.0,
		0.1,
		10.0
	).setTranslation(0, -4, 0);
	physicsWorld.createCollider(groundColliderDesc);
}
