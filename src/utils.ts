import * as j from "@javelin/ecs";

export const bundleMap = new Map<
	string,
	{
		create: (world: j.World, entity: j.Entity) => void;
		destroy: (world: j.World, entity: j.Entity) => void;
	}
>();

export function defineBundle(
	bundleId: string,
	bundleCreation: (world: j.World, entity: j.Entity) => void,
	bundleDestruction: (world: j.World, entity: j.Entity) => void
): string {
	bundleMap.set(bundleId, {
		create: bundleCreation,
		destroy: bundleDestruction,
	});

	return bundleId;
}

export function attachOrSkip(
	world: j.World,
	entity: j.Entity,
	comp: any,
	val: any
) {
    let c = world.has(entity,comp)
	if (c) {
		console.log(
			"while spawning a bundle. encountered an entity which already has the component we need. skip",
			comp
		);
		let c = world.get(entity,comp)
        // c = val;
        return c;
	} else {
		console.log(
			"while spawning bundle. entity doesn't have this component yet",
			comp
		);

		world.add(entity, comp, val);
        return val;
	}
}

export function attachOrSetComponent(
	world: j.World,
	entity: j.Entity,
	comp: any,
	val: any
) {
	let c = world.has(entity,comp)
	if (c) {
		// console.log(
		// 	"while spawning a bundle. encountered an entity which already has the component we need. set the new value",
		// 	comp
		// );
		let c = world.get(entity,comp)
        c = val;
        return c;
	} else {
		// console.log(
		// 	"while spawning bundle. entity doesn't have this component yet",
		// 	comp
		// );

		world.add(entity, comp, val);
	}
}