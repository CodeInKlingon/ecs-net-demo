// Import stylesheets
import RAPIER from '@dimforge/rapier3d-compat';
import './style.css';
import * as j from '@javelin/ecs';
import * as THREE from 'three';
import { CameraResource, PhysicsResource, RendererResource, SceneResource } from './resources';
import { bundleSpawner, initThreeSystem, initUI, physicsSystem, renderSystem, rotateCube } from './systems';
import { bundleMap } from './utils';
import { Bundle, Position, Replicate, Rotation } from './components';
import { PhysicsBox, SpecialBox } from './bundles';




export const app = j.app();

app.addResource(SceneResource, new THREE.Scene());
app.addResource(CameraResource, new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
));
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




let createBoxSystem = (world: j.World) => {

  	// world.create( j.type(Bundle, Position), PhysicsBox, {x:1,y:1, z: 1}  );
  	world.create( Bundle, PhysicsBox );
};

let log = (world: j.World) => {
	let pos = world.query(Position);
	// console.log("number of position components",pos.length);

	
	let bun = world.query(Bundle);
	// console.log("number of bundle components",bun.length);
}

app.addInitSystem(initThreeSystem);
app.addInitSystem(initUI);
app.addInitSystem(createBoxSystem);

app.addSystem(rotateCube);
app.addSystem(physicsSystem);
app.addSystem(renderSystem);
app.addSystem(bundleSpawner);
app.addSystem(log);

let loop = () => {
	app.step();
	requestAnimationFrame(loop);
};
