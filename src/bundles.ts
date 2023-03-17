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
			// addIfNotSet(world, entity, Replicate, { hostEntity: entity, components: [Bundle, Position, Rotation, Velocity]});
		});
	
		let position = { x: 0, y: 1.5, z: 0 };
		if(!world.has(entity, Position)){
			console.log("physics box claims it doesnt have position yet ...");
			world.add(entity, Position, position );
		}else{
			position = world.get(entity, Position)!;
		}

		let velocity =  {x: 0, y: 0, z: 0};
		if(!world.has(entity, Velocity)){
			world.add(entity, Velocity, velocity );
		}else{
			velocity = world.get(entity, Velocity)!;
		}

		let rotation = {x: 1, y: 0, z: 0, w: 0 };
		if(!world.has(entity, Rotation)){
			world.add(entity, Rotation, rotation );
		}else{
			rotation = world.get(entity, Rotation)!;
		}


		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
		const cube = new THREE.Mesh(geometry, material);
		cube.position.set(position.x, position.y, position.z);
		scene.add(cube);

		if(world.has(entity, Mesh)){
			world.set(entity, Mesh, cube.id)
		}else{
			world.add(entity, Mesh, cube.id)
		}

		const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
            position.x, position.y, position.z
		).setRotation(rotation);
		const rigidBody = physicsWorld!.createRigidBody(rigidBodyDesc);
		rigidBody.setLinearDamping(0.05)

		if(world.has(entity, RigidBody)){
			world.set(entity, RigidBody, rigidBody.handle)
		}else{
			world.add(entity, RigidBody, rigidBody.handle)
		}
		// Create a cuboid collider attached to the dynamic rigidBody.
		const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
		physicsWorld!.createCollider(colliderDesc, rigidBody);

	},
	(world, entity) => {
		let scene = app.getResource(SceneResource);
        let physicsWorld = app.getResource(PhysicsResource);

		//remove from three scene
		let meshId = world.get(entity, Mesh);
		scene?.remove(scene.getObjectById(meshId!)!);

		let rbHandle = world.get(entity, RigidBody);
		physicsWorld?.removeRigidBody(physicsWorld.getRigidBody(rbHandle!));
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

			// addIfNotSet(world, entity, Replicate, { hostEntity: entity, components: [Bundle, Position, Rotation, Velocity]});
		})

		const [position] = addIfNotSet(world, entity, Position, { x: 0, y: 0, z: 0 });

		let velocity = {x: 0, y: 0, z: 0}
		if(world.has(entity, Velocity)){
			world.set(entity, Velocity, velocity)
		}else{
			world.add(entity, Velocity, velocity)
		}

		let rotation = {x: 1, y: 0, z: 0, w: 0}
		if(!world.has(entity, Rotation)){
			world.add(entity, Rotation, rotation)
		}

        if(!world.has(entity, SpinningBox)){
			world.add(entity, SpinningBox );
		}

		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		const cube = new THREE.Mesh(geometry, material);
		cube.position.set(position!.x, position!.y, position!.z);
		scene.add(cube);

		if(world.has(entity, Mesh)){
			world.set(entity, Mesh, cube.id)
		}else{
			world.add(entity, Mesh, cube.id)
		}
		// addOrUpdateIfExists(world, entity, Mesh, cube.id);

		const rigidBodyDesc =
			RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
				position!.x, position!.y, position!.z
			).setRotation(rotation!);

		const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

		if(world.has(entity, RigidBody)){
			world.set(entity, RigidBody, rigidBody.handle)
		}else{
			world.add(entity, RigidBody, rigidBody.handle)
		}

		const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
		physicsWorld.createCollider(colliderDesc, rigidBody);
	},
	(world, entity) => {
		console.log("delete me");
		
        let scene = app.getResource(SceneResource);
        let physicsWorld = app.getResource(PhysicsResource);

		//remove from three scene
		let meshId = world.get(entity, Mesh);
		scene?.remove(scene.getObjectById(meshId!)!);

		let rbHandle = world.get(entity, RigidBody);
		physicsWorld?.removeRigidBody(physicsWorld.getRigidBody(rbHandle!));
		
	}
);
