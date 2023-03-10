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
	bundleDespawner,
	bundleSpawner,
	clickAndCastDelete,
	initThreeSystem,
	initUI,
	physicsSystem,
	renderSystem,
	replicateSystem,
	rotateCube,
} from "./systems";
import { actions, bundleMap, nextStep, nextStepSystem } from "./utils";

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
	// let pos = world.query(Position);
	// console.log("number of position components",pos.length);
    console.log(actions)
};

app.addInitSystem(initThreeSystem);
app.addInitSystem(initUI);
app.addInitSystem((world) => {
	world.create();
	nextStep(() => {
		console.log("Entitys this step", world.query().length); //1
	});
	console.log("Entitys this step", world.query().length); //0
});
app.addInitSystem(log);

app.addSystemToGroup(j.Group.Early, nextStepSystem);

app.addSystemToGroup(j.Group.EarlyUpdate, clickAndCastDelete);
app.addSystemToGroup(j.Group.EarlyUpdate, bundleSpawner, j.after(clickAndCastDelete));

app.addSystemToGroup(j.Group.Update, rotateCube);
app.addSystemToGroup(j.Group.Update, physicsSystem);

app.addSystemToGroup(j.Group.LateUpdate, renderSystem);

app.addSystemToGroup(j.Group.Late, replicateSystem);
app.addSystemToGroup(j.Group.Late, bundleDespawner);


const loop = () => {
	app.step();
	requestAnimationFrame(loop);
};
