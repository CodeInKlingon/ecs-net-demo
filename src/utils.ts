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
/**
Use if you want the bundle creation function to skip adding this component if it already exists. 
Returns the component's value.

- ex: ```world.create(j.type(Bundle, Position), MY_Bundle, {x: 10,y: 10,z: 10});```

if the bundle creation uses this function for adding the position component it will skip the bundles default value and use what was defined above. 
**/
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

/**
Use if you want the bundle creation function to override the value of the component if it already exists. Returns the component's value.
**/
export function attachOrSetComponent(
	world: j.World,
	entity: j.Entity,
	comp: any,
	val: any
) {
	let c = world.has(entity,comp)
	if (c) {
		let c = world.get(entity,comp)
        c = val;
        return c;
	} else {
		world.add(entity, comp, val);
		return val;
	}
}