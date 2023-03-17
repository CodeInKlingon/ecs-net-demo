import * as j from "@javelin/ecs";
import { Value } from "@javelin/ecs/dist/declarations/src/component";
import { HasLocalAuthority, Replicate } from "./components";

export enum MessageType {
	Snapshot = 0,
	Broadcast = 1,
	BroadcastRequest = 2,
	Sync = 3,
}


export type EntitySnapshot = {
    entity: j.Entity;
    components: ComponentSnapShot<any>[];
    // peerWithAuthority?: string | undefined;
};

type ComponentSnapShot<T> = {
    component: j.Singleton<T>;
    type: "value" | "tag"
    value: Value<T>;
};

export const SyncSnapshot = {
    latest: [] as EntitySnapshot[]
}

export const ReplicateQueryToSnapshot = (world: j.World, _myPeerId: string, localOnly: boolean = false) => {
    let snapshot: EntitySnapshot[] = []

    let replicatedQueryResult;
    if(localOnly){
        replicatedQueryResult = world.query(Replicate, HasLocalAuthority);
    }else{
        replicatedQueryResult = world.query(Replicate);
    }

    // let replicatedEntities = world.query(...[Replicate, ...(localOnly ? [HasLocalAuthority]: [])] );
    let replicatedEntities = new Map<j.Entity, any>();
    replicatedQueryResult.each((entity, replicate) => {
        // let hostPeerId = isHost() ? myPeerID() : hostPeer();
        // if(replicate && replicate.peerWithAuthority ? replicate.peerWithAuthority == myPeerId: true){

        replicatedEntities.set(entity, replicate)
        // }else{
        //     console.log("skpping ent that other client has auth of")
        // }
    });

    replicatedEntities.forEach((replicate, entity) => {
        if(!replicate) return
        let entitySnapShot: EntitySnapshot = {
            entity: replicate.hostEntity ?? entity,
            components: [{
                component: Replicate,
                type: "value",
                value: {...replicate, hostEntity: replicate.hostEntity ?? entity}
            }],
            // peerWithAuthority: replicate.peerWithAuthority
        };

        replicate.components.forEach((component: any) => {
            // console.log("typof comp", typeof component);
            let value = world.get(entity, component)

            entitySnapShot.components.push({
                component: component,
                type: value === true || value === null ? "tag" : "value",
                value: value
            });
        });
        snapshot.push(entitySnapShot);
    });

    return snapshot
}