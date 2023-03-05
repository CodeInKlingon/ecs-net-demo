import { attachOrSetComponent, attachOrSkip, defineBundle } from "./utils";
import * as THREE from "three";
import RAPIER from '@dimforge/rapier3d-compat';

import * as j from '@javelin/ecs';
import { PhysicsResource, SceneResource } from "./resources";
import { app } from "./main";
import { Bundle, Mesh, Position, Replicate, RigidBody, Rotation, SpinningBox } from "./components";

export const PhysicsBox = defineBundle(
	"physics_box",
	(world, entity) => {
        let scene = app.getResource(SceneResource);
        let physicsWorld = app.getResource(PhysicsResource);
        if (!scene || !physicsWorld) return;


		attachOrSetComponent(world, entity, Replicate, [Bundle, Position, Rotation]);

        console.log("attach position");
		let position = attachOrSkip(world, entity, Position, { x: 0, y: 1.5, z: 0 });

		// let rotation = component(Rotation, {x: 0,y: 0, z: 0, w: 0});
		// world.attach(entity, rotation)
		console.log("attach rotation");
		let rotation = attachOrSkip(world, entity, Rotation, {
			x: 0,
			y: 0,
			z: 0,
			w: 0,
		});

		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
		const cube = new THREE.Mesh(geometry, material);
		cube.position.set(position.x, position.y, position.z);
		scene.add(cube);
		// let mesh = component(Mesh, {id: cube.id});

		attachOrSetComponent(world, entity, Mesh, cube.id);
		// world.attach(entity, toComponent(cube, Mesh))

		const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
            position.x, position.y, position.z
		);
		const rigidBody = physicsWorld!.createRigidBody(rigidBodyDesc);
		// let handle = component(RigidBody, {handle: rigidBody.handle} );

		console.log("attach rb");
		attachOrSetComponent(world, entity, RigidBody, rigidBody.handle);

		// Create a cuboid collider attached to the dynamic rigidBody.
		const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
		physicsWorld!.createCollider(colliderDesc, rigidBody);

		// world.attach(entity, mesh)

		// world.attach(entity, handle);
		// let position = component(Position, {x: 0,y: 1.5,z: 0});
		// world.attach(entity, position)
	},
	() => {
		return;
	}
);

export const SpecialBox = defineBundle(
	"special_box",
	(world, entity) => {
		console.log("creating spinning");

        let scene = app.getResource(SceneResource);
        let physicsWorld = app.getResource(PhysicsResource);
        if (!scene || !physicsWorld) return;
		// let tag = component(SpinningCube, {a: 0})
		// world.attach(entity, tag)
		attachOrSetComponent(world, entity, Replicate, [Bundle, Position, Rotation]);

		console.log("attach spinning mesh");
		attachOrSetComponent(world, entity, SpinningBox, 1);

		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		const cube = new THREE.Mesh(geometry, material);
        console.log(scene, cube)
		scene.add(cube);

		// let mesh = component(Mesh, {id: cube.id});
		// world.attach(entity, mesh)
		console.log("attach mesh");
		attachOrSetComponent(world, entity, Mesh, cube.id);

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
		attachOrSetComponent(world, entity, RigidBody, rigidBody.handle);

		// Create a cuboid collider attached to the dynamic rigidBody.
		const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
		physicsWorld.createCollider(colliderDesc, rigidBody);
	},
	() => {
		return;
	}
);
