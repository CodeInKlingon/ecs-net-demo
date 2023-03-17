import * as j from "@javelin/ecs";
import { ValuesInit } from "@javelin/ecs/dist/declarations/src/component";
import { Velocity } from "./components";

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
		create: (world, entity) => { console.log("run create");return bundleCreation(world, entity)},//bundleCreation,
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
	if (world.has(entity, type)) {
		let c = world.get<T>(entity, type)
        // c = val;
        return [c] as ValuesInit<T>;
	} else {
		world.add<T>(entity, type, ...values);
        return values;
		// return null;
	}

	return values
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
	// let c = 
	if (world.has(entity, type)) {
		// let c = world.get<T>(entity, type)
		world.set(entity, type, values);
		// c = values as j.ComponentValue<T>;
        return values as ValuesInit<T>;
	} else {
		console.log(type, values)
		if(type == Velocity){}
		    // world.add(entity, type, ...values);
		return [...values];
	}

	return values;
}

let nextStepQueue: ((world: j.World) => void)[] = [];
let thisStepQueue: ((world: j.World) => void)[] = [];
export const nextStep = (callback: (world: j.World) => void) => {
	nextStepQueue.push(callback);
}

export const nextStepSystem = (world: j.World) => {
	
	thisStepQueue.forEach( callback => {
		callback(world);
	});

	thisStepQueue = nextStepQueue;
	nextStepQueue = [];
}


export function addBundle(world: j.World, entity: j.Entity, bundleId: string){
	//queue this for next step so that other components can be settled first	
	const bundle = bundleMap.get(bundleId);
	// nextStep((world)=>{
		// if (world.exists(entity)) 
		    bundle?.create(world, entity);
	// })
}


export const rpcDictionary = new Map<number, (world: j.World, data: any) => { broadcast: boolean, newContext: any}>();


export function defineRPC<T>( callback: (world: j.World, data: T) => { broadcast: boolean, newContext: T} ){
	let id = rpcDictionary.size + 1;
	rpcDictionary.set(id, callback);
	return (data: T) => enqueueRPC(id, data )
}

export const rpcQueue: {queue: {actionId: number, context: any}[]} = {queue: []};
export function enqueueRPC<T>(actionId: number, context: T){
	rpcQueue.queue.push({
		actionId: actionId,
		context: context
    });
}

