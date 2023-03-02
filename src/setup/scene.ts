import RAPIER from "@dimforge/rapier3d-compat";
import { component, World } from "@javelin/ecs";
import * as THREE from "three";
import { physicsWorld, scene } from "../main";
import { Bundle,  } from "../schemas";
import { SpecialBox } from "./bundles";
import { defineBundle } from "./prefab";

export function spawnStaticCube(world: World){

	let entity = world.create();

	
	let bundleComponent = component(Bundle, {id: SpecialBox})
	world.attach(entity, bundleComponent);
	


	(function () {
		console.log("spawn floor")
		let groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.1, 10.0)
			.setTranslation(0,-4,0)
		physicsWorld.createCollider(groundColliderDesc);
	})();
}