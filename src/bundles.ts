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

		console.log("attach rotation");
		let rotation = attachOrSkip(world, entity, Rotation, {
			x: 1,
			y: 0,
			z: 0,
			w: 0,
		});

		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
		const cube = new THREE.Mesh(geometry, material);
		cube.position.set(position.x, position.y, position.z);
		scene.add(cube);

		attachOrSetComponent(world, entity, Mesh, cube.id);

		const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
            position.x, position.y, position.z
		).setRotation(rotation);
		const rigidBody = physicsWorld!.createRigidBody(rigidBodyDesc);

		console.log("attach rb");
		attachOrSetComponent(world, entity, RigidBody, rigidBody.handle);

		// Create a cuboid collider attached to the dynamic rigidBody.
		const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
		physicsWorld!.createCollider(colliderDesc, rigidBody);

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

		attachOrSetComponent(world, entity, Replicate, [Bundle, Position, Rotation]);

		console.log("attach position");
		const position = attachOrSkip(world, entity, Position, { x: 0, y: 0, z: 0 });

		const rotation = attachOrSkip(world, entity, Rotation, {
			x: 1,
			y: 0,
			z: 0,
			w: 0,
		});

		console.log("attach spinning box tag");
		attachOrSetComponent(world, entity, SpinningBox, 1);

		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		const cube = new THREE.Mesh(geometry, material);
		cube.position.set(position.x, position.y, position.z);
		scene.add(cube);

		console.log("attach mesh");
		attachOrSetComponent(world, entity, Mesh, cube.id);

		const rigidBodyDesc =
			RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
				position.x, position.y, position.z
			).setRotation(rotation);

		const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

		console.log("attach rb");
		attachOrSetComponent(world, entity, RigidBody, rigidBody.handle);

		const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
		physicsWorld.createCollider(colliderDesc, rigidBody);
	},
	() => {
		return;
	}
);
