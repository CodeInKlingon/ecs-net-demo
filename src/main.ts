import "./style.css";
import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { Peer } from "peerjs";

import { ComponentType, System, World, system } from "@lastolivegames/becsy";
import {ThreeRenderSystem} from "./systems/threeRenderSystem";
import {PhysicsSystem} from "./systems/physics";
import { initUI } from "./setup/initUI";
import { BundleSpawner, bundleMap } from "./bundle";
import { rotateCube } from "./systems/rotateCube";
import { entitySpawner } from "./systems/entitySpawner";
import { Replicated } from "./multiplayer";

export const createEntityQueue: (ComponentType<any> | Record<string, unknown>)[][] = [];
export const peer = new Peer();
export let physicsWorld: RAPIER.World | undefined; // = new RAPIER.World(new RAPIER.Vector3(0, -9.8, 0));

@system(s => s.after(ThreeRenderSystem))
class Replication extends System {
	private networkedEntities = this.query(
		q => q.current.added.and.removed.with(Replicated).usingAll.read);

	execute(): void {
		for (const entity of this.networkedEntities.current) {
			let componentsToReplicate = entity.read(Replicated).components;
			console.log("components to replicate", componentsToReplicate)

			componentsToReplicate.forEach(compType => {

				let val: Record< string, any> = {}
				Object.keys(compType.schema!).forEach( (key: string) => {
					val[key] = entity.read(compType)[key]

				});
				console.log("entity has value", val);
			});
		}
	}
}

Replication


await initPhysicsLib();
export const world = await World.create()
initUI(world);
ThreeRenderSystem
PhysicsSystem
BundleSpawner
bundleMap
rotateCube
entitySpawner

export const scene = new THREE.Scene();
scene.background = new THREE.Color("#ececec");
const ambientLight = new THREE.AmbientLight("#BBB");
scene.add(ambientLight)
const directionalLight = new THREE.DirectionalLight("#FFF", 0.6)
directionalLight.position.set( -5, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize = new THREE.Vector2(2048, 2048); 

var side = 15;
directionalLight.shadow.camera.top = side;
directionalLight.shadow.camera.bottom = -side;
directionalLight.shadow.camera.left = side;
directionalLight.shadow.camera.right = -side;
directionalLight.shadow.radius = 5
directionalLight.shadow.blurSamples = 25
scene.add(directionalLight)

var shadowHelper = new THREE.CameraHelper( directionalLight.shadow.camera );
scene.add( shadowHelper );
export const camera = new THREE.PerspectiveCamera(
	75,
	1920 / 1080,
	0.1,
	1000
);

export const renderer = new THREE.WebGLRenderer({antialias: true});

renderer.shadowMap.enabled = true
renderer.setSize(1920, 1080);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.type = THREE.VSMShadowMap

camera.position.z = 10;

const geometry = new THREE.BoxGeometry(20, 0.2, 20);
const material = new THREE.MeshStandardMaterial({ color: "#fff" });
const cube = new THREE.Mesh(geometry, material);
cube.position.set(0, -4, 0);

// ...
cube.receiveShadow = true
scene.add(cube)

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

