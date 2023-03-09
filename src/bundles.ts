import { addOrUpdateIfExists, addIfNotSet, defineBundle, nextStep } from "./utils";
import * as THREE from "three";
import RAPIER from '@dimforge/rapier3d-compat';

import { PhysicsResource, SceneResource } from "./resources";
import { app } from "./main";
import { Bundle, Mesh, Position, Replicate, RigidBody, Rotation, SpinningBox, Velocity } from "./components";

export const PhysicsBox = defineBundle(
	"physics_box",
	(world, entity) => {
        let scene = app.getResource(SceneResource);
        let physicsWorld = app.getResource(PhysicsResource);
        if (!scene || !physicsWorld) return;
		nextStep(()=>{
			addIfNotSet(world, entity, Replicate, { hostEntity: entity, components: [Bundle, Position, Rotation, Velocity]});
		});
	
		let [position] = addIfNotSet(world, entity, Position, { x: 0, y: 1.5, z: 0 });
		
		addIfNotSet(world, entity, Velocity, {x: 0, y: 0, z: 0});

		let [rotation] = addIfNotSet(world, entity, Rotation, {
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

		addOrUpdateIfExists(world, entity, Mesh, cube.id);
		
		const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
            position.x, position.y, position.z
		).setRotation(rotation);
		const rigidBody = physicsWorld!.createRigidBody(rigidBodyDesc);

		addOrUpdateIfExists(world, entity, RigidBody, rigidBody.handle);

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

		nextStep(()=>{

			addIfNotSet(world, entity, Replicate, { hostEntity: entity, components: [Bundle, Position, Rotation, Velocity]});
		})

		const [position] = addIfNotSet(world, entity, Position, { x: 0, y: 0, z: 0 });

		addOrUpdateIfExists(world, entity, Velocity, {x: 0, y: 0, z: 0});

		const [rotation] = addIfNotSet(world, entity, Rotation, {
			x: 1,
			y: 0,
			z: 0,
			w: 0,
		});

		addOrUpdateIfExists(world, entity, SpinningBox );

		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		const cube = new THREE.Mesh(geometry, material);
		cube.position.set(position!.x, position!.y, position!.z);
		scene.add(cube);

		addOrUpdateIfExists(world, entity, Mesh, cube.id);

		const rigidBodyDesc =
			RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
				position!.x, position!.y, position!.z
			).setRotation(rotation!);

		const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

		addOrUpdateIfExists(world, entity, RigidBody, rigidBody.handle);

		const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
		physicsWorld.createCollider(colliderDesc, rigidBody);
	},
	() => {
		return;
	}
);
