import { World } from "@lastolivegames/becsy";
import { Bundle } from "../schemas";
import { SpecialBox } from "./bundles";
import { createEntityQueue } from "../main";

export function spawnStaticCube(world: World) {
	createEntityQueue.push([Bundle, { id: SpecialBox }])
	// world.createEntity(Bundle, { id: SpecialBox });
}
