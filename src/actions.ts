import * as j from "@javelin/ecs";
import { PhysicsBox } from "./bundles";
import { Bundle, Player, Position, Replicate, Rotation, Velocity } from "./components";
import { entityMap, hostPeer, isHost, myPeerID } from "./systems";
import { defineRPC } from "./utils";

export const spawnPhysicsBox = defineRPC(
	(
		world: j.World,
		data: {
			position: {x: number, y: number, z: number},
			bundle: string,
			hostEntity?: j.Entity | undefined,
		}
) => {
	console.log("This should happen everywhere", data.position);
	let hostPeerId = isHost() ? myPeerID() : hostPeer()?.peer;
	
    let newEnt = world.create(
		j.type( Bundle, Position, Replicate),
		data.bundle,
		data.position,
		{
			hostEntity: data.hostEntity,
			components: [Bundle, Position, Rotation, Velocity],
			peerWithAuthority: hostPeerId!
		}
	);
    data.hostEntity = newEnt;
	
	return {broadcast: true, newContext: data};
});

export const broadCastDelete = defineRPC((world, hostEnt: j.Entity )=>{
	let ent = entityMap.get(hostEnt)
	if(world.exists(ent!))
		world.delete(ent!);
	return {broadcast: true, newContext: hostEnt};
});


export const spawnPlayer = defineRPC(
	(
		world: j.World,
		data: {
			position: {x: number, y: number, z: number},
			peerWithAuthority: string,
			hostEntity?: j.Entity | undefined,
		}
) => {
	console.log("This should happen everywhere", data.position);
	
    let newEnt = world.create(
		j.type( Bundle, Position, Replicate, Player),
		PhysicsBox,
		data.position,
		{
			hostEntity: data.hostEntity,
			components: [Bundle, Position, Rotation, Velocity],
			peerWithAuthority: data.peerWithAuthority
		}
	);
    data.hostEntity = newEnt;
	
	return {broadcast: true, newContext: data};
});