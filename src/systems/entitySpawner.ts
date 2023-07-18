import { System, system } from "@lastolivegames/becsy"
import { createEntityQueue } from "../main"
import { Bundle, Position } from "../schemas";
import { BundleSpawner } from "./bundleSpawner";


@system(s=> s.before(BundleSpawner))
export class entitySpawner extends System {

    constructor(){
		super();
		this.query(
			q => q.current.with(Bundle).write.usingAll.write);
	}
	

	execute(): void {
		for(const e of createEntityQueue){
			console.log("spawning something", e)
			this.createEntity( Position, {x: -5, y: 5, z: 0}, ...e)
		}

		createEntityQueue.splice(0, createEntityQueue.length);
	}
}