import "./style.css";
import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { Peer } from "peerjs";

export const peer = new Peer()

await RAPIER.init();

import { createWorld, World } from "@javelin/ecs";
import threeRenderSystem from "./systems/threeRenderSystem";
import physics from "./systems/physics";
import { initUI } from "./setup/initUI";
import { bundleSpawner } from "./systems/bundleSpawner";
import { bundleMap } from "./setup/prefab";
import { rotateCube } from "./systems/rotateCube";

console.log(bundleMap);

export let world: World | undefined;

export async function applySnapShot(snapshot: any = {}) {
	if (world) world.reset();

	world = createWorld({ snapshot: snapshot });
	world.addSystem(bundleSpawner);
	world.addSystem(rotateCube);
	world.addSystem(physics);
	world.addSystem(threeRenderSystem);
}

export const physicsWorld = new RAPIER.World(new RAPIER.Vector3(0, -9.8, 0));

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);

export const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 10;

let t1: number;
function animate() {
	requestAnimationFrame(animate);
	const t2 = performance.now();

	if (world) world.step(t2 - (t1 ?? t2));
	t1 = t2;
}

//init ecs world
applySnapShot();
if (world) initUI(world);

(function () {
	const groundColliderDesc = RAPIER.ColliderDesc.cuboid(
		10.0,
		0.1,
		10.0
	).setTranslation(0, -4, 0);
	physicsWorld.createCollider(groundColliderDesc);
})();

animate();
