import { System, system } from "@lastolivegames/becsy";
import { physicsWorld } from "../main";
import { Position, RigidBody, Rotation } from "../schemas";
import { BundleSpawner } from "./bundleSpawner";


@system(s => s.after(BundleSpawner))
export class PhysicsSystem extends System {

	private physicsEntities = this.query(
		q => q.current.with(Position).write.and.with(Rotation).write.and.with(RigidBody).read);
	
	execute(): void {
		// console.log("num", this.physicsEntities.current.length);
		for (const entity of this.physicsEntities.current) {
			// const rigidbody = entity.read(RigidBody);
			const rb = physicsWorld!.getRigidBody(entity.read(RigidBody).handle);
			if (!rb) {
				console.log("no rb found");
				return;
			}
			console.log(entity.read(RigidBody).handle);
			console.log("rb.translation()", rb.translation());
		
			//apply physics transformation to components
			entity.write(Position).x = rb.translation().x;
			entity.write(Position).y = rb.translation().y;
			entity.write(Position).z = rb.translation().z;

			entity.write(Rotation).x = rb.rotation().x;
			entity.write(Rotation).y = rb.rotation().y;
			entity.write(Rotation).z = rb.rotation().z;
			entity.write(Rotation).w = rb.rotation().w;
		}

		physicsWorld!.step();
	}

};
