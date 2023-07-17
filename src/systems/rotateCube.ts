import { System, system } from "@lastolivegames/becsy";
import * as THREE from "three";
import { physicsWorld } from "../main";
import { RigidBody, SpinningCube } from "../schemas";

@system
export class rotateCube extends System {
	private spinningCubeEntities = this.query(
		q => q.current.with(RigidBody).and.with(SpinningCube));
	
	execute(): void {
		for (const entity of this.spinningCubeEntities.current) {
			const handle = entity.read(RigidBody);
			const rb = physicsWorld!.bodies.get(handle.handle);
			if (!rb) return;

			const rot = rb.rotation();
			const q = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);

			q.multiply(new THREE.Quaternion(1, 1, 0.01, 0.01));

			rb.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
		}
	}
	
}
