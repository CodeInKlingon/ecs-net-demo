import { defineBundle } from "./prefab";
import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { Position, RigidBody, Rotation, Mesh, SpinningCube, Replicated } from "../schemas";
import { physicsWorld, scene } from "../main";
import { addOrReturnComponent, addOrSetComponent } from "../systems/bundleSpawner";
function getRandomColor() {
	const letters = "0123456789ABCDEF";
	let color = "#";
	for (let i = 0; i < 6; i++) {
	  color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}
export const PhysicsBox = defineBundle(
	"physics_box",
	(entity) => {
		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshStandardMaterial({ color: getRandomColor() });
		const cube = new THREE.Mesh(geometry, material);
		cube.position.set(0, 1.5, 0);
		cube.castShadow = true

		// ...
		cube.receiveShadow = true
		scene.add(cube);
		addOrSetComponent(entity, Mesh, { id: cube.id });

		addOrSetComponent(entity, Replicated, { peerWithAuthority: "1", id: "1", components: [Position] });

		console.log("attach position");
		let position = addOrReturnComponent(entity, Position, { x: -5, y: 1.5, z: 0 });
		
		const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
			position!.x, position!.y, position!.z
		);
		const rigidBody = physicsWorld!.createRigidBody(rigidBodyDesc);
		console.log("attach rb");
		addOrSetComponent(entity, RigidBody, {
			handle: rigidBody.handle,
		});
		// Create a cuboid collider attached to the dynamic rigidBody.
		const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
		physicsWorld!.createCollider(colliderDesc, rigidBody);

		console.log("attach rotation");
		addOrSetComponent(entity, Rotation, {
			x: 0,
			y: 0,
			z: 0,
			w: 0,
		});
	},
	() => {
		return;
	}
);

export const SpecialBox = defineBundle(
	"special_box",
	(entity) => {
		console.log("creating spinning");
		// let tag = component(SpinningCube, {a: 0})
		// world.attach(entity, tag)
		console.log("attach spinning mesh");
		addOrSetComponent(entity, SpinningCube);

		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		const cube = new THREE.Mesh(geometry, material);
		scene.add(cube);

		// let mesh = component(Mesh, {id: cube.id});
		// world.attach(entity, mesh)
		console.log("attach mesh");
		addOrSetComponent(entity, Mesh, { id: cube.id });

		// let position = component(Position, {x: 0,y: 0,z: 0});
		// world.attach(entity, position)
		console.log("attach position");
		addOrSetComponent(entity, Position, { x: 0, y: 0, z: 0 });

		// let rotation = component(Rotation, {x: 0,y: 0, z: 0, w: 0});
		// world.attach(entity, rotation)
		console.log("attach rotation");
		addOrSetComponent(entity, Rotation, {
			x: 0,
			y: 0,
			z: 0,
			w: 0,
		});

		const rigidBodyDesc =
			RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
				0.0,
				0.0,
				0.0
			);
		const rigidBody = physicsWorld!.createRigidBody(rigidBodyDesc);

		// let handle = component(RigidBody, {handle: rigidBody.handle} );
		// world.attach(entity, handle)
		console.log("attach rb");
		addOrSetComponent(entity, RigidBody, {
			handle: rigidBody.handle,
		});

		// Create a cuboid collider attached to the dynamic rigidBody.
		const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
		physicsWorld!.createCollider(colliderDesc, rigidBody);
	},
	() => {
		return;
	}
);
