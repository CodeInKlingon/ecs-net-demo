import { component, World } from "@javelin/ecs";
import { Bundle } from "../schemas";
import { SpecialBox } from "./bundles";

export function spawnStaticCube(world: World) {
	let entity = world.create();

	let bundleComponent = component(Bundle, { id: SpecialBox });
	world.attach(entity, bundleComponent);
}
