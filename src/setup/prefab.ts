import { World } from "@javelin/ecs";

export const bundleMap = new Map<
	string,
	{
		create: (world: World, entity: number) => void;
		destroy: (world: World, entity: number) => void;
	}
>();

export function defineBundle(
	bundleId: string,
	bundleCreation: (world: World, entity: number) => void,
	bundleDestruction: (world: World, entity: number) => void
): string {
	bundleMap.set(bundleId, {
		create: bundleCreation,
		destroy: bundleDestruction,
	});

	return bundleId;
}
