import { Entity, System, system, ComponentType } from "@lastolivegames/becsy";
import { Bundle, Mesh, Position, RigidBody, Rotation } from "../schemas";
import { bundleMap } from "../setup/prefab";

//bundle managemnet system. spawns and de spawns entities with bundle components using a monitor
@system
export class BundleSpawner extends System {

	private bundles = this.query(
		q => q.current.added.and.removed.with(Bundle).withAny);
	
	test = this.query(q => q.using(Mesh).write)
	test2 = this.query(q => q.using(RigidBody).write)
	test3 = this.query(q => q.using(Position).write)
	test4 = this.query(q => q.using(Rotation).write)
	
		execute(): void {
		//new bundles
		for (const addedBundle of this.bundles.added) {
			const bundleComponent = addedBundle.read(Bundle);
			if (bundleMap.has(bundleComponent.id)) {
				const bundle = bundleMap.get(bundleComponent.id);
				bundle?.create(addedBundle);
			} else {
				console.log(
					"tried to spawn a bundle but couldn't find the definition"
				);
			}
		}

		//removed bundles
		for (const removedBundle of this.bundles.removed) {
			const bundleComponent = removedBundle.read(Bundle);
			if (bundleMap.has(bundleComponent.id)) {
				const bundle = bundleMap.get(bundleComponent.id);
				bundle?.destroy(removedBundle);
			}
		}
	}
}

export function attachOrSetComponent<T>(
	entity: Entity,
	comp: ComponentType<T>,
	value: T
) {
	if (entity.has(comp)) {
		console.log(
			"while spawning a bundle. encountered an entity which already has the component we need. set the new value",
			comp
		);


		const entries = Object.entries(comp.schema!)
		const keys = Object.keys(comp.schema!)
		// c = value;
		console.log("entries", entries);
		console.log("keys", keys);
		//TODO: implement write for each component property
	} else {
		console.log(
			"while spawning bundle. entity doesn't have this component yet",
			comp
		);
		entity.add(comp, value);
	}
}
