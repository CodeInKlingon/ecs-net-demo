import { component, World } from "@javelin/ecs";
import { Bundle } from "../schemas";
import { SpecialBox } from "./bundles";

export function spawnStaticCube(world: World) {
	const entity = world.create();

	const bundleComponent = component(Bundle, { id: SpecialBox });
	world.attach(entity, bundleComponent);
}
