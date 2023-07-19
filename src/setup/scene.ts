import { Bundle } from "../bundle";
import { SpecialBox } from "./bundles";
import { createEntityQueue } from "../main";

export function spawnStaticCube() {
	createEntityQueue.push([Bundle, { id: SpecialBox }])
}
