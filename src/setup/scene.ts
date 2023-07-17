import { World } from "@lastolivegames/becsy";
import { Bundle } from "../schemas";
import { SpecialBox } from "./bundles";

export function spawnStaticCube(world: World) {
	world.createEntity(Bundle, { id: SpecialBox });
}
