import { defineBundle } from "./prefab";
import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { Position, RigidBody, Rotation, Mesh, SpinningCube } from "../schemas";
import { physicsWorld, scene } from "../main";
import { attachOrSetComponent } from "../systems/bundleSpawner";

export const PhysicsBox = defineBundle(
	"physics_box",
	(world, entity) => {
		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
		const cube = new THREE.Mesh(geometry, material);
		cube.position.set(0, 1.5, 0);
		scene.add(cube);
		// let mesh = component(Mesh, {id: cube.id});

		console.log("attach mesh", world.tryGet(entity, Mesh));
		attachOrSetComponent(world, entity, Mesh, { id: cube.id });
		// world.attach(entity, toComponent(cube, Mesh))

		const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
			0.0,
			1.5,
			0.0
		);
		const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);
		// let handle = component(RigidBody, {handle: rigidBody.handle} );

		console.log("attach rb");
		attachOrSetComponent(world, entity, RigidBody, {
			handle: rigidBody.handle,
		});

		// Create a cuboid collider attached to the dynamic rigidBody.
		const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
		physicsWorld.createCollider(colliderDesc, rigidBody);

		// world.attach(entity, mesh)

		// world.attach(entity, handle);
		// let position = component(Position, {x: 0,y: 1.5,z: 0});
		// world.attach(entity, position)
		console.log("attach position");
		attachOrSetComponent(world, entity, Position, { x: 0, y: 1.5, z: 0 });

		// let rotation = component(Rotation, {x: 0,y: 0, z: 0, w: 0});
		// world.attach(entity, rotation)
		console.log("attach rotation");
		attachOrSetComponent(world, entity, Rotation, {
			x: 0,
			y: 0,
			z: 0,
			w: 0,
		});
	},
	() => {return}
);

export const SpecialBox = defineBundle(
	"special_box",
	(world, entity) => {
		console.log("creating spinning");
		// let tag = component(SpinningCube, {a: 0})
		// world.attach(entity, tag)
		console.log("attach spinning mesh");
		attachOrSetComponent(world, entity, SpinningCube, { a: 0 });

		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		const cube = new THREE.Mesh(geometry, material);
		scene.add(cube);

		// let mesh = component(Mesh, {id: cube.id});
		// world.attach(entity, mesh)
		console.log("attach mesh");
		attachOrSetComponent(world, entity, Mesh, { id: cube.id });

		// let position = component(Position, {x: 0,y: 0,z: 0});
		// world.attach(entity, position)
		console.log("attach position");
		attachOrSetComponent(world, entity, Position, { x: 0, y: 0, z: 0 });

		// let rotation = component(Rotation, {x: 0,y: 0, z: 0, w: 0});
		// world.attach(entity, rotation)
		console.log("attach rotation");
		attachOrSetComponent(world, entity, Rotation, {
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
		const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

		// let handle = component(RigidBody, {handle: rigidBody.handle} );
		// world.attach(entity, handle)
		console.log("attach rb");
		attachOrSetComponent(world, entity, RigidBody, {
			handle: rigidBody.handle,
		});

		// Create a cuboid collider attached to the dynamic rigidBody.
		const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
		physicsWorld.createCollider(colliderDesc, rigidBody);
	},
	() => {return}
);
