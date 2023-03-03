import { createQuery } from "@javelin/ecs";
import * as THREE from "three";
import { physicsWorld } from "../main";
import { RigidBody, SpinningCube } from "../schemas";

const cube = createQuery(RigidBody, SpinningCube);
export function rotateCube() {
	cube((_entity, [handle, _tag]) => {
		const rb = physicsWorld.bodies.get(handle.handle);
		if (!rb) return;

		const rot = rb.rotation();
		const q = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);

		q.multiply(new THREE.Quaternion(1, 1, 0.01, 0.01));

		rb.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
	});
}
