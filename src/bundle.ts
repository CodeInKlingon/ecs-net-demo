import { System, component, field, system, Entity, ComponentType } from "@lastolivegames/becsy";

export const bundleMap = new Map<
	string,
	{
		create: (entity: Entity) => void;
		destroy: (entity: Entity) => void;
	}
>();

export function defineBundle(
	bundleId: string,
	bundleCreation: (entity: Entity) => void,
	bundleDestruction: (entity: Entity) => void
): string {
	bundleMap.set(bundleId, {
		create: bundleCreation,
		destroy: bundleDestruction,
	});

	return bundleId;
}


export function addOrSetComponent<T>(
	entity: Entity,
	comp: ComponentType<T>,
	value?: T
):T | undefined {
	if (entity.has(comp)) {
		console.log(
			"while spawning a bundle. encountered an entity which already has the component we need. set the new value",
			value
		);

		if(comp.schema && value){
			Object.keys(comp.schema!).forEach( (key: string) => {
				//@ts-ignore
				entity.write(comp)[key] = value[key]
			});
		}

		return value;
	} else {
		console.log(
			"while spawning bundle. entity doesn't have this component yet",
			comp
		);
		entity.add(comp, value);

		return value;
	}
}


export function addOrReturnComponent<T>(
	entity: Entity,
	comp: ComponentType<T>,
	value?: T
):T | undefined {
	if (entity.has(comp)) {
	
		let returnValue: Record< string, any> = {}
		
		if(comp.schema){
			Object.keys(comp.schema!).forEach( (key: string) => {
				// @ts-ignore
				returnValue[key] = entity.read(comp)[key]
			});
		}
		console.log(
			"while spawning a bundle. encountered an entity which already has the component we need. return the current value",
			returnValue
		);
		return returnValue as T;
	} else {
		console.log(
			"while spawning bundle. entity doesn't have this component yet",
			comp
		);
		entity.add(comp, value);

		return value;
	}
}


@component
export class Bundle {
	@field.dynamicString(50) declare id: string;
}

@system
export class BundleSpawner extends System {

	private bundles = this.query(
		q => q.current.added.and.removed.with(Bundle).withAny);
	
	constructor(){
		super();
		this.query(q => q.usingAll.write)
	}

	execute(): void {
		//new bundles
		for (const addedBundle of this.bundles.added) {
			const bundleComponent = addedBundle.read(Bundle);
			if (bundleMap.has(bundleComponent.id)) {
				const bundle = bundleMap.get(bundleComponent.id);
				bundle?.create(addedBundle);
			} else {
				console.log(
					"tried to spawn a bundle but couldn't find the definition"
				);
			}
		}

		//removed bundles
		for (const removedBundle of this.bundles.removed) {
			const bundleComponent = removedBundle.read(Bundle);
			if (bundleMap.has(bundleComponent.id)) {
				const bundle = bundleMap.get(bundleComponent.id);
				bundle?.destroy(removedBundle);
			}
		}
	}
}