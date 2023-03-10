import * as j from "@javelin/ecs";
import { ValuesInit } from "@javelin/ecs/dist/declarations/src/component";

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
export function addIfNotSet<T extends j.Component[]>(
	world: j.World,
	entity: j.Entity,
	type: j.Type<T>,
	...values: ValuesInit<T>
){
    let c = world.has(entity, type)
	if (c) {
		let c = world.get<T>(entity, type)
        // c = val;
        return [c] as ValuesInit<T>;
	} else {
		world.add<T>(entity, type, ...values);
        return values;
		// return null;
	}
}

/**
Use if you want the bundle creation function to override the value of the component if it already exists. Returns the component's value.
**/
export function addOrUpdateIfExists<T extends j.Component[]>(
	world: j.World,
	entity: j.Entity,
	type: j.Type<T>,
	...values: ValuesInit<T>
){
	let c = world.has(entity, type)
	if (c) {
		let c = world.get<T>(entity, type)
		c = values as j.ComponentValue<T>;
        return c as ValuesInit<T>;
	} else {
		world.add(entity, type, ...values);
		return values;
	}
}

let nextStepQueue: (() => void)[] = [];
let thisStepQueue: (() => void)[] = [];
export const nextStep = (callback: () => void) => {
	nextStepQueue.push(callback);
}

export const nextStepSystem = () => {
	
	thisStepQueue.forEach( callback => {
		callback();
	});

	thisStepQueue = nextStepQueue;
	nextStepQueue = [];
}


export function addBundle(world: j.World, entity: j.Entity, bundleId: string){
	//queue this for next step so that other components can be settled first	
	const bundle = bundleMap.get(bundleId);
	nextStep(()=>{
		if (world.exists(entity)) bundle?.create(world, entity);
	})
}