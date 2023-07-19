
import * as THREE from "three";
import { composer, scene } from "../main";
import { Position, Rotation, Mesh } from "../components";
import { System, system } from "@lastolivegames/becsy";
import { PhysicsSystem } from "./physics";


@system(s => s.after(PhysicsSystem))
export class ThreeRenderSystem extends System {

	private threeEntities = this.query(
		q => q.current.with(Position).read.and.with(Rotation).read.and.with(Mesh).read);
	

	execute(): void {
		// console.log("threejs entity count", this.threeEntities.current.length)

		for (const entity of this.threeEntities.current) {
			// const mesh = entity.read(Mesh);
			// const rotation = entity.read(Rotation)

			const object = scene.getObjectById(entity.read(Mesh).id);

			if (!object) {
				console.log("no object found")
				return;
			}

			// console.log(object)

			//apply component translation to three objects
			object.position.set(entity.read(Position).x, entity.read(Position).y, entity.read(Position).z);
			object.setRotationFromQuaternion(
				new THREE.Quaternion(
					entity.read(Rotation).x,
					entity.read(Rotation).y,
					entity.read(Rotation).z,
					entity.read(Rotation).w
				)
			);
		}
		// renderer.render(scene, camera);
		composer.render();

	}

};
