import { Entity } from "@lastolivegames/becsy";

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
