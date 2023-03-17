// Import stylesheets
import RAPIER from "@dimforge/rapier3d-compat";
import "./style.css";
import * as j from "@javelin/ecs";
import * as THREE from "three";
import {
	CameraResource,
	PhysicsResource,
	RendererResource,
	SceneResource,
} from "./resources";
import {
	rpcExecutorSystem,
	applySyncSnapshot,
	bundleDespawner,
	bundleSpawner,
	clickAndCastDelete,
	initThreeSystem,
	initUI,
	physicsSystem,
	playerMovement,
	renderSystem,
	replicateCleanUp,
	replicateSystem,
	rotateCube,
	syncIntervalSystem,
	syncResetSystem,
} from "./systems";
import { rpcDictionary, bundleMap, nextStep, nextStepSystem } from "./utils";
import { Bundle } from "./components";
import { before } from "@javelin/ecs";

export const app = j.app();

app.addResource(SceneResource, new THREE.Scene());
app.addResource(
	CameraResource,
	new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	)
);
app.addResource(RendererResource, new THREE.WebGLRenderer());

RAPIER.init().then(() => {
	const physicsWorld = new RAPIER.World(new RAPIER.Vector3(0, -9.8, 0));
	app.addResource(PhysicsResource, physicsWorld);

	const groundColliderDesc = RAPIER.ColliderDesc.cuboid(
		10.0,
		0.1,
		10.0
	).setTranslation(0, -4, 0);
	physicsWorld.createCollider(groundColliderDesc);
	console.log(bundleMap);
	loop();
});

let log = (_world: j.World) => {
	let pos = _world.query(Bundle);
	let arr: number[] = [];
	pos.each(e => arr.push(e));
};

app.addInitSystem(initThreeSystem);
app.addInitSystem(initUI);

app.addSystemToGroup(j.Group.Early, syncResetSystem);
app.addSystemToGroup(j.Group.Early, applySyncSnapshot, j.after(syncResetSystem));
app.addSystemToGroup(j.Group.Early, nextStepSystem, j.after(applySyncSnapshot));
app.addSystemToGroup(j.Group.Early, rpcExecutorSystem, j.after(nextStepSystem));

app.addSystemToGroup(j.Group.EarlyUpdate, clickAndCastDelete);
app.addSystemToGroup(j.Group.EarlyUpdate, replicateSystem, j.after(clickAndCastDelete));
app.addSystemToGroup(j.Group.EarlyUpdate, bundleSpawner, j.after(clickAndCastDelete));

app.addSystemToGroup(j.Group.Update, playerMovement);
app.addSystemToGroup(j.Group.Update, rotateCube, j.before(physicsSystem));
app.addSystemToGroup(j.Group.Update, physicsSystem);

app.addSystemToGroup(j.Group.LateUpdate, renderSystem);

app.addSystemToGroup(j.Group.Late, replicateCleanUp);
app.addSystemToGroup(j.Group.Late, bundleDespawner);
app.addSystemToGroup(j.Group.Late, syncIntervalSystem);


const loop = () => {
	app.step();
	requestAnimationFrame(loop);
};
